-- Seed do TSE — GERADO por etl/magistrados.py --seed-sql-tse
-- a partir de etl/dados/magistrados-tse.json. NÃO editar à mão.
-- Rode depois de 0001-0004 (magistrados do STF já semeados).

set search_path = judiciario, public, extensions;

-- Só os magistrados que NÃO vêm do STF (esses já existem via seed-stf).
insert into magistrados (slug, nome, nome_completo, data_nascimento, origem_carreira) values
  ('floriano-azevedo-marques', 'Floriano de Azevedo Marques', 'Floriano Peixoto de Azevedo Marques Neto', '1968-06-04', 'advocacia'),
  ('estela-aranha', 'Estela Aranha', 'Estela Aranha', null, 'advocacia'),
  ('naue-pinheiro-azevedo', 'Nauê Bernardo Pinheiro de Azevedo', 'Nauê Bernardo Pinheiro de Azevedo', null, 'advocacia'),
  ('antonio-carlos-ferreira', 'Antonio Carlos Ferreira', 'Antonio Carlos Ferreira', null, 'magistratura'),
  ('villas-boas-cueva', 'Villas Bôas Cueva', 'Ricardo Villas Bôas Cueva', null, 'magistratura'),
  ('sebastiao-reis-junior', 'Sebastião Reis Júnior', 'Sebastião Alves dos Reis Júnior', null, 'magistratura'),
  ('marco-aurelio-bellizze', 'Marco Aurélio Bellizze', 'Marco Aurélio Bellizze Oliveira', null, 'magistratura')
on conflict (slug) do update set
  data_nascimento = excluded.data_nascimento,
  nome_completo = excluded.nome_completo, origem_carreira = excluded.origem_carreira;

-- Mandatos (composição + direção) — todos por slug, STF ou novo.
-- v.data_inicio/v.data_fim saem da VALUES como `text` (mesmo motivo do
-- 0004_seed_stf.sql: VALUES-como-subconsulta resolve os literais pra texto,
-- não pro `unknown` que um INSERT ... VALUES direto teria) -- cast explícito
-- pra não colidir com as colunas `date`.
insert into mandatos_direcao (tribunal_id, magistrado_id, cargo, data_inicio, data_fim, biennio, eleito)
  select 'tse', mg.id, v.cargo, v.data_inicio::date, v.data_fim::date, v.biennio, true
  from magistrados mg,
    (values
  ('nunes-marques', 'efetivo_eletiva_stf', '2025-05-25', '2027-05-25', '2'),
  ('nunes-marques', 'presidente', '2025-05-25', '2027-05-25', '2'),
  ('andre-mendonca', 'efetivo_eletiva_stf', '2026-06-25', '2028-06-25', '2'),
  ('andre-mendonca', 'vice_presidente', '2026-06-25', '2028-06-25', '2'),
  ('dias-toffoli', 'efetivo_eletiva_stf', '2026-06-09', '2028-06-09', '1'),
  ('antonio-carlos-ferreira', 'efetivo_eletiva_stj', '2024-09-19', '2026-09-19', '1'),
  ('antonio-carlos-ferreira', 'corregedor_eleitoral', '2024-09-19', '2026-09-19', '1'),
  ('villas-boas-cueva', 'efetivo_eletiva_stj', '2025-12-16', '2027-12-16', '1'),
  ('floriano-azevedo-marques', 'efetivo_advogado', '2025-08-01', '2027-08-01', '2'),
  ('estela-aranha', 'efetivo_advogado', '2025-08-01', '2027-08-01', '1'),
  ('gilmar-mendes', 'substituto_eletiva_stf', null, null, '2'),
  ('cristiano-zanin', 'substituto_eletiva_stf', null, null, '1'),
  ('flavio-dino', 'substituto_eletiva_stf', null, null, '1'),
  ('sebastiao-reis-junior', 'substituto_eletiva_stj', null, null, '1'),
  ('marco-aurelio-bellizze', 'substituto_eletiva_stj', null, null, '1'),
  ('naue-pinheiro-azevedo', 'substituto_advogado', null, null, '1')
    ) as v(slug, cargo, data_inicio, data_fim, biennio)
  where mg.slug = v.slug
on conflict (tribunal_id, magistrado_id, cargo, biennio) do update set
  data_inicio = excluded.data_inicio, data_fim = excluded.data_fim;

-- Conferência: mandatos do TSE por cargo.
select md.cargo, mg.nome, md.data_inicio, md.data_fim from mandatos_direcao md
  join magistrados mg on mg.id = md.magistrado_id
  where md.tribunal_id = 'tse' order by md.cargo;
