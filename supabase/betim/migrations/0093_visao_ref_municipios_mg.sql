-- 0093_visao_ref_municipios_mg.sql
-- Ponte temporária: o site PUBLICADO (main) ainda consulta `ref_municipios_mg`.
--
-- ─── A LACUNA QUE ESTA MIGRATION FECHA ───
--
-- A `0092` renomeou `ref_municipios_mg` para `ref_municipios` e acrescentou
-- `uf`. O código da branch `ambiental-sigbm-27uf` já usa o nome novo, mas o que
-- está no ar foi gerado a partir de `main`, que ainda diz `ref_municipios_mg`
-- em quatro lugares de runtime:
--
--   apps/web/lib/db/schema.ts
--   apps/web/lib/db/queries/barragens.ts        (contarBarragensMg, por município)
--   apps/web/lib/db/queries/ambiental-licenciamento.ts
--   apps/web/app/ambiental/copam/municipio/[idIbge]/page.tsx
--
-- Sem esta visão, toda consulta dessas telas falha com
-- `relation "ref_municipios_mg" does not exist` — e o erro só aparece nas
-- rotas que consultam o banco em request-time, não na home.
--
-- A visão é um recorte de MG da tabela nova, com as mesmas colunas + `uf`.
-- Leitura funciona igual; escrita também (visão simples de uma tabela é
-- auto-atualizável no Postgres), mas quem escreve é o ETL, que já usa o nome
-- novo.
--
-- QUANDO APAGAR: assim que a `ambiental-sigbm-27uf` estiver em produção.
-- Aí `drop view ref_municipios_mg;` e nada mais depende do nome antigo.

create or replace view ref_municipios_mg as
select *
  from ref_municipios
 where uf = 'MG';

comment on view ref_municipios_mg is
  'Ponte temporaria (0093): nome antigo da tabela de municipios, recorte MG. '
  'Existe so para o site publicado, que ainda consulta ref_municipios_mg. '
  'Apagar quando a branch ambiental-sigbm-27uf estiver em producao.';
