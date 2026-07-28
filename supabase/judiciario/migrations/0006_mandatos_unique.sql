-- 0006_mandatos_unique.sql — F7: idempotência do seed de mandatos_direcao
--
-- `mandatos_direcao` (0001) não tinha nenhuma constraint única — rodar o
-- seed do TSE duas vezes duplicaria cada linha (presidente, corregedor
-- etc.), inflando a composição. Mesma disciplina de idempotência aplicada
-- em toda tabela de seed deste projeto (cadeiras, nomeações via
-- senado_id_externo, alertas via 0005).

set search_path = judiciario, public, extensions;

-- `alter table ... add constraint IF NOT EXISTS` NÃO EXISTE no Postgres
-- (só CREATE INDEX/TABLE aceitam IF NOT EXISTS) — índice único faz o
-- mesmo papel e é o que `on conflict (tribunal_id, magistrado_id, cargo,
-- biennio)` precisa para funcionar (Postgres infere o alvo por um índice
-- único com essas colunas, não exige constraint nomeada).
create unique index if not exists mandatos_direcao_unico
  on mandatos_direcao (tribunal_id, magistrado_id, cargo, biennio);

-- Conferência.
select indexname from pg_indexes where indexname = 'mandatos_direcao_unico';
