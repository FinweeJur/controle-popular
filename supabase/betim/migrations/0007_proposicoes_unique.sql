-- Natural key for proposições legislativas, matching how PNCP contracts/
-- licitações are keyed (a stable natural identifier instead of relying on
-- app-side dedupe). tipo+numero+ano is unique per câmara municipal --
-- confirmed against camarabetim.mg.gov.br's own numbering ("Indicação Nº
-- 078/2026" etc, never repeated within a tipo+ano).
alter table proposicoes
  add constraint proposicoes_id_municipio_tipo_numero_ano_key
  unique (id_municipio, tipo, numero, ano);
