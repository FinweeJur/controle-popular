"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square, TriangleAlert } from "lucide-react";
import type { EstacaoRadio } from "@/lib/radio/estacoes";
import {
  OPCOES_INFERENCIA,
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
      const saida = await transcriber(normalizar(bloco), OPCOES_INFERENCIA);
      const texto = limparTexto(saida?.text ?? "");
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
    } catch (e) {
      parar();
      setStatus("erro");
      setErro(
        e instanceof Error
          ? e.message
          : "Falha ao carregar a transcrição neste navegador.",
      );
    }
  }, [estacao, drenarFila, parar]);

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
          <Mic size={14} aria-hidden="true" className="text-primary" />
          {rotuloStatus}
        </p>
        <div className="flex items-center gap-1">
          {status === "inativo" || status === "erro" ? (
            <button
              type="button"
              onClick={() => void ligar()}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[0.75rem] font-semibold text-white hover:opacity-90"
              title="Roda no seu aparelho: o áudio não sai daqui"
            >
              <Play size={11} aria-hidden="true" /> Ligar
            </button>
          ) : (
            <button
              type="button"
              onClick={parar}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[0.75rem] font-semibold text-text-soft hover:border-primary hover:text-primary"
            >
              <Square size={11} aria-hidden="true" /> Parar
            </button>
          )}
          <button
            type="button"
            onClick={() => setAberta((v) => !v)}
            aria-expanded={aberta}
            aria-label={aberta ? "Recolher transcrição" : "Abrir transcrição"}
            className="rounded-md p-1 text-text-soft hover:text-primary"
          >
            <Play
              size={12}
              aria-hidden="true"
              className={aberta ? "rotate-90 transition-transform" : "transition-transform"}
            />
          </button>
        </div>
      </div>

      {aberta && (
        <div className="p-2">
          {status === "inativo" && (
            <p className="px-1 py-2 text-xs leading-relaxed text-text-soft">
              Ligue para ver o texto do que a rádio fala. A conversão roda no seu
              aparelho, sem enviar o áudio para fora — a primeira vez baixa o
              modelo (cerca de 250 MB). É transcrição de fala: música pode sair
              imprecisa.
            </p>
          )}
          {status === "erro" && (
            <p className="flex items-start gap-1.5 px-1 py-2 text-xs text-alert">
              <TriangleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              {erro ?? "Não foi possível transcrever esta estação."}
            </p>
          )}

          {(status === "carregando-modelo" || status === "ouvindo") && (
            <>
              <div
                ref={scrollerRef}
                onScroll={aoRolar}
                className="max-h-56 overflow-y-auto rounded-lg border border-border/60 bg-surface-2/40 p-2 text-sm leading-relaxed text-text"
                aria-live="polite"
              >
                {trechos.length === 0 ? (
                  <p className="text-xs text-text-soft">
                    {status === "carregando-modelo"
                      ? "Preparando o modelo no seu aparelho…"
                      : "Ouvindo… o texto aparece a cada poucos segundos."}
                  </p>
                ) : (
                  trechos.map((t) => (
                    <p key={t.id} className="mb-1.5">
                      {t.texto}
                    </p>
                  ))
                )}
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[0.75rem] text-text-soft">
                  <TriangleAlert size={10} aria-hidden="true" />
                  gerado por máquina — pode errar
                </span>
                {!seguir && (
                  <button
                    type="button"
                    onClick={() => {
                      setSeguir(true);
                      const el = scrollerRef.current;
                      if (el) el.scrollTop = el.scrollHeight;
                    }}
                    className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[0.75rem] font-semibold text-primary hover:bg-primary/20"
                  >
                    <Pause size={11} aria-hidden="true" /> voltar ao vivo
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
