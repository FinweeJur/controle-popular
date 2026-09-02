import { and, asc, desc, eq, gte, inArray, like, sql } from "drizzle-orm";
import { getD1 } from "@/lib/db/clientD1";
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

export async function incrementarContador(tipo: string) {
  const db = await getD1();
  if (!db) return null;
  const agora = new Date().toISOString();
  await db
    .insert(contadores)
    .values({ tipo, contagem: 1, atualizado_em: agora })
    .onConflictDoUpdate({
      target: contadores.tipo,
      set: { contagem: sql`${contadores.contagem} + 1`, atualizado_em: agora },
    });
  return true;
}

export type LinhaContadorD1 = { tipo: string; contagem: number };

export async function totaisContadores(): Promise<LinhaContadorD1[] | null> {
  const db = await getD1();
  if (!db) return null;
  return db
    .select({ tipo: contadores.tipo, contagem: contadores.contagem })
    .from(contadores);
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
 * ═══ LEITURA PÚBLICA — POR QUE ELA PRECISOU VIR PARA CÁ ═══
 *
 * O primeiro passo da migração moveu só as ESCRITAS para o D1 e deixou a
 * listagem pública lendo do Postgres. Isso partiu o produto ao meio de um
 * jeito que nenhum teste pegava: o cadastro entrava no D1, a moderação
 * aprovava no D1 (`aprovarPendenteD1`), e a lista continuava consultando um
 * Postgres onde aquela linha nunca existiu. Ou seja, aprovar não publicava
 * nada. Pior, o clique de um item listado tentava um UPDATE no D1 sobre um
 * id que só existia no outro banco.
 *
 * As funções abaixo são as versões D1 de `zapEstabelecimentos` e
 * `classificadosVigentes` (`queries/betim.ts`, linhas ~465-522). Mesmo
 * conjunto, mesmas colunas, mesma regra de visibilidade. Duas diferenças de
 * FORMA, e as duas são limite do SQLite, não escolha:
 *
 * - `like` no lugar de `ilike`: SQLite não tem `ILIKE`, e o `LIKE` dele já
 *   ignora caixa em ASCII — mesmo comportamento para o que a busca alcança
 *   aqui, que são títulos e nomes digitados.
 * - a ordenação por nome saiu do `ORDER BY` e foi para o JS. `ptBr()`
 *   (`lib/db/ordem.ts`) é `collate "pt-BR-x-icu"`, ICU do Postgres; SQLite
 *   só tem BINARY, NOCASE e RTRIM, e nenhuma põe "ANTÔNIO" no meio dos
 *   "ANTONIO". Ordenar em memória devolve a MESMA lista porque esta
 *   consulta não tem LIMIT nem paginação — é o conjunto inteiro que chega
 *   aqui. Fosse paginada, cortar antes de ordenar mudaria quem aparece, e
 *   aí não daria. É a mesma decisão já tomada no eixo Congresso.
 *
 * Classificados fica ordenado no SQL: `created_at` é texto ISO-8601, e
 * ordem de byte sobre ISO-8601 É ordem cronológica.
 */

/** Negócios do Zap aprovados, com os filtros da página e da rota de API. */
export async function zapEstabelecimentosD1(
  idMunicipio: IdMunicipio,
  opts: { categoria?: string; q?: string; bairros?: string[] } = {}
) {
  const db = await getD1();
  if (!db) return null;
  const cond = [
    eq(zap_estabelecimentos.id_municipio, idMunicipio),
    eq(zap_estabelecimentos.aprovado, true),
  ];
  if (opts.categoria) cond.push(eq(zap_estabelecimentos.categoria, opts.categoria));
  if (opts.q) cond.push(like(zap_estabelecimentos.nome, `%${opts.q}%`));
  // `?length` e não só `?`: `inArray` com lista vazia gera `in ()`, erro de
  // sintaxe no SQLite. Mesmo guarda do Postgres.
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

/** Classificados aprovados e ainda no prazo. */
export async function classificadosVigentesD1(
  idMunicipio: IdMunicipio,
  opts: { categoria?: string; q?: string } = {}
) {
  const db = await getD1();
  if (!db) return null;
  const hoje = new Date().toISOString().slice(0, 10);
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
    // Desempate por id pela mesma razão do Postgres: dois anúncios criados
    // no mesmo instante sairiam em ordem indefinida.
    .orderBy(desc(classificados.created_at), asc(classificados.id));
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
