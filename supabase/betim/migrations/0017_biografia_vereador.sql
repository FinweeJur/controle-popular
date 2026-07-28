-- Biografia livre do vereador (pedido do usuário — item pendente do F6).
--
-- ACHADO QUE CORRIGE A SUPOSIÇÃO ORIGINAL: o texto "eleito para o Nº
-- mandato consecutivo com N votos" NÃO vem do TSE — investigação anterior
-- (2026-07-21) tinha ficado presa procurando um campo de biografia livre
-- em `basedosdados.br_tse_eleicoes.candidatos`, que **não existe**
-- (confirmado ao vivo 2026-07-23: o schema da tabela só tem campos
-- estruturados — instrucao, ocupacao, estado_civil, genero, raca — nenhum
-- texto livre). O texto real vive na aba "Histórico" da PRÓPRIA página do
-- vereador em www.camarabetim.mg.gov.br, que já é raspada por
-- `etl/camaras/betim.py` mas cujo parser nunca capturava esse parágrafo
-- (nem "Profissão" nem "Aniversário", que aparecem na mesma página).
alter table vereadores add column if not exists biografia text;
alter table vereadores add column if not exists profissao text;
-- "DD/MM" -- o site nunca mostra o ano de nascimento, só dia e mês.
alter table vereadores add column if not exists aniversario_dia_mes text;
