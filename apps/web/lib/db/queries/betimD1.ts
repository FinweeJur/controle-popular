import { and, asc, desc, eq, gte, inArray, like, sql } from "drizzle-orm";
import { getD1 } from "@/lib/db/clientD1";
import { getDb } from "@/lib/db/client";
import * as schemaPg from "@/lib/db/schema";
import { anuncios, classificados, contadores, page_views, zap_estabelecimentos } from "@/lib/db/schema.d1";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

/**
 * Queries do D1 — as cinco escritas ao vivo do portal. Mesma regra do
 * `lib/db/queries/betim.ts` (Postgres): `idMunicipio` é parâmetro
 * obrigatório em todo INSERT/UPDATE/DELETE que toca uma tabela com essa
 * coluna, para a mesma razão de lá — o `ADMIN_TOKEN` é um só para toda a
 * instalação, quem distingue cidade é o filtro.
 *
 * NÃO confundir com `queries/betim.ts`: aquele arquivo é o Postgres (ETL,
 * build, e a leitura das dezenas de tabelas que o ETL alimenta). Este é só
 * D1 — as escritas ao vivo E a leitura pública DAS MESMAS DUAS TABELAS que
 * elas gravam (zap, classificados), porque banco de escrita e banco de
 * leitura tinham que ser o mesmo para o cadastro aprovado aparecer.
 * Ver o cabeçalho de `lib/db/schema.d1.ts`.
 */

export async function inserirPageView(path: string) {
  const agora = new Date().toISOString();
  const db = await getD1();
  if (db) {
    await db
      .insert(page_views)
      .values({ path, contagem: 1, atualizado_em: agora })
      .onConflictDoUpdate({
        target: page_views.path,
        set: { contagem: sql`${page_views.contagem} + 1`, atualizado_em: agora },
      });
    return true;
  }
  const pgDb = getDb();
  if (pgDb) {
    await pgDb
      .insert(schemaPg.page_views)
      .values({ path, contagem: 1, atualizado_em: agora })
      .onConflictDoUpdate({
        target: schemaPg.page_views.path,
        set: { contagem: sql`${schemaPg.page_views.contagem} + 1`, atualizado_em: agora },
      });
    return true;
  }
  return null;
}

export type LinhaPageViewD1 = { path: string; contagem: number; atualizado_em: string };

export async function rankingPageViews(limite: number): Promise<LinhaPageViewD1[] | null> {
  const db = await getD1();
  if (db) {
    return db
      .select({ path: page_views.path, contagem: page_views.contagem, atualizado_em: page_views.atualizado_em })
      .from(page_views)
      .orderBy(desc(page_views.contagem))
      .limit(limite);
  }
  const pgDb = getDb();
  if (pgDb) {
    return pgDb
      .select({ path: schemaPg.page_views.path, contagem: schemaPg.page_views.contagem, atualizado_em: schemaPg.page_views.atualizado_em })
      .from(schemaPg.page_views)
      .orderBy(desc(schemaPg.page_views.contagem))
      .limit(limite);
  }
  return null;
}

export async function incrementarContador(tipo: string) {
  const agora = new Date().toISOString();
  const db = await getD1();
  if (db) {
    await db
      .insert(contadores)
      .values({ tipo, contagem: 1, atualizado_em: agora })
      .onConflictDoUpdate({
        target: contadores.tipo,
        set: { contagem: sql`${contadores.contagem} + 1`, atualizado_em: agora },
      });
    return true;
  }
  const pgDb = getDb();
  if (pgDb) {
    await pgDb
      .insert(schemaPg.contadores)
      .values({ tipo, contagem: 1, atualizado_em: agora })
      .onConflictDoUpdate({
        target: schemaPg.contadores.tipo,
        set: { contagem: sql`${schemaPg.contadores.contagem} + 1`, atualizado_em: agora },
      });
    return true;
  }
  return null;
}

export type LinhaContadorD1 = { tipo: string; contagem: number };

export async function totaisContadores(): Promise<LinhaContadorD1[] | null> {
  const db = await getD1();
  if (db) {
    return db
      .select({ tipo: contadores.tipo, contagem: contadores.contagem })
      .from(contadores);
  }
  const pgDb = getDb();
  if (pgDb) {
    return pgDb
      .select({ tipo: schemaPg.contadores.tipo, contagem: schemaPg.contadores.contagem })
      .from(schemaPg.contadores);
  }
  return null;
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
  const agora = new Date().toISOString();
  const id = crypto.randomUUID();
  if (db) {
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
  const pgDb = getDb();
  if (pgDb) {
    const [linha] = await pgDb
      .insert(schemaPg.zap_estabelecimentos)
      .values({
        id_municipio: idMunicipio,
        nome: dados.nome,
        whatsapp: dados.whatsapp,
        categoria: dados.categoria,
        descricao: dados.descricao,
        bairro: dados.bairro,
        aprovado: false,
      })
      .returning({ id: schemaPg.zap_estabelecimentos.id });
    return linha ? { id: String(linha.id) } : null;
  }
  return null;
}

/**
 * Soma 1 no contador de cliques — UPDATE atômico (`set cliques = cliques + 1`), sem read-then-write.
 */
export async function incrementarCliquesZapD1(idMunicipio: IdMunicipio, id: string) {
  const db = await getD1();
  if (db) {
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
  const pgDb = getDb();
  if (pgDb) {
    const linhas = await pgDb
      .update(schemaPg.zap_estabelecimentos)
      .set({ cliques: sql`coalesce(${schemaPg.zap_estabelecimentos.cliques}, 0) + 1` })
      .where(
        and(
          eq(schemaPg.zap_estabelecimentos.id_municipio, idMunicipio),
          eq(schemaPg.zap_estabelecimentos.id, id),
          eq(schemaPg.zap_estabelecimentos.aprovado, true)
        )
      )
      .returning({ id: schemaPg.zap_estabelecimentos.id, cliques: schemaPg.zap_estabelecimentos.cliques });
    return linhas[0] ? { id: String(linhas[0].id), cliques: linhas[0].cliques ?? 0 } : null;
  }
  return null;
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
  const agora = new Date().toISOString();
  const id = crypto.randomUUID();
  if (db) {
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
  const pgDb = getDb();
  if (pgDb) {
    const [linha] = await pgDb
      .insert(schemaPg.classificados)
      .values({
        id_municipio: idMunicipio,
        titulo: dados.titulo,
        descricao: dados.descricao,
        categoria: dados.categoria,
        preco: dados.preco === null ? null : String(dados.preco),
        contato_whatsapp: dados.contato_whatsapp,
        expira_em: dados.expira_em,
        aprovado: false,
      })
      .returning({ id: schemaPg.classificados.id });
    return linha ? { id: String(linha.id) } : null;
  }
  return null;
}

/** Todos os anúncios pagos da cidade, inclusive inativos — visão do painel admin. */
export async function listarAnunciosAdminD1(idMunicipio: IdMunicipio) {
  const db = await getD1();
  if (db) {
    return db
      .select()
      .from(anuncios)
      .where(eq(anuncios.id_municipio, idMunicipio))
      .orderBy(desc(anuncios.created_at));
  }
  const pgDb = getDb();
  if (pgDb) {
    const rows = await pgDb
      .select()
      .from(schemaPg.anuncios)
      .where(eq(schemaPg.anuncios.id_municipio, idMunicipio))
      .orderBy(desc(schemaPg.anuncios.created_at));
    return rows.map((r) => ({
      id: String(r.id),
      id_municipio: r.id_municipio,
      nome_comercio: r.nome_comercio,
      plano: r.plano,
      banner_url: r.banner_url,
      link: r.link,
      ativo: r.ativo ?? false,
      data_inicio: r.data_inicio,
      data_fim: r.data_fim,
      created_at: r.created_at ?? "",
      updated_at: r.updated_at ?? null,
    }));
  }
  return null;
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
  const agora = new Date().toISOString();
  const id = crypto.randomUUID();
  if (db) {
    const [linha] = await db
      .insert(anuncios)
      .values({ id, id_municipio: idMunicipio, ...dados, ativo: false, created_at: agora })
      .returning();
    return linha ?? null;
  }
  const pgDb = getDb();
  if (pgDb) {
    const [linha] = await pgDb
      .insert(schemaPg.anuncios)
      .values({
        id_municipio: idMunicipio,
        nome_comercio: dados.nome_comercio,
        plano: dados.plano,
        banner_url: dados.banner_url,
        link: dados.link,
        ativo: false,
        data_inicio: dados.data_inicio,
        data_fim: dados.data_fim,
      })
      .returning();
    return linha
      ? {
          id: String(linha.id),
          id_municipio: linha.id_municipio,
          nome_comercio: linha.nome_comercio,
          plano: linha.plano,
          banner_url: linha.banner_url,
          link: linha.link,
          ativo: linha.ativo ?? false,
          data_inicio: linha.data_inicio,
          data_fim: linha.data_fim,
          created_at: linha.created_at ?? "",
          updated_at: linha.updated_at ?? null,
        }
      : null;
  }
  return null;
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
  if (db) {
    const [linha] = await db
      .update(anuncios)
      .set({ ...patch, updated_at: new Date().toISOString() })
      .where(and(eq(anuncios.id_municipio, idMunicipio), eq(anuncios.id, id)))
      .returning();
    return linha ?? null;
  }
  const pgDb = getDb();
  if (pgDb) {
    const [linha] = await pgDb
      .update(schemaPg.anuncios)
      .set({
        ...(patch.nome_comercio !== undefined ? { nome_comercio: patch.nome_comercio } : {}),
        ...(patch.plano !== undefined ? { plano: patch.plano } : {}),
        ...(patch.banner_url !== undefined ? { banner_url: patch.banner_url } : {}),
        ...(patch.link !== undefined ? { link: patch.link } : {}),
        ...(patch.ativo !== undefined ? { ativo: patch.ativo } : {}),
        ...(patch.data_inicio !== undefined ? { data_inicio: patch.data_inicio } : {}),
        ...(patch.data_fim !== undefined ? { data_fim: patch.data_fim } : {}),
        updated_at: new Date().toISOString(),
      })
      .where(and(eq(schemaPg.anuncios.id_municipio, idMunicipio), eq(schemaPg.anuncios.id, id)))
      .returning();
    return linha
      ? {
          id: String(linha.id),
          id_municipio: linha.id_municipio,
          nome_comercio: linha.nome_comercio,
          plano: linha.plano,
          banner_url: linha.banner_url,
          link: linha.link,
          ativo: linha.ativo ?? false,
          data_inicio: linha.data_inicio,
          data_fim: linha.data_fim,
          created_at: linha.created_at ?? "",
          updated_at: linha.updated_at ?? null,
        }
      : null;
  }
  return null;
}

export async function removerAnuncioD1(idMunicipio: IdMunicipio, id: string) {
  const db = await getD1();
  if (db) {
    const [linha] = await db
      .delete(anuncios)
      .where(and(eq(anuncios.id_municipio, idMunicipio), eq(anuncios.id, id)))
      .returning({ id: anuncios.id });
    return linha ?? null;
  }
  const pgDb = getDb();
  if (pgDb) {
    const [linha] = await pgDb
      .delete(schemaPg.anuncios)
      .where(and(eq(schemaPg.anuncios.id_municipio, idMunicipio), eq(schemaPg.anuncios.id, id)))
      .returning({ id: schemaPg.anuncios.id });
    return linha ? { id: String(linha.id) } : null;
  }
  return null;
}

/** Negócios do Zap aprovados, com os filtros da página e da rota de API. */
export async function zapEstabelecimentosD1(
  idMunicipio: IdMunicipio,
  opts: { categoria?: string; q?: string; bairros?: string[] } = {}
) {
  const db = await getD1();
  if (db) {
    const cond = [
      eq(zap_estabelecimentos.id_municipio, idMunicipio),
      eq(zap_estabelecimentos.aprovado, true),
    ];
    if (opts.categoria) cond.push(eq(zap_estabelecimentos.categoria, opts.categoria));
    if (opts.q) cond.push(like(zap_estabelecimentos.nome, `%${opts.q}%`));
    if (opts.bairros?.length) cond.push(inArray(zap_estabelecimentos.bairro, opts.bairros));
    const linhas = await db
      .select({
        id: zap_estabelecimentos.id,
        nome: zap_estabelecimentos.nome,
        whatsapp: zap_estabelecimentos.whatsapp,
        categoria: zap_estabelecimentos.categoria,
        descricao: zap_estabelecimentos.descricao,
        bairro: zap_estabelecimentos.bairro,
        cliques: zap_estabelecimentos.cliques,
      })
      .from(zap_estabelecimentos)
      .where(and(...cond));
    return linhas.sort(
      (a, b) =>
        (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR") || a.id.localeCompare(b.id)
    );
  }
  const pgDb = getDb();
  if (pgDb) {
    const cond = [
      eq(schemaPg.zap_estabelecimentos.id_municipio, idMunicipio),
      eq(schemaPg.zap_estabelecimentos.aprovado, true),
    ];
    if (opts.categoria) cond.push(eq(schemaPg.zap_estabelecimentos.categoria, opts.categoria));
    if (opts.q) cond.push(like(schemaPg.zap_estabelecimentos.nome, `%${opts.q}%`));
    if (opts.bairros?.length) cond.push(inArray(schemaPg.zap_estabelecimentos.bairro, opts.bairros));
    const linhas = await pgDb
      .select({
        id: schemaPg.zap_estabelecimentos.id,
        nome: schemaPg.zap_estabelecimentos.nome,
        whatsapp: schemaPg.zap_estabelecimentos.whatsapp,
        categoria: schemaPg.zap_estabelecimentos.categoria,
        descricao: schemaPg.zap_estabelecimentos.descricao,
        bairro: schemaPg.zap_estabelecimentos.bairro,
        cliques: schemaPg.zap_estabelecimentos.cliques,
      })
      .from(schemaPg.zap_estabelecimentos)
      .where(and(...cond));
    return linhas.map((l) => ({ ...l, cliques: l.cliques ?? 0 })).sort(
      (a, b) =>
        (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR") || a.id.localeCompare(b.id)
    );
  }
  return null;
}

/** Classificados aprovados e ainda no prazo. */
export async function classificadosVigentesD1(
  idMunicipio: IdMunicipio,
  opts: { categoria?: string; q?: string } = {}
) {
  const db = await getD1();
  const hoje = new Date().toISOString().slice(0, 10);
  if (db) {
    const cond = [
      eq(classificados.id_municipio, idMunicipio),
      eq(classificados.aprovado, true),
      gte(classificados.expira_em, hoje),
    ];
    if (opts.categoria) cond.push(eq(classificados.categoria, opts.categoria));
    if (opts.q) cond.push(like(classificados.titulo, `%${opts.q}%`));
    return db
      .select({
        id: classificados.id,
        categoria: classificados.categoria,
        titulo: classificados.titulo,
        descricao: classificados.descricao,
        preco: classificados.preco,
        contato_whatsapp: classificados.contato_whatsapp,
        expira_em: classificados.expira_em,
      })
      .from(classificados)
      .where(and(...cond))
      .orderBy(desc(classificados.created_at), asc(classificados.id));
  }
  const pgDb = getDb();
  if (pgDb) {
    const cond = [
      eq(schemaPg.classificados.id_municipio, idMunicipio),
      eq(schemaPg.classificados.aprovado, true),
      gte(schemaPg.classificados.expira_em, hoje),
    ];
    if (opts.categoria) cond.push(eq(schemaPg.classificados.categoria, opts.categoria));
    if (opts.q) cond.push(like(schemaPg.classificados.titulo, `%${opts.q}%`));
    const linhas = await pgDb
      .select({
        id: schemaPg.classificados.id,
        categoria: schemaPg.classificados.categoria,
        titulo: schemaPg.classificados.titulo,
        descricao: schemaPg.classificados.descricao,
        preco: schemaPg.classificados.preco,
        contato_whatsapp: schemaPg.classificados.contato_whatsapp,
        expira_em: schemaPg.classificados.expira_em,
        created_at: schemaPg.classificados.created_at,
      })
      .from(schemaPg.classificados)
      .where(and(...cond))
      .orderBy(desc(schemaPg.classificados.created_at), asc(schemaPg.classificados.id));
    return linhas.map((l) => ({
      id: String(l.id),
      categoria: l.categoria,
      titulo: l.titulo,
      descricao: l.descricao,
      preco: l.preco === null ? null : Number(l.preco),
      contato_whatsapp: l.contato_whatsapp,
      expira_em: l.expira_em,
    }));
  }
  return null;
}

export const TABELAS_MODERADAS_D1 = {
  zap_estabelecimentos,
  classificados,
} as const;

export type TabelaModeradaD1 = keyof typeof TABELAS_MODERADAS_D1;

/** Cadastros aguardando moderação nas duas tabelas. */
export async function pendentesDeModeracaoD1(idMunicipio: IdMunicipio) {
  const db = await getD1();
  if (db) {
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
  const pgDb = getDb();
  if (pgDb) {
    const [zap, pendentesClassificados] = await Promise.all([
      pgDb
        .select({
          id: schemaPg.zap_estabelecimentos.id,
          nome: schemaPg.zap_estabelecimentos.nome,
          whatsapp: schemaPg.zap_estabelecimentos.whatsapp,
          categoria: schemaPg.zap_estabelecimentos.categoria,
          descricao: schemaPg.zap_estabelecimentos.descricao,
          bairro: schemaPg.zap_estabelecimentos.bairro,
          created_at: schemaPg.zap_estabelecimentos.created_at,
        })
        .from(schemaPg.zap_estabelecimentos)
        .where(
          and(
            eq(schemaPg.zap_estabelecimentos.id_municipio, idMunicipio),
            eq(schemaPg.zap_estabelecimentos.aprovado, false)
          )
        )
        .orderBy(desc(schemaPg.zap_estabelecimentos.created_at)),
      pgDb
        .select({
          id: schemaPg.classificados.id,
          titulo: schemaPg.classificados.titulo,
          descricao: schemaPg.classificados.descricao,
          categoria: schemaPg.classificados.categoria,
          preco: schemaPg.classificados.preco,
          contato_whatsapp: schemaPg.classificados.contato_whatsapp,
          created_at: schemaPg.classificados.created_at,
        })
        .from(schemaPg.classificados)
        .where(and(eq(schemaPg.classificados.id_municipio, idMunicipio), eq(schemaPg.classificados.aprovado, false)))
        .orderBy(desc(schemaPg.classificados.created_at)),
    ]);
    return {
      zap_estabelecimentos: zap.map((z) => ({ ...z, created_at: z.created_at ?? "" })),
      classificados: pendentesClassificados.map((c) => ({
        ...c,
        preco: c.preco === null ? null : Number(c.preco),
        created_at: c.created_at ?? "",
      })),
    };
  }
  return null;
}

export async function aprovarPendenteD1(
  idMunicipio: IdMunicipio,
  tabela: TabelaModeradaD1,
  id: string
) {
  const db = await getD1();
  if (db) {
    const t = TABELAS_MODERADAS_D1[tabela];
    const [linha] = await db
      .update(t)
      .set({ aprovado: true, updated_at: new Date().toISOString() })
      .where(and(eq(t.id_municipio, idMunicipio), eq(t.id, id)))
      .returning({ id: t.id });
    return linha ?? null;
  }
  const pgDb = getDb();
  if (pgDb) {
    const t = tabela === "zap_estabelecimentos" ? schemaPg.zap_estabelecimentos : schemaPg.classificados;
    const [linha] = await pgDb
      .update(t)
      .set({ aprovado: true, updated_at: new Date().toISOString() })
      .where(and(eq(t.id_municipio, idMunicipio), eq(t.id, id)))
      .returning({ id: t.id });
    return linha ? { id: String(linha.id) } : null;
  }
  return null;
}

/** Rejeitar apaga a linha pendente — ela nunca chegou a ser pública. */
export async function rejeitarPendenteD1(
  idMunicipio: IdMunicipio,
  tabela: TabelaModeradaD1,
  id: string
) {
  const db = await getD1();
  if (db) {
    const t = TABELAS_MODERADAS_D1[tabela];
    const [linha] = await db
      .delete(t)
      .where(and(eq(t.id_municipio, idMunicipio), eq(t.id, id), eq(t.aprovado, false)))
      .returning({ id: t.id });
    return linha ?? null;
  }
  const pgDb = getDb();
  if (pgDb) {
    const t = tabela === "zap_estabelecimentos" ? schemaPg.zap_estabelecimentos : schemaPg.classificados;
    const [linha] = await pgDb
      .delete(t)
      .where(and(eq(t.id_municipio, idMunicipio), eq(t.id, id), eq(t.aprovado, false)))
      .returning({ id: t.id });
    return linha ? { id: String(linha.id) } : null;
  }
  return null;
}

