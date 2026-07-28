-- 0005_alertas_extensao.sql — F6: alertas por projeção e por nomeação
--
-- LACUNA REAL, achada ao escrever etl/alertas.py: `alertas` só referencia
-- `vaga_id` (0001_schema.sql). Mas o alerta de maior valor do produto —
-- "esta cadeira que você acompanha vai vagar em N meses" — precisa
-- disparar ANTES de existir uma linha em `vagas`, porque `vagas` só é
-- aberta quando a data projetada CHEGA (`etl.vacancia.recalcular()`,
-- `vacancia_projetada <= hoje`). Um aviso com `horizonte_meses` de
-- antecedência (o campo que `monitoramentos` já tem desde a F1) não tem
-- `vaga_id` nenhum pra apontar.
--
-- Fix: `alertas` ganha `cadeira_id` (projeção, antes da vaga existir) e
-- `nomeacao_id` (evento de indicação) — mesmo padrão dual-âncora que
-- `documentos` já usa desde o schema original (`vaga_id` + `nomeacao_id`).
-- Todos nullable: um alerta usa EXATAMENTE UM dos três, nunca mais de um.

set search_path = judiciario, public, extensions;

alter table alertas add column if not exists cadeira_id uuid references cadeiras;
alter table alertas add column if not exists nomeacao_id uuid references nomeacoes;

-- A unique constraint original só cobria `vaga_id` — sem uma equivalente
-- para `cadeira_id`/`nomeacao_id`, o mesmo alerta duplicaria a cada
-- rodada do etl.alertas (nada trava o "insert" de rodar duas vezes).
drop index if exists alertas_monitoramento_id_vaga_id_motivo_key;
create unique index if not exists alertas_unico_vaga
  on alertas (monitoramento_id, vaga_id, motivo) where vaga_id is not null;
create unique index if not exists alertas_unico_cadeira
  on alertas (monitoramento_id, cadeira_id, motivo) where cadeira_id is not null;
create unique index if not exists alertas_unico_nomeacao
  on alertas (monitoramento_id, nomeacao_id, motivo) where nomeacao_id is not null;

-- Conferência.
select column_name, data_type from information_schema.columns
  where table_schema = 'judiciario' and table_name = 'alertas'
  order by ordinal_position;
