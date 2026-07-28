import { getSupabaseClient, ID_MUNICIPIO_DEFAULT } from "@/lib/betim/supabase";

export interface IndicadorRow {
  nome: string;
  valor: string | null;
  valor_numerico: number | null;
  ano_referencia: number | null;
  unidade: string | null;
}

export async function fetchIndicadores(
  nomes: string[]
): Promise<Record<string, IndicadorRow>> {
  const supabase = getSupabaseClient();
  if (!supabase) return {};

  const { data, error } = await supabase
    .from("indicadores")
    .select("nome, valor, valor_numerico, ano_referencia, unidade")
    .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
    .in("nome", nomes)
    .order("ano_referencia", { ascending: false });

  if (error || !data) return {};

  const map: Record<string, IndicadorRow> = {};
  for (const row of data as IndicadorRow[]) {
    if (!map[row.nome]) map[row.nome] = row;
  }
  return map;
}
