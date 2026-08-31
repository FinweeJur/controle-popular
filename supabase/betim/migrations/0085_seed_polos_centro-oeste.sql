-- Migration 0085: Semeia os 20 polos do interior da região Centro-Oeste.
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
  '5003207', 'Corumbá', 'MS', NULL, NULL, NULL,
  'controlepopular.br/corumba',
  '{"nome_portal":"Controle Popular Corumbá"}'::jsonb,
  '{"datasus_6dig":"500320","estado_municipios_count":79,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '5003702', 'Dourados', 'MS', NULL, NULL, NULL,
  'controlepopular.br/dourados',
  '{"nome_portal":"Controle Popular Dourados"}'::jsonb,
  '{"datasus_6dig":"500370","estado_municipios_count":79,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '5008305', 'Três Lagoas', 'MS', NULL, NULL, NULL,
  'controlepopular.br/tres-lagoas',
  '{"nome_portal":"Controle Popular Três Lagoas"}'::jsonb,
  '{"datasus_6dig":"500830","estado_municipios_count":79,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '5102504', 'Cáceres', 'MT', NULL, NULL, NULL,
  'controlepopular.br/caceres',
  '{"nome_portal":"Controle Popular Cáceres"}'::jsonb,
  '{"datasus_6dig":"510250","estado_municipios_count":141,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '5105259', 'Lucas do Rio Verde', 'MT', NULL, NULL, NULL,
  'controlepopular.br/lucas-do-rio-verde',
  '{"nome_portal":"Controle Popular Lucas do Rio Verde"}'::jsonb,
  '{"datasus_6dig":"510525","estado_municipios_count":141,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '5107602', 'Rondonópolis', 'MT', NULL, NULL, NULL,
  'controlepopular.br/rondonopolis',
  '{"nome_portal":"Controle Popular Rondonópolis"}'::jsonb,
  '{"datasus_6dig":"510760","estado_municipios_count":141,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '5107909', 'Sinop', 'MT', NULL, NULL, NULL,
  'controlepopular.br/sinop',
  '{"nome_portal":"Controle Popular Sinop"}'::jsonb,
  '{"datasus_6dig":"510790","estado_municipios_count":141,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '5107958', 'Tangará da Serra', 'MT', NULL, NULL, NULL,
  'controlepopular.br/tangara-da-serra',
  '{"nome_portal":"Controle Popular Tangará da Serra"}'::jsonb,
  '{"datasus_6dig":"510795","estado_municipios_count":141,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '5108402', 'Várzea Grande', 'MT', NULL, NULL, NULL,
  'controlepopular.br/varzea-grande',
  '{"nome_portal":"Controle Popular Várzea Grande"}'::jsonb,
  '{"datasus_6dig":"510840","estado_municipios_count":141,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '5200258', 'Águas Lindas de Goiás', 'GO', NULL, NULL, NULL,
  'controlepopular.br/aguas-lindas-de-goias',
  '{"nome_portal":"Controle Popular Águas Lindas de Goiás"}'::jsonb,
  '{"datasus_6dig":"520025","estado_municipios_count":246,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '5201108', 'Anápolis', 'GO', NULL, NULL, NULL,
  'controlepopular.br/anapolis',
  '{"nome_portal":"Controle Popular Anápolis"}'::jsonb,
  '{"datasus_6dig":"520110","estado_municipios_count":246,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '5201405', 'Aparecida de Goiânia', 'GO', NULL, NULL, NULL,
  'controlepopular.br/aparecida-de-goiania',
  '{"nome_portal":"Controle Popular Aparecida de Goiânia"}'::jsonb,
  '{"datasus_6dig":"520140","estado_municipios_count":246,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '5205109', 'Catalão', 'GO', NULL, NULL, NULL,
  'controlepopular.br/catalao',
  '{"nome_portal":"Controle Popular Catalão"}'::jsonb,
  '{"datasus_6dig":"520510","estado_municipios_count":246,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '5208004', 'Formosa', 'GO', NULL, NULL, NULL,
  'controlepopular.br/formosa',
  '{"nome_portal":"Controle Popular Formosa"}'::jsonb,
  '{"datasus_6dig":"520800","estado_municipios_count":246,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '5211503', 'Itumbiara', 'GO', NULL, NULL, NULL,
  'controlepopular.br/itumbiara',
  '{"nome_portal":"Controle Popular Itumbiara"}'::jsonb,
  '{"datasus_6dig":"521150","estado_municipios_count":246,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '5211909', 'Jataí', 'GO', NULL, NULL, NULL,
  'controlepopular.br/jatai',
  '{"nome_portal":"Controle Popular Jataí"}'::jsonb,
  '{"datasus_6dig":"521190","estado_municipios_count":246,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '5212501', 'Luziânia', 'GO', NULL, NULL, NULL,
  'controlepopular.br/luziania',
  '{"nome_portal":"Controle Popular Luziânia"}'::jsonb,
  '{"datasus_6dig":"521250","estado_municipios_count":246,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '5213103', 'Mineiros', 'GO', NULL, NULL, NULL,
  'controlepopular.br/mineiros',
  '{"nome_portal":"Controle Popular Mineiros"}'::jsonb,
  '{"datasus_6dig":"521310","estado_municipios_count":246,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '5218805', 'Rio Verde', 'GO', NULL, NULL, NULL,
  'controlepopular.br/rio-verde',
  '{"nome_portal":"Controle Popular Rio Verde"}'::jsonb,
  '{"datasus_6dig":"521880","estado_municipios_count":246,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '5221858', 'Valparaíso de Goiás', 'GO', NULL, NULL, NULL,
  'controlepopular.br/valparaiso-de-goias',
  '{"nome_portal":"Controle Popular Valparaíso de Goiás"}'::jsonb,
  '{"datasus_6dig":"522185","estado_municipios_count":246,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
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
