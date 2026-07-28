-- Seed de tribunais e cadeiras — GERADO por etl/seed_tribunais.py
-- a partir de regras/regras.json versão 1.0.0. NÃO editar à mão.
-- Rode depois de 0001 e 0002.

set search_path = judiciario, public, extensions;

insert into tribunais (id, ramo, instancia, esfera, nome, sigla, n_cadeiras, autoridade_nomeante, exige_sabatina_senado, base_legal) values
  ('stf', 'constitucional', 'superior', 'federal', 'Supremo Tribunal Federal', 'STF', 11, 'presidente_republica', true, 'CF art. 101'),
  ('stj', 'superior', 'superior', 'federal', 'Superior Tribunal de Justiça', 'STJ', 33, 'presidente_republica', true, 'CF art. 104, parágrafo único'),
  ('tst', 'trabalho', 'superior', 'federal', 'Tribunal Superior do Trabalho', 'TST', 27, 'presidente_republica', true, 'CF art. 111-A'),
  ('stm', 'militar', 'superior', 'federal', 'Superior Tribunal Militar', 'STM', 15, 'presidente_republica', true, 'CF art. 123'),
  ('tse', 'eleitoral', 'superior', 'federal', 'Tribunal Superior Eleitoral', 'TSE', 7, 'eletiva', false, 'CF arts. 119 e 121, §2º')
on conflict (id) do update set
  n_cadeiras = excluded.n_cadeiras, base_legal = excluded.base_legal,
  nome = excluded.nome;

-- Cadeiras: N por tribunal, numeradas, com a cota da régua.
-- Idempotente por (tribunal_id, numero).

-- STF · Supremo Tribunal Federal (11 cadeiras)
insert into cadeiras (tribunal_id, numero, cota) values
  ('stf', 1, 'livre'),
  ('stf', 2, 'livre'),
  ('stf', 3, 'livre'),
  ('stf', 4, 'livre'),
  ('stf', 5, 'livre'),
  ('stf', 6, 'livre'),
  ('stf', 7, 'livre'),
  ('stf', 8, 'livre'),
  ('stf', 9, 'livre'),
  ('stf', 10, 'livre'),
  ('stf', 11, 'livre')
on conflict (tribunal_id, numero) do update set cota = excluded.cota;

-- STJ · Superior Tribunal de Justiça (33 cadeiras)
insert into cadeiras (tribunal_id, numero, cota) values
  ('stj', 1, 'terco_trf'),
  ('stj', 2, 'terco_trf'),
  ('stj', 3, 'terco_trf'),
  ('stj', 4, 'terco_trf'),
  ('stj', 5, 'terco_trf'),
  ('stj', 6, 'terco_trf'),
  ('stj', 7, 'terco_trf'),
  ('stj', 8, 'terco_trf'),
  ('stj', 9, 'terco_trf'),
  ('stj', 10, 'terco_trf'),
  ('stj', 11, 'terco_trf'),
  ('stj', 12, 'terco_tj'),
  ('stj', 13, 'terco_tj'),
  ('stj', 14, 'terco_tj'),
  ('stj', 15, 'terco_tj'),
  ('stj', 16, 'terco_tj'),
  ('stj', 17, 'terco_tj'),
  ('stj', 18, 'terco_tj'),
  ('stj', 19, 'terco_tj'),
  ('stj', 20, 'terco_tj'),
  ('stj', 21, 'terco_tj'),
  ('stj', 22, 'terco_tj'),
  ('stj', 23, 'terco_oab'),
  ('stj', 24, 'terco_oab'),
  ('stj', 25, 'terco_oab'),
  ('stj', 26, 'terco_oab'),
  ('stj', 27, 'terco_oab'),
  ('stj', 28, 'terco_oab'),
  ('stj', 29, 'terco_mp'),
  ('stj', 30, 'terco_mp'),
  ('stj', 31, 'terco_mp'),
  ('stj', 32, 'terco_mp'),
  ('stj', 33, 'terco_mp')
on conflict (tribunal_id, numero) do update set cota = excluded.cota;

-- TST · Tribunal Superior do Trabalho (27 cadeiras)
insert into cadeiras (tribunal_id, numero, cota) values
  ('tst', 1, 'quinto_oab_mpt'),
  ('tst', 2, 'quinto_oab_mpt'),
  ('tst', 3, 'quinto_oab_mpt'),
  ('tst', 4, 'quinto_oab_mpt'),
  ('tst', 5, 'quinto_oab_mpt'),
  ('tst', 6, 'carreira_trt'),
  ('tst', 7, 'carreira_trt'),
  ('tst', 8, 'carreira_trt'),
  ('tst', 9, 'carreira_trt'),
  ('tst', 10, 'carreira_trt'),
  ('tst', 11, 'carreira_trt'),
  ('tst', 12, 'carreira_trt'),
  ('tst', 13, 'carreira_trt'),
  ('tst', 14, 'carreira_trt'),
  ('tst', 15, 'carreira_trt'),
  ('tst', 16, 'carreira_trt'),
  ('tst', 17, 'carreira_trt'),
  ('tst', 18, 'carreira_trt'),
  ('tst', 19, 'carreira_trt'),
  ('tst', 20, 'carreira_trt'),
  ('tst', 21, 'carreira_trt'),
  ('tst', 22, 'carreira_trt'),
  ('tst', 23, 'carreira_trt'),
  ('tst', 24, 'carreira_trt'),
  ('tst', 25, 'carreira_trt'),
  ('tst', 26, 'carreira_trt'),
  ('tst', 27, 'carreira_trt')
on conflict (tribunal_id, numero) do update set cota = excluded.cota;

-- STM · Superior Tribunal Militar (15 cadeiras)
insert into cadeiras (tribunal_id, numero, cota) values
  ('stm', 1, 'militar_marinha'),
  ('stm', 2, 'militar_marinha'),
  ('stm', 3, 'militar_marinha'),
  ('stm', 4, 'militar_exercito'),
  ('stm', 5, 'militar_exercito'),
  ('stm', 6, 'militar_exercito'),
  ('stm', 7, 'militar_exercito'),
  ('stm', 8, 'militar_aeronautica'),
  ('stm', 9, 'militar_aeronautica'),
  ('stm', 10, 'militar_aeronautica'),
  ('stm', 11, 'civil_stm'),
  ('stm', 12, 'civil_stm'),
  ('stm', 13, 'civil_stm'),
  ('stm', 14, 'civil_stm'),
  ('stm', 15, 'civil_stm')
on conflict (tribunal_id, numero) do update set cota = excluded.cota;

-- TSE · Tribunal Superior Eleitoral (7 cadeiras)
insert into cadeiras (tribunal_id, numero, cota) values
  ('tse', 1, 'eletiva_stf'),
  ('tse', 2, 'eletiva_stf'),
  ('tse', 3, 'eletiva_stf'),
  ('tse', 4, 'eletiva_stj'),
  ('tse', 5, 'eletiva_stj'),
  ('tse', 6, 'advogado_lista_stf'),
  ('tse', 7, 'advogado_lista_stf')
on conflict (tribunal_id, numero) do update set cota = excluded.cota;

-- Conferência: contagem de cadeiras por tribunal deve bater com n_cadeiras.
select t.id, t.n_cadeiras, count(c.id) as cadeiras_criadas
  from tribunais t left join cadeiras c on c.tribunal_id = t.id
  group by t.id, t.n_cadeiras order by t.id;
