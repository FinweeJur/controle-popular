import { desc, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { ambiental_legislacao } from "@/lib/db/schema";

/**
 * Queries de `/ambiental/legislacao` — as três fontes que o F0 mapeou
 * (`docs/ambiental/F0-discovery.md` §6) já unificadas numa tabela só pelos
 * coletores (`etl.apis.legislacao_almg`/`legislacao_semad`/`legislacao_siam`).
 * Este arquivo só lê; a lógica de coleta, normalização e a decisão de NÃO
 * fundir entre fontes estão documentadas na migration `0063` e em
 * `etl.apis._legislacao_ambiental`.
 *
 * ═══ POR QUE `listarLegislacaoAmbiental` TRAZ TUDO, SEM FILTRO NO SERVIDOR ═══
 *
 * O corpus (~6-7 mil normas) é pequeno o bastante para filtrar no
 * NAVEGADOR — mesma decisão já tomada em `lib/betim/legislacao.ts` para o
 * acervo de uma cidade (~660 atos) e documentada em
 * `app/[municipio]/camara/legislacao/ListaLegislacao.tsx`: filtro no
 * cliente evita `searchParams` em Server Component, que quebra o build de
 * `output: 'export'` (F0 §7). Se o corpus crescer muito além disso, o
 * remédio já documentado no projeto é "JSON estático + tabela cliente"
 * (o padrão de `/busca`, `scripts/gerar-indice-busca.mts`) — não chegamos
 * lá aqui de propósito, para não introduzir um passo de build manual que
 * ninguém lembra de rodar, por um ganho que o tamanho atual não justifica.
 */

export type FonteLegislacaoAmbiental = "almg" | "semad" | "siam";

export interface LegislacaoAmbientalRow {
  fonte: FonteLegislacaoAmbiental;
  tipo: string;
  numero: string | null;
  ano: number | null;
  ementa: string | null;
  data: string | null;
  orgao: string | null;
  linkPdf: string | null;
  chaveDedup: string | null;
}

function paraLinha(r: typeof ambiental_legislacao.$inferSelect): LegislacaoAmbientalRow {
  return {
    fonte: r.fonte as FonteLegislacaoAmbiental,
    tipo: r.tipo,
    numero: r.numero,
    ano: r.ano,
    ementa: r.ementa,
    data: r.data,
    orgao: r.orgao,
    linkPdf: r.link_pdf,
    chaveDedup: r.chave_dedup,
  };
}

/** Todas as linhas, mais recente primeiro (nulo por último). Sem `id`/
 *  `id_fonte`/timestamps — a tela não precisa, e cada campo a menos é
 *  bytes a menos indo para o navegador num corpus deste tamanho. */
export async function listarLegislacaoAmbiental(): Promise<LegislacaoAmbientalRow[]> {
  const db = getDb();
  if (!db) return [];
  const linhas = await db
    .select()
    .from(ambiental_legislacao)
    .orderBy(sql`${ambiental_legislacao.data} desc nulls last`, desc(ambiental_legislacao.ano));
  return linhas.map(paraLinha);
}

export interface ContagemLegislacaoAmbiental {
  total: number;
  porFonte: Record<FonteLegislacaoAmbiental, number>;
}

/** Card da home de `/ambiental` — número real, não estimativa. */
export async function contarLegislacaoAmbiental(): Promise<ContagemLegislacaoAmbiental> {
  const db = getDb();
  const vazio: ContagemLegislacaoAmbiental = { total: 0, porFonte: { almg: 0, semad: 0, siam: 0 } };
  if (!db) return vazio;

  const linhas = await db.execute<{ fonte: FonteLegislacaoAmbiental; n: number }>(sql`
    select fonte, count(*)::int as n from ambiental_legislacao group by fonte
  `);
  const porFonte = { ...vazio.porFonte };
  let total = 0;
  for (const l of linhas.rows ?? []) {
    porFonte[l.fonte] = l.n;
    total += l.n;
  }
  return { total, porFonte };
}
