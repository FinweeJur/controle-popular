-- Corrige o link da Ouvidoria de Betim em `municipios.fontes` -- estava
-- apontando para uma URL que a revisão de completude de 2026-08-14
-- confirmou morta (WebFetch devolveu corpo vazio em 2026-08-13 E 2026-08-14,
-- dois dias seguidos -- deixou de ser "instabilidade pontual").
--
-- A URL antiga (`https://www.betim.mg.gov.br/portal/ouvidoria`) foi
-- confirmada viva em 2026-08-04 pelo commit `1583fa4` (migration 0040) --
-- por isso ficou fora do NAO_VERIFICADO até agora, só sinalizada como "não
-- reconfirmada". Duas checagens ao vivo consecutivas sem conteúdo é o
-- suficiente para tratar como morta, não como instabilidade.
--
-- A troca não é uma URL nova adivinhada: é outra página VIVA no MESMO
-- domínio institucional (betim.mg.gov.br), com conteúdo completo conferido
-- ao vivo em 2026-08-14 -- telefones da Ouvidoria Geral, da Ouvidoria da
-- Mulher e da Ouvidoria do SUS, endereço físico, horário de atendimento.
update municipios
   set fontes = coalesce(fontes, '{}'::jsonb)
              || jsonb_build_object(
                   'ouvidoria',
                   'https://www.betim.mg.gov.br/portal/secretarias-paginas/85/conhecendo-a-ouvidoria/'
                 )
 where id_municipio = '3106705';
