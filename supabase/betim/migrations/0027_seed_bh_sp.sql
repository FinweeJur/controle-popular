-- Semeia Belo Horizonte (3106200) e São Paulo (3550308) no eixo Cidades.
--
-- Ativar uma cidade é UMA LINHA nesta tabela: `app/[municipio]/layout.tsx`
-- lê `slugsDasCidades()` no `generateStaticParams`, então a rota nasce do
-- banco, não de código. Ver `lib/db/queries/municipios.ts`.
--
-- `branding.slug` é o override do slug da URL. Sem ele, `slugDoNome()`
-- derivaria "belo-horizonte" e "sao-paulo" do nome. O plano do projeto
-- (Projetos/Controle Popular BH — Executable Plan.md, §1 e §8) especifica
-- `/bh`, e a rede já foi anunciada assim; o override existe para que o
-- nome exibido continue sendo "Belo Horizonte" sem amarrá-lo à URL.
--
-- `fontes` é o que decide QUAIS PÁGINAS a cidade tem (ver `temFonte()`).
-- As chaves com `false` são páginas de Betim que não replicam:
--   paraopeba    — só municípios signatários do Acordo do Rio Paraopeba;
--                  BH não é (é a bacia de Brumadinho).
--   citrolandia  — é um bairro de Betim.
--   links_uteis_mg — links estaduais de MG; não servem a São Paulo.
--
-- CNPJs confirmados ao vivo em 2026-08-03 (BrasilAPI /api/cnpj/v1 e PNCP):
--   18715383000140 MUNICIPIO DE BELO HORIZONTE
--   17316563000196 BELO HORIZONTE CAMARA MUNICIPAL
--   46395000000139 MUNICIPIO DE SAO PAULO
--   50176288000128 SAO PAULO CAMARA MUNICIPAL
--
-- `estado_municipios_count` alimenta o ranking do PNTP/ATRICON: MG tem 853
-- municípios (mesmo de Betim) e SP tem 645.

insert into municipios (
  id_municipio, nome, uf, cnpj_prefeitura, lat, lng, dominio, branding, fontes, ativo
) values
(
  '3106200', 'Belo Horizonte', 'MG', '18715383000140', -19.9167, -43.9345,
  'controlepopular.br/bh',
  '{"nome_portal": "Controle Popular BH", "slug": "bh"}'::jsonb,
  '{
     "cnpj_camara": "17316563000196",
     "datasus_6dig": "310620",
     "estado_municipios_count": 853,
     "camara_host": "https://www.cmbh.mg.gov.br/",
     "camara_render": "html",
     "prefeitura_dados_abertos_api": "ckan",
     "prefeitura_dados_abertos_host": "https://ckan.pbh.gov.br/api/3/action/",
     "sic_prefeitura": "https://prefeitura.pbh.gov.br/e-sic",
     "diario_oficial": "https://dom-web.pbh.gov.br/",
     "paraopeba": false,
     "citrolandia": false,
     "links_uteis_mg": true,
     "rotas_legadas": false
   }'::jsonb,
  true
),
(
  '3550308', 'São Paulo', 'SP', '46395000000139', -23.5505, -46.6333,
  'controlepopular.br/sp',
  '{"nome_portal": "Controle Popular SP", "slug": "sp"}'::jsonb,
  '{
     "cnpj_camara": "50176288000128",
     "datasus_6dig": "355030",
     "estado_municipios_count": 645,
     "camara_host": "https://www.saopaulo.sp.leg.br/",
     "camara_render": "html",
     "prefeitura_dados_abertos_api": "ckan",
     "prefeitura_dados_abertos_host": "http://dados.prefeitura.sp.gov.br/api/3/action/",
     "sic_prefeitura": "https://esic.prefeitura.sp.gov.br/",
     "diario_oficial": "https://diariooficial.prefeitura.sp.gov.br/",
     "paraopeba": false,
     "citrolandia": false,
     "links_uteis_mg": false,
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
  -- `fontes` recebe MERGE, não substituição: o ETL de descoberta grava
  -- chaves aqui (lista de CNPJs de órgão, ids de dataset do CKAN) e um
  -- re-run desta migration não pode apagá-las.
  fontes = coalesce(municipios.fontes, '{}'::jsonb) || excluded.fontes,
  ativo = excluded.ativo;

-- Betim ganha as mesmas chaves novas para que o código possa lê-las sem
-- `?? default` espalhado. `cnpj_camara` fica de fora aqui de propósito: o
-- scraper de Betim não usa PNCP para a Câmara (raspa o site direto), então
-- o CNPJ nunca foi verificado neste projeto — e um CNPJ errado no lugar de
-- ausente faria o ETL coletar contrato de outro ente em silêncio.
update municipios
   set fontes = coalesce(fontes, '{}'::jsonb) || '{
         "datasus_6dig": "310670",
         "paraopeba": true,
         "citrolandia": true,
         "links_uteis_mg": true,
         "rotas_legadas": true
       }'::jsonb
 where id_municipio = '3106705';
