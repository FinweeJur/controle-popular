-- Migration 0084: Semeia os 45 polos do interior da região Nordeste.
--
-- Códigos IBGE de 7 dígitos e datasus_6dig CONFERIDOS na API do IBGE
-- (inventário apps/web/data/polos-interior-ibge.json; ver
-- scripts/gerar-polos-interior.cjs). Nenhum código foi digitado à mão:
-- cada polo casa por nome normalizado + UF e ambíguo fica de fora.
--
-- ═══ PENDÊNCIAS EXPLÍCITAS (por polo, antes de ATIVAR) ═══
--   - cnpj_prefeitura é NULL de propósito: conferir no PNCP/Interlegis
--     por cidade (CNPJ errado é pior que ausente — faz o ETL coletar
--     contrato de outro ente em silêncio)
--   - camara_sistema/camara_coletor/camara_host: identificar o fornecedor
--     da câmara (SAPL? SysSolution? nenhum?) antes de escrever coletor
--   - lat/lng: conferir na fonte oficial por polo
--   - ativo = false até o ETL rodar pelo menos uma vez para a cidade
--     (runbook-cidade-nova.md, checklist resumido)
--
-- Fontes regionais de MG ("paraopeba", "citrolandia", "links_uteis_mg",
-- "rotas_legadas") são explicitamente desligadas (false): esta região não
-- é MG e ausência de chave é lida como "tem" (ver temFonte()).

INSERT INTO municipios (
  id_municipio, nome, uf, cnpj_prefeitura, lat, lng, dominio, branding, fontes, ativo
) VALUES

(
  '2105302', 'Imperatriz', 'MA', NULL, NULL, NULL,
  'controlepopular.br/imperatriz',
  '{"nome_portal":"Controle Popular Imperatriz"}'::jsonb,
  '{"datasus_6dig":"210530","estado_municipios_count":217,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2203909', 'Floriano', 'PI', NULL, NULL, NULL,
  'controlepopular.br/floriano',
  '{"nome_portal":"Controle Popular Floriano"}'::jsonb,
  '{"datasus_6dig":"220390","estado_municipios_count":224,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2207702', 'Parnaíba', 'PI', NULL, NULL, NULL,
  'controlepopular.br/parnaiba',
  '{"nome_portal":"Controle Popular Parnaíba"}'::jsonb,
  '{"datasus_6dig":"220770","estado_municipios_count":224,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2208007', 'Picos', 'PI', NULL, NULL, NULL,
  'controlepopular.br/picos',
  '{"nome_portal":"Controle Popular Picos"}'::jsonb,
  '{"datasus_6dig":"220800","estado_municipios_count":224,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2304103', 'Crateús', 'CE', NULL, NULL, NULL,
  'controlepopular.br/crateus',
  '{"nome_portal":"Controle Popular Crateús"}'::jsonb,
  '{"datasus_6dig":"230410","estado_municipios_count":184,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2304202', 'Crato', 'CE', NULL, NULL, NULL,
  'controlepopular.br/crato',
  '{"nome_portal":"Controle Popular Crato"}'::jsonb,
  '{"datasus_6dig":"230420","estado_municipios_count":184,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2305506', 'Iguatu', 'CE', NULL, NULL, NULL,
  'controlepopular.br/iguatu',
  '{"nome_portal":"Controle Popular Iguatu"}'::jsonb,
  '{"datasus_6dig":"230550","estado_municipios_count":184,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2307304', 'Juazeiro do Norte', 'CE', NULL, NULL, NULL,
  'controlepopular.br/juazeiro-do-norte',
  '{"nome_portal":"Controle Popular Juazeiro do Norte"}'::jsonb,
  '{"datasus_6dig":"230730","estado_municipios_count":184,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2311306', 'Quixadá', 'CE', NULL, NULL, NULL,
  'controlepopular.br/quixada',
  '{"nome_portal":"Controle Popular Quixadá"}'::jsonb,
  '{"datasus_6dig":"231130","estado_municipios_count":184,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2312908', 'Sobral', 'CE', NULL, NULL, NULL,
  'controlepopular.br/sobral',
  '{"nome_portal":"Controle Popular Sobral"}'::jsonb,
  '{"datasus_6dig":"231290","estado_municipios_count":184,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2402006', 'Caicó', 'RN', NULL, NULL, NULL,
  'controlepopular.br/caico',
  '{"nome_portal":"Controle Popular Caicó"}'::jsonb,
  '{"datasus_6dig":"240200","estado_municipios_count":167,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2402600', 'Ceará-Mirim', 'RN', NULL, NULL, NULL,
  'controlepopular.br/ceara-mirim',
  '{"nome_portal":"Controle Popular Ceará-Mirim"}'::jsonb,
  '{"datasus_6dig":"240260","estado_municipios_count":167,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2403103', 'Currais Novos', 'RN', NULL, NULL, NULL,
  'controlepopular.br/currais-novos',
  '{"nome_portal":"Controle Popular Currais Novos"}'::jsonb,
  '{"datasus_6dig":"240310","estado_municipios_count":167,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2407104', 'Macaíba', 'RN', NULL, NULL, NULL,
  'controlepopular.br/macaiba',
  '{"nome_portal":"Controle Popular Macaíba"}'::jsonb,
  '{"datasus_6dig":"240710","estado_municipios_count":167,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2408003', 'Mossoró', 'RN', NULL, NULL, NULL,
  'controlepopular.br/mossoro',
  '{"nome_portal":"Controle Popular Mossoró"}'::jsonb,
  '{"datasus_6dig":"240800","estado_municipios_count":167,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2409407', 'Pau dos Ferros', 'RN', NULL, NULL, NULL,
  'controlepopular.br/pau-dos-ferros',
  '{"nome_portal":"Controle Popular Pau dos Ferros"}'::jsonb,
  '{"datasus_6dig":"240940","estado_municipios_count":167,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2503704', 'Cajazeiras', 'PB', NULL, NULL, NULL,
  'controlepopular.br/cajazeiras',
  '{"nome_portal":"Controle Popular Cajazeiras"}'::jsonb,
  '{"datasus_6dig":"250370","estado_municipios_count":223,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2504009', 'Campina Grande', 'PB', NULL, NULL, NULL,
  'controlepopular.br/campina-grande',
  '{"nome_portal":"Controle Popular Campina Grande"}'::jsonb,
  '{"datasus_6dig":"250400","estado_municipios_count":223,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2506301', 'Guarabira', 'PB', NULL, NULL, NULL,
  'controlepopular.br/guarabira',
  '{"nome_portal":"Controle Popular Guarabira"}'::jsonb,
  '{"datasus_6dig":"250630","estado_municipios_count":223,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2510808', 'Patos', 'PB', NULL, NULL, NULL,
  'controlepopular.br/patos',
  '{"nome_portal":"Controle Popular Patos"}'::jsonb,
  '{"datasus_6dig":"251080","estado_municipios_count":223,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2516201', 'Sousa', 'PB', NULL, NULL, NULL,
  'controlepopular.br/sousa',
  '{"nome_portal":"Controle Popular Sousa"}'::jsonb,
  '{"datasus_6dig":"251620","estado_municipios_count":223,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2601102', 'Araripina', 'PE', NULL, NULL, NULL,
  'controlepopular.br/araripina',
  '{"nome_portal":"Controle Popular Araripina"}'::jsonb,
  '{"datasus_6dig":"260110","estado_municipios_count":185,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2604106', 'Caruaru', 'PE', NULL, NULL, NULL,
  'controlepopular.br/caruaru',
  '{"nome_portal":"Controle Popular Caruaru"}'::jsonb,
  '{"datasus_6dig":"260410","estado_municipios_count":185,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2606002', 'Garanhuns', 'PE', NULL, NULL, NULL,
  'controlepopular.br/garanhuns',
  '{"nome_portal":"Controle Popular Garanhuns"}'::jsonb,
  '{"datasus_6dig":"260600","estado_municipios_count":185,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2609907', 'Ouricuri', 'PE', NULL, NULL, NULL,
  'controlepopular.br/ouricuri',
  '{"nome_portal":"Controle Popular Ouricuri"}'::jsonb,
  '{"datasus_6dig":"260990","estado_municipios_count":185,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2610905', 'Pesqueira', 'PE', NULL, NULL, NULL,
  'controlepopular.br/pesqueira',
  '{"nome_portal":"Controle Popular Pesqueira"}'::jsonb,
  '{"datasus_6dig":"261090","estado_municipios_count":185,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2611101', 'Petrolina', 'PE', NULL, NULL, NULL,
  'controlepopular.br/petrolina',
  '{"nome_portal":"Controle Popular Petrolina"}'::jsonb,
  '{"datasus_6dig":"261110","estado_municipios_count":185,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2613909', 'Serra Talhada', 'PE', NULL, NULL, NULL,
  'controlepopular.br/serra-talhada',
  '{"nome_portal":"Controle Popular Serra Talhada"}'::jsonb,
  '{"datasus_6dig":"261390","estado_municipios_count":185,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2616407', 'Vitória de Santo Antão', 'PE', NULL, NULL, NULL,
  'controlepopular.br/vitoria-de-santo-antao',
  '{"nome_portal":"Controle Popular Vitória de Santo Antão"}'::jsonb,
  '{"datasus_6dig":"261640","estado_municipios_count":185,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2700300', 'Arapiraca', 'AL', NULL, NULL, NULL,
  'controlepopular.br/arapiraca',
  '{"nome_portal":"Controle Popular Arapiraca"}'::jsonb,
  '{"datasus_6dig":"270030","estado_municipios_count":102,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2702306', 'Coruripe', 'AL', NULL, NULL, NULL,
  'controlepopular.br/coruripe',
  '{"nome_portal":"Controle Popular Coruripe"}'::jsonb,
  '{"datasus_6dig":"270230","estado_municipios_count":102,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2706307', 'Palmeira dos Índios', 'AL', NULL, NULL, NULL,
  'controlepopular.br/palmeira-dos-indios',
  '{"nome_portal":"Controle Popular Palmeira dos Índios"}'::jsonb,
  '{"datasus_6dig":"270630","estado_municipios_count":102,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2709301', 'União dos Palmares', 'AL', NULL, NULL, NULL,
  'controlepopular.br/uniao-dos-palmares',
  '{"nome_portal":"Controle Popular União dos Palmares"}'::jsonb,
  '{"datasus_6dig":"270930","estado_municipios_count":102,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2802908', 'Itabaiana', 'SE', NULL, NULL, NULL,
  'controlepopular.br/itabaiana',
  '{"nome_portal":"Controle Popular Itabaiana"}'::jsonb,
  '{"datasus_6dig":"280290","estado_municipios_count":75,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2900702', 'Alagoinhas', 'BA', NULL, NULL, NULL,
  'controlepopular.br/alagoinhas',
  '{"nome_portal":"Controle Popular Alagoinhas"}'::jsonb,
  '{"datasus_6dig":"290070","estado_municipios_count":417,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2903201', 'Barreiras', 'BA', NULL, NULL, NULL,
  'controlepopular.br/barreiras',
  '{"nome_portal":"Controle Popular Barreiras"}'::jsonb,
  '{"datasus_6dig":"290320","estado_municipios_count":417,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2905701', 'Camaçari', 'BA', NULL, NULL, NULL,
  'controlepopular.br/camacari',
  '{"nome_portal":"Controle Popular Camaçari"}'::jsonb,
  '{"datasus_6dig":"290570","estado_municipios_count":417,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2910800', 'Feira de Santana', 'BA', NULL, NULL, NULL,
  'controlepopular.br/feira-de-santana',
  '{"nome_portal":"Controle Popular Feira de Santana"}'::jsonb,
  '{"datasus_6dig":"291080","estado_municipios_count":417,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2913606', 'Ilhéus', 'BA', NULL, NULL, NULL,
  'controlepopular.br/ilheus',
  '{"nome_portal":"Controle Popular Ilhéus"}'::jsonb,
  '{"datasus_6dig":"291360","estado_municipios_count":417,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2914802', 'Itabuna', 'BA', NULL, NULL, NULL,
  'controlepopular.br/itabuna',
  '{"nome_portal":"Controle Popular Itabuna"}'::jsonb,
  '{"datasus_6dig":"291480","estado_municipios_count":417,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2918001', 'Jequié', 'BA', NULL, NULL, NULL,
  'controlepopular.br/jequie',
  '{"nome_portal":"Controle Popular Jequié"}'::jsonb,
  '{"datasus_6dig":"291800","estado_municipios_count":417,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2918407', 'Juazeiro', 'BA', NULL, NULL, NULL,
  'controlepopular.br/juazeiro',
  '{"nome_portal":"Controle Popular Juazeiro"}'::jsonb,
  '{"datasus_6dig":"291840","estado_municipios_count":417,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2919207', 'Lauro de Freitas', 'BA', NULL, NULL, NULL,
  'controlepopular.br/lauro-de-freitas',
  '{"nome_portal":"Controle Popular Lauro de Freitas"}'::jsonb,
  '{"datasus_6dig":"291920","estado_municipios_count":417,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2924009', 'Paulo Afonso', 'BA', NULL, NULL, NULL,
  'controlepopular.br/paulo-afonso',
  '{"nome_portal":"Controle Popular Paulo Afonso"}'::jsonb,
  '{"datasus_6dig":"292400","estado_municipios_count":417,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '2933307', 'Vitória da Conquista', 'BA', NULL, NULL, NULL,
  'controlepopular.br/vitoria-da-conquista',
  '{"nome_portal":"Controle Popular Vitória da Conquista"}'::jsonb,
  '{"datasus_6dig":"293330","estado_municipios_count":417,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
)

ON CONFLICT (id_municipio) DO UPDATE SET
  nome = EXCLUDED.nome,
  uf = EXCLUDED.uf,
  cnpj_prefeitura = EXCLUDED.cnpj_prefeitura,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  dominio = EXCLUDED.dominio,
  branding = EXCLUDED.branding,
  fontes = EXCLUDED.fontes,
  ativo = EXCLUDED.ativo;
