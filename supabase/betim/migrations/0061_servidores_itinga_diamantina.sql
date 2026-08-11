-- Promove Itinga e Diamantina de "fornecedor mapeado, sem coletor" (migration
-- 0052) para "fornecedor confirmado ao vivo, com coletor" — consumido por
-- `etl/betim/etl/prefeitura/cidadesmg.py` e `etl/betim/etl/prefeitura/portaltransp.py`.
--
-- ═══ O QUE MUDOU DESDE A 0052 ═══
--
-- A 0052 registrou Itinga como CidadesMG e Diamantina como "PortalTransp,
-- mesmo fornecedor de Araçuaí" — mas SEM a chave `_sistema`, de propósito,
-- porque nenhum coletor existia ainda para nenhuma das duas.
--
-- Confirmado ao vivo em 2026-08-11:
--   Itinga:     CidadesMG bateu. Segue em cidadesmg.com.br/portaltransparencia,
--               cidade identificada por `?Param=Itinga` (fornecedor é
--               multi-tenant por query string, não por subdominio — ver
--               cabeçalho de `cidadesmg.py`).
--   Diamantina: "mesmo fornecedor de Araçuaí" NÃO bateu. O link "Remuneração"
--               do portal oficial (diamantina.mg.gov.br/portal/transparencia)
--               aponta para `portaltransp.com.br` — um WordPress + PHP
--               próprio, nada a ver com o ASP.NET/DevExpress do PortalTP de
--               Araçuaí (`portaltp.com.br`, outro domínio, outra stack).
--               Nomes parecidos, fornecedores diferentes; daí o sistema
--               virar 'portaltransp' (não 'portaltp') e ganhar módulo
--               próprio. `prefeitura_transparencia_host` troca do site da
--               prefeitura (0052) para o host real que serve o dado — mesma
--               convenção dos outros coletores (host = o que o coletor de
--               fato acessa); o site da prefeitura continua no ar, só não é
--               fonte de dado nenhum, é página de links.
--               `prefeitura_transparencia_param='pdmt'` é o código que o
--               próprio portal usa para selecionar a prefeitura de
--               Diamantina dentro do fornecedor (visto no link
--               `?data=pdmt&valuable=2026` do menu "Cargo ou Função" etc.) —
--               o mesmo papel que `Param=Itinga` cumpre no CidadesMG, nome
--               de parâmetro diferente por fornecedor.
update municipios
   set fontes = coalesce(fontes, '{}'::jsonb) || jsonb_build_object(
         'prefeitura_transparencia_sistema', 'cidadesmg',
         'prefeitura_transparencia_host', 'https://cidadesmg.com.br/portaltransparencia',
         'prefeitura_transparencia_param', 'Itinga'
       )
 where id_municipio = '3134004';

update municipios
   set fontes = coalesce(fontes, '{}'::jsonb) || jsonb_build_object(
         'prefeitura_transparencia_sistema', 'portaltransp',
         'prefeitura_transparencia_host', 'https://portaltransp.com.br',
         'prefeitura_transparencia_param', 'pdmt'
       )
 where id_municipio = '3121605';
