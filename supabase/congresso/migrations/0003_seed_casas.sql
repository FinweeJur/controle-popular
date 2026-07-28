-- Casas legislativas iniciais. Rode depois de 0001 e 0002.
--
-- Só as duas federais entram agora. Estadual (ALMG) e municipal (Câmara de
-- Betim, via PROLEGIS — já mapeado e raspado no app /betim, código
-- reaproveitável) entram em F10/F11 como linhas novas aqui, sem nenhuma
-- mudança de schema.

set search_path = congresso, public, extensions;

insert into congresso.casas (id, esfera, nome, uf, url_api, url_site) values
  ('camara', 'federal', 'Câmara dos Deputados', null,
   'https://dadosabertos.camara.leg.br/api/v2', 'https://www.camara.leg.br'),
  ('senado', 'federal', 'Senado Federal', null,
   'https://legis.senado.leg.br/dadosabertos', 'https://www.senado.leg.br')
on conflict (id) do nothing;

-- Conferência rápida: deve devolver 2 linhas. Se devolver erro de relação
-- inexistente, o 0001 não rodou inteiro ou rodou com outro search_path.
select id, esfera, nome from congresso.casas order by id;
