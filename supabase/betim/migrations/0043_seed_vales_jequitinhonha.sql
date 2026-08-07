-- Semeia Araçuaí (3103405), Itinga (3134004) e Diamantina (3121605) — as três
-- primeiras cidades do eixo Cidades fora de região metropolitana.
--
-- Ativar uma cidade é UMA LINHA nesta tabela: `app/[municipio]/layout.tsx` lê
-- `slugsDasCidades()` no `generateStaticParams`, então a rota nasce do banco,
-- não de código. Ver `lib/db/queries/municipios.ts`. Molde: `0027_seed_bh_sp.sql`.
--
-- ═══ OS CÓDIGOS IBGE, QUE JÁ CUSTARAM CARO NESTE PROJETO ═══
--
-- Conferidos ao vivo em 2026-08-07 nos DOIS sentidos: `/localidades/municipios/{id}`
-- e a lista dos 853 municípios de MG. Os dois palpites iniciais estavam ERRADOS,
-- e errados do pior jeito possível — apontando para municípios reais de MG:
--
--     3103504 = ARAGUARI    (não Araçuaí, que é 3103405 — transposição de dígito)
--     3133600 = ITAPEVA     (não Itinga,  que é 3134004)
--
-- É exatamente o modo de falha do caso Betim/BH registrado no `0001_schema.sql`:
-- a linha entra sem erro nenhum e o ETL popula a cidade errada em silêncio.
-- Ao abrir a próxima cidade, confira o código na API do IBGE antes de escrever.
--
-- ═══ CNPJs, conferidos ao vivo em fonte oficial ═══
--
--     17963083000117  MUNICIPIO DE ARACUAI          (PNCP)
--     26201996000197  CAMARA MUNICIPAL DE ARACUAI   (PNCP + diretório do Interlegis)
--     18348748000145  MUNICIPIO DE ITINGA           (PNCP)
--     26222059000118  ITINGA CAMARA MUNICIPAL       (PNCP)
--     17754136000190  MUNICIPIO DE DIAMANTINA       (PNCP)
--     20209557000144  DIAMANTINA CAMARA MUNICIPAL   (PNCP)
--
-- CNPJ errado não é o mesmo que CNPJ ausente: errado faz o `etl.pncp.contratos`
-- coletar contrato de outro ente e gravá-lo como do município, sem erro.
--
-- ═══ `branding.slug` NÃO é semeado, de propósito ═══
--
-- `slugDoNome()` já deriva `aracuai` / `itinga` / `diamantina` (conferido: a
-- normalização NFD come o `ç` e o `í` de "Araçuaí"). O override só existe para
-- `/bh` e `/sp`, cujas URLs foram anunciadas antes do código.
--
-- ═══ `fontes` é o que decide QUAIS PÁGINAS a cidade tem (ver `temFonte()`) ═══
--
-- Ausência de chave é lida como "TEM" — para não quebrar Betim, que não declara
-- nada. Então as chaves com `false` abaixo são obrigatórias, não decorativas:
--   paraopeba      — só municípios signatários do Acordo do Rio Paraopeba
--   citrolandia    — é um bairro de Betim
--   rotas_legadas  — `/zap-betim` e `/nota-betim`, URLs antigas só de Betim
-- `links_uteis_mg` fica `true`: as três são de Minas.
--
-- `camara_proposicoes: false` em Araçuaí e Itinga é medição, não escolha: o SAPL
-- de Araçuaí devolve 0 em `materia/materialegislativa` e a Câmara de Itinga não
-- tem módulo de proposições nenhum. Página permanentemente vazia é pior que
-- página ausente.
--
-- `legislacao_fonte` declara QUEM MANDA em `atos_oficiais` para a cidade. A
-- tabela não tem chave natural, então o único jeito de gravá-la é
-- `refresh_completo_seguro` filtrando por `id_municipio` — que APAGA TUDO da
-- cidade. Com dois coletores sem dono declarado, eles se apagam alternadamente.
-- Mesmo mecanismo de `fontes.contratos_fonte` em `etl/pncp/contratos.py`.
--
-- `vereadores_fonte` existe porque Itinga não tem fonte de câmara: os vereadores
-- vêm do TSE (`etl.bd.tse --semear`). A tela credita a origem a partir desta
-- chave; ausência significa "site oficial da Câmara", que é o caso das três
-- cidades já no ar.
--
-- ═══ `camara_coletor` é chave de MÁQUINA; `camara_sistema` é RÓTULO DE TELA ═══
--
-- São duas chaves de propósito. `camara_sistema` já existe em produção com
-- "PROLEGIS" (Betim), "SIL" (BH) e "SPLegis" (SP), e é impressa literalmente em
-- `camara/proposicoes/page.tsx` — "direto do sistema legislativo (PROLEGIS)".
-- Reusá-la para despachar módulo faria a tela escrever "(syssolution)", em caixa
-- baixa e no registro errado. O despacho do ETL usa `camara_coletor`
-- (`sapl` | `syssolution`), e ausência dela significa "esta cidade não tem
-- módulo de câmara" — que é o caso de Itinga.
--
-- `legislatura.ordinal` só existe onde foi CONFIRMADO na fonte. Araçuaí está
-- na 24ª: veio de `/api/parlamentares/legislatura/` do próprio SAPL, que
-- devolve `{"numero": 24, "data_inicio": "2025-01-01", "data_fim":
-- "2028-12-31"}`. Itinga e Diamantina ficam sem, e aí `rotuloLegislatura()`
-- degrada para "Legislatura atual (2025-2028)" — que é o que se pode afirmar
-- sem inventar número. A numeração é POR CASA: copiar o 24 de Araçuaí para as
-- vizinhas seria errado e ninguém notaria.
--
-- `estado_municipios_count` alimenta o ranking do PNTP/ATRICON: MG tem 853
-- municípios (conferido na mesma listagem do IBGE usada acima).
--
-- ═══ ATENÇÃO: `ativo = true` PUBLICA SOZINHO ═══
--
-- `rebuild.yml` roda `cron: "0 12 * * 1"`. Com estas linhas no banco, as três
-- cidades entram no ar no próximo rebuild de segunda-feira, sem ninguém rodar
-- deploy. Foi decidido assim — mas é um prazo: o que não estiver carregado até lá
-- publica vazio. Para segurar, troque para `false` e ligue depois com um
-- `update`; o ETL popula igual, porque `carregar_municipio()` nem lê esta coluna.

insert into municipios (
  id_municipio, nome, uf, cnpj_prefeitura, lat, lng, dominio, branding, fontes, ativo
) values
(
  '3103405', 'Araçuaí', 'MG', '17963083000117', -16.8484, -42.0662,
  'controlepopular.br/aracuai',
  '{"nome_portal": "Controle Popular Araçuaí"}'::jsonb,
  '{
     "cnpj_camara": "26201996000197",
     "datasus_6dig": "310340",
     "estado_municipios_count": 853,
     "camara_host": "https://sapl.aracuai.mg.leg.br/",
     "camara_coletor": "sapl",
     "camara_sistema": "SAPL",
     "camara_cadeiras": 11,
     "camara_proposicoes": false,
     "vereadores_fonte": "sapl",
     "legislacao_fonte": "camara_sapl",
     "legislacao_municipal_host": "https://sapl.aracuai.mg.leg.br/",
     "legislatura": {"ordinal": 24, "inicio": 2025, "fim": 2028},
     "prefeitura_host": "https://www.aracuai.mg.gov.br/",
     "diario_oficial": "https://www.diariomunicipal.com.br/amm-mg/",
     "paraopeba": false,
     "citrolandia": false,
     "links_uteis_mg": true,
     "rotas_legadas": false
   }'::jsonb,
  true
),
(
  '3134004', 'Itinga', 'MG', '18348748000145', -16.6067, -41.7702,
  'controlepopular.br/itinga',
  '{"nome_portal": "Controle Popular Itinga"}'::jsonb,
  '{
     "cnpj_camara": "26222059000118",
     "datasus_6dig": "313400",
     "estado_municipios_count": 853,
     "camara_host": "https://www.camaraitinga.mg.gov.br/",
     "camara_cadeiras": 11,
     "camara_proposicoes": false,
     "vereadores_fonte": "tse",
     "legislatura": {"inicio": 2025, "fim": 2028},
     "prefeitura_host": "https://www.itinga.mg.gov.br/",
     "paraopeba": false,
     "citrolandia": false,
     "links_uteis_mg": true,
     "rotas_legadas": false
   }'::jsonb,
  true
),
(
  '3121605', 'Diamantina', 'MG', '17754136000190', -18.2441, -43.6006,
  'controlepopular.br/diamantina',
  '{"nome_portal": "Controle Popular Diamantina"}'::jsonb,
  '{
     "cnpj_camara": "20209557000144",
     "datasus_6dig": "312160",
     "estado_municipios_count": 853,
     "camara_host": "https://cmdiamantina.mg.gov.br/",
     "camara_coletor": "syssolution",
     "camara_sistema": "SysSolution",
     "camara_cadeiras": 13,
     "vereadores_fonte": "syssolution",
     "legislacao_fonte": "camara_syssolution",
     "legislacao_municipal_host": "https://cmdiamantina.mg.gov.br/",
     "legislatura": {"inicio": 2025, "fim": 2028},
     "prefeitura_host": "https://www.diamantina.mg.gov.br/",
     "diario_oficial": "https://www.diariomunicipal.com.br/amm-mg/",
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
  -- `fontes` recebe MERGE, não substituição: o ETL de descoberta grava chaves
  -- aqui (`cnpjs_orgao` do PNCP, `syssolution_pagina_tam`) e um re-run desta
  -- migration não pode apagá-las.
  fontes = coalesce(municipios.fontes, '{}'::jsonb) || excluded.fontes,
  ativo = excluded.ativo;

-- As três cidades já no ar não declaram `camara_proposicoes` nem
-- `vereadores_fonte`, e não precisam: `temFonte()` lê ausência como "tem", e a
-- ausência de `vereadores_fonte` significa "site oficial da Câmara" — que é
-- exatamente o caso de Betim, BH e São Paulo. Nada a retro-preencher aqui.
