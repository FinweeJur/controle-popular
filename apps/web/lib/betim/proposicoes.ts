import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

export const PROPOSICOES_PAGE_SIZE = 30;

export interface ProposicaoListRow {
  id: string;
  tipo: string;
  numero: number | null;
  ano: number | null;
  ementa: string | null;
  situacao: string | null;
  data_apresentacao: string | null;
  autores: string[] | null;
  link_fonte: string | null;
  temas?: string[] | null;
}

export interface ProposicoesFilters {
  tipo?: string;
  situacao?: string;
  ano?: string;
  tema?: string;
  q?: string;
  page?: number;
}

export interface ProposicoesResult {
  rows: ProposicaoListRow[];
  total: number;
  configured: boolean;
  ok: boolean;
}

/**
 * O termo de busca continua sendo higienizado, mas por outra razão que a
 * original. No PostgREST, `%`, `,` e parênteses são SINTAXE da URL do
 * filtro — deixá-los passar mudava a consulta. Aqui o valor vai como
 * parâmetro ligado (`$1`), então não há injeção a evitar; o que sobra é o
 * `%`, que num `ilike` vira curinga e transforma "10%" numa busca por
 * qualquer coisa. Mantido para a busca dar o mesmo resultado de antes.
 */
function sanitizeSearchTerm(termo: string | undefined): string | undefined {
  const trimmed = termo?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/[%,()]/g, "");
}

/**
 * Lista paginada de `proposicoes` da Câmara inteira (não de um vereador
 * específico -- ver `getProposicoesByVereador` em lib/vereadores.ts pra
 * isso). Antes desta função só existia "os 3 últimos" na Home e a lista
 * por vereador -- não dava pra buscar/filtrar todas as proposições da
 * Câmara num só lugar (achado do usuário 2026-07-23).
 */
export async function fetchProposicoes(
  idMunicipio: IdMunicipio,
  filters: ProposicoesFilters = {}
): Promise<ProposicoesResult> {
  try {
    const data = await q.proposicoesPaginadas(idMunicipio, {
      tipo: filters.tipo,
      situacao: filters.situacao,
      ano: filters.ano ? Number(filters.ano) : undefined,
      tema: filters.tema,
      q: sanitizeSearchTerm(filters.q),
      pagina: filters.page,
      porPagina: PROPOSICOES_PAGE_SIZE,
    });
    if (!data) return { rows: [], total: 0, configured: false, ok: false };

    // O total do conjunto filtrado vem por `count(*) over ()` em cada
    // linha; sem linha nenhuma, o total é zero.
    return {
      rows: data as ProposicaoListRow[],
      total: data[0]?.total ?? 0,
      configured: true,
      ok: true,
    };
  } catch {
    return { rows: [], total: 0, configured: true, ok: false };
  }
}

/** Valores distintos de `situacao` hoje na tabela -- pra popular o
 *  `<select>` de filtro sem hardcoded uma lista que pode ficar
 *  desatualizada se a Câmara mudar a nomenclatura de tramitação. */
export async function getSituacoesDisponiveis(idMunicipio: IdMunicipio): Promise<string[]> {
  try {
    const data = await q.situacoesDeProposicoes(idMunicipio);
    if (!data) return [];
    // Ordenação no JS, não no `order by`: `Array.sort()` sem comparador é
    // por code unit UTF-16, e a collation do Postgres não reproduz isso —
    // trocar mudaria a ordem do `<select>` em silêncio.
    return data.map((r) => r.situacao as string).sort();
  } catch {
    return [];
  }
}
