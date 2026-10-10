/**
 * ═══ TABELA ORDENÁVEL — A LÓGICA PURA ═══
 *
 * O descritor de coluna (`ColunaOrdenavel`) e os cálculos que não dependem de
 * React: normalizar, comparar linhas, extrair o texto de uma coluna, filtrar,
 * ordenar e montar as opções do filtro de categoria.
 *
 * Fica separado do componente (`app/eleicoes/2026/gastos-campanha/
 * TabelaOrdenavel.tsx`) pelo mesmo motivo de `lib/tabela/ordenar.ts`: lógica
 * pura é testável sem montar React, e o componente só liga estado e UI. Aqui
 * NÃO há JSX — a formatação de moeda/número mora no componente (usa `Moeda`).
 *
 * Regra dos valores ausentes: ausente = null/undefined/vazio/número inválido
 * (`Number(null)` é 0, por isso a checagem explícita). No comparador NUMÉRICO o
 * ausente fica no FIM nas DUAS direções (mesma decisão de `ordenar.ts`): dado
 * que existe é mais confiável que dado que falta; só os presentes invertem.
 */

export type Direcao = "asc" | "desc";

/** Descritor PLANO de uma coluna (atravessa a fronteira servidor→cliente). */
export interface ColunaOrdenavel {
  /** Campo principal da linha (leitura, ordenação e cabeçalho do CSV). */
  campo: string;
  rotulo: string;
  /** Alinha à direita com numerais tabulares (dinheiro e contagem). */
  numerica?: boolean;
  formato?: "texto" | "numero" | "moeda";
  /** Campo secundário exibido em letra pequena sob o principal. */
  subtexto?: string;
  /** Junta vários campos numa célula (ex.: `cargo/uf`). */
  combinar?: string[];
  separador?: string;
  /** Texto quando o valor é nulo/vazio (padrão "—"). */
  vazio?: string;
  /** Campo booleano que, verdadeiro, acrescenta um selo ao lado do principal. */
  selo?: string;
  seloTexto?: string;
  /** Vira um `<select>` de categoria acima da tabela. */
  filtro?: boolean;
}

type Linha = Record<string, unknown>;

/** Sem acento, minúsculo e sem espaços nas pontas — a régua da busca do portal. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Converte um valor incerto em string, tratando nulo/indefinido como vazio. */
export function texto(v: unknown): string {
  if (v === null) return "";
  if (v === undefined) return "";
  return String(v);
}

/** Ausente = nulo, indefinido, vazio ou número inválido. */
export function ehVazio(v: unknown): boolean {
  if (v === null) return true;
  if (v === undefined) return true;
  if (v === "") return true;
  if (typeof v === "number") return !Number.isFinite(v);
  return false;
}

/** Complemento de `ehVazio`, para evitar `!` no meio de expressões longas. */
export function ehPresente(v: unknown): boolean {
  if (ehVazio(v)) return false;
  return true;
}

function separadorDe(col: ColunaOrdenavel): string {
  if (col.separador) return col.separador;
  return "/";
}

/** Texto quando o valor é vazio — o rótulo do descritor, ou "—". */
export function vazioDe(col: ColunaOrdenavel): string {
  if (col.vazio) return col.vazio;
  return "—";
}

/** Junta os campos combinados (ex.: `cargo/uf`); vazio quando não há combinação. */
export function combinado(l: Linha, col: ColunaOrdenavel): string {
  if (!col.combinar) return "";
  return col.combinar.map((c) => texto(l[c])).filter(Boolean).join(separadorDe(col));
}

/** Texto/valor de uma coluna para ordenar (combinado quando `combinar` existe). */
export function chaveOrdenacao(l: Linha, col: ColunaOrdenavel): string {
  if (col.combinar) return combinado(l, col);
  return texto(l[col.campo]);
}

function ordemNumerica(col: ColunaOrdenavel): boolean {
  if (col.numerica) return true;
  if (col.formato === "numero") return true;
  if (col.formato === "moeda") return true;
  return false;
}

function compararTexto(a: Linha, b: Linha, col: ColunaOrdenavel, dir: Direcao): number {
  const base = chaveOrdenacao(a, col).localeCompare(chaveOrdenacao(b, col), "pt-BR");
  if (dir === "asc") return base;
  return -base;
}

function compararNumero(a: Linha, b: Linha, col: ColunaOrdenavel, dir: Direcao): number {
  const va = a[col.campo];
  const vb = b[col.campo];
  const fa = ehPresente(va);
  const fb = ehPresente(vb);
  if (fa !== fb) {
    // Ausente nunca "sobe": fica no fim em qualquer direção.
    if (fa) return -1;
    return 1;
  }
  if (!fa) return 0;
  const na = Number(va);
  const nb = Number(vb);
  let base = 0;
  if (na < nb) base = -1;
  if (na > nb) base = 1;
  if (dir === "asc") return base;
  return -base;
}

/** Compara duas linhas por uma coluna, já aplicando a direção. */
export function compararLinhas(a: Linha, b: Linha, col: ColunaOrdenavel, dir: Direcao): number {
  if (ordemNumerica(col)) return compararNumero(a, b, col, dir);
  return compararTexto(a, b, col, dir);
}

/** Valor de uma coluna para o CSV: combinado, número cru (moeda/contagem) ou texto. */
export function textoCsv(l: Linha, col: ColunaOrdenavel): string | number {
  if (col.combinar) return combinado(l, col);
  const v = l[col.campo];
  if (ehVazio(v)) return "";
  if (col.formato === "moeda") return Number(v);
  if (col.formato === "numero") return Number(v);
  return String(v);
}

/** Valores únicos de uma coluna, ordenados em pt-BR — as opções do filtro. */
export function opcoesDeFiltro(linhas: readonly Linha[], col: ColunaOrdenavel): string[] {
  const valores = linhas.map((l) => texto(l[col.campo])).filter(Boolean);
  return [...new Set(valores)].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Mapa `campo → opções` para todas as colunas marcadas como filtro. */
export function opcoesPorColuna(
  linhas: readonly Linha[],
  colunas: readonly ColunaOrdenavel[]
): Record<string, string[]> {
  const mapa: Record<string, string[]> = {};
  for (const c of colunas) mapa[c.campo] = opcoesDeFiltro(linhas, c);
  return mapa;
}

/** Aplica os filtros de categoria e depois a busca textual (sem acento/caixa). */
export function filtrarLinhas(
  linhas: readonly Linha[],
  filtros: Record<string, string>,
  busca: readonly string[] | undefined,
  termo: string
): Linha[] {
  let r = [...linhas];
  for (const [campo, valor] of Object.entries(filtros)) {
    if (valor) r = r.filter((l) => texto(l[campo]) === valor);
  }
  const alvo = normalizar(termo);
  if (!alvo) return r;
  if (!busca) return r;
  return r.filter((l) => busca.some((c) => normalizar(texto(l[c])).includes(alvo)));
}

/** Ordena por uma coluna, devolvendo nova lista. */
export function ordenarLinhas(
  linhas: readonly Linha[],
  col: ColunaOrdenavel,
  dir: Direcao
): Linha[] {
  return [...linhas].sort((a, b) => compararLinhas(a, b, col, dir));
}
