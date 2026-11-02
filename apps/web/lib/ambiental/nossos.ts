/**
 * @file Dimensão do painel da Coleção Nossos — `/ambiental/nossos?colecao=`.
 *
 * O QUE É: as três listas que eram páginas irmãs (`/ambiental/nossos-rios`,
 * `/ambiental/nossas-serras`, `/ambiental/nossos-territorios`) viram UM
 * recorte por vez. Cada rota antiga era o MESMO esqueleto — título, parágrafo,
 * grade de cartões — e a única coisa que mudava era o filtro por `tipo` dentro
 * de `LUGARES_CATALOGO`. Não havia dado próprio em nenhuma das três: o dado
 * de cada rio/serra/território mora nas rotas dinâmicas `[slug]`, que
 * continuam vivas.
 *
 * POR QUE AQUI E NÃO NA PÁGINA: a página é componente de servidor; a
 * dimensão (slug, rótulo, texto de abertura e quais `tipo` cabem) é dado puro
 * e testável. A contagem da faceta sai da MESMA função que alimenta a lista —
 * o N do botão e o número de cartões não podem discordar.
 *
 * O QUE NÃO ENTROU: `nossos-animais` e `nossa-gente` parecem irmãs pelo
 * prefixo, mas têm catálogo e tabela próprios (CSV inclusive) e continuam
 * rotas; elas aparecem na faixa de páginas irmãs do painel.
 *
 * FONTE: `lib/lugares.ts` (catálogo versionado, sem coleta em tempo de
 * execução). Nenhum número é digitado à mão aqui.
 */

import { LUGARES_CATALOGO, type RegistroLugar } from "@/lib/lugares";

/** Um recorte da Coleção Nossos: um `tipo` (ou par de tipos) do catálogo. */
export interface RecorteNossos {
  /** Valor de `?colecao=`. */
  slug: "rios" | "serras" | "territorios";
  /** Rótulo curto do botão da faceta. */
  rotulo: string;
  /** Título da seção quando o recorte está ativo. */
  titulo: string;
  /** Linha de abertura — preserva o texto que cada rota antiga publicava. */
  descricao: string;
  /** Etiqueta do cartão de contexto. */
  etiqueta: string;
  /** Emoji usado pelos cartões das três listas antigas. */
  emoji: string;
  /** Texto do link de cada cartão, como estava na rota de origem. */
  cta: string;
  /**
   * Prefixo das rotas de detalhe (`<rota>/<id>`), que continuam vivas — é lá
   * que mora o dado de cada lugar. O índice antigo (`<rota>` puro) virou
   * ponte para este painel.
   */
  rota: "/ambiental/nossos-rios" | "/ambiental/nossas-serras" | "/ambiental/nossos-territorios";
  /** Tipos de `LUGARES_CATALOGO` que compõem este recorte. */
  tipos: ReadonlyArray<RegistroLugar["tipo"]>;
}

/**
 * A ordem é a da tela do hub (`/ambiental/nossos`), não a alfabética: rio,
 * serra e território contam a história "água, relevo, terra" que o hub abriu.
 */
export const RECORTES_NOSSOS: ReadonlyArray<RecorteNossos> = [
  {
    slug: "rios",
    rotulo: "Rios",
    titulo: "Nossos Rios: As Águas e a Vida Ribanceira",
    descricao:
      "Os rios que desenham o território, alimentam as cidades e sustentam a pesca e a agricultura de vazante.",
    etiqueta: "Bacias Hidrográficas",
    emoji: "🌊",
    cta: "Abrir painel do rio e impactos humanos →",
    rota: "/ambiental/nossos-rios",
    tipos: ["rio"],
  },
  {
    slug: "serras",
    rotulo: "Serras",
    titulo: "Nossas Serras: A Guardiã das Águas e da Paisagem",
    descricao:
      "Cordilheiras, picos e campos rupestres que protegem nascentes vitais, abrigam parques estaduais e enfrentam a pressão de títulos minerários.",
    etiqueta: "Cordilheiras & Relevo",
    emoji: "⛰️",
    cta: "Abrir painel da serra e impacto na nossa gente →",
    rota: "/ambiental/nossas-serras",
    tipos: ["serra"],
  },
  {
    slug: "territorios",
    rotulo: "Territórios",
    titulo: "Nossos Territórios: A Terra e a Posse Coletiva",
    descricao:
      "O Observatório Nacional Socioambiental reúne a malha fundiária, o Cadastro Ambiental Rural (CAR), os quilombos e a integridade ecológica do solo.",
    etiqueta: "Territórios & Função Social da Terra",
    emoji: "🌱",
    cta: "Abrir território e situação do nosso povo →",
    rota: "/ambiental/nossos-territorios",
    tipos: ["vale", "cerrado"],
  },
];

/** Normaliza o `searchParams` do App Router (string, array ou ausente). */
function primeiro(valor?: string | string[]): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

/**
 * Recorte pedido na URL. Slug desconhecido devolve `undefined`, e o painel
 * mostra a união — nunca um recorte inventado nem 404 por query errada.
 */
export function recortePorSlug(slug?: string | string[]): RecorteNossos | undefined {
  const alvo = primeiro(slug);
  return RECORTES_NOSSOS.find((recorte) => recorte.slug === alvo);
}

/**
 * Fichas de um recorte. Sem recorte, devolve a união dos três — é o "Todos"
 * do painel e o denominador das facetas.
 */
export function lugaresDoRecorte(recorte?: RecorteNossos): RegistroLugar[] {
  if (!recorte) {
    const tipos = new Set(RECORTES_NOSSOS.flatMap((item) => item.tipos));
    return LUGARES_CATALOGO.filter((lugar) => tipos.has(lugar.tipo));
  }
  const tipos = new Set(recorte.tipos);
  return LUGARES_CATALOGO.filter((lugar) => tipos.has(lugar.tipo));
}

/** N de uma faceta — mesma função que alimenta a lista, por construção. */
export function contarRecorte(recorte: RecorteNossos): number {
  return lugaresDoRecorte(recorte).length;
}

/** URL do painel: sem slug devolve a união, com slug o recorte. */
export function hrefColecao(slug?: string): string {
  return slug ? `/ambiental/nossos?colecao=${slug}` : "/ambiental/nossos";
}

/** Facetas prontas para `PainelFacetas`, com o N medido no catálogo. */
export function facetasNossos(): Array<{ slug: string; rotulo: string; n: number }> {
  return RECORTES_NOSSOS.map((recorte) => ({
    slug: recorte.slug,
    rotulo: recorte.rotulo,
    n: contarRecorte(recorte),
  }));
}
