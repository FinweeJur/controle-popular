"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Mic, NotebookPen, Pause, Play, Square, TriangleAlert } from "lucide-react";
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
 * Forma na tela (dono, 01/11/2026): com a transcrição DESLIGADA, a bolha vira
 * um ícone pequeno de lápis com papel (36 px) — antes era uma barra de 352 px
 * sempre aberta, tapando o texto da página no canto inferior esquerdo. O botão
 * atual ("Transcrição ao vivo" + Ligar) só aparece ao passar o mouse, ao focar
 * pelo teclado ou ao tocar no ícone. Ligada a transcrição, o painel fica aberto:
 * quem ligou está lendo o texto, não navegando.
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
  // Forma compacta (dono, 01/11/2026): parada, a bolha é só um ícone; o painel
  // abre no hover e no foco por CSS (`group-hover/transcricao`), sem trocar o
  // ícone de lugar — trocar desmontaria o botão focado e o teclado perderia o
  // fio. `fixado` é a saída do celular, onde não existe hover.
  // ⚠️ Grupo NOMEADO de propósito: `group-hover:` cru casa com QUALQUER
  // ancestral `.group` — e o `PlayerRadio` (que envolve este widget) é um
  // deles. Com o nome sem sufixo, focar o botão do play (`:focus-within` do
  // grupo do rádio) abria a bolha sozinha e ela ficava aberta depois do
  // clique (dono, 02/11/2026: "aparece sempre, não é expansível").
  const [fixado, setFixado] = useState(false);
  const ativa = status !== "inativo";
  const painelFixo = ativa || fixado;

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

  const rotuloStatus = ROTULOS[status];

  return (
    // `group`: o hover no ícone (ou no próprio painel) mantém o painel aberto.
    // O painel mora em `absolute bottom-full`, então abrir NÃO empurra o botão
    // do play para cima — o ícone fica no lugar e o painel cresce para cima.
    // `stopPropagation` no enter/foco: este widget vive DENTRO do grupo do
    // rádio (`PlayerRadio`), que abre o índice de estações no mesmo gesto.
    // Sem o corte, passar o mouse no ícone abria dois painéis empilhados.
    <div
      className="group/transcricao relative mb-2 flex flex-col items-center"
      onMouseEnter={(ev) => ev.stopPropagation()}
      onFocus={(ev) => ev.stopPropagation()}
    >
      <BotaoIcone aberto={painelFixo} aoAlternar={() => setFixado((v) => !v)} />

      <div
        className={`${painelFixo ? "block" : "hidden group-hover/transcricao:block group-focus-within/transcricao:block"} absolute bottom-full left-0 mb-1 w-[min(calc(100vw-2rem),22rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl`}
      >
        <Cabecalho
          rotulo={rotuloStatus}
          status={status}
          aberta={aberta}
          aoLigar={() => void ligar()}
          aoParar={parar}
          aoAlternarCorpo={() => {
            // Recolher com a transcrição desligada esconde o painel inteiro:
            // é a saída no celular, onde não existe hover.
            if (aberta && !ativa) setFixado(false);
            setAberta((v) => !v);
          }}
        />

        {aberta && (
          <Corpo
            status={status}
            erro={erro}
            trechos={trechos}
            seguir={seguir}
            scrollerRef={scrollerRef}
            aoRolar={aoRolar}
            aoVoltarAoVivo={() => {
              setSeguir(true);
              const el = scrollerRef.current;
              if (el) el.scrollTop = el.scrollHeight;
            }}
          />
        )}
      </div>
    </div>
  );
}

/** Rótulo do estado, num lugar só (era um encadeado de ternários no render). */
const ROTULOS: Record<Status, string> = {
  inativo: "Transcrição ao vivo",
  "carregando-modelo": "Carregando modelo…",
  ouvindo: "Transcrevendo ao vivo",
  erro: "Falhou",
};

/** Ícone compacto da forma parada: lápis com papel (pedido do dono).
 *  Só o círculo de 36 px fica na tela; o painel abre por CSS no hover. */
function BotaoIcone({ aberto, aoAlternar }: { aberto: boolean; aoAlternar: () => void }) {
  return (
    <button
      type="button"
      onClick={aoAlternar}
      aria-expanded={aberto}
      aria-label="Transcrição ao vivo da rádio"
      title="Transcrição ao vivo — passe o mouse para abrir; roda no seu aparelho"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/95 text-text-soft shadow-lg backdrop-blur transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <NotebookPen size={16} aria-hidden="true" />
    </button>
  );
}

interface CabecalhoProps {
  rotulo: string;
  status: Status;
  aberta: boolean;
  aoLigar: () => void;
  aoParar: () => void;
  aoAlternarCorpo: () => void;
}

/** Faixa de cima do painel: estado, Ligar/Parar e o chevron do corpo. */
function Cabecalho({ rotulo, status, aberta, aoLigar, aoParar, aoAlternarCorpo }: CabecalhoProps) {
  const inativo = status === "inativo" || status === "erro";
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-2 px-3 py-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-text">
        <Mic size={14} aria-hidden="true" className="text-primary" />
        {rotulo}
      </p>
      <div className="flex items-center gap-1">
        {inativo ? (
          <button
            type="button"
            onClick={aoLigar}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[0.75rem] font-semibold text-white hover:opacity-90"
            title="Roda no seu aparelho: o áudio não sai daqui"
          >
            <Play size={11} aria-hidden="true" /> Ligar
          </button>
        ) : (
          <button
            type="button"
            onClick={aoParar}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[0.75rem] font-semibold text-text-soft hover:border-primary hover:text-primary"
          >
            <Square size={11} aria-hidden="true" /> Parar
          </button>
        )}
        <button
          type="button"
          onClick={aoAlternarCorpo}
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
  );
}

interface CorpoProps {
  status: Status;
  erro: string | null;
  trechos: Trecho[];
  seguir: boolean;
  scrollerRef: RefObject<HTMLDivElement | null>;
  aoRolar: () => void;
  aoVoltarAoVivo: () => void;
}

/** Miolo do painel: explicação, erro ou o texto que a rádio falou. */
function Corpo({ status, erro, trechos, seguir, scrollerRef, aoRolar, aoVoltarAoVivo }: CorpoProps) {
  const transcrevendo = status === "carregando-modelo" || status === "ouvindo";
  return (
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

      {transcrevendo && (
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
                onClick={aoVoltarAoVivo}
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[0.75rem] font-semibold text-primary hover:bg-primary/20"
              >
                <Pause size={11} aria-hidden="true" /> voltar ao vivo
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
