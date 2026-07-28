-- 0025_atos_temas.sql
-- Página de Legislação (leis/decretos/resoluções) com ranqueamento por
-- tema (pedido do usuário 2026-07-24). A fonte boa é o dataset
-- "Legislação" do portal de dados abertos de Betim
-- (`betim.mg.gov.br/portal/dados-abertos/legislacao/{ano}`, JSON), que traz
-- categoria + ementa por ato — diferente do APIDecreto (só orçamentário).
-- A ementa é classificada por tema (`etl/temas.py`, mesma regra das
-- proposições/contratos) e guardada aqui pra filtrar/ranquear por área.
-- Coluna opcional: o ETL degrada (grava sem `temas`) até esta rodar.

alter table atos_oficiais
  add column if not exists temas text[];
