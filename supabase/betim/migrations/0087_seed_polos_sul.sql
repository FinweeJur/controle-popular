-- Migration 0087: Semeia os 35 polos do interior da região Sul.
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
  '4101408', 'Apucarana', 'PR', NULL, NULL, NULL,
  'controlepopular.br/apucarana',
  '{"nome_portal":"Controle Popular Apucarana"}'::jsonb,
  '{"datasus_6dig":"410140","estado_municipios_count":399,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4101804', 'Araucária', 'PR', NULL, NULL, NULL,
  'controlepopular.br/araucaria',
  '{"nome_portal":"Controle Popular Araucária"}'::jsonb,
  '{"datasus_6dig":"410180","estado_municipios_count":399,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4104303', 'Campo Mourão', 'PR', NULL, NULL, NULL,
  'controlepopular.br/campo-mourao',
  '{"nome_portal":"Controle Popular Campo Mourão"}'::jsonb,
  '{"datasus_6dig":"410430","estado_municipios_count":399,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4104808', 'Cascavel', 'PR', NULL, NULL, NULL,
  'controlepopular.br/cascavel',
  '{"nome_portal":"Controle Popular Cascavel"}'::jsonb,
  '{"datasus_6dig":"410480","estado_municipios_count":399,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4108304', 'Foz do Iguaçu', 'PR', NULL, NULL, NULL,
  'controlepopular.br/foz-do-iguacu',
  '{"nome_portal":"Controle Popular Foz do Iguaçu"}'::jsonb,
  '{"datasus_6dig":"410830","estado_municipios_count":399,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4109401', 'Guarapuava', 'PR', NULL, NULL, NULL,
  'controlepopular.br/guarapuava',
  '{"nome_portal":"Controle Popular Guarapuava"}'::jsonb,
  '{"datasus_6dig":"410940","estado_municipios_count":399,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4113700', 'Londrina', 'PR', NULL, NULL, NULL,
  'controlepopular.br/londrina',
  '{"nome_portal":"Controle Popular Londrina"}'::jsonb,
  '{"datasus_6dig":"411370","estado_municipios_count":399,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4115200', 'Maringá', 'PR', NULL, NULL, NULL,
  'controlepopular.br/maringa',
  '{"nome_portal":"Controle Popular Maringá"}'::jsonb,
  '{"datasus_6dig":"411520","estado_municipios_count":399,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4118402', 'Paranavaí', 'PR', NULL, NULL, NULL,
  'controlepopular.br/paranavai',
  '{"nome_portal":"Controle Popular Paranavaí"}'::jsonb,
  '{"datasus_6dig":"411840","estado_municipios_count":399,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4119905', 'Ponta Grossa', 'PR', NULL, NULL, NULL,
  'controlepopular.br/ponta-grossa',
  '{"nome_portal":"Controle Popular Ponta Grossa"}'::jsonb,
  '{"datasus_6dig":"411990","estado_municipios_count":399,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4125506', 'São José dos Pinhais', 'PR', NULL, NULL, NULL,
  'controlepopular.br/sao-jose-dos-pinhais',
  '{"nome_portal":"Controle Popular São José dos Pinhais"}'::jsonb,
  '{"datasus_6dig":"412550","estado_municipios_count":399,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4127700', 'Toledo', 'PR', NULL, NULL, NULL,
  'controlepopular.br/toledo',
  '{"nome_portal":"Controle Popular Toledo"}'::jsonb,
  '{"datasus_6dig":"412770","estado_municipios_count":399,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4128104', 'Umuarama', 'PR', NULL, NULL, NULL,
  'controlepopular.br/umuarama',
  '{"nome_portal":"Controle Popular Umuarama"}'::jsonb,
  '{"datasus_6dig":"412810","estado_municipios_count":399,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4202008', 'Balneário Camboriú', 'SC', NULL, NULL, NULL,
  'controlepopular.br/balneario-camboriu',
  '{"nome_portal":"Controle Popular Balneário Camboriú"}'::jsonb,
  '{"datasus_6dig":"420200","estado_municipios_count":295,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4202404', 'Blumenau', 'SC', NULL, NULL, NULL,
  'controlepopular.br/blumenau',
  '{"nome_portal":"Controle Popular Blumenau"}'::jsonb,
  '{"datasus_6dig":"420240","estado_municipios_count":295,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4202909', 'Brusque', 'SC', NULL, NULL, NULL,
  'controlepopular.br/brusque',
  '{"nome_portal":"Controle Popular Brusque"}'::jsonb,
  '{"datasus_6dig":"420290","estado_municipios_count":295,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4204202', 'Chapecó', 'SC', NULL, NULL, NULL,
  'controlepopular.br/chapeco',
  '{"nome_portal":"Controle Popular Chapecó"}'::jsonb,
  '{"datasus_6dig":"420420","estado_municipios_count":295,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4204608', 'Criciúma', 'SC', NULL, NULL, NULL,
  'controlepopular.br/criciuma',
  '{"nome_portal":"Controle Popular Criciúma"}'::jsonb,
  '{"datasus_6dig":"420460","estado_municipios_count":295,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4208203', 'Itajaí', 'SC', NULL, NULL, NULL,
  'controlepopular.br/itajai',
  '{"nome_portal":"Controle Popular Itajaí"}'::jsonb,
  '{"datasus_6dig":"420820","estado_municipios_count":295,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4208906', 'Jaraguá do Sul', 'SC', NULL, NULL, NULL,
  'controlepopular.br/jaragua-do-sul',
  '{"nome_portal":"Controle Popular Jaraguá do Sul"}'::jsonb,
  '{"datasus_6dig":"420890","estado_municipios_count":295,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4209102', 'Joinville', 'SC', NULL, NULL, NULL,
  'controlepopular.br/joinville',
  '{"nome_portal":"Controle Popular Joinville"}'::jsonb,
  '{"datasus_6dig":"420910","estado_municipios_count":295,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4209300', 'Lages', 'SC', NULL, NULL, NULL,
  'controlepopular.br/lages',
  '{"nome_portal":"Controle Popular Lages"}'::jsonb,
  '{"datasus_6dig":"420930","estado_municipios_count":295,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4211900', 'Palhoça', 'SC', NULL, NULL, NULL,
  'controlepopular.br/palhoca',
  '{"nome_portal":"Controle Popular Palhoça"}'::jsonb,
  '{"datasus_6dig":"421190","estado_municipios_count":295,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4216602', 'São José', 'SC', NULL, NULL, NULL,
  'controlepopular.br/sao-jose',
  '{"nome_portal":"Controle Popular São José"}'::jsonb,
  '{"datasus_6dig":"421660","estado_municipios_count":295,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4218707', 'Tubarão', 'SC', NULL, NULL, NULL,
  'controlepopular.br/tubarao',
  '{"nome_portal":"Controle Popular Tubarão"}'::jsonb,
  '{"datasus_6dig":"421870","estado_municipios_count":295,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4304606', 'Canoas', 'RS', NULL, NULL, NULL,
  'controlepopular.br/canoas',
  '{"nome_portal":"Controle Popular Canoas"}'::jsonb,
  '{"datasus_6dig":"430460","estado_municipios_count":497,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4305108', 'Caxias do Sul', 'RS', NULL, NULL, NULL,
  'controlepopular.br/caxias-do-sul',
  '{"nome_portal":"Controle Popular Caxias do Sul"}'::jsonb,
  '{"datasus_6dig":"430510","estado_municipios_count":497,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4307005', 'Erechim', 'RS', NULL, NULL, NULL,
  'controlepopular.br/erechim',
  '{"nome_portal":"Controle Popular Erechim"}'::jsonb,
  '{"datasus_6dig":"430700","estado_municipios_count":497,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4313409', 'Novo Hamburgo', 'RS', NULL, NULL, NULL,
  'controlepopular.br/novo-hamburgo',
  '{"nome_portal":"Controle Popular Novo Hamburgo"}'::jsonb,
  '{"datasus_6dig":"431340","estado_municipios_count":497,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4314100', 'Passo Fundo', 'RS', NULL, NULL, NULL,
  'controlepopular.br/passo-fundo',
  '{"nome_portal":"Controle Popular Passo Fundo"}'::jsonb,
  '{"datasus_6dig":"431410","estado_municipios_count":497,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4314407', 'Pelotas', 'RS', NULL, NULL, NULL,
  'controlepopular.br/pelotas',
  '{"nome_portal":"Controle Popular Pelotas"}'::jsonb,
  '{"datasus_6dig":"431440","estado_municipios_count":497,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4315602', 'Rio Grande', 'RS', NULL, NULL, NULL,
  'controlepopular.br/rio-grande',
  '{"nome_portal":"Controle Popular Rio Grande"}'::jsonb,
  '{"datasus_6dig":"431560","estado_municipios_count":497,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4316808', 'Santa Cruz do Sul', 'RS', NULL, NULL, NULL,
  'controlepopular.br/santa-cruz-do-sul',
  '{"nome_portal":"Controle Popular Santa Cruz do Sul"}'::jsonb,
  '{"datasus_6dig":"431680","estado_municipios_count":497,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4316907', 'Santa Maria', 'RS', NULL, NULL, NULL,
  'controlepopular.br/santa-maria',
  '{"nome_portal":"Controle Popular Santa Maria"}'::jsonb,
  '{"datasus_6dig":"431690","estado_municipios_count":497,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
  false
),
(
  '4318705', 'São Leopoldo', 'RS', NULL, NULL, NULL,
  'controlepopular.br/sao-leopoldo',
  '{"nome_portal":"Controle Popular São Leopoldo"}'::jsonb,
  '{"datasus_6dig":"431870","estado_municipios_count":497,"paraopeba":false,"citrolandia":false,"links_uteis_mg":false,"rotas_legadas":false}'::jsonb,
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
