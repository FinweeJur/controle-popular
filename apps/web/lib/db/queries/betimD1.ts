import { and, desc, eq, sql } from "drizzle-orm";
import { getD1 } from "@/lib/db/clientD1";
import { anuncios, classificados, page_views, zap_estabelecimentos } from "@/lib/db/schema.d1";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

/**
 * Queries do D1 — as cinco escritas ao vivo do portal. Mesma regra do
 * `lib/db/queries/betim.ts` (Postgres): `idMunicipio` é parâmetro
 * obrigatório em todo INSERT/UPDATE/DELETE que toca uma tabela com essa
 * coluna, para a mesma razão de lá — o `ADMIN_TOKEN` é um só para toda a
 * instalação, quem distingue cidade é o filtro.
 *
 * NÃO confundir com `queries/betim.ts`: aquele arquivo é o Postgres (ETL,
 * build, toda LEITURA pública hoje). Este é só D1, só para as cinco rotas
 * de escrita. Ver o cabeçalho de `lib/db/schema.d1.ts`.
 */

export async function inserirPageView(path: string) {
  const db = await getD1();
  if (!db) return null;
  const agora = new Date().toISOString();
  // Upsert equivalente ao `on conflict do update` do Postgres — D1/SQLite
  // suporta a mesma sintaxe.
  await db
    .insert(page_views)
    .values({ path, contagem: 1, atualizado_em: agora })
    .onConflictDoUpdate({
      target: page_views.path,
      set: { contagem: sql`${page_views.contagem} + 1`, atualizado_em: agora },
    });
  return true;
}

export type LinhaPageViewD1 = { path: string; contagem: number; atualizado_em: string };

export async function rankingPageViews(limite: number): Promise<LinhaPageViewD1[] | null> {
  const db = await getD1();
  if (!db) return null;
  return db
    .select({ path: page_views.path, contagem: page_views.contagem, atualizado_em: page_views.atualizado_em })
    .from(page_views)
    .orderBy(desc(page_views.contagem))
    .limit(limite);
}

export async function inserirZapEstabelecimentoD1(
  idMunicipio: IdMunicipio,
  dados: {
    nome: string;
    whatsapp: string;
    categoria: string;
    descricao: string | null;
    bairro: string | null;
  }
) {
  const db = await getD1();
  if (!db) return null;
  const agora = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.insert(zap_estabelecimentos).values({
    id,
    id_municipio: idMunicipio,
    nome: dados.nome,
    whatsapp: dados.whatsapp,
    categoria: dados.categoria,
    descricao: dados.descricao,
    bairro: dados.bairro,
    aprovado: false,
    cliques: 0,
    created_at: agora,
  });
  return { id };
}

/**
 * Soma 1 no contador de cliques — mesmo UPDATE atômico do Postgres
 * (`set cliques = cliques + 1`), sem read-then-write.
 */
export async function incrementarCliquesZapD1(idMunicipio: IdMunicipio, id: string) {
  const db = await getD1();
  if (!db) return null;
  const linhas = await db
    .update(zap_estabelecimentos)
    .set({ cliques: sql`${zap_estabelecimentos.cliques} + 1` })
    .where(
      and(
        eq(zap_estabelecimentos.id_municipio, idMunicipio),
        eq(zap_estabelecimentos.id, id),
        eq(zap_estabelecimentos.aprovado, true)
      )
    )
    .returning({ id: zap_estabelecimentos.id, cliques: zap_estabelecimentos.cliques });
  return linhas[0] ?? null;
}

export async function inserirClassificadoD1(
  idMunicipio: IdMunicipio,
  dados: {
    titulo: string;
    descricao: string;
    categoria: string;
    preco: number | null;
    contato_whatsapp: string;
    expira_em: string;
  }
) {
  const db = await getD1();
  if (!db) return null;
  const agora = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.insert(classificados).values({
    id,
    id_municipio: idMunicipio,
    titulo: dados.titulo,
    descricao: dados.descricao,
    categoria: dados.categoria,
    preco: dados.preco,
    contato_whatsapp: dados.contato_whatsapp,
    expira_em: dados.expira_em,
    aprovado: false,
    created_at: agora,
  });
  return { id };
}

/** Todos os anúncios pagos da cidade, inclusive inativos — visão do painel admin. */
export async function listarAnunciosAdminD1(idMunicipio: IdMunicipio) {
  const db = await getD1();
  if (!db) return null;
  return db
    .select()
    .from(anuncios)
    .where(eq(anuncios.id_municipio, idMunicipio))
    .orderBy(desc(anuncios.created_at));
}

export async function inserirAnuncioD1(
  idMunicipio: IdMunicipio,
  dados: {
    nome_comercio: string;
    plano: string;
    banner_url: string | null;
    link: string | null;
    data_inicio: string | null;
    data_fim: string | null;
  }
) {
  const db = await getD1();
  if (!db) return null;
  const agora = new Date().toISOString();
  const id = crypto.randomUUID();
  const [linha] = await db
    .insert(anuncios)
    .values({ id, id_municipio: idMunicipio, ...dados, ativo: false, created_at: agora })
    .returning();
  return linha ?? null;
}

export type PatchAnuncioD1 = Partial<{
  nome_comercio: string;
  plano: string;
  banner_url: string | null;
  link: string | null;
  ativo: boolean;
  data_inicio: string | null;
  data_fim: string | null;
}>;

export async function atualizarAnuncioD1(
  idMunicipio: IdMunicipio,
  id: string,
  patch: PatchAnuncioD1
) {
  const db = await getD1();
  if (!db) return null;
  const [linha] = await db
    .update(anuncios)
    .set({ ...patch, updated_at: new Date().toISOString() })
    .where(and(eq(anuncios.id_municipio, idMunicipio), eq(anuncios.id, id)))
    .returning();
  return linha ?? null;
}

export async function removerAnuncioD1(idMunicipio: IdMunicipio, id: string) {
  const db = await getD1();
  if (!db) return null;
  const [linha] = await db
    .delete(anuncios)
    .where(and(eq(anuncios.id_municipio, idMunicipio), eq(anuncios.id, id)))
    .returning({ id: anuncios.id });
  return linha ?? null;
}

/**
 * As duas tabelas que passam por moderação, indexadas pelo nome que a rota
 * aceita no corpo do pedido — mesmo desenho de `TABELAS_MODERADAS` no
 * Postgres: o mapa É a lista de permissão, a tabela nunca vem direto da
 * string que o cliente mandou.
 */
export const TABELAS_MODERADAS_D1 = {
  zap_estabelecimentos,
  classificados,
} as const;

export type TabelaModeradaD1 = keyof typeof TABELAS_MODERADAS_D1;

/** Cadastros aguardando moderação nas duas tabelas. */
export async function pendentesDeModeracaoD1(idMunicipio: IdMunicipio) {
  const db = await getD1();
  if (!db) return null;
  const [zap, pendentesClassificados] = await Promise.all([
    db
      .select({
        id: zap_estabelecimentos.id,
        nome: zap_estabelecimentos.nome,
        whatsapp: zap_estabelecimentos.whatsapp,
        categoria: zap_estabelecimentos.categoria,
        descricao: zap_estabelecimentos.descricao,
        bairro: zap_estabelecimentos.bairro,
        created_at: zap_estabelecimentos.created_at,
      })
      .from(zap_estabelecimentos)
      .where(
        and(
          eq(zap_estabelecimentos.id_municipio, idMunicipio),
          eq(zap_estabelecimentos.aprovado, false)
        )
      )
      .orderBy(desc(zap_estabelecimentos.created_at)),
    db
      .select({
        id: classificados.id,
        titulo: classificados.titulo,
        descricao: classificados.descricao,
        categoria: classificados.categoria,
        preco: classificados.preco,
        contato_whatsapp: classificados.contato_whatsapp,
        created_at: classificados.created_at,
      })
      .from(classificados)
      .where(and(eq(classificados.id_municipio, idMunicipio), eq(classificados.aprovado, false)))
      .orderBy(desc(classificados.created_at)),
  ]);
  return { zap_estabelecimentos: zap, classificados: pendentesClassificados };
}

export async function aprovarPendenteD1(
  idMunicipio: IdMunicipio,
  tabela: TabelaModeradaD1,
  id: string
) {
  const db = await getD1();
  if (!db) return null;
  const t = TABELAS_MODERADAS_D1[tabela];
  const [linha] = await db
    .update(t)
    .set({ aprovado: true, updated_at: new Date().toISOString() })
    .where(and(eq(t.id_municipio, idMunicipio), eq(t.id, id)))
    .returning({ id: t.id });
  return linha ?? null;
}

/** Rejeitar apaga a linha pendente — ela nunca chegou a ser pública. */
export async function rejeitarPendenteD1(
  idMunicipio: IdMunicipio,
  tabela: TabelaModeradaD1,
  id: string
) {
  const db = await getD1();
  if (!db) return null;
  const t = TABELAS_MODERADAS_D1[tabela];
  const [linha] = await db
    .delete(t)
    // `aprovado = false` também no WHERE: rejeitar só alcança o que está
    // pendente. Sem isso, o id de um cadastro JÁ APROVADO seria apagado.
    .where(and(eq(t.id_municipio, idMunicipio), eq(t.id, id), eq(t.aprovado, false)))
    .returning({ id: t.id });
  return linha ?? null;
}
