"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  GripVertical,
  ListMusic,
  Pause,
  Play,
  Radio,
  Volume2,
  VolumeX,
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
import { usarArrastavel } from "@/lib/usarArrastavel";

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
  // Volume e mudo: pedido do dono (02/10/2026). O rádio toca em segundo
  // plano; sem controle de volume o leitor só podia mutar o aparelho
  // inteiro. O estado é do React e é espelhado no `<audio>` por efeito.
  const [volume, setVolume] = useState(1);
  const [mudo, setMudo] = useState(false);
  // Janela arrastável: o canto pode tapar o que a pessoa precisa ler; a
  // posição fica lembrada no `localStorage` (pedido do dono, 30/09/2026).
  const { estilo, arrastando, handlers, resetar } = usarArrastavel("cp_radio_pos");

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
        style={estilo}
        // `group` revela o volume no hover/foco do player inteiro — inclusive
        // quando o ponteiro está sobre o painel do índice (que é filho).
        className="group fixed bottom-4 left-[4.75rem] z-40 flex flex-col items-start print:hidden"
        // Abre no hover/foco e fecha com atraso de 1,5 s: o vão entre o botão
        // e o painel não some com o índice ao atravessá-lo (ver helpers abaixo).
        onMouseEnter={abrirIndice}
        onMouseLeave={agendarFecharIndice}
        // Foco por teclado também abre (focus bubbling do React), para quem
        // navega sem mouse alcançar os itens do índice.
        onFocus={abrirIndice}
        onBlur={agendarFecharIndice}
      >
        {/* Bolha de transcrição ao vivo (só nas federais de fala). */}
        {estacaoAtual?.transcrevivel && tocando && (
          <TranscricaoRadio key={estacaoAtual.id} estacao={estacaoAtual} />
        )}

        {/* Controle único do player. Antes eram TRÊS botões soltos (arrastar,
            play e chevron do índice); viraram uma pílula só: a pega de arrasto
            à esquerda e o corpo clicável (play/pause + nome + indicador do
            índice) à direita. O índice abre no hover/foco do conjunto — o
            chevron é só o indicador visual, sem botão próprio. */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-stretch overflow-hidden rounded-full border border-border bg-surface/95 shadow-lg backdrop-blur">
            {/* Pega de arrasto: move a janelinha; clique duplo volta ao canto.
                `touch-none` impede a página de rolar em vez de arrastar. */}
            <button
              type="button"
              {...handlers}
              onDoubleClick={resetar}
              aria-label="Arrastar o player de rádio"
              title="Arraste para mover; clique duplo volta ao canto"
              className={`touch-none inline-flex cursor-grab items-center justify-center border-r border-border px-1.5 text-text-soft transition-colors hover:bg-surface-2 hover:text-primary ${
                arrastando ? "cursor-grabbing" : ""
              }`}
            >
              <GripVertical size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => void tocar(idAtual ?? ESTACAO_PADRAO)}
              aria-label={rotulo}
              title={`${rotulo} — o índice de rádios abre aqui`}
              aria-expanded={indiceAberto}
              aria-controls="cp-radio-indice"
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-text transition-colors hover:bg-surface-2 hover:text-primary"
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
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={`shrink-0 text-text-soft transition-transform ${indiceAberto ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Volume: aparece no hover/foco do player inteiro (classe `group`)
              e também enquanto `indiceAberto` — assim ele não pisca no vão
              entre o botão e o painel, nem some ao passar o mouse sobre o
              painel. O botão de mudo tem estado `aria-pressed`; o `range` usa
              a mesma escala 0–1 de `audio.volume`. Enquanto invisível fica
              `pointer-events-none`, para um clique às cegas não mexer no som;
              o foco de teclado continua chegando nele. */}
          <div
            className={`flex items-center gap-1.5 rounded-full border border-border bg-surface/95 px-2 py-1.5 shadow-lg backdrop-blur transition-opacity ${
              indiceAberto
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
            }`}
          >
            <button
              type="button"
              onClick={() => setMudo((m) => !m)}
              aria-label={mudo ? "Ativar som da rádio" : "Silenciar rádio"}
              aria-pressed={mudo}
              title={mudo ? "Ativar som" : "Silenciar"}
              className="text-text-soft transition-colors hover:text-primary"
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
              className="h-1 w-20 cursor-pointer accent-[var(--cp-primary)]"
            />
          </div>
        </div>

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
