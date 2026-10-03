"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ListMusic,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
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
import Bandeira from "@/app/components/Bandeira";
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
 *
 * CONTROLE VISUAL (pedido do dono, 03/10/2026): a pílula com nome, pega de
 * arrasto e chevron virou UM botão redondo só com play/pause — o terceiro
 * círculo da pilha da lateral esquerda (abaixo vem a pata do pet, embaixo o
 * FAB do Seu Nonô; régua em `SeuNono.tsx`). O índice de estações e o volume
 * abrem no hover/foco do conjunto (`group`); no celular o toque foca e abre.
 * A posição fixa acabou com o arrasto de 30/09 — os três botões têm lugar
 * desenhado; quem arrasta agora é só o Seu Nonô (leva a pata junto).
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
  // Volume e mudo: pedido do dono (02/10/2026). O rádio toca em segundo
  // plano; sem controle de volume o leitor só podia mutar o aparelho
  // inteiro. O estado é do React e é espelhado no `<audio>` por efeito.
  const [volume, setVolume] = useState(1);
  const [mudo, setMudo] = useState(false);
  // Sem arrasto: o botão é o terceiro círculo da pilha fixa do canto
  // esquerdo (pedido do dono, 03/10/2026) — mover um quebraria os três.

  // Espelha o volume/mudo no elemento de áudio sempre que mudam. Roda também
  // na montagem, para o `<audio>` nascer com os valores do estado.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = mudo;
  }, [volume, mudo]);

  // O índice abre no hover do botão. Ao sair, ele NÃO fecha na hora: há um
  // vão de alguns pixels entre o botão e o painel, e fechar na saída tornava
  // o índice quase inacessível (o ponteiro atravessava o vão e o painel
  // sumia). Fecha só 1,5 s depois de a pessoa sair (pedido do dono,
  // 30/09/2026); voltar ao painel dentro desse tempo cancela o fechamento.
  const fecharTimer = useRef<number | null>(null);

  const abrirIndice = useCallback(() => {
    if (fecharTimer.current !== null) {
      window.clearTimeout(fecharTimer.current);
      fecharTimer.current = null;
    }
    setIndiceAberto(true);
  }, []);

  const fecharIndiceJa = useCallback(() => {
    if (fecharTimer.current !== null) {
      window.clearTimeout(fecharTimer.current);
      fecharTimer.current = null;
    }
    setIndiceAberto(false);
  }, []);

  const agendarFecharIndice = useCallback(() => {
    if (fecharTimer.current !== null) window.clearTimeout(fecharTimer.current);
    fecharTimer.current = window.setTimeout(() => {
      fecharTimer.current = null;
      setIndiceAberto(false);
    }, 1500);
  }, []);

  // Não deixa um timer pendente disparar depois de desmontar.
  useEffect(() => {
    return () => {
      if (fecharTimer.current !== null) window.clearTimeout(fecharTimer.current);
    };
  }, []);

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
          hls.on(Hls.Events.ERROR, (_evt: unknown, data: { fatal?: boolean }) => {
            if (data?.fatal) {
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
        // Geometria da pilha da lateral esquerda (combinada com o
        // `SeuNono.tsx`, 03/10/2026): h-12 em 84..132 px da borda de baixo,
        // `left-5` → centro em x=44, o mesmo eixo de 56 px da pilha. O max()
        // repete a conta do safe-area do Seu Nonô para o iPhone não
        // desalinhar os três botões. `z-[45]`: por baixo da pata e do FAB
        // (z-50), por cima dos bichinhos (z-40) — um pet passando por trás
        // não pode cobrir o play.
        className="group fixed bottom-[max(6.25rem,calc(env(safe-area-inset-bottom)_+_5.25rem))] left-5 z-[45] flex flex-col items-start print:hidden"
        data-nao-plataforma
        // Abre no hover/foco e fecha com atraso de 1,5 s: o vão entre o botão
        // e o painel não some com o índice ao atravessá-lo (ver helpers abaixo).
        onMouseEnter={abrirIndice}
        onMouseLeave={agendarFecharIndice}
        // Foco por teclado também abre (focus bubbling do React), para quem
        // navega sem mouse alcançar os itens do índice. No celular o toque
        // foca o botão — o índice abre junto com o play, é a porta de troca
        // de estação em tela pequena.
        onFocus={abrirIndice}
        onBlur={agendarFecharIndice}
      >
        {/* Bolha de transcrição ao vivo (só nas federais de fala). */}
        {estacaoAtual?.transcrevivel && tocando && (
          <TranscricaoRadio key={estacaoAtual.id} estacao={estacaoAtual} />
        )}

        {/* Botão redondo só com play/pause (pedido do dono, 03/10/2026):
            a pílula com nome, arrasto e chevron saiu. O que aparece é o
            ícone do estado: Play parado, Pause tocando. Nome da estação,
            volume e lista vivem no índice, que abre no hover/foco. */}
        <button
          type="button"
          onClick={() => void tocar(idAtual ?? ESTACAO_PADRAO)}
          aria-label={rotulo}
          title={`${rotulo} — o índice de rádios abre ao passar o mouse`}
          aria-expanded={indiceAberto}
          aria-controls="cp-radio-indice"
          aria-pressed={tocando}
          className="flex h-12 w-12 touch-none items-center justify-center rounded-full border border-border bg-surface/95 shadow-lg backdrop-blur transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {tocando ? (
            <Pause size={20} aria-hidden="true" className="text-primary" />
          ) : (
            <Play size={20} aria-hidden="true" className="text-primary" />
          )}
        </button>

        {/* Índice expansível: aparece ao passar o mouse/focar no botão. */}
        {indiceAberto && (
          <div
            id="cp-radio-indice"
            className="absolute bottom-full left-0 mb-2 w-[min(calc(100vw-2rem),21rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border bg-primary/10 px-3 py-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-text">
                <ListMusic size={14} aria-hidden="true" />
                Índice de rádios
              </p>
              <Link
                href="/radio"
                className="text-xs font-semibold text-primary hover:underline"
                // Navegação: fecha na hora, sem os 1,5 s do hover — a saída é
                // intencional e o atraso só faria o índice piscar na transição.
                onClick={fecharIndiceJa}
              >
                Ver todas →
              </Link>
              <button
                type="button"
                onClick={fecharIndiceJa}
                aria-label="Fechar o índice de rádios"
                title="Fechar"
                className="rounded-full p-0.5 text-text-soft hover:bg-surface-2 hover:text-primary"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
            {/* Volume no cabeçalho do índice: o botão do canto virou só um
                ícone (03/10/2026), então o controle de som mora aqui —
                visível sem rolar, em qualquer tela. O `range` usa a mesma
                escala 0–1 de `audio.volume`; o mudo tem `aria-pressed`. */}
            <div className="flex items-center gap-2 border-b border-border bg-surface-2/50 px-3 py-2">
              <button
                type="button"
                onClick={() => setMudo((m) => !m)}
                aria-label={mudo ? "Ativar som da rádio" : "Silenciar rádio"}
                aria-pressed={mudo}
                title={mudo ? "Ativar som" : "Silenciar"}
                className="shrink-0 text-text-soft transition-colors hover:text-primary"
              >
                {mudo || volume === 0 ? (
                  <VolumeX size={16} aria-hidden="true" />
                ) : (
                  <Volume2 size={16} aria-hidden="true" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={mudo ? 0 : volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  if (v > 0) setMudo(false);
                }}
                aria-label="Volume da rádio"
                className="h-1 w-full min-w-0 cursor-pointer accent-[var(--cp-primary)]"
              />
              <span
                aria-hidden="true"
                className="w-8 shrink-0 text-right text-[0.65rem] tabular-nums text-text-soft"
              >
                {mudo || volume === 0 ? "mudo" : `${Math.round(volume * 100)}%`}
              </span>
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
                              {ativa && carregando && (
                                <span className="shrink-0 text-[0.65rem] font-medium text-primary">
                                  Sintonizando…
                                </span>
                              )}
                              <span title={e.paisNome} className="inline-flex">
                                <Bandeira iso={e.pais} nome={e.paisNome} tamanho={12} />
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

      </div>
    </>
  );
}
