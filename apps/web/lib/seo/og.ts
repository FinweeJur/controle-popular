/**
 * Imagem padrão de compartilhamento social (Open Graph) do portal.
 *
 * Papel no portal: quando alguém cola um link do Controle Popular no
 * WhatsApp, Telegram ou LinkedIn, o leitor vê um cartão com título,
 * descrição e imagem. Sem `images` no `openGraph`, o cartão sai sem foto.
 *
 * ## Por que este módulo existe
 *
 * O Next faz merge RASO de metadata entre layout e página: se a página
 * declara `openGraph` sem `images`, ela SUBSTITUI o objeto inteiro do layout
 * — e a imagem herdada da raiz some. Medido no ar em 04/10/2026: os posts
 * do blog (`/noticias/[slug]`) e `/betim/emendas` devolviam `<meta
 * property="og:image">` vazio. `comImagemOg()` injeta a imagem padrão em
 * qualquer `openGraph` montado na mão, sem depender da herança da raiz.
 *
 * Fonte do arquivo: `apps/web/public/capas/home-page.webp` (1200×630, o
 * tamanho mínimo que o Facebook e o WhatsApp aceitam para cartão grande).
 */

import type { Metadata } from "next";

/**
 * A forma de `openGraph` que o Next aceita, derivada do próprio `Metadata`:
 * o tipo `OpenGraph` não é exportado na raiz de `next` (só em caminho
 * interno, que muda entre versões).
 */
type OpenGraph = NonNullable<Metadata["openGraph"]>;

/** Caminho (relativo ao site) da capa padrão, no formato esperado pelo OG. */
export const CAPA_PADRAO = "/capas/home-page.webp";

/** Dimensões da capa — declaradas para o leitor não puxar a imagem "cerca". */
export const CAPA_LARGURA = 1200;
export const CAPA_ALTURA = 630;

export type ImagemOg = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

/** A capa padrão no formato do campo `openGraph.images`. */
export function imagemPadrao(alt?: string): ImagemOg[] {
  return [
    {
      url: CAPA_PADRAO,
      width: CAPA_LARGURA,
      height: CAPA_ALTURA,
      alt: alt ?? "Controle Popular — portal de fiscalização cidadã",
    },
  ];
}

/**
 * Devolve o `openGraph` recebido garantindo que `images` exista.
 *
 * Se o objeto já trouxer imagem (a página tem capa própria), é devolvido
 * como está — a regra só preenche o buraco, nunca sobrescreve escolha alheia.
 *
 * O parâmetro é tipado pelo próprio `Metadata["openGraph"]` do Next, não por
 * um genérico: com genérico o TypeScript inferia a constraint (`{images?}`)
 * no literal chamador e recusava `type: "website"` (medido em `tsc`, 04/10).
 */
export function comImagemOg(og: OpenGraph, alt?: string): OpenGraph {
  if ("images" in og && og.images) return og;
  return { ...og, images: imagemPadrao(alt) };
}
