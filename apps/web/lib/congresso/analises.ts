/**
 * @file Lógica pura do painel `/congresso/analises`.
 *
 * O QUE É: o recorte único que alimenta contador, barras, lista e paginação do
 * painel que substituiu `/congresso/alertas` e `/congresso/bons-exemplos`
 * (02/11/2026). As duas páginas antigas eram a MESMA entidade — proposição
 * federal com análise de direitos concluída — separadas só pelo sentido do
 * rótulo: `reducionista*` (restringe) e `garantista*` (amplia).
 *
 * POR QUE UM MÓDULO PURO: o botão da faceta, a barra e a lista precisam dizer
 * o mesmo número. Se cada bloco contasse por conta própria, um deles mentiria
 * no primeiro dia em que o acervo mudasse. Aqui a contagem é uma função só,
 * testada, e a página apenas desenha o resultado — estado na URL, render no
 * servidor (AGENTS §5.1 e §5.13).
 *
 * O QUE FICA DE FORA DO PAINEL: análises com rótulo `neutro` ou `misto` (e as
 * que ainda não têm análise). Elas existem em `coberturaAnalise` e o painel
 * declara a diferença — número sem denominador é erro de publicação.
 *
 * FONTE: `analises` e `analise_itens` do banco do portal, alimentadas pelo ETL
 * a partir da API de Dados Abertos da Câmara dos Deputados
 * (dadosabertos.camara.leg.br). A classificação vem de `rubrica.ts`, nunca do
 * modelo de linguagem.
 */

import type { Destaque } from "@/lib/congresso/destaques";
import { TEMAS, casaComTema, temaPorSlug, type Tema } from "@/lib/congresso/temas";

/** Os três recortes do painel. `todas` é o acervo inteiro dos dois sentidos. */
export const RECORTES = [
  { slug: "todas", rotulo: "Todas as análises" },
  { slug: "restringem", rotulo: "Restringem direitos" },
  { slug: "ampliam", rotulo: "Ampliam direitos" },
] as const;

export type Recorte = (typeof RECORTES)[number]["slug"];

/** Quantos cartões cabem numa página — o mesmo tamanho que a tabela antiga. */
export const POR_PAGINA = 20;

/** A proposição é do lado restritivo da régua? Fonte: `rubrica.ts`. */
export function restringe(rotulo: Destaque["rotulo"]): boolean {
  return (rotulo ?? "").startsWith("reducionista");
}

/** Lê o recorte da URL. Valor desconhecido cai em `todas`, nunca em erro. */
export function recortePorSlug(valor?: string | string[] | null): Recorte {
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  if (bruto === "restringem" || bruto === "ampliam") return bruto;
  return "todas";
}

/** O tema da URL só vale se existir na rubrica — slug inventado não filtra. */
export function temaDoParam(valor?: string | string[] | null): Tema | undefined {
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  return bruto ? temaPorSlug(bruto) : undefined;
}

/**
 * Aplica o recorte. A ordem recebida é preservada: restritivos vêm do mais
 * grave para o menos (`alertas()`), ampliativos do mais expressivo para o
 * menos (`bonsExemplos()`).
 */
export function filtrarPorRecorte(lista: Destaque[], recorte: Recorte): Destaque[] {
  if (recorte === "todas") return lista;
  const querRestritivo = recorte === "restringem";
  return lista.filter((d) => restringe(d.rotulo) === querRestritivo);
}

/** Recorte do tema sobre uma lista já recortada. */
export function filtrarPorTema(lista: Destaque[], tema?: Tema): Destaque[] {
  if (!tema) return lista;
  return lista.filter((d) => casaComTema(tema, d, d.direitos));
}

/**
 * Quantas proposições cada tema alcança e a ordem de exibição.
 *
 * ATENÇÃO AO DENOMINADOR: um projeto pode pertencer a mais de um tema (casa por
 * tema oficial, direito ou regex da ementa). Por isso a soma das barras pode
 * passar do total do recorte — a nota do painel diz isso em vez de esconder.
 */
export function contarPorTema(lista: Destaque[]): Array<{ slug: string; nome: string; n: number }> {
  return TEMAS.map((tema) => ({
    slug: tema.slug,
    nome: tema.nome,
    n: filtrarPorTema(lista, tema).length,
  }))
    .filter((t) => t.n > 0)
    .sort((a, b) => b.n - a.n || a.nome.localeCompare(b.nome, "pt-BR"));
}

/**
 * Uma proposição, um cartão.
 *
 * O banco guarda análise por proposição, mas reanálise produz mais de uma linha
 * com `status = 'ok'`. As listas antigas eram separadas por rótulo, então a
 * repetição não aparecia; no painel "todas" as duas cairiam lado a lado, com a
 * mesma `key`. Fica a análise mais recente (`analisadaEm`) e a ordem de primeira
 * aparição é preservada.
 */
export function semDuplicatas(lista: Destaque[]): Destaque[] {
  const indice = new Map<string, number>();
  const saida: Destaque[] = [];
  for (const d of lista) {
    const i = indice.get(d.id);
    if (i === undefined) {
      indice.set(d.id, saida.length);
      saida.push(d);
      continue;
    }
    if ((d.analisadaEm ?? "") > (saida[i].analisadaEm ?? "")) saida[i] = d;
  }
  return saida;
}

/** Lê `?pagina=` como inteiro positivo. Qualquer outra coisa vira 1. */export function paginaDoParam(valor?: string | string[] | null): number {
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  const n = Number.parseInt(bruto ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export interface Pagina<T> {
  itens: T[];
  /** Página efetivamente exibida, já presa ao intervalo válido. */
  pagina: number;
  totalPaginas: number;
  /** Posição 1-based do primeiro item; 0 quando a lista está vazia. */
  inicio: number;
  /** Posição 1-based do último item; 0 quando a lista está vazia. */
  fim: number;
  total: number;
}

/**
 * Corta a lista da página. Página fora do intervalo é presa na borda — link
 * antigo para `?pagina=99` mostra a última página em vez de tela vazia.
 */
export function paginar<T>(itens: T[], pagina: number, porPagina = POR_PAGINA): Pagina<T> {
  const total = itens.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const atual = Math.min(Math.max(1, Math.trunc(pagina) || 1), totalPaginas);
  const deslocamento = (atual - 1) * porPagina;
  const fatia = itens.slice(deslocamento, deslocamento + porPagina);
  return {
    itens: fatia,
    pagina: atual,
    totalPaginas,
    inicio: fatia.length ? deslocamento + 1 : 0,
    fim: deslocamento + fatia.length,
    total,
  };
}

/**
 * URL do painel. Parâmetro no padrão é omitido para não criar URL duplicada:
 * `todas` sem tema e sem página é a própria rota canônica, `/congresso/analises`.
 */
export function hrefAnalises({
  recorte = "todas",
  tema,
  pagina = 1,
}: {
  recorte?: Recorte;
  tema?: string;
  pagina?: number;
} = {}): string {
  const params = new URLSearchParams();
  if (recorte !== "todas") params.set("recorte", recorte);
  if (tema) params.set("tema", tema);
  if (pagina > 1) params.set("pagina", String(pagina));
  const qs = params.toString();
  return `/congresso/analises${qs ? `?${qs}` : ""}`;
}

/** Item de faceta: o rótulo do botão e o N medido no MESMO recorte. */
export interface ItemFaceta {
  slug: string;
  rotulo: string;
  n: number;
}

/** Tudo que o painel desenha, medido uma vez e passado como bloco único. */
export interface VisaoPainel {
  acervo: Destaque[];
  recorte: Recorte;
  tema?: Tema;
  cobertura: { analisadas: number; total: number };
  /** Análises concluídas que não estão neste painel (neutras, mistas, repetidas). */
  foraDoPainel: number;
  /** N de cada botão já condicionado ao tema atual. */
  facetasDeRecorte: ItemFaceta[];
  /** N de cada botão já condicionado ao recorte atual. */
  facetasDeTema: ItemFaceta[];
  /** Denominador do recorte atual (com tema, quando houver). */
  totalNoRecorte: number;
  /** Denominador do tema atual (todo o acervo, quando não houver tema). */
  totalNoTema: number;
  barras: Array<{ slug: string; nome: string; n: number }>;
  pagina: Pagina<Destaque>;
}

/**
 * Monta a visão inteira do painel a partir das duas listas do banco.
 *
 * POR QUE AQUI, E NÃO NA PÁGINA: contador, barras, lista e paginação precisam
 * sair do mesmo recorte. Concentrar a conta numa função pura permite testar
 * que o N do botão é o tamanho da lista, sem renderizar React nem tocar o
 * banco. A página fica só com o desenho.
 */
export function montarVisao({
  restringem,
  ampliam,
  cobertura,
  recorte,
  tema,
  pagina: paginaPedida,
}: {
  restringem: Destaque[];
  ampliam: Destaque[];
  cobertura: { analisadas: number; total: number };
  recorte: Recorte;
  tema?: Tema;
  pagina: number;
}): VisaoPainel {
  const acervo = semDuplicatas([...restringem, ...ampliam]);
  const recortado = filtrarPorRecorte(acervo, recorte);
  const noTema = filtrarPorTema(acervo, tema);
  const doRecorte = filtrarPorTema(recortado, tema);

  return {
    acervo,
    recorte,
    tema,
    cobertura,
    foraDoPainel: Math.max(0, cobertura.analisadas - acervo.length),
    facetasDeRecorte: [
      {
        slug: "restringem",
        rotulo: "Restringem",
        n: filtrarPorRecorte(noTema, "restringem").length,
      },
      {
        slug: "ampliam",
        rotulo: "Ampliam",
        n: filtrarPorRecorte(noTema, "ampliam").length,
      },
    ],
    facetasDeTema: TEMAS.map((t) => ({
      slug: t.slug,
      rotulo: t.nome,
      n: filtrarPorTema(recortado, t).length,
    })).filter((f) => f.n > 0),
    totalNoRecorte: doRecorte.length,
    totalNoTema: noTema.length,
    barras: contarPorTema(doRecorte),
    pagina: paginar(doRecorte, paginaPedida),
  };
}
