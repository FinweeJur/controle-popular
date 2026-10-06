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
import Bandeira, { BandeiraEstado } from "@/app/components/Bandeira";
import LogoRadio from "@/app/components/LogoRadio";
import TranscricaoRadio from "@/app/components/TranscricaoRadio";
import MedidorLiquido from "@/app/components/react-bits/SloshGauge";
import { useProximidadeLinha } from "@/app/components/react-bits/useProximidadeLinha";
import { useArrastavel } from "@/lib/usarArrastavel";
import {
  medirTopoUtil,
  usePosicaoPainel,
  type CaixaAncora,
} from "@/lib/posicionar-painel";

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
 * círculo da pilha da lateral esquerdo (abaixo vem a pata do pet, embaixo o
 * FAB do Seu Nonô; régua em `SeuNono.tsx`). O índice de estações e o volume
 * abrem no hover/foco do conjunto (`group`); no celular o toque foca e abre.
 *
 * VOLUME À DIREITA + CASCA (pedido do dono, 06/10/2026): o volume era uma
 * linha no cabeçalho do índice e, com o painel abrindo para cima, o topo
 * passava por trás da navbar (`TopNav` `z-50` fica ACIMA do grupo `z-[45]`)
 * — "cortando no topo". Duas correções juntas: (1) o painel virou duas
 * colunas — esquerda com título e lista, direita com o medidor de líquido
 * (SloshGauge, pedido "com essa animação") e o botão de mudo; (2) o
 * `margemTopo` do posicionador desconta a casca (`medirTopoUtil`), então o
 * painel abre abaixo da navbar sem burlar a ordem de camadas. A lista
 * também ganhou o efeito de proximidade LineSidebar: barra de acento no
 * item mais perto do ponteiro (`useProximidadeLinha`).
 *
 * ARRASTO DE VOLTA (conserto, 03/10/2026): a posição fixa tinha tirado o
 * arrasto do rádio. O dono pediu os TRÊS arrastáveis e com posição lembrada
 * — o rádio voltou a usar `useArrastavel` (chave `cp_radio_pos`). O clique
 * de play/pause continua: o gesto só é arrasto depois de 5 px e o `onClick`
 * consulta `foiArrasto()` para não tocar a estação ao mover.
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

  // Arrasto com posição lembrada (pedido do dono, 03/10/2026): o botão é o
  // terceiro círculo da pilha, mas pode ser movido como o FAB do Seu Nonô.
  // A posição persiste em `cp_radio_pos` e o clique continua separado do
  // gesto pelo limiar de 5 px (`foiArrasto`).
  const { estilo, arrastando, foiArrasto, handlers, resetar } =
    useArrastavel("cp_radio_pos");

  // Posicionamento do índice (pedido do dono, 03/10/2026): o painel abria
  // ACIMA com `bottom-full` e, em tela baixa, o topo (com o volume) saía pela
  // borda de cima. Agora a caixa do conjunto é a âncora e o utilitário decide
  // abrir para cima ou para baixo, mantendo o volume visível e o painel
  // inteiro na tela. O índice é `position: absolute` dentro do conjunto
  // (que é `fixed` e tem `transform` do arrasto) — por isso as coordenadas de
  // viewport viram deslocamento relativo subtraindo a caixa da âncora.
  const grupoRef = useRef<HTMLDivElement | null>(null);
  const indiceRef = useRef<HTMLDivElement | null>(null);
  // Contêiner da lista para o efeito de proximidade (LineSidebar): os itens
  // `[data-cp-prox]` acendem conforme o ponteiro passa. A ref é estável e o
  // hook resolve o elemento a cada quadro — o índice nasce no hover.
  const listaRef = useRef<HTMLDivElement | null>(null);
  useProximidadeLinha(listaRef);
  const medirAncoraIndice = useCallback((): CaixaAncora | null => {
    const el = grupoRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { esq: r.left, topo: r.top, larg: r.width, alt: r.height };
  }, []);
  const posIndice = usePosicaoPainel({
    aberto: indiceAberto,
    painelRef: indiceRef,
    medirAncora: medirAncoraIndice,
    // Casca sticky (navbar `z-50`) descontada do topo: o painel fica num
    // grupo `z-[45]` — abaixo dela por regra de camadas — então ele NÃO
    // sobe por cima: abre abaixo, sem perder a primeira linha atrás da barra
    // (medido 06/10/2026, "volume cortando no topo").
    opcoes: { margemTopo: medirTopoUtil },
  });

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
        ref={grupoRef}
        style={estilo}
        className="group fixed bottom-[max(6.25rem,calc(env(safe-area-inset-bottom)_+_5.25rem))] left-5 z-[45] flex flex-col items-start print:hidden"
        data-arrastavel-caixa
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
          {...handlers}
          onDoubleClick={resetar}
          onClick={() => {
            // Gesto foi mover: não tocar a estação por acidente (limiar de
            // 5 px no hook). Sem isto, arrastar o rádio daria play/pause.
            if (foiArrasto()) return;
            void tocar(idAtual ?? ESTACAO_PADRAO);
          }}
          aria-label={rotulo}
          title={`${rotulo} — arraste para mover; clique duplo volta ao canto; o índice abre ao passar o mouse`}
          aria-expanded={indiceAberto}
          aria-controls="cp-radio-indice"
          aria-pressed={tocando}
          className={`flex h-12 w-12 touch-none items-center justify-center rounded-full border border-border bg-surface/95 shadow-lg backdrop-blur transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            arrastando ? "cursor-grabbing" : "cursor-grab"
          }`}
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
            ref={indiceRef}
            id="cp-radio-indice"
            // Posição vinda do utilitário; `visibility` só evita um flash na
            // primeira pintura, enquanto o `useLayoutEffect` ainda não mediu.
            style={{
              left: posIndice
                ? Math.round(posIndice.posicao.x - posIndice.ancora.esq)
                : 0,
              top: posIndice
                ? Math.round(posIndice.posicao.y - posIndice.ancora.topo)
                : 0,
              maxHeight: posIndice ? Math.round(posIndice.posicao.altura) : undefined,
              visibility: posIndice ? "visible" : "hidden",
            }}
            // Duas colunas (06/10/2026): esquerda título+lista, direita o
            // volume. `flex-row` + `overflow-hidden` mantêm o corte da rolagem
            // só na lista.
            className="absolute z-50 flex w-[min(calc(100vw-2rem),23rem)] flex-row overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
          >
            {/* Coluna esquerda: o título fixo e a lista que rola sozinha. */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex shrink-0 items-center justify-between border-b border-border bg-primary/10 px-3 py-2">
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
              {/* A lista é o pedaço que rola quando o utilitário corta a
                  altura: `flex-1 min-h-0` deixa o teto do painel vencer e o
                  título fica sempre visível. O `overscroll-contain` segura a
                  roda do mouse aqui dentro: sem ele, chegar ao fim da lista
                  arrastava a rolagem para a página atrás do painel.
                  `listaRef` é o contêiner do efeito de proximidade — os
                  itens `[data-cp-prox]` acendem perto do ponteiro. */}
              <div
                ref={listaRef}
                // `data-lenis-prevent`: a rolagem suave da página (Lenis) engole
                // a roda do mouse e só devolve o controle a quem se marca com
                // este atributo. Sem ele, esta lista fica parada — medido em
                // 06/10/2026 (`scrollH` 1976 > `clientH` 457 e `scrollTop` 0
                // depois da roda).
                data-lenis-prevent
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
              >
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
                          <li key={e.id} data-cp-prox>
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
                              <span
                                title={e.paisNome}
                                className="inline-flex items-center gap-1"
                              >
                                <Bandeira iso={e.pais} nome={e.paisNome} tamanho={12} />
                                {/* Estado ao lado do país só na estação
                                    brasileira; a componente some sem UF. */}
                                <BandeiraEstado uf={e.uf} tamanho={12} />
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

            {/* Coluna direita: volume à direita (pedido do dono, 06/10/2026
                — "barra de volume para a direita com essa animação"). O
                medidor de líquido (SloshGauge) ondula ao mudar de nível;
                arrastar ou usar as setas do teclado muda o volume
                (`role="slider"` liga no `interativo`). O mudo mantém o
                `aria-pressed` de antes; as cores vêm dos tokens do tema. */}
            <div className="flex shrink-0 flex-col items-center justify-center gap-3 border-l border-border bg-surface px-2 py-2">
              <button
                type="button"
                onClick={() => setMudo((m) => !m)}
                aria-label={mudo ? "Ativar som da rádio" : "Silenciar rádio"}
                aria-pressed={mudo}
                title={mudo ? "Ativar som" : "Silenciar"}
                className="shrink-0 text-text-soft transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {mudo || volume === 0 ? (
                  <VolumeX size={16} aria-hidden="true" />
                ) : (
                  <Volume2 size={16} aria-hidden="true" />
                )}
              </button>
              <MedidorLiquido
                interativo
                valor={mudo ? 0 : Math.round(volume * 100)}
                aoMudar={(n) => {
                  setVolume(n / 100);
                  if (n > 0) setMudo(false);
                }}
                corLiquido="var(--cp-primary)"
                corVidro="var(--cp-surface-2)"
                largura={56}
                altura={150}
                raio={14}
                rotuloAria="Volume da rádio"
              />
              <span
                aria-hidden="true"
                className="text-[0.65rem] font-medium tabular-nums text-text-soft"
              >
                {mudo || volume === 0 ? "mudo" : `${Math.round(volume * 100)}%`}
              </span>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
