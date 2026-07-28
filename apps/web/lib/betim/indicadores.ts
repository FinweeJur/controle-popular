import * as q from "@/lib/db/queries/betim";

export interface IndicadorRow {
  nome: string;
  valor: string | null;
  valor_numerico: number | null;
  ano_referencia: number | null;
  unidade: string | null;
}

export async function fetchIndicadores(
  idMunicipio: string,
  nomes: string[]
): Promise<Record<string, IndicadorRow>> {
  const data = await q.listarIndicadores(idMunicipio, nomes);
  const error = null;

  if (error || !data) return {};

  const map: Record<string, IndicadorRow> = {};
  for (const row of data as IndicadorRow[]) {
    if (!map[row.nome]) map[row.nome] = row;
  }
  return map;
}
