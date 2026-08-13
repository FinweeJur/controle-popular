-- Schema inicial do D1 `controlepopular-escritas` — as cinco tabelas das
-- escritas ao vivo do portal (pageview, zap, clique, classificados,
-- moderação admin). Ver o cabeçalho de `lib/db/schema.d1.ts` para o porquê
-- deste banco existir separado do Postgres.
--
-- Medição em 2026-08-13 (Postgres local, `controle_popular`): 22 linhas em
-- `page_views` (todas de teste local — produção respondia 500 desde o
-- deploy) e ZERO em `zap_estabelecimentos`/`classificados`/`anuncios`. Não
-- há histórico que valha migrar: as tabelas nascem vazias aqui.

create table if not exists page_views (
  path           text primary key,
  contagem       integer not null default 0,
  atualizado_em  text not null
);

create index if not exists page_views_contagem_idx
  on page_views (contagem);

create table if not exists zap_estabelecimentos (
  id             text primary key,
  id_municipio   text not null,
  nome           text,
  whatsapp       text,
  categoria      text,
  descricao      text,
  aprovado       integer not null default 0,
  cliques        integer not null default 0,
  created_at     text not null,
  updated_at     text,
  bairro         text
);

create index if not exists zap_estabelecimentos_municipio_aprovado_idx
  on zap_estabelecimentos (id_municipio, aprovado);

create table if not exists classificados (
  id                 text primary key,
  id_municipio       text not null,
  categoria          text,
  titulo             text,
  descricao          text,
  preco              real,
  contato_whatsapp   text,
  aprovado           integer not null default 0,
  expira_em          text,
  created_at         text not null,
  updated_at         text
);

create index if not exists classificados_municipio_aprovado_idx
  on classificados (id_municipio, aprovado);

create table if not exists anuncios (
  id             text primary key,
  id_municipio   text not null,
  nome_comercio  text,
  plano          text,
  banner_url     text,
  link           text,
  ativo          integer not null default 0,
  data_inicio    text,
  data_fim       text,
  created_at     text not null,
  updated_at     text
);

create index if not exists anuncios_municipio_idx
  on anuncios (id_municipio);
