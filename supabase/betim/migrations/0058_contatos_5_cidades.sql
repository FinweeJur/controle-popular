-- Replica `contatos_uteis` (só Betim tinha, 19 linhas de 0003+0035) para as
-- outras 5 cidades do eixo Cidades: Araçuaí, Belo Horizonte, Diamantina,
-- Itinga e São Paulo. Pedido do usuário 2026-08-11.
--
-- Cada telefone abaixo foi lido AO VIVO na fonte oficial citada em `fonte`
-- (site da prefeitura/câmara, ou órgão estadual quando o município não
-- publica página própria de "telefones úteis"). Nenhum número foi inventado
-- ou copiado de agregador sem marcar a ressalva — ver exceções abaixo.
--
-- ═══ POR QUE `noticias` FICOU DE FORA (as 5 cidades) ═══
--
-- A tarefa original supunha que `noticias` fosse um feed de assessoria de
-- imprensa da prefeitura, raspável por RSS/HTML. MEDINDO o que já está no
-- banco (7 linhas, todas de Betim): não é isso. A 0021_noticias.sql já
-- registra a decisão de formato — "redação própria (texto HTML autoral, não
-- RSS agregado de fontes externas)". Das 7 linhas de Betim, 4 são `achado`
-- (investigação própria sobre dado já carregado: ranking de transparência,
-- fornecedor sancionado no CEIS, mínimos constitucionais, vintage do IDH) e
-- 3 são `curadoria` sobre o desastre de Brumadinho/Bacia do Paraopeba —
-- tema que só se aplica a Betim (`fontes.paraopeba` é `false` nas 5 cidades
-- desta migration, ver 0027 e 0043).
--
-- Ou seja: replicar `noticias` não é um scraper para rodar — é escrever
-- achados de investigação NOVOS por cidade, o que exige apurar dado
-- específico de cada uma (CEIS, nota de transparência, mínimos
-- constitucionais já existem no banco por cidade e dariam para virar
-- `achado`, mas isso é trabalho editorial, não uma migration de seed).
-- Nenhuma das 5 prefeituras pesquisadas publica assessoria de imprensa em
-- formato raspável de forma que desse pra virar `curadoria` sem reescrever
-- o texto de outro veículo (o que a 0023 já proíbe). Por isso: zero linhas
-- de `noticias` nesta migration, e fica registrado aqui — não é ausência de
-- pesquisa, é a natureza da tabela.
--
-- ═══ EXCEÇÕES MEDIDAS (não forçadas) ═══
--
-- SAMU (192) em Itinga: a lista oficial de bases descentralizadas do
-- CIS-NORJE (consórcio que cobre o Vale do Jequitinhonha, fonte abaixo)
-- lista Araçuaí e Diamantina mas NÃO lista Itinga. Por isso Itinga não tem
-- linha de SAMU aqui — 192 continua discável nacionalmente (a chamada cai
-- na central regional mesmo sem base no município), mas "tem base local"
-- é uma alegação que não dá pra sustentar com o que foi encontrado; melhor
-- deixar de fora do que sugerir um recurso que a cidade não tem.
--
-- Câmara de Diamantina: o domínio oficial (cmdiamantina.mg.gov.br) devolveu
-- HTTP 403 pro fetch automatizado (WAF) e o domínio alternativo
-- (camaradiamantina.cam.mg.gov.br) tem certificado TLS que não bate com o
-- host. O telefone (38) 3531-1228 veio de agregador (camaramunicipal.com.br)
-- e foi cross-validado em uma segunda busca independente — não é a fonte
-- oficial da própria Câmara, e isso fica marcado no `fonte` da linha.
--
-- Guarda Municipal: só Diamantina tem ("Guarda Municipal Patrimonial",
-- achado no próprio /portal/telefones/ da prefeitura). Araçuaí não tem
-- (/a-cidade/telefones-uteis/guarda-municipal devolveu 404 ao vivo) e não
-- foi encontrada evidência de Guarda Civil/Municipal própria em Itinga —
-- cidades pequenas costumam não ter corporação própria, e "não achei" não
-- é a mesma coisa que "não existe", então nenhuma linha foi criada pra não
-- afirmar isso.
--
-- Ouvidoria como linha separada: só quando o número é DIFERENTE do central
-- da prefeitura (Diamantina tem 0800 próprio; BH e SP têm central única —
-- 156 — que atende os dois; Araçuaí e Itinga têm o mesmo número pros dois
-- casos, então uma segunda linha idêntica só duplicaria a mesma informação
-- na tela sem acrescentar nada, e por isso o nome da linha já diz
-- "central / ouvidoria").

insert into contatos_uteis (id_municipio, nome, telefone, categoria, ordem, fonte) values

-- ── Araçuaí (3103405) ──
-- Fonte primária: prefeitura publica "telefones úteis" página a página,
-- igual ao padrão que já valeu pra Betim (www.betim.mg.gov.br/portal/telefones/).
('3103405', 'Polícia Militar', '190', 'emergencia', 1, 'https://aracuai.mg.gov.br/a-cidade/telefones-uteis/policia-militar'),
('3103405', 'Corpo de Bombeiros', '193', 'emergencia', 2, 'https://aracuai.mg.gov.br/a-cidade/telefones-uteis'),
('3103405', 'SAMU', '192', 'emergencia', 3, 'https://cisnorje.saude.mg.gov.br/samu/bases-descentralizadas/'),
('3103405', 'Defesa Civil', '199', 'emergencia', 4, 'https://aracuai.mg.gov.br/a-cidade/telefones-uteis'),
('3103405', 'Prefeitura Municipal de Araçuaí (central / ouvidoria)', '(33) 3731-1570', 'prefeitura', 5, 'https://www.aracuai.mg.gov.br/ouvidoria'),
('3103405', 'Câmara Municipal de Araçuaí', '(33) 3731-1995', 'camara', 6, 'https://sapl.aracuai.mg.leg.br/'),

-- ── Itinga (3134004) ──
-- Prefeitura não publica página própria de "telefones úteis": PM e Bombeiros
-- citados pela fonte estadual (mesmo número em todo MG). SAMU deliberadamente
-- OMITIDO — ver nota acima (Itinga fora da lista de bases do CIS-NORJE).
('3134004', 'Polícia Militar', '190', 'emergencia', 1, 'https://www.policiamilitar.mg.gov.br/portal-pm/conteudo.action?conteudo=51&tipoConteudo=destaque'),
('3134004', 'Corpo de Bombeiros', '193', 'emergencia', 2, 'https://www.bombeiros.mg.gov.br/'),
('3134004', 'Prefeitura Municipal de Itinga (central / ouvidoria)', '(33) 3733-1616', 'prefeitura', 3, 'https://www.itinga.mg.gov.br/ouvidoria'),
('3134004', 'Câmara Municipal de Itinga', '(33) 99939-8726', 'camara', 4, 'https://www.camaraitinga.mg.gov.br/'),

-- ── Diamantina (3121605) ──
-- Fonte primária: mesmo padrão de "telefones úteis" página única de Betim/
-- Araçuaí. Câmara é a exceção marcada na nota acima (403 no domínio oficial).
('3121605', 'Polícia Militar', '190', 'emergencia', 1, 'https://www.diamantina.mg.gov.br/portal/telefones/'),
('3121605', 'Corpo de Bombeiros', '193', 'emergencia', 2, 'https://www.diamantina.mg.gov.br/portal/telefones/'),
('3121605', 'SAMU', '192', 'emergencia', 3, 'https://cisnorje.saude.mg.gov.br/samu/bases-descentralizadas/'),
('3121605', 'Defesa Civil de Diamantina (plantão 24h)', '(38) 99890-5871', 'emergencia', 4, 'https://www.diamantina.mg.gov.br/portal/noticias/0/3/2819/defesa-civil-informa-canais-de-acesso'),
('3121605', 'Guarda Municipal Patrimonial', '(38) 3531-6834', 'emergencia', 5, 'https://www.diamantina.mg.gov.br/portal/telefones/'),
('3121605', 'Prefeitura Municipal de Diamantina (central)', '(38) 3531-9269', 'prefeitura', 6, 'https://www.diamantina.mg.gov.br/portal/telefones/'),
('3121605', 'Ouvidoria da Prefeitura de Diamantina (0800)', '0800 101 1130', 'prefeitura', 7, 'https://www.diamantina.mg.gov.br/portal/telefones/'),
('3121605', 'Câmara Municipal de Diamantina', '(38) 3531-1228', 'camara', 8, 'https://www.camaramunicipal.com.br/sobre/camara-municipal-de-diamantina-mg (agregador — cmdiamantina.mg.gov.br bloqueou fetch automatizado com HTTP 403; numero cross-validado em segunda busca independente)'),

-- ── Belo Horizonte (3106200) ──
-- Central 156 atende prefeitura E ouvidoria (confirmado ao vivo na própria
-- página da ouvidoria) — por isso uma linha só, não duas repetidas.
('3106200', 'Polícia Militar', '190', 'emergencia', 1, 'https://www.policiamilitar.mg.gov.br/portal-pm/conteudo.action?conteudo=51&tipoConteudo=destaque'),
('3106200', 'Corpo de Bombeiros', '193', 'emergencia', 2, 'https://www.bombeiros.mg.gov.br/'),
('3106200', 'SAMU', '192', 'emergencia', 3, 'https://www.saude.mg.gov.br/samu/'),
('3106200', 'Guarda Civil Municipal de Belo Horizonte (emergência)', '153', 'emergencia', 4, 'https://prefeitura.pbh.gov.br/seguranca/perguntas-frequentes'),
('3106200', 'Prefeitura de Belo Horizonte (Central de Atendimento / Ouvidoria)', '156', 'prefeitura', 5, 'https://prefeitura.pbh.gov.br/ouvidoria/fale-com-a-ouvidoria'),
('3106200', 'Câmara Municipal de Belo Horizonte', '(31) 3555-1100', 'camara', 6, 'https://www.cmbh.mg.gov.br/'),

-- ── São Paulo (3550308) ──
-- A página da Defesa Civil municipal lista os 4 números nacionais de uma
-- vez só (190/192/193/199) — citada nas 3 primeiras linhas por ser a fonte
-- municipal, mesmo sendo números padronizados nacionalmente.
('3550308', 'Polícia Militar', '190', 'emergencia', 1, 'https://prefeitura.sp.gov.br/web/defesa_civil/w/noticias/184619'),
('3550308', 'Corpo de Bombeiros', '193', 'emergencia', 2, 'https://prefeitura.sp.gov.br/web/defesa_civil/w/noticias/184619'),
('3550308', 'SAMU', '192', 'emergencia', 3, 'https://prefeitura.sp.gov.br/web/defesa_civil/w/noticias/184619'),
('3550308', 'Defesa Civil', '199', 'emergencia', 4, 'https://prefeitura.sp.gov.br/web/defesa_civil/w/noticias/184619'),
('3550308', 'Defesa Civil de São Paulo (atendimento direto)', '(11) 3124-5157', 'emergencia', 5, 'https://prefeitura.sp.gov.br/web/defesa_civil/w/noticias/184619'),
('3550308', 'Guarda Civil Metropolitana de São Paulo (emergência)', '153', 'emergencia', 6, 'https://prefeitura.sp.gov.br/web/seguranca_urbana/w/noticias/10920'),
('3550308', 'Prefeitura de São Paulo (Central SP 156 / Ouvidoria)', '156', 'prefeitura', 7, 'https://prefeitura.sp.gov.br/web/ouvidoria/w/fale_com_a_ouvidoria/227268'),
('3550308', 'Câmara Municipal de São Paulo', '(11) 3396-4000', 'camara', 8, 'https://www.saopaulo.sp.leg.br/')

on conflict (id_municipio, nome) do update set
  telefone = excluded.telefone,
  categoria = excluded.categoria,
  ordem = excluded.ordem,
  fonte = excluded.fonte,
  updated_at = now();
