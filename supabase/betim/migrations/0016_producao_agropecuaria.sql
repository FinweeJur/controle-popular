-- Produção agropecuária (pedido do usuário 2026-07-23 — tirar /agro do
-- "em breve"). Fonte: IBGE PAM (lavouras) e PPM (rebanhos, leite/ovos/mel),
-- via Base dos Dados (BigQuery) — mesmo padrão de `etl/bd/ibge.py`.
--
-- IMPORTANTE sobre unidade: `valor_producao`/`valor` do IBGE vêm em
-- MIL REAIS (milhares), não em reais cheios — confirmado comparando ordem
-- de grandeza real (tomate: 180 toneladas colhidas, valor=603 só faz
-- sentido como R$603.000, não R$603). Multiplicar por 1000 na exibição;
-- documentado aqui pra não se perder no meio do pipeline.
create table producao_agropecuaria (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  ano int not null,
  categoria text not null,   -- lavoura_temporaria | lavoura_permanente | rebanho | producao_animal
  produto text not null,
  quantidade numeric,        -- toneladas (lavouras) | cabeças (rebanho) | conforme `unidade` (produção animal)
  unidade text,
  area_colhida numeric,      -- hectares, só faz sentido pra categoria = lavoura_*
  valor_producao_mil_reais numeric(15,2),
  fonte text default 'br_ibge_pam_ppm',
  unique (id_municipio, ano, categoria, produto),
  created_at timestamptz default now(), updated_at timestamptz
);

alter table producao_agropecuaria enable row level security;
create policy producao_agropecuaria_public_select on producao_agropecuaria for select using (true);
create policy producao_agropecuaria_service_role_all on producao_agropecuaria for all to service_role using (true) with check (true);
