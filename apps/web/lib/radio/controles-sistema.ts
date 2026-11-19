/**
 * @file controles-sistema.ts
 * @description Ponte entre o player de rádio e o Media Session do navegador.
 *
 * POR QUE EXISTE (dono, 18/11/2026): no celular, no tablet e no painel de
 * mídia do navegador a rádio tocava sem nome nem play/pause. Estas funções
 * publicam os metadados e registram os botões do sistema — todas com guarda
 * de ambiente (`navigator.mediaSession` não existe no servidor nem em
 * navegador antigo), para o componente não carregar esses `if`.
 *
 * QUEM MANDA NO ÁUDIO é o `<audio>` do `PlayerRadio`: `aoPausar` e `aoRetomar`
 * chegam de lá; aqui não há segundo player.
 *
 * Tipo de ação suportada varia por navegador (`setActionHandler` pode lançar);
 * por isso cada registro é isolado em `try` e o retorno desfaz tudo.
 */

import type { EstacaoRadio } from "./estacoes";
import { midiaDaEstacao } from "./mediasession";

/** `true` quando o navegador tem Media Session (Chrome, Edge, Safari 15+). */
function temMediaSession(): boolean {
  return typeof navigator !== "undefined" && "mediaSession" in navigator;
}

/** Publica título/artista/álbum/arte da estação. Nada acontece sem suporte. */
export function publicarMidia(estacao: EstacaoRadio): void {
  if (!temMediaSession() || typeof MediaMetadata === "undefined") return;
  const midia = midiaDaEstacao(estacao, window.location.origin);
  navigator.mediaSession.metadata = new MediaMetadata({
    title: midia.titulo,
    artist: midia.artista,
    album: midia.album,
    artwork: midia.artwork,
  });
}

/** Espelha "tocando/pausado" no sistema (senão o botão fica dessincronizado). */
export function publicarEstadoReproducao(tocando: boolean): void {
  if (!temMediaSession()) return;
  navigator.mediaSession.playbackState = tocando ? "playing" : "paused";
}

/**
 * Liga play/pause/stop do sistema ao player. Devolve a função que desliga,
 * para o `useEffect` limpar ao desmontar ou trocar de estação.
 */
export function ligarControlesDoSistema(
  aoRetomar: () => void,
  aoPausar: () => void
): () => void {
  if (!temMediaSession()) return () => {};
  const ms = navigator.mediaSession;
  const acoes: [MediaSessionAction, MediaSessionActionHandler][] = [
    ["play", aoRetomar],
    ["pause", aoPausar],
    ["stop", aoPausar],
  ];
  for (const [acao, handler] of acoes) {
    try {
      ms.setActionHandler(acao, handler);
    } catch {
      // Ação não suportada neste navegador: as outras seguem valendo.
    }
  }
  return () => {
    for (const [acao] of acoes) {
      try {
        ms.setActionHandler(acao, null);
      } catch {
        // Idem.
      }
    }
  };
}
