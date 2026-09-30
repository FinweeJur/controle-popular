"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square, TriangleAlert } from "lucide-react";
import type { EstacaoRadio } from "@/lib/radio/estacoes";

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
 * - a biblioteca e o modelo são baixados na primeira vez (~dezenas de MB) — por
 *   isso a transcrição só começa no clique, nunca automática;
 * - é transcrição de máquina: erra, e por isso a bolha traz o selo "gerado por
 *   máquina" (regra do AGENTS § 7);
 * - a bolha sobe sozinha; quem rola para trás pausa o acompanhamento e ganha o
 *   botão "voltar ao vivo".
 */

/** Biblioteca de inferência local (sem chave, sem servidor). O `+esm` do
 * jsDelivr entrega o pacote já no formato de módulo que o navegador importa. */
const TRANSFORMERS_CDN =
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/+esm";

/** Modelo multilíngue leve; roda em CPU. */
const MODELO_WHISPER = "Xenova/whisper-base";

/** Taxa de amostragem que o Whisper exige. */
const TAXA_WHISPER = 16000;

/** Segundos por bloco enviado ao modelo. */
const SEGUNDOS_BLOCO = 6;

type Status = "inativo" | "carregando-modelo" | "ouvindo" | "erro";

/** Assinatura mínima do `transformers.js` que a bolha usa. */
interface ModuloTransformers {
  pipeline: (
    tarefa: string,
    modelo: string,
    opcoes?: Record<string, unknown>,
  ) => Promise<(audio: Float32Array) => Promise<{ text: string }>>;
}

interface Trecho {
  id: number;
  texto: string;
}

export interface TranscricaoRadioProps {
  estacao: EstacaoRadio;
}

/** Concatena blocos de Float32 num único Float32Array. */
function concatenar(blocos: Float32Array[]): Float32Array {
  const total = blocos.reduce((acc, b) => acc + b.length, 0);
  const saida = new Float32Array(total);
  let pos = 0;
  for (const b of blocos) {
    saida.set(b, pos);
    pos += b.length;
  }
  return saida;
}

export default function TranscricaoRadio({ estacao }: TranscricaoRadioProps) {
  const [aberta, setAberta] = useState(false);
  const [status, setStatus] = useState<Status>("inativo");
  const [erro, setErro] = useState<string | null>(null);
  const [trechos, setTrechos] = useState<Trecho[]>([]);
  const [seguir, setSeguir] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const ganhoRef = useRef<GainNode | null>(null);
  // Acumuladores da captura e da fila de inferência.
  const bufferRef = useRef<Float32Array[]>([]);
  const amostrasRef = useRef(0);
  const filaRef = useRef<Float32Array[]>([]);
  const processandoRef = useRef(false);
  const transcriberRef = useRef<((audio: Float32Array) => Promise<{ text: string }>) | null>(null);
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
      const saida = await transcriber(bloco);
      const texto = (saida?.text ?? "").trim();
      if (texto.length > 2) {
        contadorRef.current += 1;
        setTrechos((atual) => {
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
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    ganhoRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current = null;
    ganhoRef.current = null;
    const ctx = ctxRef.current;
    ctxRef.current = null;
    if (ctx && ctx.state !== "closed") void ctx.close();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    bufferRef.current = [];
    amostrasRef.current = 0;
    filaRef.current = [];
    setStatus("inativo");
  }, []);

  /** Liga a transcrição: cria o grafo de áudio e carrega o modelo. */
  const ligar = useCallback(async () => {
    setErro(null);
    setAberta(true);
    setStatus("carregando-modelo");
    try {
      // 1. Áudio oculto próprio (não soma som: não é ligado ao destino).
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.preload = "auto";
      audioRef.current = audio;

      // As federais são HLS (`.m3u8`): o Chrome não toca nativo. Aqui também
      // vale o `hls.js`, senão não haveria áudio para capturar no Chrome.
      const suporteHlsNativo =
        audio.canPlayType("application/vnd.apple.mpegurl") !== "";
      if (estacao.formato === "hls" && !suporteHlsNativo) {
        const { default: Hls } = await import("hls.js");
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: false });
          hlsRef.current = hls;
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            void audio.play().catch(() => {});
          });
          hls.loadSource(estacao.stream);
          hls.attachMedia(audio);
        } else {
          audio.src = estacao.stream;
        }
      } else {
        audio.src = estacao.stream;
      }
      await audio.play().catch(() => {
        // No HLS o manifesto ainda pode não ter chegado; o listener acima
        // dispara o play. Nos demais formatos, falha é falha.
        if (estacao.formato !== "hls") {
          throw new Error("Não foi possível abrir o áudio desta estação.");
        }
      });

      // 2. Grafo em 16 kHz: fonte → processador → ganho 0 → destino.
      const ctx = new AudioContext({ sampleRate: TAXA_WHISPER });
      await ctx.resume();
      ctxRef.current = ctx;
      const source = ctx.createMediaElementSource(audio);
      sourceRef.current = source;
      const processor = ctx.createScriptProcessor(8192, 1, 1);
      processorRef.current = processor;
      const ganho = ctx.createGain();
      ganho.gain.value = 0; // silêncio: só captura.
      ganhoRef.current = ganho;

      const alvo = TAXA_WHISPER * SEGUNDOS_BLOCO;
      processor.onaudioprocess = (ev) => {
        const dados = ev.inputBuffer.getChannelData(0);
        bufferRef.current.push(new Float32Array(dados));
        amostrasRef.current += dados.length;
        if (amostrasRef.current >= alvo) {
          const bloco = concatenar(bufferRef.current);
          bufferRef.current = [];
          amostrasRef.current = 0;
          filaRef.current.push(bloco);
          void drenarFila();
        }
      };
      source.connect(processor);
      processor.connect(ganho);
      ganho.connect(ctx.destination);

      // 3. Modelo local (baixado na primeira vez).
      // Import remoto em runtime: fica FORA do bundle do Next (`webpackIgnore`).
      const mod = (await import(
        /* webpackIgnore: true */ TRANSFORMERS_CDN
      )) as unknown as ModuloTransformers;
      const transcriber = await mod.pipeline(
        "automatic-speech-recognition",
        MODELO_WHISPER,
        { language: "portuguese", task: "transcribe" },
      );
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
              className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[0.7rem] font-semibold text-white hover:opacity-90"
              title="Roda no seu aparelho: o áudio não sai daqui"
            >
              <Play size={11} aria-hidden="true" /> Ligar
            </button>
          ) : (
            <button
              type="button"
              onClick={parar}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[0.7rem] font-semibold text-text-soft hover:border-primary hover:text-primary"
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
              modelo (algumas dezenas de MB).
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
                <span className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[0.65rem] text-text-soft">
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
                    className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[0.7rem] font-semibold text-primary hover:bg-primary/20"
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
