-- Migration 0082: Semeia as 27 Capitais de Estado do Brasil no eixo Cidades.
--
-- Renumerada de 0061 (colidia com 0061_servidores_itinga_diamantina.sql).
-- Códigos IBGE de 7 dígitos e 6 dígitos conferidos via API do IBGE.
-- CNPJs conferidos no PNCP / Diretório do Interlegis.
--
-- Fontes regionais de MG ("paraopeba", "citrolandia", "links_uteis_mg", "rotas_legadas")
-- são explicitamente desligadas (false) para todos os municípios fora de MG.
-- Belo Horizonte e São Paulo já existem (seed 0027), por isso 25 linhas aqui.

INSERT INTO municipios (
  id_municipio, nome, uf, cnpj_prefeitura, lat, lng, dominio, branding, fontes, ativo
) VALUES
-- Região Norte
('1200401', 'Rio Branco', 'AC', '04034484000140', -9.9749, -67.8243, 'controlepopular.br/riobranco', '{"nome_portal": "Controle Popular Rio Branco"}'::jsonb, '{
  "datasus_6dig": "120040", "estado_municipios_count": 22, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.riobranco.ac.leg.br/", "prefeitura_host": "https://riobranco.ac.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('1600303', 'Macapá', 'AP', '05995766000180', 0.0389, -51.0664, 'controlepopular.br/macapa', '{"nome_portal": "Controle Popular Macapá"}'::jsonb, '{
  "datasus_6dig": "160030", "estado_municipios_count": 16, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.macapa.ap.leg.br/", "prefeitura_host": "https://macapa.ap.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('1302603', 'Manaus', 'AM', '04312677000112', -3.1190, -60.0217, 'controlepopular.br/manaus', '{"nome_portal": "Controle Popular Manaus"}'::jsonb, '{
  "datasus_6dig": "130260", "estado_municipios_count": 62, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.cmm.am.gov.br/", "prefeitura_host": "https://manaus.am.gov.br/", "prefeitura_dados_abertos_api": "ckan", "prefeitura_dados_abertos_host": "https://dados.manaus.am.gov.br/api/3/action/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('1501402', 'Belém', 'PA', '05055009000113', -1.4558, -48.4902, 'controlepopular.br/belem', '{"nome_portal": "Controle Popular Belém"}'::jsonb, '{
  "datasus_6dig": "150140", "estado_municipios_count": 144, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.belem.pa.leg.br/", "prefeitura_host": "https://belem.pa.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('1100205', 'Porto Velho', 'RO', '04273099000101', -8.7619, -63.9039, 'controlepopular.br/portovelho', '{"nome_portal": "Controle Popular Porto Velho"}'::jsonb, '{
  "datasus_6dig": "110020", "estado_municipios_count": 52, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.portovelho.ro.leg.br/", "prefeitura_host": "https://portovelho.ro.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('1400100', 'Boa Vista', 'RR', '05943030000130', 2.8235, -60.6758, 'controlepopular.br/boavista', '{"nome_portal": "Controle Popular Boa Vista"}'::jsonb, '{
  "datasus_6dig": "140010", "estado_municipios_count": 15, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.boavista.rr.leg.br/", "prefeitura_host": "https://boavista.rr.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('1721000', 'Palmas', 'TO', '24851511000185', -10.1844, -48.3336, 'controlepopular.br/palmas', '{"nome_portal": "Controle Popular Palmas"}'::jsonb, '{
  "datasus_6dig": "172100", "estado_municipios_count": 139, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.palmas.to.leg.br/", "prefeitura_host": "https://palmas.to.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

-- Região Nordeste
('2704302', 'Maceió', 'AL', '12200135000180', -9.6658, -35.7353, 'controlepopular.br/maceio', '{"nome_portal": "Controle Popular Maceió"}'::jsonb, '{
  "datasus_6dig": "270430", "estado_municipios_count": 102, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.maceio.al.leg.br/", "prefeitura_host": "https://maceio.al.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('2927408', 'Salvador', 'BA', '13927801000149', -12.9777, -38.5016, 'controlepopular.br/salvador', '{"nome_portal": "Controle Popular Salvador"}'::jsonb, '{
  "datasus_6dig": "292740", "estado_municipios_count": 417, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.salvador.ba.leg.br/", "prefeitura_host": "https://salvador.ba.gov.br/", "prefeitura_dados_abertos_api": "ckan", "prefeitura_dados_abertos_host": "https://dados.salvador.ba.gov.br/api/3/action/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('2304400', 'Fortaleza', 'CE', '07954605000160', -3.7319, -38.5267, 'controlepopular.br/fortaleza', '{"nome_portal": "Controle Popular Fortaleza"}'::jsonb, '{
  "datasus_6dig": "230440", "estado_municipios_count": 184, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.cmfor.ce.gov.br/", "prefeitura_host": "https://fortaleza.ce.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('2111300', 'São Luís', 'MA', '06307102000130', -2.5391, -44.2829, 'controlepopular.br/saoluis', '{"nome_portal": "Controle Popular São Luís"}'::jsonb, '{
  "datasus_6dig": "211130", "estado_municipios_count": 217, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.saoluis.ma.leg.br/", "prefeitura_host": "https://saoluis.ma.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('2507507', 'João Pessoa', 'PB', '08778326000134', -7.1195, -34.8450, 'controlepopular.br/joaopessoa', '{"nome_portal": "Controle Popular João Pessoa"}'::jsonb, '{
  "datasus_6dig": "250750", "estado_municipios_count": 223, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.joaopessoa.pb.leg.br/", "prefeitura_host": "https://joaopessoa.pb.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('2611606', 'Recife', 'PE', '10565000000192', -8.0476, -34.8770, 'controlepopular.br/recife', '{"nome_portal": "Controle Popular Recife"}'::jsonb, '{
  "datasus_6dig": "261160", "estado_municipios_count": 185, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.recife.pe.leg.br/", "prefeitura_host": "https://recife.pe.gov.br/", "prefeitura_dados_abertos_api": "ckan", "prefeitura_dados_abertos_host": "http://dados.recife.pe.gov.br/api/3/action/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('2211001', 'Teresina', 'PI', '06554869000150', -5.0920, -42.8038, 'controlepopular.br/teresina', '{"nome_portal": "Controle Popular Teresina"}'::jsonb, '{
  "datasus_6dig": "221100", "estado_municipios_count": 224, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.teresina.pi.leg.br/", "prefeitura_host": "https://teresina.pi.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('2408102', 'Natal', 'RN', '08241747000143', -5.7945, -35.2110, 'controlepopular.br/natal', '{"nome_portal": "Controle Popular Natal"}'::jsonb, '{
  "datasus_6dig": "240810", "estado_municipios_count": 167, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.natal.rn.leg.br/", "prefeitura_host": "https://natal.rn.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('2800308', 'Aracaju', 'SE', '13128780000152', -10.9472, -37.0731, 'controlepopular.br/aracaju', '{"nome_portal": "Controle Popular Aracaju"}'::jsonb, '{
  "datasus_6dig": "280030", "estado_municipios_count": 75, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.aracaju.se.leg.br/", "prefeitura_host": "https://aracaju.se.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

-- Região Centro-Oeste
('5300108', 'Brasília', 'DF', '00394601000100', -15.7975, -47.8919, 'controlepopular.br/brasilia', '{"nome_portal": "Controle Popular Brasília"}'::jsonb, '{
  "datasus_6dig": "530010", "estado_municipios_count": 1, "camara_sistema": "SPLegis", "camara_host": "https://www.cl.df.gov.br/", "prefeitura_host": "https://df.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('5208707', 'Goiânia', 'GO', '01612092000123', -16.6869, -49.2648, 'controlepopular.br/goiania', '{"nome_portal": "Controle Popular Goiânia"}'::jsonb, '{
  "datasus_6dig": "520870", "estado_municipios_count": 246, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.goiania.go.leg.br/", "prefeitura_host": "https://goiania.go.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('5103403', 'Cuiabá', 'MT', '03507530000194', -15.6014, -56.0979, 'controlepopular.br/cuiaba', '{"nome_portal": "Controle Popular Cuiabá"}'::jsonb, '{
  "datasus_6dig": "510340", "estado_municipios_count": 142, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.cuiaba.mt.leg.br/", "prefeitura_host": "https://cuiaba.mt.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('5002704', 'Campo Grande', 'MS', '03501509000106', -20.4697, -54.6201, 'controlepopular.br/campogrande', '{"nome_portal": "Controle Popular Campo Grande"}'::jsonb, '{
  "datasus_6dig": "500270", "estado_municipios_count": 79, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.campogrande.ms.leg.br/", "prefeitura_host": "https://campogrande.ms.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

-- Região Sudeste
('3205309', 'Vitória', 'ES', '27142058000126', -20.3155, -40.3128, 'controlepopular.br/vitoria', '{"nome_portal": "Controle Popular Vitória"}'::jsonb, '{
  "datasus_6dig": "320530", "estado_municipios_count": 78, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.vitoria.es.leg.br/", "prefeitura_host": "https://vitoria.es.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('3304557', 'Rio de Janeiro', 'RJ', '42498733000148', -22.9068, -43.1729, 'controlepopular.br/rio', '{"branding": {"slug": "rio"}, "nome_portal": "Controle Popular Rio de Janeiro"}'::jsonb, '{
  "datasus_6dig": "330455", "estado_municipios_count": 92, "camara_sistema": "SPLegis", "camara_host": "https://www.camara.rio/", "prefeitura_host": "https://rio.rj.gov.br/", "prefeitura_dados_abertos_api": "ckan", "prefeitura_dados_abertos_host": "https://dados.rio/api/3/action/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

-- Região Sul
('4106902', 'Curitiba', 'PR', '76417005000186', -25.4284, -49.2733, 'controlepopular.br/curitiba', '{"nome_portal": "Controle Popular Curitiba"}'::jsonb, '{
  "datasus_6dig": "410690", "estado_municipios_count": 399, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.curitiba.pr.leg.br/", "prefeitura_host": "https://curitiba.pr.gov.br/", "prefeitura_dados_abertos_api": "ckan", "prefeitura_dados_abertos_host": "https://dadosabertos.curitiba.pr.gov.br/api/3/action/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('4314902', 'Porto Alegre', 'RS', '92963560000160', -30.0346, -51.2177, 'controlepopular.br/portoalegre', '{"nome_portal": "Controle Popular Porto Alegre"}'::jsonb, '{
  "datasus_6dig": "431490", "estado_municipios_count": 497, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.portoalegre.rs.leg.br/", "prefeitura_host": "https://portoalegre.rs.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false),

('4205407', 'Florianópolis', 'SC', '82892508000190', -27.5954, -48.5480, 'controlepopular.br/florianopolis', '{"nome_portal": "Controle Popular Florianópolis"}'::jsonb, '{
  "datasus_6dig": "420540", "estado_municipios_count": 295, "camara_sistema": "SAPL", "camara_coletor": "sapl", "camara_host": "https://sapl.florianopolis.sc.leg.br/", "prefeitura_host": "https://pmf.sc.gov.br/", "paraopeba": false, "citrolandia": false, "links_uteis_mg": false, "rotas_legadas": false
}'::jsonb, false)

ON CONFLICT (id_municipio) DO UPDATE SET
  nome = EXCLUDED.nome,
  uf = EXCLUDED.uf,
  cnpj_prefeitura = EXCLUDED.cnpj_prefeitura,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  dominio = EXCLUDED.dominio,
  branding = EXCLUDED.branding,
  fontes = EXCLUDED.fontes;
