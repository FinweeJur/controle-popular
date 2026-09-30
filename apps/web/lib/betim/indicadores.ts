import { listarIndicadores } from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

/**
 * Leitura dos indicadores de "A cidade em números" — a home de
 * `/[municipio]` e os cartões por área.
 *
 * `fetchIndicadores` pede uma LISTA de nomes e devolve um `Record<nome, row>`
 * com UM por nome (o primeiro que vier), para a página montar os cartões sem
 * varrer a lista a cada uso. A leitura crua vem de `listarIndicadores`
 * (`lib/db/queries/betim.ts`), que já cai na cadeia de reserva; a fonte e o
 * método de cada número estão em `lib/betim/fontesIndicadores.ts`.
 */
export interface IndicadorRow {
  nome: string;
  valor: string | null;
  valor_numerico: number | null;
  ano_referencia: number | null;
  unidade: string | null;
}

export async function fetchIndicadores(
  idMunicipio: IdMunicipio,
  nomes: string[]
): Promise<Record<string, IndicadorRow>> {
  const data = await listarIndicadores(idMunicipio, nomes);

  if (!data) return {};

  const map: Record<string, IndicadorRow> = {};
  for (const row of data as IndicadorRow[]) {
    if (!map[row.nome]) map[row.nome] = row;
  }
  return map;
}
