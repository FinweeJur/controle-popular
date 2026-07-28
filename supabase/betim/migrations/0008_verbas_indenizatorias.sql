-- Verbas indenizatórias dos vereadores (Câmara de Betim, seção Transparência):
-- reembolsos itemizados por categoria (alimentação, mídia, copa interna,
-- locação de imóveis, etc.) -- distinto de `diarias` (viagens específicas).
-- Fonte: https://www.camarabetim.mg.gov.br/Transparência/Verbas Indenizatórias
create table verbas_indenizatorias (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  vereador_id uuid references vereadores,
  beneficiario text,             -- nome como aparece na fonte (fallback se vereador_id não casar)
  data date,
  grupo_verba text,              -- tema: Alimentação, Mídia, Copa Interna, Locação de Imóveis, etc.
  fornecedor text,
  valor numeric(15,2),
  link_fonte text,
  created_at timestamptz default now(), updated_at timestamptz,
  unique (id_municipio, vereador_id, data, grupo_verba, fornecedor, valor)
);
create index on verbas_indenizatorias (id_municipio, grupo_verba);
create index on verbas_indenizatorias (id_municipio, fornecedor);

-- Same RLS pattern as migration 0002 (public_select_tables loop): public
-- SELECT, writes restricted to service_role.
alter table verbas_indenizatorias enable row level security;
create policy verbas_indenizatorias_public_select on verbas_indenizatorias for select using (true);
create policy verbas_indenizatorias_service_role_all on verbas_indenizatorias for all to service_role using (true) with check (true);
