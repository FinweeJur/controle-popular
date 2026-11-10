-- 0002_contadores.sql
-- Mesma lacuna da 0091 no Postgres, do lado do D1: `contadores` estava
-- declarada em `lib/db/schema.d1.ts` e faltava no DDL do banco
-- `controlepopular-escritas` (a `0001_escritas.sql` cria page_views,
-- zap_estabelecimentos, classificados e anuncios, sem contadores).
--
-- Sem o binding D1 aplicado hoje em produção a rota cai no Postgres, mas
-- enquanto este DDL faltar qualquer ativação do D1 traz o 500 de volta em
-- `GET /api/contador` e descarta os cliques do POST em silêncio.
create table if not exists contadores (
  tipo           text primary key,
  contagem       integer not null default 0,
  atualizado_em  text not null
);
