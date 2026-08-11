-- Contador de visualizações das páginas principais do portal.
--
-- Chave é o PATH da URL (`/betim`, `/betim/prefeitura/contratos`,
-- `/congresso`, ...) e não um id_municipio separado: o path já carrega a
-- cidade/zona, e path é justamente o que a tela de "mais vistas" precisa
-- para linkar de volta para a página.
--
-- "Visualização" aqui é CARREGAMENTO DE PÁGINA, não visitante único: cada
-- carregamento soma 1, sem dedupe por sessão/IP/cookie (ver
-- `app/api/pageview/route.din.ts`, que faz o upsert, e
-- `app/components/PageViewBeacon.tsx`, que dispara o `sendBeacon`). É
-- contador aproximado de página cívica — o objetivo é "o que mais se lê no
-- portal", não uma métrica de auditoria.

create table if not exists page_views (
  path           text primary key,
  contagem       bigint not null default 0,
  atualizado_em  timestamptz not null default now()
);

-- A tela de "mais vistas" ordena por contagem desc; sem este índice ela
-- faria seq scan na tabela inteira a cada acesso.
create index if not exists page_views_contagem_idx
  on page_views (contagem desc);

-- Mesmo padrão condicional da migration 0058 (atos_oficiais_geo): grants só
-- se os papéis do Supabase/PostgREST ainda existirem no banco. O app hoje
-- lê e escreve com a role dona da tabela (ver `lib/db/client.ts`), então
-- isto é só para não deixar `page_views` fora do padrão das tabelas
-- públicas caso algo além do app leia por PostgREST.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on page_views to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on page_views to authenticated;
  end if;
end $$;
