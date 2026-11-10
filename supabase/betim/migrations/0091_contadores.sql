-- 0091_contadores.sql
-- Cria a tabela `contadores` — contador público de pedidos, downloads e
-- inscrições (PLANO-NAVEGACAO-E-NOTIFICACOES.md).
--
-- ═══ A LACUNA QUE ESTA MIGRATION FECHA ═══
--
-- `contadores` foi declarada em `lib/db/schema.ts` (Postgres) e em
-- `lib/db/schema.d1.ts` (D1), e é usada por quatro funções de
-- `lib/db/queries/betimD1.ts` (`incrementarContador`, `somarContador`,
-- `totaisContadores` + o beacon de CSP) — mas NENHUMA migration criava a
-- tabela. Nem no Postgres (última migration até a 0090 não a tem) nem no D1
-- (`migrations-d1/0001_escritas.sql` cria page_views, zap_estabelecimentos,
-- classificados e anuncios, sem `contadores`).
--
-- Medição em produção (2026-11-02):
--   * `GET /api/contador` → **500**, corpo `{"error":"Contadores
--     indisponíveis."}`. O `select` em `contadores` estoura e o `catch` da
--     rota (`app/api/contador/route.din.ts`) traduz para 500.
--   * `GET /api/pageview` → 200 com carimbos do Postgres, então conexão e
--     binding estão sãos: faltava só esta tabela.
--   * `POST /api/contador` nunca estourava porque engole o erro (é beacon
--     fogo-e-esqueça) — os cliques eram descartados em silêncio.
--
-- Tipos idênticos aos de `lib/db/schema.ts`, de propósito: `contagem integer`
-- (não bigint — o Drizzle do app declara integer) e `atualizado_em text`
-- (o app grava ISO 8601 montado em JS, não `now()`).

create table if not exists contadores (
  tipo           text primary key,
  contagem       integer not null default 0,
  atualizado_em  text not null
);

-- Mesmo padrão condicional da 0059 (page_views): grants só se os papéis do
-- Supabase/PostgREST existirem. O app grava e lê com a role dona da tabela
-- (ver `lib/db/client.ts`); isto é só para manter o padrão das tabelas
-- públicas caso algo além do app leia por PostgREST.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on contadores to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on contadores to authenticated;
  end if;
end $$;
