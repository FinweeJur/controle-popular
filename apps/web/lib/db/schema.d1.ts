import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Schema do D1 (SQLite), banco SEPARADO do Postgres de `schema.ts`.
 *
 * POR QUE DOIS BANCOS: o Postgres (Neon, `lib/db/client.ts`) segue sendo o
 * banco do ETL e do build — é dele que as páginas estáticas puxam dado na
 * hora de gerar o site. Este arquivo é o banco das ESCRITAS AO VIVO do
 * portal em produção (pageview, zap, clique, classificados, moderação
 * admin) — as únicas cinco rotas que gravam depois do deploy, medidas em
 * 2026-08-13 (ver `docs/` ou o commit desta migration para a medição
 * completa). Region ENAM, DB `controlepopular-escritas`
 * (id `c3818333-4600-45e4-a675-dea967fb75e9`), binding `DB_ESCRITAS`
 * (`wrangler.jsonc`).
 *
 * NÃO é o Postgres inteiro replicado: são cinco tabelas pequenas,
 * append-only na maior parte. `DATABASE_URL` apontando para
 * `127.0.0.1:5432` (a máquina de build) é o que fazia estas cinco rotas
 * responderem 500 em produção — de dentro da Cloudflare, `127.0.0.1` é a
 * própria Cloudflare, que não acha ninguém. D1 roda no mesmo runtime do
 * Worker, sem esse problema de alcance.
 *
 * TIPOS SÃO SQLite, NÃO POSTGRES: sem `uuid`, sem `boolean` nativo (via
 * `integer({ mode: "boolean" })`, gravado como 0/1), sem `timestamptz`
 * (datas são `text` ISO-8601, gravadas pelo próprio app — SQLite não tem
 * tipo de data). `numeric` do Postgres virou `real` — a única coluna
 * monetária daqui é `classificados.preco`, e a perda de precisão de ponto
 * flutuante não importa para um preço de anúncio classificado exibido em
 * tela, ao contrário de `despesas`/`contratos` no Postgres, que somam
 * milhões e ficam na tabela grande.
 *
 * `casing: "preserve"` do `drizzle.config.ts` do Postgres NÃO se aplica
 * aqui — este schema é escrito à mão, não introspectado. Os nomes seguem
 * snake_case por convenção do projeto, não por essa flag.
 *
 * HISTÓRICO NÃO MIGRADO: medição ao vivo em 2026-08-13 (Postgres local,
 * `controle_popular`) achou 22 linhas em `page_views` (todas de teste local
 * — as rotas em produção respondem 500 desde o deploy, então zero
 * navegação real chegou a gravar) e ZERO linhas em `zap_estabelecimentos`,
 * `classificados`, `anuncios`. Não há dado histórico que valha migrar:
 * todas as tabelas nascem vazias no D1.
 */

export const page_views = sqliteTable(
  "page_views",
  {
    path: text().primaryKey().notNull(),
    contagem: integer().notNull().default(0),
    atualizado_em: text().notNull(),
  },
  (table) => [
    // Mesma razão da migration 0059 no Postgres: `/dados/populares` ordena
    // por contagem desc, e sem índice seria varredura da tabela inteira.
    index("page_views_contagem_idx").on(table.contagem),
  ]
);

export const zap_estabelecimentos = sqliteTable(
  "zap_estabelecimentos",
  {
    // Sem `uuid().defaultRandom()` do Postgres: o id é gerado em JS
    // (`crypto.randomUUID()`, disponível no runtime do Worker) e passado
    // explicitamente no INSERT — ver `lib/db/queries/betimD1.ts`.
    id: text().primaryKey().notNull(),
    id_municipio: text().notNull(),
    nome: text(),
    whatsapp: text(),
    categoria: text(),
    descricao: text(),
    aprovado: integer({ mode: "boolean" }).notNull().default(false),
    cliques: integer().notNull().default(0),
    created_at: text().notNull(),
    updated_at: text(),
    bairro: text(),
  },
  (table) => [
    // A moderação e a listagem pública sempre filtram por
    // (id_municipio, aprovado) juntos — ver `pendentesDeModeracaoD1` e
    // `TABELAS_MODERADAS_D1`.
    index("zap_estabelecimentos_municipio_aprovado_idx").on(
      table.id_municipio,
      table.aprovado
    ),
  ]
);

export const classificados = sqliteTable(
  "classificados",
  {
    id: text().primaryKey().notNull(),
    id_municipio: text().notNull(),
    categoria: text(),
    titulo: text(),
    descricao: text(),
    preco: real(),
    contato_whatsapp: text(),
    aprovado: integer({ mode: "boolean" }).notNull().default(false),
    expira_em: text(),
    created_at: text().notNull(),
    updated_at: text(),
  },
  (table) => [
    index("classificados_municipio_aprovado_idx").on(table.id_municipio, table.aprovado),
  ]
);

export const anuncios = sqliteTable(
  "anuncios",
  {
    id: text().primaryKey().notNull(),
    id_municipio: text().notNull(),
    nome_comercio: text(),
    plano: text(),
    banner_url: text(),
    link: text(),
    ativo: integer({ mode: "boolean" }).notNull().default(false),
    data_inicio: text(),
    data_fim: text(),
    created_at: text().notNull(),
    updated_at: text(),
  },
  (table) => [index("anuncios_municipio_idx").on(table.id_municipio)]
);
