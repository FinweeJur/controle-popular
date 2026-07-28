-- Seed de magistrados do STF — GERADO por etl/magistrados.py
-- a partir de etl/dados/magistrados-stf.json. NÃO editar à mão.
-- Rode depois de 0001, 0002 e 0003.

set search_path = judiciario, public, extensions;

insert into magistrados (slug, nome, nome_completo, data_nascimento, origem_carreira) values
  ('gilmar-mendes', 'Gilmar Mendes', 'Gilmar Ferreira Mendes', '1955-12-30', 'advocacia'),
  ('carmen-lucia', 'Cármen Lúcia', 'Cármen Lúcia Antunes Rocha', '1954-04-19', 'advocacia'),
  ('dias-toffoli', 'Dias Toffoli', 'José Antonio Dias Toffoli', '1967-11-15', 'advocacia'),
  ('luiz-fux', 'Luiz Fux', 'Luiz Fux', '1953-04-26', 'magistratura'),
  ('edson-fachin', 'Edson Fachin', 'Luiz Edson Fachin', '1958-02-08', 'advocacia'),
  ('alexandre-de-moraes', 'Alexandre de Moraes', 'Alexandre de Moraes', '1968-12-13', 'advocacia'),
  ('nunes-marques', 'Nunes Marques', 'Kassio Nunes Marques', '1972-05-16', 'magistratura'),
  ('andre-mendonca', 'André Mendonça', 'André Luiz de Almeida Mendonça', '1972-12-27', 'advocacia'),
  ('cristiano-zanin', 'Cristiano Zanin', 'Cristiano Zanin Martins', '1975-11-15', 'advocacia'),
  ('flavio-dino', 'Flávio Dino', 'Flávio Dino de Castro e Costa', '1968-04-30', 'magistratura')
on conflict (slug) do update set
  data_nascimento = excluded.data_nascimento,
  nome_completo = excluded.nome_completo, origem_carreira = excluded.origem_carreira;

-- Ocupações: liga cada ministro à sua cadeira.
insert into ocupacoes (cadeira_id, magistrado_id, data_posse)
  select c.id, mg.id, v.posse from cadeiras c, magistrados mg,
    (values
      ('gilmar-mendes', 1, '2002-06-20'),
      ('carmen-lucia', 2, '2006-06-21'),
      ('dias-toffoli', 3, '2009-10-23'),
      ('luiz-fux', 4, '2011-03-03'),
      ('edson-fachin', 5, '2015-06-16'),
      ('alexandre-de-moraes', 6, '2017-03-22'),
      ('nunes-marques', 7, '2020-11-05'),
      ('andre-mendonca', 8, '2021-12-16'),
      ('cristiano-zanin', 9, '2023-08-03'),
      ('flavio-dino', 10, '2024-02-22')
    ) as v(slug, numero, posse)
  where c.tribunal_id = 'stf' and c.numero = v.numero and mg.slug = v.slug
on conflict (cadeira_id, magistrado_id, data_posse) do nothing;

-- Nomeações históricas: alimentam o poder de indicação.
insert into nomeacoes (senado_id_externo, tribunal_id, magistrado_id, autoridade_nomeante, cargo_nomeante, data_deliberacao)
  select 'seed:stf:'||v.slug, 'stf', mg.id, v.nomeante, 'presidente_republica', v.posse
  from magistrados mg,
    (values
      ('gilmar-mendes', 'Fernando Henrique Cardoso', '2002-06-20'),
      ('carmen-lucia', 'Luiz Inácio Lula da Silva', '2006-06-21'),
      ('dias-toffoli', 'Luiz Inácio Lula da Silva', '2009-10-23'),
      ('luiz-fux', 'Dilma Rousseff', '2011-03-03'),
      ('edson-fachin', 'Dilma Rousseff', '2015-06-16'),
      ('alexandre-de-moraes', 'Michel Temer', '2017-03-22'),
      ('nunes-marques', 'Jair Bolsonaro', '2020-11-05'),
      ('andre-mendonca', 'Jair Bolsonaro', '2021-12-16'),
      ('cristiano-zanin', 'Luiz Inácio Lula da Silva', '2023-08-03'),
      ('flavio-dino', 'Luiz Inácio Lula da Silva', '2024-02-22')
    ) as v(slug, nomeante, posse)
  where mg.slug = v.slug
on conflict (senado_id_externo) do update set autoridade_nomeante = excluded.autoridade_nomeante;

-- Vaga aberta hoje (dado de produto — o app existe para mostrar isto).
insert into vagas (cadeira_id, data_abertura, motivo, fase)
  select c.id, '2025-10-18', 'aposentadoria', 'aberta'
  from cadeiras c where c.tribunal_id = 'stf' and c.numero = 11
on conflict (cadeira_id, data_abertura) do nothing;

-- Conferência: ocupantes atuais e vacância projetada (nascimento + 75).
select magistrado_nome, vacancia_projetada from vw_vacancia
  where tribunal_id = 'stf' and atual order by vacancia_projetada;
