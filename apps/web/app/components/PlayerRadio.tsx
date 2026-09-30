"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ListMusic, Pause, Play, Radio } from "lucide-react";
import {
  bandeiraDe,
  ESTACOES,
  estacaoPorId,
  ORDEM_TIPOS,
  ROTULO_TIPO,
  type EstacaoRadio,
} from "@/lib/radio/estacoes";
import {
  EVENTO_ESTADO,
  EVENTO_TOCAR,
  type EstadoRadio,
} from "@/lib/radio/eventos";
import LogoRadio from "@/app/components/LogoRadio";
import TranscricaoRadio from "@/app/components/TranscricaoRadio";

/**
 * Player de rádio persistente e multi-estação.
 *
 * Papel no portal: tocar as estações do diretório `/radio` sem tirar o leitor
 * da página. O `<audio>` vive no layout RAIZ (`app/layout.tsx`), que não
 * desmonta na navegação — por isso a transmissão continua ao trocar de página.
 *
 * Como o controle funciona (um estado, um canal):
 * - cartões da `/radio`, o índice do hover e o botão do rodapé pedem a estação
 *   por evento global (`pedirTocao` → `cp:radio-tocar`);
 * - este componente é o único dono do `<audio>` e devolve o estado por
 *   `cp:radio-estado`, para os cartões marcarem o que está no ar.
 *
 * Formatos: MP3/AAC tocam nativos. HLS (`.m3u8`, as federais) só toca nativo no
 * Safari; no resto a biblioteca `hls.js` é importada sob demanda — fora do
 * bundle inicial. Falha de rede/stream não derruba a página: o estado volta a
 * "parado" e o leitor pode escolher outra estação.
 *
 * Sem autoplay (o navegador bloqueia áudio com som sem gesto): todo play nasce
 * de um clique.
 */

/** Estação acionada pelo botão do rodapé quando nada está carregado. */
const ESTACAO_PADRAO = "radio-brasil-de-fato";

export default function PlayerRadio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Instância do hls.js quando a estação é HLS e o navegador não toca nativo.
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const [idAtual, setIdAtual] = useState<string | null>(null);
  const [tocando, setTocando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [indiceAberto, setIndiceAberto] = useState(false);

  const estacaoAtual = idAtual ? estacaoPorId(idAtual) ?? null : null;

  /** Publica o estado para os cartões da `/radio`. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const estado: EstadoRadio = { id: idAtual, tocando, carregando };
    window.dispatchEvent(new CustomEvent(EVENTO_ESTADO, { detail: estado }));
  }, [idAtual, tocando, carregando]);

  /** Carrega e toca uma estação (troca o stream do `<audio>`). */
  const carregar = useCallback(async (estacao: EstacaoRadio) => {
    const audio = audioRef.current;
    if (!audio) return;
    setCarregando(true);
    setIdAtual(estacao.id);

    // Limpa um HLS anterior antes de qualquer troca.
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    audio.pause();

    const suporteHlsNativo =
      audio.canPlayType("application/vnd.apple.mpegurl") !== "";

    if (estacao.formato === "hls" && !suporteHlsNativo) {
      try {
        // Import sob demanda: o hls.js só entra no navegador de quem toca uma
        // estação HLS — o bundle inicial fica leve.
        const { default: Hls } = await import("hls.js");
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: false });
          hlsRef.current = hls;
          hls.on(Hls.Events.ERROR, (_evt, data) => {
            if (data.fatal) {
              setCarregando(false);
              setTocando(false);
            }
          });
          hls.loadSource(estacao.stream);
          hls.attachMedia(audio);
        } else {
          audio.src = estacao.stream;
        }
      } catch {
        setCarregando(false);
        return;
      }
    } else {
      audio.src = estacao.stream;
    }

    audio.load();
    try {
      await audio.play();
    } catch {
      // Autoplay barrado ou stream fora do ar: não trava a interface.
      setCarregando(false);
    }
  }, []);

  /** Toca/pausa a estação indicada (ou troca, se for outra). */
  const tocar = useCallback(
    async (id: string) => {
      const estacao = estacaoPorId(id);
      const audio = audioRef.current;
      if (!estacao || !audio) return;

      if (idAtual === id) {
        if (audio.paused) {
          setCarregando(true);
          try {
            await audio.play();
          } catch {
            setCarregando(false);
          }
        } else {
          audio.pause();
        }
        return;
      }
      await carregar(estacao);
    },
    [idAtual, carregar],
  );

  // O índice do hover pede a estação direto; o rodapé usa o evento `toggle`.
  useEffect(() => {
    const aoTocar = (ev: Event) => {
      const d = (ev as CustomEvent<{ id?: string }>).detail;
      if (d?.id) void tocar(d.id);
    };
    const aoAlternar = () => void tocar(idAtual ?? ESTACAO_PADRAO);
    window.addEventListener(EVENTO_TOCAR, aoTocar);
    window.addEventListener("cp:radio-toggle", aoAlternar);
    return () => {
      window.removeEventListener(EVENTO_TOCAR, aoTocar);
      window.removeEventListener("cp:radio-toggle", aoAlternar);
    };
  }, [tocar, idAtual]);

  // Libera o hls.js ao desmontar (troca de layout/tema não deve vazar).
  useEffect(() => {
    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, []);

  const rotulo = tocando
    ? `Pausar ${estacaoAtual?.nome ?? "a rádio"}`
    : `Ouvir ${estacaoAtual?.nome ?? "a rádio"}`;

  return (
    <>
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => {
          setTocando(true);
          setCarregando(false);
        }}
        onPause={() => setTocando(false)}
        onWaiting={() => setCarregando(true)}
        onPlaying={() => setCarregando(false)}
        onError={() => {
          setTocando(false);
          setCarregando(false);
        }}
      />

      <div
        className="fixed bottom-4 left-[4.75rem] z-40 flex flex-col items-start print:hidden"
        onMouseEnter={() => setIndiceAberto(true)}
        onMouseLeave={() => setIndiceAberto(false)}
      >
        {/* Bolha de transcrição ao vivo (só nas federais de fala). */}
        {estacaoAtual?.transcrevivel && tocando && (
          <TranscricaoRadio key={estacaoAtual.id} estacao={estacaoAtual} />
        )}

        {/* Índice expansível: aparece ao passar o mouse/focar no botão. */}
        {indiceAberto && (
          <div className="mb-2 w-[min(calc(100vw-2rem),21rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-primary/10 px-3 py-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-text">
                <ListMusic size={14} aria-hidden="true" />
                Índice de rádios
              </p>
              <Link
                href="/radio"
                className="text-xs font-semibold text-primary hover:underline"
                onClick={() => setIndiceAberto(false)}
              >
                Ver todas →
              </Link>
            </div>
            <div className="max-h-[min(70vh,26rem)] overflow-y-auto p-2">
              {ORDEM_TIPOS.map((tipo) => {
                const grupo = ESTACOES.filter((e) => e.tipo === tipo);
                if (grupo.length === 0) return null;
                return (
                  <div key={tipo} className="mb-1.5 last:mb-0">
                    <p className="px-1 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-text-soft">
                      {ROTULO_TIPO[tipo]}
                    </p>
                    <ul>
                      {grupo.map((e) => {
                        const ativa = e.id === idAtual;
                        return (
                          <li key={e.id}>
                            <button
                              type="button"
                              onClick={() => void tocar(e.id)}
                              className={`flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-surface-2 ${
                                ativa ? "bg-primary/10" : ""
                              }`}
                            >
                              <LogoRadio estacao={e} tamanho={22} />
                              <span className="min-w-0 flex-1 truncate text-xs text-text">
                                {e.nome}
                              </span>
                              <span aria-hidden="true" title={e.paisNome}>
                                {bandeiraDe(e.pais)}
                              </span>
                              {ativa && tocando ? (
                                <Pause size={12} className="shrink-0 text-primary" aria-hidden="true" />
                              ) : (
                                <Play size={12} className="shrink-0 text-text-soft" aria-hidden="true" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botão flutuante principal */}
        <div className="flex items-stretch gap-1">
          <button
            type="button"
            onClick={() => void tocar(idAtual ?? ESTACAO_PADRAO)}
            aria-label={rotulo}
            title={rotulo}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/95 px-3 py-2 text-xs font-semibold text-text shadow-lg backdrop-blur transition-colors hover:border-primary hover:text-primary"
          >
            <span className="relative flex h-4 w-4 items-center justify-center">
              {tocando ? (
                <Pause size={16} aria-hidden="true" className="text-primary" />
              ) : (
                <Radio size={16} aria-hidden="true" className="text-primary" />
              )}
            </span>
            <span className="hidden sm:inline max-w-[12rem] truncate">
              {carregando
                ? "Sintonizando…"
                : tocando
                  ? estacaoAtual?.nome ?? "A rádio"
                  : "Ouvir a rádio"}
            </span>
            {tocando && (
              <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setIndiceAberto((v) => !v)}
            aria-expanded={indiceAberto}
            aria-label="Abrir índice de rádios"
            title="Índice de rádios"
            className="inline-flex items-center justify-center rounded-full border border-border bg-surface/95 px-2 text-text-soft shadow-lg backdrop-blur transition-colors hover:border-primary hover:text-primary"
          >
            <ChevronDown
              size={15}
              aria-hidden="true"
              className={`transition-transform ${indiceAberto ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>
    </>
  );
}
