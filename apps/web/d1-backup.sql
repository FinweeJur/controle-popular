PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE IF NOT EXISTS "d1_migrations"(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(1,'0001_escritas.sql','2026-08-13 03:47:29');
CREATE TABLE page_views (
  path           text primary key,
  contagem       integer not null default 0,
  atualizado_em  text not null
);
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/',94,'2026-09-09T16:12:14.770Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/betim',7,'2026-08-23T21:19:29.712Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/betim/prefeitura/contratos',2,'2026-08-16T01:38:24.354Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/betim/dados',1,'2026-08-13T16:34:12.784Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/betim/citrolandia',1,'2026-08-13T16:34:39.164Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/dados/populares',3,'2026-08-21T22:45:30.832Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/judiciario',4,'2026-08-23T10:54:06.883Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/betim/zap',1,'2026-08-13T18:42:57.271Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/ambiental/direito-critico',2,'2026-08-14T00:55:15.890Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/funcaosocialterra',22,'2026-08-21T22:50:00.856Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/funcaosocialterra/mapa',16,'2026-08-19T18:52:57.651Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/direitos-em-movimento',7,'2026-08-20T18:29:10.560Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/direitos-em-movimento/ajuda',4,'2026-08-20T18:29:15.805Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/ambiental',11,'2026-08-25T02:10:43.098Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/ambiental/legislacao',7,'2026-08-22T00:41:35.274Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/funcaosocialterra/alertas',11,'2026-08-17T09:42:51.664Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/paraopeba',21,'2026-08-24T14:42:09.393Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/paraopeba/quem-atua',6,'2026-08-20T18:28:59.250Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/ambiental/copam',7,'2026-08-25T02:11:42.476Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/paraopeba/auxilio',2,'2026-08-15T22:03:09.027Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/direitos-em-movimento/denuncia',2,'2026-08-15T19:26:50.450Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/diamantina',1,'2026-08-14T12:13:51.026Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/diamantina/camara',1,'2026-08-14T12:14:18.900Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/diamantina/vereadores/marcos-francisco-santos-fonseca',1,'2026-08-14T12:14:24.878Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/paraopeba/documentos',3,'2026-08-15T22:07:29.540Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/paraopeba/clipping',3,'2026-08-17T03:16:02.595Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/ambiental/barragens',2,'2026-08-21T22:57:15.692Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/judiciario/indicacoes',1,'2026-08-15T19:28:05.405Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/paraopeba/biblioteca',4,'2026-08-24T14:42:15.757Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/paraopeba/linha-do-tempo',1,'2026-08-15T22:07:40.990Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/termos',1,'2026-08-15T22:08:05.710Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/sobre',1,'2026-08-15T22:14:53.683Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/aracuai',3,'2026-08-17T03:13:09.132Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/aracuai/prefeitura/contratos',1,'2026-08-17T03:04:20.516Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/aracuai/camara',3,'2026-08-17T03:13:02.390Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/aracuai/vereadores/carlindo-dourado',1,'2026-08-17T03:12:05.376Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/aracuai/vereadores/claudio-nunes-siqueira',1,'2026-08-17T03:13:05.852Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/bh',1,'2026-08-17T03:13:44.268Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/ambiental/copam/municipio/3103405',1,'2026-08-17T03:14:42.204Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/paraopeba/entenda',1,'2026-08-20T18:31:03.389Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/ambiental/licenciamento',2,'2026-08-21T22:50:45.304Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/ambiental/copam/municipio/3147006',1,'2026-08-21T22:51:03.770Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/judiciario/vagas',1,'2026-08-22T00:40:19.379Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/ambiental/copam/reuniao/2011',1,'2026-08-25T02:11:14.203Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/ambiental/copam/municipio/3170404',1,'2026-08-25T02:11:31.628Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/ambiental/copam/reuniao/1998',1,'2026-08-25T02:12:00.347Z');
INSERT INTO "page_views" ("path","contagem","atualizado_em") VALUES('/com',4,'2026-08-25T22:37:10.823Z');
CREATE TABLE zap_estabelecimentos (
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
CREATE TABLE classificados (
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
CREATE TABLE anuncios (
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
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('d1_migrations',1);
CREATE INDEX page_views_contagem_idx
  on page_views (contagem);
CREATE INDEX zap_estabelecimentos_municipio_aprovado_idx
  on zap_estabelecimentos (id_municipio, aprovado);
CREATE INDEX classificados_municipio_aprovado_idx
  on classificados (id_municipio, aprovado);
CREATE INDEX anuncios_municipio_idx
  on anuncios (id_municipio);
