-- Migração D1 -> PostgreSQL para as tabelas de escrita ao vivo
-- Permite que o container Docker na Guara Cloud use o Postgres diretamente.

CREATE TABLE IF NOT EXISTS page_views (
  path text PRIMARY KEY,
  contagem integer NOT NULL DEFAULT 0,
  atualizado_em text NOT NULL
);

CREATE INDEX IF NOT EXISTS page_views_contagem_idx ON page_views (contagem);

CREATE TABLE IF NOT EXISTS contadores (
  tipo text PRIMARY KEY,
  contagem integer NOT NULL DEFAULT 0,
  atualizado_em text NOT NULL
);

-- Registros exportados do D1 em 2026-09-16
INSERT INTO page_views (path, contagem, atualizado_em) VALUES
  ('/', 94, '2026-09-09T16:12:14.770Z'),
  ('/betim', 7, '2026-08-23T21:19:29.712Z'),
  ('/betim/prefeitura/contratos', 2, '2026-08-16T01:38:24.354Z'),
  ('/betim/dados', 1, '2026-08-13T16:34:12.784Z'),
  ('/betim/citrolandia', 1, '2026-08-13T16:34:39.164Z'),
  ('/dados/populares', 3, '2026-08-21T22:45:30.832Z'),
  ('/judiciario', 4, '2026-08-23T10:54:06.883Z'),
  ('/betim/zap', 1, '2026-08-13T18:42:57.271Z'),
  ('/ambiental/direito-critico', 2, '2026-08-14T00:55:15.890Z'),
  ('/funcaosocialterra', 22, '2026-08-21T22:50:00.856Z'),
  ('/funcaosocialterra/mapa', 16, '2026-08-19T18:52:57.651Z'),
  ('/direitos-em-movimento', 7, '2026-08-20T18:29:10.560Z'),
  ('/direitos-em-movimento/ajuda', 4, '2026-08-20T18:29:15.805Z'),
  ('/ambiental', 11, '2026-08-25T02:10:43.098Z'),
  ('/ambiental/legislacao', 7, '2026-08-22T00:41:35.274Z'),
  ('/funcaosocialterra/alertas', 11, '2026-08-17T09:42:51.664Z'),
  ('/paraopeba', 21, '2026-08-24T14:42:09.393Z'),
  ('/paraopeba/quem-atua', 6, '2026-08-20T18:28:59.250Z'),
  ('/ambiental/copam', 7, '2026-08-25T02:11:42.476Z'),
  ('/paraopeba/auxilio', 2, '2026-08-15T22:03:09.027Z'),
  ('/direitos-em-movimento/denuncia', 2, '2026-08-15T19:26:50.450Z'),
  ('/diamantina', 1, '2026-08-14T12:13:51.026Z'),
  ('/diamantina/camara', 1, '2026-08-14T12:14:18.900Z'),
  ('/diamantina/vereadores/marcos-francisco-santos-fonseca', 1, '2026-08-14T12:14:24.878Z'),
  ('/paraopeba/documentos', 3, '2026-08-15T22:07:29.540Z'),
  ('/paraopeba/clipping', 3, '2026-08-17T03:16:02.595Z'),
  ('/ambiental/barragens', 2, '2026-08-21T22:57:15.692Z'),
  ('/judiciario/indicacoes', 1, '2026-08-15T19:28:05.405Z'),
  ('/paraopeba/biblioteca', 4, '2026-08-24T14:42:15.757Z'),
  ('/paraopeba/linha-do-tempo', 1, '2026-08-15T22:07:40.990Z'),
  ('/termos', 1, '2026-08-15T22:08:05.710Z'),
  ('/sobre', 1, '2026-08-15T22:14:53.683Z'),
  ('/aracuai', 3, '2026-08-17T03:13:09.132Z'),
  ('/aracuai/prefeitura/contratos', 1, '2026-08-17T03:04:20.516Z'),
  ('/aracuai/camara', 3, '2026-08-17T03:13:02.390Z'),
  ('/aracuai/vereadores/carlindo-dourado', 1, '2026-08-17T03:12:05.376Z'),
  ('/aracuai/vereadores/claudio-nunes-siqueira', 1, '2026-08-17T03:13:05.852Z'),
  ('/bh', 1, '2026-08-17T03:13:44.268Z'),
  ('/ambiental/copam/municipio/3103405', 1, '2026-08-17T03:14:42.204Z'),
  ('/paraopeba/entenda', 1, '2026-08-20T18:31:03.389Z'),
  ('/ambiental/licenciamento', 2, '2026-08-21T22:50:45.304Z'),
  ('/ambiental/copam/municipio/3147006', 1, '2026-08-21T22:51:03.770Z'),
  ('/judiciario/vagas', 1, '2026-08-22T00:40:19.379Z'),
  ('/ambiental/copam/reuniao/2011', 1, '2026-08-25T02:11:14.203Z'),
  ('/ambiental/copam/municipio/3170404', 1, '2026-08-25T02:11:31.628Z'),
  ('/ambiental/copam/reuniao/1998', 1, '2026-08-25T02:12:00.347Z'),
  ('/com', 4, '2026-08-25T22:37:10.823Z')
ON CONFLICT (path) DO UPDATE SET
  contagem = EXCLUDED.contagem,
  atualizado_em = EXCLUDED.atualizado_em;
