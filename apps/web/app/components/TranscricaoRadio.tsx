"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square, TriangleAlert } from "lucide-react";
import type { EstacaoRadio } from "@/lib/radio/estacoes";
import {
  OPCOES_INFERENCIA_APRIMORADAS,
  carregarModelo,
  criarCaptura,
  liberarTranscritor,
  limparTexto,
  normalizar,
  prepararAudio,
  type CapturaAudio,
  type Transcritor,
} from "@/lib/radio/transcricao";

/**
 * Bolha de transcrição ao vivo — 100% no navegador, sem API de IA.
 *
 * Papel no portal: dar texto legível ao que a rádio fala, para quem não pode
 * ouvir (surdez, ambiente barulhento, áudio mudo). Só aparece nas estações de
 * fala cujo stream envia CORS (as federais) — sem CORS, o Web Audio entrega
 * silêncio e a transcrição não teria o que ler.
 *
 * Como funciona, sem serviço externo:
 * 1. um `<audio>` OCULTO e próprio toca o mesmo stream com `crossOrigin`;
 *    ele NÃO é ligado à saída — só ao grafo de áudio, então não há som dobrado;
 * 2. um `AudioContext` a 16 kHz (a taxa que o Whisper espera) captura blocos de
 *    ~6 s via `ScriptProcessorNode`;
 * 3. o modelo Whisper (`transformers.js`, WebAssembly) roda NO NAVEGADOR e
 *    devolve o texto. Nada de áudio sai do aparelho.
 *
 * Decisões e limites, declarados:
 * - a biblioteca e o modelo são baixados na primeira vez (~250 MB) — por isso a
 *   transcrição só começa no clique, nunca automática;
 * - o idioma é FORÇADO para português em cada chamada (`language`/`task` vão nas
 *   opções de inferência, não na criação do pipeline). Antes iam só no
 *   construtor, onde o `transformers.js` os ignora: o Whisper autodetectava e
 *   devolvia inglês em música e fala em português (medido 29/10/2026);
 * - blocos de 12 s (antes 6 s): janela curta corta palavra e aumenta a
 *   alucinação; o áudio também é normalizado por pico antes de ir ao modelo;
 * - é transcrição de FALA, não de letra de música. Música rende pouco e o selo
 *   "gerado por máquina" existe para isso (regra do AGENTS § 7);
 * - a bolha sobe sozinha; quem rola para trás pausa o acompanhamento e ganha o
 *   botão "voltar ao vivo".
 *
 * A parte de áudio/modelo mora em `lib/radio/transcricao.ts` desde 29/10/2026,
 * quando o CodeScene passou a cobrar a complexidade média deste arquivo.
 */

/** Blocos enfileirados acima disto são descartados (o mais antigo sai): sem o
 * teto, uma máquina lenta acumula minutos de atraso e a "transcrição ao vivo"
 * vira passado. */
const MAX_FILA = 2;

type Status = "inativo" | "carregando-modelo" | "ouvindo" | "erro";

interface Trecho {
  id: number;
  texto: string;
}

export interface TranscricaoRadioProps {
  estacao: EstacaoRadio;
}

export default function TranscricaoRadio({ estacao }: TranscricaoRadioProps) {
  const [aberta, setAberta] = useState(false);
  const [status, setStatus] = useState<Status>("inativo");
  const [erro, setErro] = useState<string | null>(null);
  const [trechos, setTrechos] = useState<Trecho[]>([]);
  const [seguir, setSeguir] = useState(true);
  const [tentativas, setTentativas] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const capturaRef = useRef<CapturaAudio | null>(null);
  // Fila de inferência.
  const filaRef = useRef<Float32Array[]>([]);
  const processandoRef = useRef(false);
  const transcriberRef = useRef<Transcritor | null>(null);
  // Token da sessão: um `ligar` em andamento não pode "ressuscitar" depois de
  // um `parar` (o modelo leva dezenas de segundos para baixar).
  const sessaoRef = useRef(0);
  const contadorRef = useRef(0);
  const seguirRef = useRef(true);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Mantém o ref do autoscroll em sincronia (o callback de áudio lê o ref).
  useEffect(() => {
    seguirRef.current = seguir;
  }, [seguir]);

  /** Envia um bloco de áudio ao modelo e anexa o texto. */
  const transcrever = useCallback(async (bloco: Float32Array) => {
    const transcriber = transcriberRef.current;
    if (!transcriber) return;
    try {
       // Usar opções aprimoradas para forçar português
       const saida = await transcriber(normalizar(bloco), OPCOES_INFERENCIA_APRIMORADAS);
       const texto = limparTexto(saida?.text ?? "");
       
       // Log para depuração de problemas de idioma
       if (saida?.text && saida.text !== texto) {
         console.log("Texto bruto vs limpo:", { bruto: saida.text, limpo: texto });
       }
      if (texto.length > 2) {
        contadorRef.current += 1;
        setTrechos((atual) => {
          // Repetição exata em sequência é alucinação clássica do Whisper
          // (principalmente em música); não entra duas vezes.
          if (atual.length > 0 && atual[atual.length - 1].texto === texto) return atual;
          const novo = [...atual, { id: contadorRef.current, texto }];
          // Limita a memória: guarda os últimos 80 trechos.
          return novo.length > 80 ? novo.slice(-80) : novo;
        });
      }
    } catch {
      // Bloco ruim não derruba a sessão: segue para o próximo.
    }
  }, []);

  /** Consome a fila de blocos, um por vez. */
  const drenarFila = useCallback(async () => {
    if (processandoRef.current) return;
    processandoRef.current = true;
    while (filaRef.current.length > 0) {
      const bloco = filaRef.current.shift();
      if (bloco) await transcrever(bloco);
    }
    processandoRef.current = false;
  }, [transcrever]);

  /** Para a captura e libera os recursos de áudio. */
  const parar = useCallback(() => {
    // Invalida qualquer `ligar` em voo (modelo baixando) antes de fechar.
    sessaoRef.current += 1;
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const captura = capturaRef.current;
    capturaRef.current = null;
    captura?.processor.disconnect();
    captura?.source.disconnect();
    captura?.ganho.disconnect();
    if (captura && captura.ctx.state !== "closed") void captura.ctx.close();
    // Libera o modelo: sem isto, trocar de estação alocava outro Whisper
    // (centenas de MB) sem soltar o anterior.
    const transcriber = transcriberRef.current;
    transcriberRef.current = null;
    liberarTranscritor(transcriber);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    filaRef.current = [];
    setStatus("inativo");
  }, []);

  /** Liga a transcrição: cria o grafo de áudio e carrega o modelo. */
  const ligar = useCallback(async () => {
    setErro(null);
    setAberta(true);
    setTrechos([]); // sessão nova não mistura o texto da anterior
    setStatus("carregando-modelo");
    const sessao = ++sessaoRef.current;
    try {
      const audio = await prepararAudio(estacao, hlsRef);
      audioRef.current = audio;
      if (sessao !== sessaoRef.current) {
        parar();
        return;
      }

      const captura = await criarCaptura(audio, (bloco) => {
        // Teto da fila: descarta o bloco mais antigo quando a máquina não
        // acompanha, para o texto não ficar minutos atrás do áudio.
        if (filaRef.current.length >= MAX_FILA) filaRef.current.shift();
        filaRef.current.push(bloco);
        void drenarFila();
      });
      capturaRef.current = captura;

      const transcriber = await carregarModelo();
      if (sessao !== sessaoRef.current) {
        liberarTranscritor(transcriber);
        parar();
        return;
      }
      transcriberRef.current = transcriber;
      setStatus("ouvindo");
      setTentativas(0); // Resetar tentativas em caso de sucesso
    } catch (e) {
      parar();
      setStatus("erro");
      
      // Melhorar mensagens de erro com base no tipo de falha
      let mensagemErro = "Falha ao carregar a transcrição neste navegador.";
      
      if (e instanceof Error) {
        const mensagem = e.message.toLowerCase();
        
        if (mensagem.includes("cors") || mensagem.includes("cross-origin")) {
          mensagemErro = "Esta estação não permite transcrição online (CORS bloqueado).";
        } else if (mensagem.includes("network") || mensagem.includes("fetch")) {
          mensagemErro = "Não foi possível acessar o stream de áudio da estação.";
        } else if (mensagem.includes("hls") || mensagem.includes("manifest")) {
          mensagemErro = "Formato de stream não suportado para transcrição.";
        } else if (mensagem.includes("audio") || mensagem.includes("play")) {
          mensagemErro = "Não foi possível reproduzir o áudio desta estação.";
        } else if (mensagem.includes("model") || mensagem.includes("whisper")) {
          mensagemErro = "Erro ao carregar modelo de transcrição. Tente novamente.";
        } else if (mensagem.includes("memory") || mensagem.includes("heap")) {
          mensagemErro = "Memória insuficiente para transcrição. Feche outras abas e tente novamente.";
        } else {
          mensagemErro = e.message;
        }
      }
      
      setErro(mensagemErro);
      console.error("Erro na transcrição:", e);
      
      // Retry automático para falhas não críticas
      const errosNaoCriticos = [
        "network", "fetch", "model", "whisper", "memory", "heap"
      ];
      
      const ehErroNaoCritico = errosNaoCriticos.some(erro => 
        mensagemErro.toLowerCase().includes(erro)
      );
      
      if (ehErroNaoCritico && tentativas < 2) {
        setTentativas(tentativas + 1);
        // Não chamar ligar diretamente aqui para evitar referência circular
      }
    }
  }, [estacao, drenarFila, parar, tentativas]);

  // Efeito para lidar com retry automático
  useEffect(() => {
    if (tentativas > 0 && tentativas <= 2) {
      const timer = setTimeout(() => {
        console.log(`Tentativa ${tentativas} de 3 para transcrição...`);
        void ligar();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [tentativas, ligar]);

  // Sai da página/estação: encerra a captura.
  useEffect(() => {
    return () => parar();
  }, [parar]);

  // Autoscroll: acompanha o fim, a menos que o leitor tenha rolado para trás.
  useEffect(() => {
    if (!seguir) return;
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [trechos, seguir]);

  const aoRolar = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const noFim = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    setSeguir(noFim);
  };

  const rotuloStatus =
    status === "carregando-modelo"
      ? "Carregando modelo…"
      : status === "ouvindo"
        ? "Transcrevendo ao vivo"
        : status === "erro"
          ? "Falhou"
          : "Transcrição ao vivo";

  return (
    <div className="mb-2 w-[min(calc(100vw-2rem),22rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-text">
          <Mic size={14} aria-hidden="true" />
          {rotuloStatus}
        </p>
        {status === "erro" && (
          <button
            type="button"
            onClick={() => {
              setErro(null);
              ligar();
            }}
            className="rounded-full p-0.5 text-text-soft hover:text-primary"
            aria-label="Tentar novamente"
            title="Tentar novamente"
          >
            <Play size={12} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setAberta(false)}
          aria-label="Fechar a transcrição"
          title="Fechar"
          className="rounded-full p-0.5 text-text-soft hover:text-primary"
        >
          <Square size={12} aria-hidden="true" />
        </button>
      </div>
      {aberta && (
        <div className="flex h-48 flex-col">
          <div
            ref={scrollerRef}
            onScroll={aoRolar}
            className="flex-1 overflow-y-auto p-3 text-xs"
          >
            {erro ? (
              <div className="flex items-center gap-2 p-2 text-text-soft">
                <TriangleAlert size={14} aria-hidden="true" />
                <p>{erro}</p>
              </div>
            ) : trechos.length === 0 ? (
              <p className="text-center text-text-soft">Aguardando áudio...</p>
            ) : (
              trechos.map((trecho) => (
                <p
                  key={trecho.id}
                  className="mb-2 last:mb-0 last:pb-2"
                  // `whitespace-pre-wrap` evita que quebras de linha sejam
                  // ignoradas (o Whisper as vezes devolve "\n" no meio da frase).
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {trecho.texto}
                </p>
              ))
            )}
          </div>
          <div className="flex items-center justify-between border-t border-border bg-surface-2 px-3 py-1.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSeguir(!seguir)}
                className="rounded-full p-0.5 text-text-soft hover:text-primary"
                aria-label={seguir ? "Pausar scroll" : "Voltar ao vivo"}
                title={seguir ? "Pausar scroll" : "Voltar ao vivo"}
              >
                {seguir ? <Pause size={12} aria-hidden="true" /> : <Play size={12} aria-hidden="true" />}
              </button>
              <p className="text-xs text-text-soft">
                {trechos.length} trecho{trechos.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setTrechos([]);
                setSeguir(true);
              }}
              className="rounded-full p-0.5 text-text-soft hover:text-primary"
              aria-label="Limpar transcrição"
              title="Limpar transcrição"
            >
              <Square size={12} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}