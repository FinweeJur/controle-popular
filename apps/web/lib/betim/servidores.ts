import { getSupabaseClient, ID_MUNICIPIO_DEFAULT } from "@/lib/betim/supabase";

export const SERVIDORES_PAGE_SIZE = 50;

export interface ServidorRow {
  nome: string;
  cargo: string | null;
  lotacao: string | null;
  vinculo: string | null;
  orgao: string | null;
}

export interface ServidoresResult {
  rows: ServidorRow[];
  total: number;
  configured: boolean;
  ok: boolean;
}

const EMPTY: ServidoresResult = { rows: [], total: 0, configured: false, ok: false };

/**
 * Lista paginada de servidores (nome, cargo, lotação, vínculo). A tabela
 * tem ~9,8k linhas em Betim, então PAGINA sempre (teto de 1000 do
 * PostgREST) e busca no servidor por `ilike`. Remuneração individual NÃO
 * é exibida — `folha_pagamento` está vazia e nome+valor individualizado é
 * dado sensível; nome+cargo de servidor público é informação pública.
 */
export async function getServidores(opts: {
  q?: string;
  orgao?: string;
  page?: number;
}): Promise<ServidoresResult> {
  const supabase = getSupabaseClient();
  if (!supabase) return EMPTY;

  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * SERVIDORES_PAGE_SIZE;
  const to = from + SERVIDORES_PAGE_SIZE - 1;

  try {
    let query = supabase
      .from("servidores")
      .select("nome, cargo, lotacao, vinculo, orgao", { count: "exact" })
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT);

    if (opts.orgao) query = query.eq("orgao", opts.orgao);
    if (opts.q) {
      const termo = `%${opts.q}%`;
      // Busca em nome OU cargo OU lotação.
      query = query.or(`nome.ilike.${termo},cargo.ilike.${termo},lotacao.ilike.${termo}`);
    }

    const { data, error, count } = await query
      .order("nome", { ascending: true })
      .range(from, to);
    if (error) return { ...EMPTY, configured: true };

    return {
      rows: (data ?? []) as ServidorRow[],
      total: count ?? 0,
      configured: true,
      ok: true,
    };
  } catch {
    return { ...EMPTY, configured: true };
  }
}
