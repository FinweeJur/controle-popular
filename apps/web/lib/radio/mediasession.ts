/**
 * @file mediasession.ts
 * @description Metadados do player de rádio para o Media Session do navegador.
 *
 * POR QUE EXISTE (dono, 18/11/2026): no celular e no tablet o portal toca a
 * rádio, mas o sistema não mostrava controle nenhum — a barra de notificação
 * (Android/Chrome) e a tecla de mídia do fone não sabiam que estação estava no
 * ar. Com a Media Session API, o sistema passa a exibir play/pause, o nome da
 * estação e a origem (Controle Popular), e o áudio deixa de ser "aba em
 * segundo plano" aos olhos do sistema operacional.
 *
 * O QUE ESTE MÓDULO FAZ: monta o objeto de metadados a partir da estação
 * (`lib/radio/estacoes.ts`) e da origem do site. Função pura, sem `navigator`,
 * para o teste rodar fora do navegador e travar o texto que aparece na
 * notificação.
 *
 * ARTE: o emblema do portal (`/marca/emblema.png`, 256x256) é a única imagem
 * quadrada e estável do repositório. Favicon de emissora é hotlink de 16-64 px
 * e chegaria borrado na notificação; o TÍTULO é que nomeia a rádio.
 */

import { ROTULO_TIPO, type EstacaoRadio } from "./estacoes";

/** Título/artista/álbum/arte como o sistema operacional vai exibir. */
export interface MidiaDaEstacao {
  titulo: string;
  artista: string;
  album: string;
  artwork: { src: string; sizes: string; type: string }[];
}

/** Origem exibida abaixo do nome da rádio, igual em toda estação. */
export const ORIGEM_RADIO = "Controle Popular · rádio ao vivo";

/** Emblema quadrado do portal, relativo à raiz do site. */
export const ARTE_RADIO = "/marca/emblema.png";

/** Lugar da emissora para o álbum: cidade/UF ou país, depois a categoria. */
function lugarDaEstacao(estacao: EstacaoRadio): string {
  const lugar = estacao.cidade
    ? estacao.uf
      ? `${estacao.cidade}, ${estacao.uf}`
      : estacao.cidade
    : estacao.paisNome;
  return `${lugar} · ${ROTULO_TIPO[estacao.tipo]}`;
}

/**
 * Metadados da estação. `origem` é `window.location.origin` — a Media Session
 * exige URL ABSOLUTA na arte; caminho relativo some da notificação.
 */
export function midiaDaEstacao(
  estacao: EstacaoRadio,
  origem: string
): MidiaDaEstacao {
  return {
    titulo: estacao.nome,
    artista: ORIGEM_RADIO,
    album: lugarDaEstacao(estacao),
    artwork: [
      {
        src: new URL(ARTE_RADIO, origem).href,
        sizes: "256x256",
        type: "image/png",
      },
    ],
  };
}
