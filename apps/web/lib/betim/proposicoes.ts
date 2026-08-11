import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";
import { viciosDeProposicoes, type VicioAto } from "@/lib/betim/legislacao-vicio";

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
  /** Ausente = sem indício de vício legislativo (ou não analisado ainda) — silêncio é o padrão. */
  vicio?: VicioAto;
}

export interface ProposicoesFilters {
  tipo?: string;
  situacao?: string;
  ano?: string;
  tema?: string;
  q?: string;
  page?: number;
  /** Default `PROPOSICOES_PAGE_SIZE`. `camara/proposicoes` pede um valor
   *  bem maior pra buscar a cidade inteira de uma vez — ver
   *  `app/[municipio]/camara/proposicoes/dados/[arquivo]/route.ts`. */
  porPagina?: number;
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
      porPagina: filters.porPagina ?? PROPOSICOES_PAGE_SIZE,
    });
    if (!data) return { rows: [], total: 0, configured: false, ok: false };

    const rows = data as ProposicaoListRow[];

    // Isolado em try/catch próprio, mesma razão de `getLegislacao`: se a
    // camada de vício falhar (migration não rodada, tabela ausente), a
    // lista de proposições — que já funciona sem isto — continua de pé, só
    // sem o badge.
    try {
      const vicios = await viciosDeProposicoes(idMunicipio, rows.map((r) => r.id));
      for (const r of rows) r.vicio = vicios.get(r.id);
    } catch {
      // segue sem vício — degradação parcial, não derruba a lista inteira.
    }

    // O total do conjunto filtrado vem por `count(*) over ()` em cada
    // linha; sem linha nenhuma, o total é zero.
    return {
      rows,
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
