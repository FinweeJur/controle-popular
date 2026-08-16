/**
 * Escritas Postgres (legado) — usadas APENAS por `scripts/paridade-betim.mts`
 * para testar paridade entre Postgres e D1. NÃO é importado por nenhuma rota
 * de produção; mantê-lo em `queries/betim.ts` embutia no bundle do Worker.
 *
 * As versões de produção estão em `queries/betimD1.ts` (D1/SQLite).
 */
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { num } from "@/lib/db/num";
import type { IdMunicipio } from "@/lib/db/queries/municipios";
import { anuncios, classificados, zap_estabelecimentos } from "@/lib/db/schema";

export async function inserirClassificado(
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
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .insert(classificados)
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
    .returning({ id: classificados.id });
  return linha ?? null;
}

export async function inserirZapEstabelecimento(
  idMunicipio: IdMunicipio,
  dados: {
    nome: string;
    whatsapp: string;
    categoria: string;
    descricao: string | null;
    bairro: string | null;
  }
) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .insert(zap_estabelecimentos)
    .values({ id_municipio: idMunicipio, ...dados, aprovado: false })
    .returning({ id: zap_estabelecimentos.id });
  return linha ?? null;
}

export async function incrementarCliquesZap(idMunicipio: IdMunicipio, id: string) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .update(zap_estabelecimentos)
    .set({ cliques: sql`coalesce(${zap_estabelecimentos.cliques}, 0) + 1` })
    .where(
      and(
        eq(zap_estabelecimentos.id_municipio, idMunicipio),
        eq(zap_estabelecimentos.id, id),
        eq(zap_estabelecimentos.aprovado, true)
      )
    )
    .returning({ id: zap_estabelecimentos.id, cliques: zap_estabelecimentos.cliques });
  return linha ?? null;
}

export async function inserirAnuncio(
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
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .insert(anuncios)
    .values({ id_municipio: idMunicipio, ...dados, ativo: false })
    .returning();
  return linha ?? null;
}

export type PatchAnuncio = Partial<{
  nome_comercio: string;
  plano: string;
  banner_url: string | null;
  link: string | null;
  ativo: boolean;
  data_inicio: string | null;
  data_fim: string | null;
}>;

export async function atualizarAnuncio(
  idMunicipio: IdMunicipio,
  id: string,
  patch: PatchAnuncio
) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .update(anuncios)
    .set(patch)
    .where(and(eq(anuncios.id_municipio, idMunicipio), eq(anuncios.id, id)))
    .returning();
  return linha ?? null;
}

export async function removerAnuncio(idMunicipio: IdMunicipio, id: string) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .delete(anuncios)
    .where(and(eq(anuncios.id_municipio, idMunicipio), eq(anuncios.id, id)))
    .returning({ id: anuncios.id });
  return linha ?? null;
}

export const TABELAS_MODERADAS = {
  zap_estabelecimentos,
  classificados,
} as const;

export type TabelaModerada = keyof typeof TABELAS_MODERADAS;

export async function pendentesDeModeracao(idMunicipio: IdMunicipio) {
  const db = getDb();
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
      .orderBy(desc(zap_estabelecimentos.created_at), asc(zap_estabelecimentos.id)),
    db
      .select({
        id: classificados.id,
        titulo: classificados.titulo,
        descricao: classificados.descricao,
        categoria: classificados.categoria,
        preco: num(classificados.preco),
        contato_whatsapp: classificados.contato_whatsapp,
        created_at: classificados.created_at,
      })
      .from(classificados)
      .where(
        and(eq(classificados.id_municipio, idMunicipio), eq(classificados.aprovado, false))
      )
      .orderBy(desc(classificados.created_at), asc(classificados.id)),
  ]);
  return { zap_estabelecimentos: zap, classificados: pendentesClassificados };
}

export async function aprovarPendente(
  idMunicipio: IdMunicipio,
  tabela: TabelaModerada,
  id: string
) {
  const db = getDb();
  if (!db) return null;
  const t = TABELAS_MODERADAS[tabela];
  const [linha] = await db
    .update(t)
    .set({ aprovado: true })
    .where(and(eq(t.id_municipio, idMunicipio), eq(t.id, id)))
    .returning({ id: t.id });
  return linha ?? null;
}

export async function rejeitarPendente(
  idMunicipio: IdMunicipio,
  tabela: TabelaModerada,
  id: string
) {
  const db = getDb();
  if (!db) return null;
  const t = TABELAS_MODERADAS[tabela];
  const [linha] = await db
    .delete(t)
    .where(and(eq(t.id_municipio, idMunicipio), eq(t.id, id), eq(t.aprovado, false)))
    .returning({ id: t.id });
  return linha ?? null;
}
