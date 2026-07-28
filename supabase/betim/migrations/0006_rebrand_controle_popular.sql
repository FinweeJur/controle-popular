-- Controle Popular — rebrand from "Betim.ai" (own domain per city) to
-- "Controle Popular" (one domain, one path per city: controlepopular.br/betim).
-- 0001_schema.sql seeded dominio='betim.ai' / branding.nome_portal='Betim.ai';
-- this updates that existing row rather than editing the already-applied
-- migration file.
update municipios
set
  dominio = 'controlepopular.br/betim',
  branding = jsonb_set(branding, '{nome_portal}', '"Controle Popular Betim"')
where id_municipio = '3106705';
