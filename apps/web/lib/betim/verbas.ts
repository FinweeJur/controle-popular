import { getSupabaseClient, ID_MUNICIPIO_DEFAULT } from "@/lib/betim/supabase";

export interface VerbasAnalytics {
  total: number;
  totalRegistros: number;
  gastosPorTema: { tema: string; valor: number; qtd: number }[];
  topFornecedores: { fornecedor: string; valor: number; qtd: number }[];
  ok: boolean;
}

const EMPTY: VerbasAnalytics = {
  total: 0,
  totalRegistros: 0,
  gastosPorTema: [],
  topFornecedores: [],
  ok: false,
};

/**
 * Aggregates `verbas_indenizatorias` client-side (small dataset, under a
 * few hundred rows for a single câmara) -- PostgREST has no GROUP BY, so
 * this fetches all matching rows and reduces in JS, same pattern as
 * lib/prefeitura.ts's getVisaoGeral.
 */
export async function getVerbasAnalytics(vereadorId?: string): Promise<VerbasAnalytics> {
  const supabase = getSupabaseClient();
  if (!supabase) return EMPTY;

  try {
    let query = supabase
      .from("verbas_indenizatorias")
      .select("grupo_verba, fornecedor, valor")
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT);
    if (vereadorId) query = query.eq("vereador_id", vereadorId);

    const { data, error } = await query;
    if (error) return { ...EMPTY, ok: false };
    const rows = data ?? [];

    const porTema = new Map<string, { valor: number; qtd: number }>();
    const porFornecedor = new Map<string, { valor: number; qtd: number }>();
    let total = 0;

    for (const row of rows) {
      const valor = Number(row.valor ?? 0);
      total += valor;

      const tema = row.grupo_verba || "Outros";
      const temaEntry = porTema.get(tema) ?? { valor: 0, qtd: 0 };
      temaEntry.valor += valor;
      temaEntry.qtd += 1;
      porTema.set(tema, temaEntry);

      const fornecedor = row.fornecedor || "Não identificado";
      const fornEntry = porFornecedor.get(fornecedor) ?? { valor: 0, qtd: 0 };
      fornEntry.valor += valor;
      fornEntry.qtd += 1;
      porFornecedor.set(fornecedor, fornEntry);
    }

    const gastosPorTema = [...porTema.entries()]
      .map(([tema, { valor, qtd }]) => ({ tema, valor, qtd }))
      .sort((a, b) => b.valor - a.valor);

    const topFornecedores = [...porFornecedor.entries()]
      .map(([fornecedor, { valor, qtd }]) => ({ fornecedor, valor, qtd }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);

    return {
      total,
      totalRegistros: rows.length,
      gastosPorTema,
      topFornecedores,
      ok: true,
    };
  } catch {
    return { ...EMPTY, ok: false };
  }
}
