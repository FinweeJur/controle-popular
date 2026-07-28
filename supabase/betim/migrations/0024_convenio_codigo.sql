-- 0024_convenio_codigo.sql
-- #11 do review do usuário 2026-07-24: hyperlink por convênio.
-- A URL de detalhe do Portal da Transparência é
-- `portaldatransparencia.gov.br/convenios/{codigo}`, onde {codigo} é o
-- `dimConvenio.codigo` da API (ex. 702309) — NÃO o `id` da API (que a
-- gente já guarda em `id_externo`, e que a URL de detalhe rejeita).
-- Confirmado ao vivo 2026-07-24 (só /convenios/{codigo} abre o registro).
-- Guardamos o codigo pra montar o link. Depois de rodar esta migration,
-- rodar `python -m etl.apis.transparencia_gov` pra popular o codigo dos
-- convênios já sincronizados.

alter table convenios_federais
  add column if not exists codigo text;
