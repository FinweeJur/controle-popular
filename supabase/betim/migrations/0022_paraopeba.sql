-- Auditoria socioeconômica do Rio Paraopeba (FGV), projetos ligados a
-- Betim (pedido do usuário 2026-07-24) -- Betim é um dos 26 municípios
-- signatários do Acordo Geral de Reparação (rompimento da barragem da
-- Vale em Brumadinho, 2019); a FGV audita a execução via
-- www18.fgv.br/projetorioparaopeba.
--
-- Fonte: planilhas de "Dados Abertos" do próprio portal FGV
-- (projetos-dados/dados-abertos/geral-MM-AAAA.xlsx e
-- library/dados-abertos/financeiro-AAAA-MM.xlsx), não scraping de HTML
-- -- a FGV já disponibiliza os dados estruturados em planilha mensal.
create table paraopeba_saldo_municipio (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  referencia text not null,             -- "2026-05"
  valor_acordo_inicial numeric(16,2),
  valor_acordo_atual numeric(16,2),
  empenhos_autorizados numeric(16,2),
  saldo_teto numeric(16,2),
  unique (id_municipio)
);

-- Uma iniciativa pode envolver vários municípios da bacia ao mesmo
-- tempo (`municipios_envolvidos` guarda a lista bruta da planilha) --
-- esta tabela só grava iniciativas onde Betim está entre eles.
create table paraopeba_iniciativas (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  id_fdi text not null,
  titulo text not null,
  municipios_envolvidos text,
  grupo_iniciativas text,
  tipo_obrigacao text,
  area_tematica text,
  sub_area_tematica text,
  anexo text,
  status text,
  investimento numeric(16,2),
  valor_total numeric(16,2),
  percentual_realizado numeric(6,2),
  produtos_previstos int,
  produtos_entregues int,
  produtos_em_atraso int,
  equipamentos_previstos int,
  equipamentos_entregues int,
  link_publico text,
  link_termo_compromisso text,
  referencia text not null,
  unique (id_municipio, id_fdi)
);

alter table paraopeba_saldo_municipio enable row level security;
create policy paraopeba_saldo_municipio_public_select on paraopeba_saldo_municipio for select using (true);
create policy paraopeba_saldo_municipio_service_role_all on paraopeba_saldo_municipio for all to service_role using (true) with check (true);

alter table paraopeba_iniciativas enable row level security;
create policy paraopeba_iniciativas_public_select on paraopeba_iniciativas for select using (true);
create policy paraopeba_iniciativas_service_role_all on paraopeba_iniciativas for all to service_role using (true) with check (true);
