import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { patrimonio_tombado_iepha } from "@/lib/db/schema";

/**
 * Queries de `/ambiental/patrimonio-cultural` — patrimônio cultural
 * tombado por Minas Gerais, migration `0072`. Fonte, ingestor e a lacuna
 * declarada (sem geometria, sem busca por processo) estão documentados na
 * migration e em `etl/betim/etl/apis/patrimonio_tombado_iepha.py`; este
 * arquivo só lê.
 *
 * 153 linhas ao todo — mesma decisão de filtrar no CLIENTE que
 * `legislacao-ambiental.ts`/`direito-critico.ts` já tomam (corpus pequeno,
 * evita `searchParams` em Server Component).
 */

export type CategoriaPatrimonioTombado = "BI" | "BM" | "CH" | "CP";

export interface PatrimonioTombadoRow {
  processoAno: string;
  denominacao: string;
  denominacaoCompleta: string;
  categoria: CategoriaPatrimonioTombado;
  classeSubclasse: string | null;
  municipio: string;
  distrito: string | null;
  atoLegal: string | null;
  livroDeTombo: string | null;
}

function paraLinha(r: typeof patrimonio_tombado_iepha.$inferSelect): PatrimonioTombadoRow {
  return {
    processoAno: r.processo_ano,
    denominacao: r.denominacao,
    denominacaoCompleta: r.denominacao_completa,
    categoria: r.categoria as CategoriaPatrimonioTombado,
    classeSubclasse: r.classe_subclasse,
    municipio: r.municipio,
    distrito: r.distrito,
    atoLegal: r.ato_legal,
    livroDeTombo: r.livro_de_tombo,
  };
}

export async function listarPatrimonioTombado(): Promise<PatrimonioTombadoRow[]> {
  const db = getDb();
  if (!db) return [];
  const linhas = await db
    .select()
    .from(patrimonio_tombado_iepha)
    .orderBy(desc(patrimonio_tombado_iepha.municipio));
  return linhas.map(paraLinha);
}

/** Card da home de `/ambiental` — número real, não estimativa. */
export async function contarPatrimonioTombado(): Promise<number> {
  const linhas = await listarPatrimonioTombado();
  return linhas.length;
}
