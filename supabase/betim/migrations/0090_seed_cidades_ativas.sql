-- Migration 0090: ativa as 6 cidades que o commit 10f2dcdc adicionou à mão
-- em cidades-do-build.ts e corrige a migration 0086.
--
-- ═══ POR QUE ESTA MIGRATION EXISTE ═══
--
-- O arquivo `lib/db/cidades-do-build.ts` é GERADO no prebuild a partir do
-- banco (`listarCidadesDoPostgres` filtra `ativo = true`). Sem estas linhas
-- no Postgres, a próxima regeneração apagaria as 6 cidades que o commit
-- 10f2dcdc (19/09) colocou no arquivo à mão.
--
-- As 4 cidades de 0086 (GV, Ipatinga, JF, Uberlândia) já existem com
-- ativo=false e lat/lng=NULL. Brumadinho existe como linha mínima de 0070
-- (CFEM). Serro não existe em `municipios` (só em ref_municipios_mg).
--
-- ═══ COORDENADAS — Wikipédia pt, DMS → decimal, 2026-09-24 ═══
--
--   Brumadinho         20°08′34″S 44°12′00″O → -20.1428, -44.2000
--   Serro              18°36′18″S 43°22′44″O → -18.6050, -43.3789
--   Governador Valadares 18°51′27″S 41°56′38″O → -18.8575, -41.9439
--   Ipatinga           19°28′04″S 42°32′13″O → -19.4678, -42.5369
--   Juiz de Fora       21°41′20″S 43°20′40″O → -21.6889, -43.3444
--   Uberlândia         18°55′08″S 48°16′37″O → -18.9189, -48.2769
--
-- O hand-edit tinha Serro errado (-20.3794 — isso fica perto de Diamantina,
-- ~200 km ao sul). Corrigido aqui. As outras estavam próximas o bastante;
-- usamos a fonte Wikipédia por consistência.
--
-- ═══ CORREÇÃO DO BUG DA 0086 ═══
--
-- A 0086 gravou `links_uteis_mg: false` para municípios de MG com o
-- comentário "esta região não é MG" — copiado de uma migration de outra
-- região. MG tem 853 municípios; links estaduais servem a todos eles.
-- Corrigido para true nas 4 cidades desta migration.
--
-- ═══ `ativo = true` PUBLICA SOZINHO NO PRÓXIMO BUILD ═══
--
-- Mesmo aviso da 0043: `rebuild.yml` roda cron semanal. Com estas linhas,
-- as 6 cidades entram no ar no próximo rebuild. Foi decidido assim — o
-- commit 10f2dcdc já as colocou no arquivo de build.
--
-- ═══ PENDÊNCIAS (mesmas da 0086) ═══
--
--   - cnpj_prefeitura: conferir no PNCP por cidade (CNPJ errado é pior
--     que ausente)
--   - camara_host/coletor: identificar fornecedor da câmara antes de ETL
--   - lat/lng: conferir na fonte oficial se a precisão importar

insert into municipios (
  id_municipio, nome, uf, cnpj_prefeitura, lat, lng, dominio, branding, fontes, ativo
) values
(
  '3109006', 'Brumadinho', 'MG', NULL, -20.1428, -44.2000,
  'controlepopular.br/brumadinho',
  '{"nome_portal":"Controle Popular Brumadinho"}'::jsonb,
  '{
     "datasus_6dig": "310900",
     "estado_municipios_count": 853,
     "paraopeba": true,
     "citrolandia": false,
     "links_uteis_mg": true,
     "rotas_legadas": false
   }'::jsonb,
  true
),
(
  '3167103', 'Serro', 'MG', NULL, -18.6050, -43.3789,
  'controlepopular.br/serro',
  '{"nome_portal":"Controle Popular Serro"}'::jsonb,
  '{
     "datasus_6dig": "316710",
     "estado_municipios_count": 853,
     "paraopeba": false,
     "citrolandia": false,
     "links_uteis_mg": true,
     "rotas_legadas": false
   }'::jsonb,
  true
),
(
  '3127701', 'Governador Valadares', 'MG', NULL, -18.8575, -41.9439,
  'controlepopular.br/governador-valadares',
  '{"nome_portal":"Controle Popular Governador Valadares"}'::jsonb,
  '{
     "datasus_6dig": "312770",
     "estado_municipios_count": 853,
     "paraopeba": false,
     "citrolandia": false,
     "links_uteis_mg": true,
     "rotas_legadas": false
   }'::jsonb,
  true
),
(
  '3131307', 'Ipatinga', 'MG', NULL, -19.4678, -42.5369,
  'controlepopular.br/ipatinga',
  '{"nome_portal":"Controle Popular Ipatinga"}'::jsonb,
  '{
     "datasus_6dig": "313130",
     "estado_municipios_count": 853,
     "paraopeba": false,
     "citrolandia": false,
     "links_uteis_mg": true,
     "rotas_legadas": false
   }'::jsonb,
  true
),
(
  '3136702', 'Juiz de Fora', 'MG', NULL, -21.6889, -43.3444,
  'controlepopular.br/juiz-de-fora',
  '{"nome_portal":"Controle Popular Juiz de Fora"}'::jsonb,
  '{
     "datasus_6dig": "313670",
     "estado_municipios_count": 853,
     "paraopeba": false,
     "citrolandia": false,
     "links_uteis_mg": true,
     "rotas_legadas": false
   }'::jsonb,
  true
),
(
  '3170206', 'Uberlândia', 'MG', NULL, -18.9189, -48.2769,
  'controlepopular.br/uberlandia',
  '{"nome_portal":"Controle Popular Uberlândia"}'::jsonb,
  '{
     "datasus_6dig": "317020",
     "estado_municipios_count": 853,
     "paraopeba": false,
     "citrolandia": false,
     "links_uteis_mg": true,
     "rotas_legadas": false
   }'::jsonb,
  true
)
on conflict (id_municipio) do update set
  nome = excluded.nome,
  uf = excluded.uf,
  cnpj_prefeitura = excluded.cnpj_prefeitura,
  lat = excluded.lat,
  lng = excluded.lng,
  dominio = excluded.dominio,
  branding = excluded.branding,
  -- MERGE, não substituição: o ETL de descoberta grava chaves em fontes
  -- (cnpjs_orgao do PNCP etc.) e um re-run desta migration não pode apagá-las.
  fontes = coalesce(municipios.fontes, '{}'::jsonb) || excluded.fontes,
  ativo = excluded.ativo;
