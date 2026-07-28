import { getSupabaseClient, ID_MUNICIPIO_DEFAULT, comColunaOpcional } from "@/lib/betim/supabase";

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

const SELECT = "id, tipo, numero, ano, ementa, situacao, data_apresentacao, autores, link_fonte, temas";
const SELECT_SEM_TEMA = "id, tipo, numero, ano, ementa, situacao, data_apresentacao, autores, link_fonte";

function sanitizeSearchTerm(q: string | undefined): string | undefined {
  const trimmed = q?.trim();
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
export async function fetchProposicoes(filters: ProposicoesFilters): Promise<ProposicoesResult> {
  const supabase = getSupabaseClient();
  if (!supabase) return { rows: [], total: 0, configured: false, ok: false };

  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PROPOSICOES_PAGE_SIZE;
  const to = from + PROPOSICOES_PAGE_SIZE - 1;
  const term = sanitizeSearchTerm(filters.q);

  try {
    const base = () => {
      let q = supabase
        .from("proposicoes")
        .select(SELECT, { count: "exact" })
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT);
      if (filters.tipo) q = q.eq("tipo", filters.tipo);
      if (filters.situacao) q = q.eq("situacao", filters.situacao);
      if (filters.ano) q = q.eq("ano", Number(filters.ano));
      if (filters.tema) q = q.contains("temas", [filters.tema]);
      if (term) q = q.ilike("ementa", `%${term}%`);
      return q
        .order("ano", { ascending: false })
        .order("numero", { ascending: false })
        .range(from, to);
    };
    const semTema = () => {
      let q = supabase
        .from("proposicoes")
        .select(SELECT_SEM_TEMA, { count: "exact" })
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT);
      if (filters.tipo) q = q.eq("tipo", filters.tipo);
      if (filters.situacao) q = q.eq("situacao", filters.situacao);
      if (filters.ano) q = q.eq("ano", Number(filters.ano));
      if (term) q = q.ilike("ementa", `%${term}%`);
      return q
        .order("ano", { ascending: false })
        .order("numero", { ascending: false })
        .range(from, to);
    };
    const { data, count, error } = filters.tema ? await comColunaOpcional(base, semTema) : await base();
    if (error) return { rows: [], total: 0, configured: true, ok: false };

    return {
      rows: (data ?? []) as ProposicaoListRow[],
      total: count ?? 0,
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
export async function getSituacoesDisponiveis(): Promise<string[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  try {
    // .range() explícito -- sem isso o PostgREST corta em 1000 linhas por
    // padrão, e a tabela já passa de 2700 (mesma classe de bug já
    // corrigida antes nesta sessão em getRankingVereadores/etl.alertas).
    const { data, error } = await supabase
      .from("proposicoes")
      .select("situacao")
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
      .not("situacao", "is", null)
      .range(0, 4999);
    if (error || !data) return [];
    const unicos = Array.from(new Set((data as { situacao: string }[]).map((r) => r.situacao)));
    return unicos.sort();
  } catch {
    return [];
  }
}
