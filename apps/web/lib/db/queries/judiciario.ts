import { and, asc, desc, eq, isNotNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  alertasInJudiciario,
  magistradosInJudiciario,
  mandatos_direcaoInJudiciario,
  monitoramentosInJudiciario,
  nomeacoesInJudiciario,
  tribunaisInJudiciario,
  vagasInJudiciario,
  vw_vacanciaInJudiciario,
} from "@/lib/db/schema";

/**
 * Queries do eixo Judiciário.
 *
 * Funções nomeadas por domínio, em vez de query solta espalhada por
 * página: é o que permite trocar o backend outra vez sem varrer o app, e
 * é onde o filtro obrigatório (`userId`) fica encapsulado — ver
 * `monitoramentosDoUsuario`.
 *
 * Ordenação e filtro passaram do JavaScript para o SQL. No Supabase, o
 * `fetchAll()` trazia tudo e o `.sort()` acontecia em memória, porque o
 * PostgREST truncava em 1000 linhas e paginar com ordenação era frágil.
 * Sem esse teto, ordenar no banco é mais barato e não tem o risco de
 * ordenar um conjunto truncado — que foi o bug real registrado nos
 * comentários do repo original ("inverteu um ranking inteiro em
 * produção").
 */

export async function listarTribunais() {
  const db = getDb();
  if (!db) return null;
  return db.select().from(tribunaisInJudiciario).orderBy(asc(tribunaisInJudiciario.ramo));
}

export async function ocupacoesAtuais(tribunalId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(vw_vacanciaInJudiciario)
    .where(
      and(
        eq(vw_vacanciaInJudiciario.tribunal_id, tribunalId),
        eq(vw_vacanciaInJudiciario.atual, true)
      )
    );
}

/** Ocupações atuais com vacância projetada, da mais próxima para a mais distante. */
export async function proximasVacancias(limite = 50) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(vw_vacanciaInJudiciario)
    .where(
      and(
        eq(vw_vacanciaInJudiciario.atual, true),
        isNotNull(vw_vacanciaInJudiciario.vacancia_projetada)
      )
    )
    .orderBy(asc(vw_vacanciaInJudiciario.vacancia_projetada))
    .limit(limite);
}

/**
 * Composição do TSE — lê `mandatos_direcao`, NÃO `ocupacoes`/`vw_vacancia`.
 *
 * A projeção de 75 anos da view é da cadeira de ORIGEM do ministro
 * (STF/STJ), não do mandato de 2 anos no TSE. Usar a view aqui mostraria a
 * "vacância" do presidente do TSE em 2047, quando ele completa 75 no STF,
 * em vez de 2027, quando acaba o biênio — dado real respondendo à pergunta
 * errada.
 *
 * O nome do magistrado vem por `innerJoin`; no Supabase era o embed
 * `magistrados(nome)`, que devolvia objeto ou array conforme a cardinalidade
 * e obrigava um `Array.isArray()` na saída. O join tipa direto.
 */
export async function mandatosDirecao(tribunalId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select({
      id: mandatos_direcaoInJudiciario.id,
      cargo: mandatos_direcaoInJudiciario.cargo,
      magistrado_nome: magistradosInJudiciario.nome,
      data_inicio: mandatos_direcaoInJudiciario.data_inicio,
      data_fim: mandatos_direcaoInJudiciario.data_fim,
      biennio: mandatos_direcaoInJudiciario.biennio,
      eleito: mandatos_direcaoInJudiciario.eleito,
    })
    .from(mandatos_direcaoInJudiciario)
    .innerJoin(
      magistradosInJudiciario,
      eq(magistradosInJudiciario.id, mandatos_direcaoInJudiciario.magistrado_id)
    )
    .where(eq(mandatos_direcaoInJudiciario.tribunal_id, tribunalId));
}

export async function obterNomeacao(id: string) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select()
    .from(nomeacoesInJudiciario)
    .where(eq(nomeacoesInJudiciario.id, id))
    .limit(1);
  return linha ?? null;
}

export async function obterVaga(id: string) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select()
    .from(vagasInJudiciario)
    .where(eq(vagasInJudiciario.id, id))
    .limit(1);
  return linha ?? null;
}

export async function listarVagas() {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(vagasInJudiciario)
    .orderBy(desc(vagasInJudiciario.data_abertura));
}

export async function listarNomeacoes(tribunalId?: string) {
  const db = getDb();
  if (!db) return null;
  const q = db.select().from(nomeacoesInJudiciario);
  const comFiltro = tribunalId
    ? q.where(eq(nomeacoesInJudiciario.tribunal_id, tribunalId))
    : q;
  // COALESCE de propósito, e não duas chaves de ordenação: o JS original
  // ordenava por `data_deliberacao ?? data_mensagem ?? ""`, ou seja UM
  // valor com fallback. `ORDER BY a DESC, b DESC` é outra coisa — só
  // desempata por `b` quando `a` empata — e produziu ordem diferente na
  // comparação contra o Supabase. O `NULLS LAST` reproduz o `?? ""` do
  // original, que jogava os sem data para o fim.
  // O `id` é desempate, não capricho: sem ele a ordem entre linhas com a
  // mesma data é indefinida no SQL. O JS original era um sort estável
  // sobre a ordem (arbitrária) que o PostgREST devolvia, então empate
  // "funcionava" por acidente. Na Fase 5 tudo isto vira SSG, e ordem não
  // determinística geraria HTML diferente a cada build.
  return comFiltro.orderBy(
    sql`coalesce(${nomeacoesInJudiciario.data_deliberacao}, ${nomeacoesInJudiciario.data_mensagem}) desc nulls last`,
    asc(nomeacoesInJudiciario.id)
  );
}

/**
 * Monitoramentos de UM usuário.
 *
 * `userId` é o primeiro parâmetro e é OBRIGATÓRIO — não existe sobrecarga
 * sem ele, e ele nunca deve ser lido de query string ou body.
 *
 * Isto não é zelo abstrato. A query original em `app/judiciario/painel`
 * era `sb.from("monitoramentos").select(...)` — **sem filtro de usuário
 * nenhum**. Quem recortava era a RLS (`user_id = auth.uid()` em
 * `0002_rls.sql`), com o PostgREST como único caminho até o banco. No
 * Neon o banco não protege mais nada: a mesma query sem `where` devolveria
 * os monitoramentos de todos os usuários. A fronteira agora é esta função.
 *
 * `monitoramentos` não tem coluna de data de criação, então não há
 * ordenação estável a aplicar aqui — era assim no original também.
 */
export async function monitoramentosDoUsuario(userId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(monitoramentosInJudiciario)
    .where(eq(monitoramentosInJudiciario.user_id, userId));
}

/** Alertas de UM usuário. Mesma regra do `monitoramentosDoUsuario`. */
export async function alertasDoUsuario(userId: string, limite = 50) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(alertasInJudiciario)
    .where(eq(alertasInJudiciario.user_id, userId))
    .orderBy(desc(alertasInJudiciario.criado_em))
    .limit(limite);
}
