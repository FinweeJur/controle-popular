-- Registra em `municipios.fontes` qual portal da transparência cada prefeitura
-- do Vale usa. Consumido por `etl/betim/etl/prefeitura/portaltp.py`.
--
-- ═══ POR QUE ISTO É UMA MIGRATION, E NÃO UM ARGUMENTO DE LINHA DE COMANDO ═══
--
-- É a regra que `carregar_municipio` (etl/common.py) existe para impor, escrita
-- depois do dano de 2026-08-03: módulo que aceita a cidade por `--id-municipio`
-- mas o endereço da fonte por outro argumento coleta o dado de uma cidade e o
-- grava com o id de outra, sem erro nenhum. O id tem de ser a única coisa que o
-- operador escolhe — o resto sai daqui.
--
-- ═══ O ACHADO DE 2026-08-10: SÃO TRÊS FORNECEDORES, NÃO UM ═══
--
-- O §20 registrava que `servidores` estava zerada nas três cidades do Vale e
-- que ninguém sabia qual coletor a preenchia. A resposta é que NÃO EXISTE
-- coletor genérico: folha de pagamento municipal não tem fonte federal, é um
-- portal por prefeitura. Betim tem API REST própria (`etl.prefeitura.b3106705`),
-- BH tem a da PBH, SP tem a da SEGES — e as três do Vale compraram o portal de
-- três fornecedores DIFERENTES:
--
--   Araçuaí     PortalTP       aracuai-mg.portaltp.com.br      servidores
--   Itinga      CidadesMG      cidadesmg.com.br/...?Param=Itinga  folha, diárias
--   Diamantina  PortalTransp   via diamantina.mg.gov.br/portal/transparencia
--                                                              folha, OBRAS
--
-- Os três são públicos, sem login. Só o de Araçuaí tem coletor hoje; os outros
-- dois ficam registrados abaixo para que a próxima rodada comece de um endereço
-- e não de uma busca — mas SEM a chave `_sistema`, porque é ela que o coletor
-- exige, e um coletor que não existe não deve poder ser acionado por engano.
--
-- ═══ O QUE O COLETOR NÃO LEVA, E É DECISÃO ANTERIOR A ELE ═══
--
-- Os portais expõem CPF (mascarado) e remuneração individual. A tabela
-- `servidores` é `orgao, nome, cargo, lotacao, vinculo` — não tem coluna para
-- nenhum dos dois, e é assim desde Betim. O corte de LGPD aqui não é decisão
-- nova: é a que já estava tomada, aplicada a mais uma cidade.

-- `||` e não substituição: `fontes` já carrega camara_host, cnpjs_orgao,
-- legislatura e mais uma dúzia de chaves por cidade. Sobrescrever o objeto
-- inteiro apagaria tudo isso em silêncio, e o ETL das câmaras pararia sem que
-- ninguém ligasse uma coisa à outra.
update municipios
   set fontes = coalesce(fontes, '{}'::jsonb) || jsonb_build_object(
         'prefeitura_transparencia_sistema', 'portaltp',
         'prefeitura_transparencia_host', 'https://aracuai-mg.portaltp.com.br/'
       )
 where id_municipio = '3103405';

update municipios
   set fontes = coalesce(fontes, '{}'::jsonb) || jsonb_build_object(
         -- Sem `_sistema`: mapeado, ainda sem coletor. Ver o cabeçalho.
         'prefeitura_transparencia_host',
         'https://cidadesmg.com.br/portaltransparencia/faces/user/portal.xhtml?Param=Itinga',
         'prefeitura_transparencia_fornecedor', 'cidadesmg'
       )
 where id_municipio = '3134004';

update municipios
   set fontes = coalesce(fontes, '{}'::jsonb) || jsonb_build_object(
         'prefeitura_transparencia_host', 'https://www.diamantina.mg.gov.br/portal/transparencia',
         'prefeitura_transparencia_fornecedor', 'portaltransp'
       )
 where id_municipio = '3121605';
