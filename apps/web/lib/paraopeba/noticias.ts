/**
 * @file Dimensão do painel de notícias do Paraopeba.
 *
 * O QUE É: os dois recortes de varredura automática da frente — o radar da
 * bacia do Paraopeba e o radar da Vale S.A. Até 02/11/2026 eram duas rotas
 * (`/paraopeba/noticias` e `/paraopeba/noticias-vale`) com a mesma pergunta
 * ("o que saiu na imprensa?") e fontes diferentes. Agora é uma URL canônica
 * com `?fonte=`, e cada recorte mantém a própria ressalva, o próprio coletor
 * e a própria contagem.
 *
 * POR QUE OS DOIS CONTINUAM SEPARADOS DENTRO DO PAINEL: o radar da bacia
 * filtra por termos do caso (Vale, Brumadinho, barragem, reparação, Mariana);
 * o da Vale filtra quatro feeds pela companhia. Juntar as listas num array só
 * faria um item de Brumadinho aparecer como "notícia da Vale" — e a
 * procedência é parte do dado. O painel junta a porta, não a fonte.
 *
 * FONTE: `scripts/coletar-noticias-paraopeba.py` e
 * `scripts/coletar-noticias-vale.mts`, ambas lidas no build.
 */

/** Os dois recortes possíveis do painel. */
export type FonteNoticia = "bacia" | "vale";

export interface FonteNoticiaDef {
  slug: FonteNoticia;
  rotulo: string;
  /** Uma frase sobre o que a varredura cobre — vai no botão e no `title`. */
  descricao: string;
  /** Coletor que produz o arquivo, para a seção "de onde vem o dado". */
  coletor: string;
}

export const FONTES_NOTICIA: readonly FonteNoticiaDef[] = [
  {
    slug: "bacia",
    rotulo: "Bacia do Paraopeba",
    descricao: "Varredura diária de matérias, decisões e atos sobre o caso Brumadinho.",
    coletor: "scripts/coletar-noticias-paraopeba.py",
  },
  {
    slug: "vale",
    rotulo: "Vale S.A.",
    descricao: "Quatro feeds públicos filtrando a companhia e a mineração.",
    coletor: "scripts/coletar-noticias-vale.mts",
  },
] as const;

/** Recorte exibido quando a URL chega sem `?fonte=`. */
export const FONTE_PADRAO: FonteNoticia = "bacia";

/** Resolve o `searchParams.fonte` para uma definição conhecida. */
export function fontePorSlug(bruto?: string | string[]): FonteNoticiaDef {
  const slug = Array.isArray(bruto) ? bruto[0] : bruto;
  return FONTES_NOTICIA.find((fonte) => fonte.slug === slug) ?? FONTES_NOTICIA[0];
}

/**
 * URL do recorte. Sempre com `?fonte=`, inclusive no padrão: é esse endereço
 * que o canonical anuncia, para o painel nu não competir com o recorte.
 */
export function hrefNoticia(bruto?: string | string[]): string {
  return `/paraopeba/noticias?fonte=${fontePorSlug(bruto).slug}`;
}
