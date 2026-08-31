-- Migration 0086: Semeia os 50 polos do interior da região Sudeste.
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
  '3104007', 'Araxá', 'MG', NULL, NULL, NULL,
  'controlepopular.br/araxa',
  '{"nome_portal":"Controle Popular Araxá"}'::jsonb,
  '{"datasus_6dig":"310400","estado_municipios_count":853,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3105608', 'Barbacena', 'MG', NULL, NULL, NULL,
  'controlepopular.br/barbacena',
  '{"nome_portal":"Controle Popular Barbacena"}'::jsonb,
  '{"datasus_6dig":"310560","estado_municipios_count":853,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3118601', 'Contagem', 'MG', NULL, NULL, NULL,
  'controlepopular.br/contagem',
  '{"nome_portal":"Controle Popular Contagem"}'::jsonb,
  '{"datasus_6dig":"311860","estado_municipios_count":853,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3122306', 'Divinópolis', 'MG', NULL, NULL, NULL,
  'controlepopular.br/divinopolis',
  '{"nome_portal":"Controle Popular Divinópolis"}'::jsonb,
  '{"datasus_6dig":"312230","estado_municipios_count":853,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3127701', 'Governador Valadares', 'MG', NULL, NULL, NULL,
  'controlepopular.br/governador-valadares',
  '{"nome_portal":"Controle Popular Governador Valadares"}'::jsonb,
  '{"datasus_6dig":"312770","estado_municipios_count":853,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3131307', 'Ipatinga', 'MG', NULL, NULL, NULL,
  'controlepopular.br/ipatinga',
  '{"nome_portal":"Controle Popular Ipatinga"}'::jsonb,
  '{"datasus_6dig":"313130","estado_municipios_count":853,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3136702', 'Juiz de Fora', 'MG', NULL, NULL, NULL,
  'controlepopular.br/juiz-de-fora',
  '{"nome_portal":"Controle Popular Juiz de Fora"}'::jsonb,
  '{"datasus_6dig":"313670","estado_municipios_count":853,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3143302', 'Montes Claros', 'MG', NULL, NULL, NULL,
  'controlepopular.br/montes-claros',
  '{"nome_portal":"Controle Popular Montes Claros"}'::jsonb,
  '{"datasus_6dig":"314330","estado_municipios_count":853,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3147907', 'Passos', 'MG', NULL, NULL, NULL,
  'controlepopular.br/passos',
  '{"nome_portal":"Controle Popular Passos"}'::jsonb,
  '{"datasus_6dig":"314790","estado_municipios_count":853,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3148004', 'Patos de Minas', 'MG', NULL, NULL, NULL,
  'controlepopular.br/patos-de-minas',
  '{"nome_portal":"Controle Popular Patos de Minas"}'::jsonb,
  '{"datasus_6dig":"314800","estado_municipios_count":853,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3151800', 'Poços de Caldas', 'MG', NULL, NULL, NULL,
  'controlepopular.br/pocos-de-caldas',
  '{"nome_portal":"Controle Popular Poços de Caldas"}'::jsonb,
  '{"datasus_6dig":"315180","estado_municipios_count":853,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3152501', 'Pouso Alegre', 'MG', NULL, NULL, NULL,
  'controlepopular.br/pouso-alegre',
  '{"nome_portal":"Controle Popular Pouso Alegre"}'::jsonb,
  '{"datasus_6dig":"315250","estado_municipios_count":853,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3167202', 'Sete Lagoas', 'MG', NULL, NULL, NULL,
  'controlepopular.br/sete-lagoas',
  '{"nome_portal":"Controle Popular Sete Lagoas"}'::jsonb,
  '{"datasus_6dig":"316720","estado_municipios_count":853,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3168606', 'Teófilo Otoni', 'MG', NULL, NULL, NULL,
  'controlepopular.br/teofilo-otoni',
  '{"nome_portal":"Controle Popular Teófilo Otoni"}'::jsonb,
  '{"datasus_6dig":"316860","estado_municipios_count":853,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3170107', 'Uberaba', 'MG', NULL, NULL, NULL,
  'controlepopular.br/uberaba',
  '{"nome_portal":"Controle Popular Uberaba"}'::jsonb,
  '{"datasus_6dig":"317010","estado_municipios_count":853,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3170206', 'Uberlândia', 'MG', NULL, NULL, NULL,
  'controlepopular.br/uberlandia',
  '{"nome_portal":"Controle Popular Uberlândia"}'::jsonb,
  '{"datasus_6dig":"317020","estado_municipios_count":853,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3170701', 'Varginha', 'MG', NULL, NULL, NULL,
  'controlepopular.br/varginha',
  '{"nome_portal":"Controle Popular Varginha"}'::jsonb,
  '{"datasus_6dig":"317070","estado_municipios_count":853,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3203205', 'Linhares', 'ES', NULL, NULL, NULL,
  'controlepopular.br/linhares',
  '{"nome_portal":"Controle Popular Linhares"}'::jsonb,
  '{"datasus_6dig":"320320","estado_municipios_count":78,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3205002', 'Serra', 'ES', NULL, NULL, NULL,
  'controlepopular.br/serra',
  '{"nome_portal":"Controle Popular Serra"}'::jsonb,
  '{"datasus_6dig":"320500","estado_municipios_count":78,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3301009', 'Campos dos Goytacazes', 'RJ', NULL, NULL, NULL,
  'controlepopular.br/campos-dos-goytacazes',
  '{"nome_portal":"Controle Popular Campos dos Goytacazes"}'::jsonb,
  '{"datasus_6dig":"330100","estado_municipios_count":92,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3301702', 'Duque de Caxias', 'RJ', NULL, NULL, NULL,
  'controlepopular.br/duque-de-caxias',
  '{"nome_portal":"Controle Popular Duque de Caxias"}'::jsonb,
  '{"datasus_6dig":"330170","estado_municipios_count":92,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3302403', 'Macaé', 'RJ', NULL, NULL, NULL,
  'controlepopular.br/macae',
  '{"nome_portal":"Controle Popular Macaé"}'::jsonb,
  '{"datasus_6dig":"330240","estado_municipios_count":92,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3303302', 'Niterói', 'RJ', NULL, NULL, NULL,
  'controlepopular.br/niteroi',
  '{"nome_portal":"Controle Popular Niterói"}'::jsonb,
  '{"datasus_6dig":"330330","estado_municipios_count":92,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3303401', 'Nova Friburgo', 'RJ', NULL, NULL, NULL,
  'controlepopular.br/nova-friburgo',
  '{"nome_portal":"Controle Popular Nova Friburgo"}'::jsonb,
  '{"datasus_6dig":"330340","estado_municipios_count":92,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3303906', 'Petrópolis', 'RJ', NULL, NULL, NULL,
  'controlepopular.br/petropolis',
  '{"nome_portal":"Controle Popular Petrópolis"}'::jsonb,
  '{"datasus_6dig":"330390","estado_municipios_count":92,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3304904', 'São Gonçalo', 'RJ', NULL, NULL, NULL,
  'controlepopular.br/sao-goncalo',
  '{"nome_portal":"Controle Popular São Gonçalo"}'::jsonb,
  '{"datasus_6dig":"330490","estado_municipios_count":92,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3306305', 'Volta Redonda', 'RJ', NULL, NULL, NULL,
  'controlepopular.br/volta-redonda',
  '{"nome_portal":"Controle Popular Volta Redonda"}'::jsonb,
  '{"datasus_6dig":"330630","estado_municipios_count":92,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3503208', 'Araraquara', 'SP', NULL, NULL, NULL,
  'controlepopular.br/araraquara',
  '{"nome_portal":"Controle Popular Araraquara"}'::jsonb,
  '{"datasus_6dig":"350320","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3506003', 'Bauru', 'SP', NULL, NULL, NULL,
  'controlepopular.br/bauru',
  '{"nome_portal":"Controle Popular Bauru"}'::jsonb,
  '{"datasus_6dig":"350600","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3509502', 'Campinas', 'SP', NULL, NULL, NULL,
  'controlepopular.br/campinas',
  '{"nome_portal":"Controle Popular Campinas"}'::jsonb,
  '{"datasus_6dig":"350950","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3510609', 'Carapicuíba', 'SP', NULL, NULL, NULL,
  'controlepopular.br/carapicuiba',
  '{"nome_portal":"Controle Popular Carapicuíba"}'::jsonb,
  '{"datasus_6dig":"351060","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3513801', 'Diadema', 'SP', NULL, NULL, NULL,
  'controlepopular.br/diadema',
  '{"nome_portal":"Controle Popular Diadema"}'::jsonb,
  '{"datasus_6dig":"351380","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3516200', 'Franca', 'SP', NULL, NULL, NULL,
  'controlepopular.br/franca',
  '{"nome_portal":"Controle Popular Franca"}'::jsonb,
  '{"datasus_6dig":"351620","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3518800', 'Guarulhos', 'SP', NULL, NULL, NULL,
  'controlepopular.br/guarulhos',
  '{"nome_portal":"Controle Popular Guarulhos"}'::jsonb,
  '{"datasus_6dig":"351880","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3525904', 'Jundiaí', 'SP', NULL, NULL, NULL,
  'controlepopular.br/jundiai',
  '{"nome_portal":"Controle Popular Jundiaí"}'::jsonb,
  '{"datasus_6dig":"352590","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3526902', 'Limeira', 'SP', NULL, NULL, NULL,
  'controlepopular.br/limeira',
  '{"nome_portal":"Controle Popular Limeira"}'::jsonb,
  '{"datasus_6dig":"352690","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3529005', 'Marília', 'SP', NULL, NULL, NULL,
  'controlepopular.br/marilia',
  '{"nome_portal":"Controle Popular Marília"}'::jsonb,
  '{"datasus_6dig":"352900","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3529401', 'Mauá', 'SP', NULL, NULL, NULL,
  'controlepopular.br/maua',
  '{"nome_portal":"Controle Popular Mauá"}'::jsonb,
  '{"datasus_6dig":"352940","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3534401', 'Osasco', 'SP', NULL, NULL, NULL,
  'controlepopular.br/osasco',
  '{"nome_portal":"Controle Popular Osasco"}'::jsonb,
  '{"datasus_6dig":"353440","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3538709', 'Piracicaba', 'SP', NULL, NULL, NULL,
  'controlepopular.br/piracicaba',
  '{"nome_portal":"Controle Popular Piracicaba"}'::jsonb,
  '{"datasus_6dig":"353870","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3541406', 'Presidente Prudente', 'SP', NULL, NULL, NULL,
  'controlepopular.br/presidente-prudente',
  '{"nome_portal":"Controle Popular Presidente Prudente"}'::jsonb,
  '{"datasus_6dig":"354140","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3543402', 'Ribeirão Preto', 'SP', NULL, NULL, NULL,
  'controlepopular.br/ribeirao-preto',
  '{"nome_portal":"Controle Popular Ribeirão Preto"}'::jsonb,
  '{"datasus_6dig":"354340","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3547809', 'Santo André', 'SP', NULL, NULL, NULL,
  'controlepopular.br/santo-andre',
  '{"nome_portal":"Controle Popular Santo André"}'::jsonb,
  '{"datasus_6dig":"354780","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3548500', 'Santos', 'SP', NULL, NULL, NULL,
  'controlepopular.br/santos',
  '{"nome_portal":"Controle Popular Santos"}'::jsonb,
  '{"datasus_6dig":"354850","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3548708', 'São Bernardo do Campo', 'SP', NULL, NULL, NULL,
  'controlepopular.br/sao-bernardo-do-campo',
  '{"nome_portal":"Controle Popular São Bernardo do Campo"}'::jsonb,
  '{"datasus_6dig":"354870","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3548807', 'São Caetano do Sul', 'SP', NULL, NULL, NULL,
  'controlepopular.br/sao-caetano-do-sul',
  '{"nome_portal":"Controle Popular São Caetano do Sul"}'::jsonb,
  '{"datasus_6dig":"354880","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3549805', 'São José do Rio Preto', 'SP', NULL, NULL, NULL,
  'controlepopular.br/sao-jose-do-rio-preto',
  '{"nome_portal":"Controle Popular São José do Rio Preto"}'::jsonb,
  '{"datasus_6dig":"354980","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3549904', 'São José dos Campos', 'SP', NULL, NULL, NULL,
  'controlepopular.br/sao-jose-dos-campos',
  '{"nome_portal":"Controle Popular São José dos Campos"}'::jsonb,
  '{"datasus_6dig":"354990","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3552205', 'Sorocaba', 'SP', NULL, NULL, NULL,
  'controlepopular.br/sorocaba',
  '{"nome_portal":"Controle Popular Sorocaba"}'::jsonb,
  '{"datasus_6dig":"355220","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '3554102', 'Taubaté', 'SP', NULL, NULL, NULL,
  'controlepopular.br/taubate',
  '{"nome_portal":"Controle Popular Taubaté"}'::jsonb,
  '{"datasus_6dig":"355410","estado_municipios_count":645,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
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
