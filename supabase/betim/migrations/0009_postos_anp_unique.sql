-- postos_anp: `etl.apis.anp` upserts on `cnpj` (ANP registry key per retail
-- point), but 0001_schema.sql never declared it unique — add it now so
-- `on_conflict="cnpj"` in the ETL module actually works.
alter table postos_anp add constraint postos_anp_cnpj_key unique (cnpj);
