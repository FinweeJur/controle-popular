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

/** As três estaduais (migration 0065) mais as duas federais (0073) — cada
 *  uma com licença própria, ver `docs/LEGISLACAO-FEDERAL-MMA-CNDH.md`. */
export type FonteLegislacaoAmbiental = "almg" | "semad" | "siam" | "mma" | "cndh";

export const FONTES_LEGISLACAO_AMBIENTAL = [
  "almg",
  "semad",
  "siam",
  "mma",
  "cndh",
] as const satisfies readonly FonteLegislacaoAmbiental[];

export interface LegislacaoAmbientalRow {
  fonte: FonteLegislacaoAmbiental;
  /** Coluna do banco desde a migration 0073 — não mais uma constante
   *  calculada no app. Na prática 'estadual' (ALMG/Semad/Siam) ou
   *  'nacional' (MMA/CNDH); o check do banco reserva ainda 'municipal' e
   *  'internacional' para fontes que não chegaram. */
  esfera: string;
  /** Vigência tal como a FONTE escreve ("VIGENTE", "REVOGADO", "NÃO CONSTA
   *  REVOGAÇÃO EXPRESSA"...). `null` quer dizer que a fonte não informa —
   *  o caso das três estaduais —, nunca "está em vigor". */
  situacao: string | null;
  tipo: string;
  numero: string | null;
  ano: number | null;
  ementa: string | null;
  data: string | null;
  orgao: string | null;
  linkPdf: string | null;
  chaveDedup: string | null;
  /** Os 8 temas do filtro (slugs de `etl/temas_ambientais.py`), união das
   *  tags da ementa com — só para `fonte==="almg"` — a taxonomia oficial
   *  da própria ALMG (`indexacao`). `[]` é resultado legítimo: "sem tema
   *  atribuído" é honesto, não um balde "outros" fingindo cobertura. */
  temas: string[];
  /** Vocabulário mais fino que `temas` (ver `TAG_LABELS` em
   *  `etl/temas_ambientais.py`) — pra entender do que trata a norma sem
   *  abrir o PDF. Mesma regra de palavra-chave na ementa, `[]` legítimo. */
  tags: string[];
}

function paraLinha(r: typeof ambiental_legislacao.$inferSelect): LegislacaoAmbientalRow {
  return {
    fonte: r.fonte as FonteLegislacaoAmbiental,
    esfera: r.esfera,
    situacao: r.situacao,
    tipo: r.tipo,
    numero: r.numero,
    ano: r.ano,
    ementa: r.ementa,
    data: r.data,
    orgao: r.orgao,
    linkPdf: r.link_pdf,
    chaveDedup: r.chave_dedup,
    temas: r.temas ?? [],
    tags: r.tags ?? [],
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
  const vazio: ContagemLegislacaoAmbiental = {
    total: 0,
    porFonte: Object.fromEntries(FONTES_LEGISLACAO_AMBIENTAL.map((f) => [f, 0])) as Record<
      FonteLegislacaoAmbiental,
      number
    >,
  };
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

export interface CoberturaTemasLegislacaoAmbiental {
  total: number;
  comTema: number;
  /** ALMG e MMA expõem taxonomia oficial (`indexacao`) — Semad, Siam e
   *  CNDH viram tags/temas só por palavra-chave na ementa, e o vocabulário
   *  plano do MMA não casa com o classificador de caminho da ALMG, então
   *  na prática só a ALMG tem os dois sinais. Números medidos, não a
   *  premissa: ver `etl/temas_ambientais.py`. */
  porFonte: Record<FonteLegislacaoAmbiental, { total: number; comTema: number }>;
}

/** Quantas normas ficaram COM pelo menos um tema, de quantas — a
 *  honestidade que a tarefa pediu: "sem tema atribuído" é contado, não
 *  escondido atrás de um balde "outros". */
export async function contarCoberturaTemasLegislacaoAmbiental(): Promise<CoberturaTemasLegislacaoAmbiental> {
  const db = getDb();
  const vazio: CoberturaTemasLegislacaoAmbiental = {
    total: 0,
    comTema: 0,
    porFonte: Object.fromEntries(
      FONTES_LEGISLACAO_AMBIENTAL.map((f) => [f, { total: 0, comTema: 0 }])
    ) as Record<FonteLegislacaoAmbiental, { total: number; comTema: number }>,
  };
  if (!db) return vazio;

  const linhas = await db.execute<{ fonte: FonteLegislacaoAmbiental; total: number; com_tema: number }>(sql`
    select fonte, count(*)::int as total,
           count(*) filter (where array_length(temas, 1) > 0)::int as com_tema
    from ambiental_legislacao
    group by fonte
  `);
  const porFonte = { ...vazio.porFonte };
  let total = 0;
  let comTema = 0;
  for (const l of linhas.rows ?? []) {
    porFonte[l.fonte] = { total: l.total, comTema: l.com_tema };
    total += l.total;
    comTema += l.com_tema;
  }
  return { total, comTema, porFonte };
}

export interface ContagemTemaLegislacaoAmbiental {
  tema: string;
  n: number;
}

/** Contadores por tema (os 8 do filtro) — medidos do banco a cada carga da
 *  página, não um número fixo no código que possa envelhecer. */
export async function contarPorTemaLegislacaoAmbiental(): Promise<ContagemTemaLegislacaoAmbiental[]> {
  const db = getDb();
  if (!db) return [];
  const linhas = await db.execute<{ tema: string; n: number }>(sql`
    select tema, count(*)::int as n
    from ambiental_legislacao, unnest(temas) as tema
    group by tema
    order by n desc
  `);
  return linhas.rows ?? [];
}
