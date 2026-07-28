-- Caixa disponível (pedido do usuário 2026-07-21, pesquisa em TODO.md):
-- "quanto a Prefeitura tem em caixa" — fonte confirmada ao vivo:
-- br_me_siconfi.municipio_balanco_patrimonial, conta "Caixa e
-- Equivalentes de Caixa" (nenhuma tabela existente guarda saldo
-- patrimonial, só fluxo de despesa/receita, daí a tabela nova).
create table caixa_disponivel (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  ano int not null,
  valor numeric(15,2),
  fonte text default 'br_me_siconfi',
  unique (id_municipio, ano),
  created_at timestamptz default now(), updated_at timestamptz
);

alter table caixa_disponivel enable row level security;
create policy caixa_disponivel_public_select on caixa_disponivel for select using (true);
create policy caixa_disponivel_service_role_all on caixa_disponivel for all to service_role using (true) with check (true);
