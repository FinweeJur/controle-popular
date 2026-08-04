-- `proposicoes.classe_teor` — por que esta proposição pesa menos no ranking.
--
-- O ranking de atuação (`getRankingVereadores`) somava peso só por TIPO:
-- todo Projeto de Lei valia 15, fosse ele a Política Municipal de Prevenção
-- à Violência Digital contra Crianças ou "Dá o nome de Fulano à Rua 934".
-- Medido em 2026-08-04, isso não é caso raro nem enfeite estatístico:
--
--     cidade            PLs    denominação/homenagem/data comemorativa
--     Belo Horizonte    898    110  (12%)
--     Betim             755    220  (29%)
--     São Paulo       2.184    473  (22%)
--
-- Um vereador que apresenta 40 denominações de rua aparecia à frente de um
-- que apresentou 20 projetos de política pública. O ranking mede esforço
-- legislativo; contar homenagem como política pública mede outra coisa.
--
-- POR QUE UMA COLUNA, E NÃO `temas`. `temas` já tem `homenagens_datas` e
-- seria o lugar óbvio — mas ela é deliberadamente estreita (só entra quando
-- NENHUM tema de conteúdo bate) e, principalmente, NÃO ESTÁ PREENCHIDA DE
-- FORMA COMPARÁVEL entre as cidades. Medido no mesmo dia:
--
--     alvo real x o que `temas` pega:  BH 110 -> 2 · Betim 220 -> 121 · SP 473 -> 0
--
-- (São Paulo tem `temas` nulo nas proposições; o backfill nunca rodou lá.)
-- Usar `temas` como régua puniria os vereadores de Betim e pouparia os de
-- São Paulo, por um motivo que não tem NADA a ver com o que eles fizeram.
-- Num ranking público isso não é imprecisão, é injustiça mensurável.
--
-- A classificação vem de `etl.fila_prioridade.classificar_ruido`, que já
-- existia e já foi auditada padrão a padrão contra ementa real — é a mesma
-- régua que decide o que NÃO vale gastar análise garantista. Uma régua só,
-- dois usos.
--
-- Nulo = ementa de teor normativo comum (o caso maioritário). Preenchido =
-- o slug do padrão que bateu (`denominacao`, `data_comemorativa`,
-- `honraria`, `credito_orcamentario`, `ato_de_pessoal`, `sem_ementa`).
alter table proposicoes add column if not exists classe_teor text;

-- Índice parcial: as consultas só perguntam pelas linhas CLASSIFICADAS, que
-- são a minoria (12-29%). Um índice cheio pagaria pelas ~78-88% de linhas
-- nulas sem ninguém consultá-las.
create index if not exists proposicoes_classe_teor_idx
    on proposicoes (id_municipio, classe_teor)
 where classe_teor is not null;

comment on column proposicoes.classe_teor is
  'Slug do padrao de baixo teor normativo da ementa (denominacao, data_comemorativa, honraria, credito_orcamentario, ato_de_pessoal, sem_ementa). NULL = teor normativo comum. Fonte: etl.fila_prioridade.classificar_ruido. Usado para ponderar o ranking de atuacao.';
