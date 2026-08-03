-- Renumerada de 0032 para 0036: o numero 0032 ja tinha sido usado, na mesma
-- sessao, pela migration que renomeou as colunas de ranking do PNTP. Duas
-- migrations com o mesmo prefixo rodam em ordem indefinida.
-- `municipios.fontes.obras_abertas_host` — o host do portal Obras Abertas.
--
-- POR QUE UMA CHAVE NOVA EM VEZ DE UMA CONSTANTE NO MÓDULO. As obras
-- públicas de São Paulo NÃO saem do CKAN municipal (ver a docstring de
-- `etl/psp/obras.py` para os seis datasets medidos e rejeitados): saem do
-- Obras Abertas (`obrasabertas.prefeitura.sp.gov.br`), um sistema próprio da
-- PRODAM que expõe o acervo inteiro por um export CSV
-- (`POST /Obras/DownloadCsvObras` seguido de `GET /Obras/Download`).
--
-- `fontes.prefeitura_dados_abertos_host` já existe e aponta para o CKAN — é
-- outra coisa, é outro host, e sobrescrevê-lo quebraria
-- `etl/psp/servidores.py`, que lê os dois datasets da SEGES de lá. Daí a
-- chave separada.
--
-- É a mesma regra de `fontes.diario_oficial` (usada por
-- `etl/pbh/legislacao.py`) e de `fontes.ssp_sp_id_municipio` (usada por
-- `etl/psp/crimes.py`): o que identifica a cidade na fonte externa mora no
-- BANCO, não no código. `scripts/conferir_defaults_de_cidade.py` cobra
-- exatamente isso, e sem esta linha `etl.psp.obras` aborta com mensagem em
-- vez de assumir São Paulo por omissão.
--
-- Verificado ao vivo em 2026-08-03: o export devolve 1.532 obras
-- (848 CONCLUÍDA, 681 EM ANDAMENTO, 3 SUSPENSA), CSV UTF-8 com BOM,
-- separador `;`, sem token, sem CAPTCHA e sem WAF — `requests` puro
-- responde 200 inclusive com o User-Agent padrão.
--
-- Merge (`||`), não substituição: `fontes` acumula chaves gravadas por
-- outros ETLs (a lista de CNPJs de órgão, o id interno da SSP) e esta
-- migration não pode apagá-las.

update municipios
   set fontes = coalesce(fontes, '{}'::jsonb) || jsonb_build_object(
         'obras_abertas_host', 'https://obrasabertas.prefeitura.sp.gov.br/'
       )
 where id_municipio = '3550308'
   -- Guarda de existência: re-rodar a migration não reescreve um host que
   -- alguém já tenha corrigido à mão depois de uma mudança na fonte.
   and coalesce(fontes->>'obras_abertas_host', '') = '';
