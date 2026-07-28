-- Betim.ai — IBGE servicodados.ibge.gov.br integration
-- Adds municipality geographic boundary (Malhas API) and administrative
-- hierarchy (Localidades API) to the municipios registry. Both public,
-- no-auth, live-verified 2026-07-20 for id_municipio=3106705.
alter table municipios
  add column malha_geojson jsonb,   -- GeoJSON polygon boundary (api/v3/malhas)
  add column regiao_ibge jsonb;     -- microrregiao/mesorregiao/regiao hierarchy (api/v1/localidades)
