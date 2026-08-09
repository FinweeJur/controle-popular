import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { vazio_municipioInTerras } from "@/lib/db/schema";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

/**
 * Queries do eixo Terras (rollup do pipeline acadêmico terras-devolutas).
 *
 * Sem geometria — ver a nota em `schema.ts` acima de `vazio_municipioInTerras`
 * e `supabase/terras/migrations/0001_schema.sql`. Isto lê só o número
 * agregado por método/recorte; o mapa (se vier) lê Static Asset, não banco.
 */

export interface VazioMunicipio {
  id_municipio: string;
  metodo: string;
  recorte: string;
  area_universo_ha: string;
  area_candidata_ha: string;
  qtd_poligonos: number;
  proveniencia: string;
  metodo_versao_data: string;
}

/**
 * Todas as linhas (um ou dois métodos) para um município. Nunca somar
 * `area_candidata_ha` entre métodos diferentes — denominadores distintos.
 */
export async function vazioPorMunicipio(
  idMunicipio: IdMunicipio
): Promise<VazioMunicipio[] | null> {
  const db = getDb();
  if (!db) return null;
  const linhas = await db
    .select()
    .from(vazio_municipioInTerras)
    .where(eq(vazio_municipioInTerras.id_municipio, idMunicipio));
  return linhas as VazioMunicipio[];
}
