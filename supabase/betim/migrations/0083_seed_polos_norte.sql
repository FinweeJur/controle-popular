-- Migration 0083: Semeia os 22 polos do interior da região Norte.
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
  '1100049', 'Cacoal', 'RO', NULL, NULL, NULL,
  'controlepopular.br/cacoal',
  '{"nome_portal":"Controle Popular Cacoal"}'::jsonb,
  '{"datasus_6dig":"110004","estado_municipios_count":52,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1100122', 'Ji-Paraná', 'RO', NULL, NULL, NULL,
  'controlepopular.br/ji-parana',
  '{"nome_portal":"Controle Popular Ji-Paraná"}'::jsonb,
  '{"datasus_6dig":"110012","estado_municipios_count":52,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1100304', 'Vilhena', 'RO', NULL, NULL, NULL,
  'controlepopular.br/vilhena',
  '{"nome_portal":"Controle Popular Vilhena"}'::jsonb,
  '{"datasus_6dig":"110030","estado_municipios_count":52,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1200203', 'Cruzeiro do Sul', 'AC', NULL, NULL, NULL,
  'controlepopular.br/cruzeiro-do-sul',
  '{"nome_portal":"Controle Popular Cruzeiro do Sul"}'::jsonb,
  '{"datasus_6dig":"120020","estado_municipios_count":22,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1301902', 'Itacoatiara', 'AM', NULL, NULL, NULL,
  'controlepopular.br/itacoatiara',
  '{"nome_portal":"Controle Popular Itacoatiara"}'::jsonb,
  '{"datasus_6dig":"130190","estado_municipios_count":62,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1302504', 'Manacapuru', 'AM', NULL, NULL, NULL,
  'controlepopular.br/manacapuru',
  '{"nome_portal":"Controle Popular Manacapuru"}'::jsonb,
  '{"datasus_6dig":"130250","estado_municipios_count":62,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1303403', 'Parintins', 'AM', NULL, NULL, NULL,
  'controlepopular.br/parintins',
  '{"nome_portal":"Controle Popular Parintins"}'::jsonb,
  '{"datasus_6dig":"130340","estado_municipios_count":62,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1304203', 'Tefé', 'AM', NULL, NULL, NULL,
  'controlepopular.br/tefe',
  '{"nome_portal":"Controle Popular Tefé"}'::jsonb,
  '{"datasus_6dig":"130420","estado_municipios_count":62,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1500107', 'Abaetetuba', 'PA', NULL, NULL, NULL,
  'controlepopular.br/abaetetuba',
  '{"nome_portal":"Controle Popular Abaetetuba"}'::jsonb,
  '{"datasus_6dig":"150010","estado_municipios_count":144,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1500602', 'Altamira', 'PA', NULL, NULL, NULL,
  'controlepopular.br/altamira',
  '{"nome_portal":"Controle Popular Altamira"}'::jsonb,
  '{"datasus_6dig":"150060","estado_municipios_count":144,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1500800', 'Ananindeua', 'PA', NULL, NULL, NULL,
  'controlepopular.br/ananindeua',
  '{"nome_portal":"Controle Popular Ananindeua"}'::jsonb,
  '{"datasus_6dig":"150080","estado_municipios_count":144,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1502103', 'Cametá', 'PA', NULL, NULL, NULL,
  'controlepopular.br/cameta',
  '{"nome_portal":"Controle Popular Cametá"}'::jsonb,
  '{"datasus_6dig":"150210","estado_municipios_count":144,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1502400', 'Castanhal', 'PA', NULL, NULL, NULL,
  'controlepopular.br/castanhal',
  '{"nome_portal":"Controle Popular Castanhal"}'::jsonb,
  '{"datasus_6dig":"150240","estado_municipios_count":144,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1503606', 'Itaituba', 'PA', NULL, NULL, NULL,
  'controlepopular.br/itaituba',
  '{"nome_portal":"Controle Popular Itaituba"}'::jsonb,
  '{"datasus_6dig":"150360","estado_municipios_count":144,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1504208', 'Marabá', 'PA', NULL, NULL, NULL,
  'controlepopular.br/maraba',
  '{"nome_portal":"Controle Popular Marabá"}'::jsonb,
  '{"datasus_6dig":"150420","estado_municipios_count":144,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1505502', 'Paragominas', 'PA', NULL, NULL, NULL,
  'controlepopular.br/paragominas',
  '{"nome_portal":"Controle Popular Paragominas"}'::jsonb,
  '{"datasus_6dig":"150550","estado_municipios_count":144,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1506138', 'Redenção', 'PA', NULL, NULL, NULL,
  'controlepopular.br/redencao',
  '{"nome_portal":"Controle Popular Redenção"}'::jsonb,
  '{"datasus_6dig":"150613","estado_municipios_count":144,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1506807', 'Santarém', 'PA', NULL, NULL, NULL,
  'controlepopular.br/santarem',
  '{"nome_portal":"Controle Popular Santarém"}'::jsonb,
  '{"datasus_6dig":"150680","estado_municipios_count":144,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1508100', 'Tucuruí', 'PA', NULL, NULL, NULL,
  'controlepopular.br/tucurui',
  '{"nome_portal":"Controle Popular Tucuruí"}'::jsonb,
  '{"datasus_6dig":"150810","estado_municipios_count":144,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1600600', 'Santana', 'AP', NULL, NULL, NULL,
  'controlepopular.br/santana',
  '{"nome_portal":"Controle Popular Santana"}'::jsonb,
  '{"datasus_6dig":"160060","estado_municipios_count":16,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1702109', 'Araguaína', 'TO', NULL, NULL, NULL,
  'controlepopular.br/araguaina',
  '{"nome_portal":"Controle Popular Araguaína"}'::jsonb,
  '{"datasus_6dig":"170210","estado_municipios_count":139,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '1709500', 'Gurupi', 'TO', NULL, NULL, NULL,
  'controlepopular.br/gurupi',
  '{"nome_portal":"Controle Popular Gurupi"}'::jsonb,
  '{"datasus_6dig":"170950","estado_municipios_count":139,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
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
