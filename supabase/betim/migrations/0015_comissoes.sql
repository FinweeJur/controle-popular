-- Participação em Comissões da Câmara Municipal (pedido do usuário
-- 2026-07-23 — item que faltava pra fechar o F6 em ~95%).
--
-- FONTE: aba "Participação em Comissões" na própria página de detalhe de
-- cada vereador (www.camarabetim.mg.gov.br/Parlamentares/Parlamentar/{id}),
-- renderizada client-side pelo Blazor Server. NÃO existe um catálogo
-- central de comissões no site — cada vereador expõe sua própria lista de
-- participações (em andamento + finalizadas), e o roster de comissões é
-- reconstruído agregando as 23 páginas.
--
-- ACHADO QUE MOLDOU O SCHEMA: comissões foram renomeadas ao longo das
-- legislaturas (ex.: "Meio Ambiente e Desenvolvimento Sustentável" virou
-- "..., Desenvolvimento Sustentável e Proteção Animal", que num ponto
-- intermediário apareceu como "..., Bem-Estar, Proteção e Defesa Animal";
-- mesmo padrão em "Segurança Pública..." e "Finanças, Orçamento..."). Não
-- há fonte oficial que confirme essas mudanças como "a mesma comissão
-- renomeada" vs. "comissão nova com mandato parecido" — por isso o
-- catálogo (`comissoes`) é semeado só com os nomes do bloco "em
-- andamento" (24 comissões, o roster ATUAL e sem ambiguidade), e
-- `comissao_membros` grava SEMPRE o nome bruto exatamente como raspado
-- (`nome_comissao_bruto`), com FK para `comissoes` só quando bate
-- exatamente. Participação com nome histórico que não bate com nenhuma
-- comissão atual fica com `comissao_id` nulo — auditável, nunca
-- silenciosamente casada com um "provável" nome atual.
create table comissoes (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  nome text not null,
  especial boolean default false,  -- true pra "Comissão Especial..." (ad hoc, não permanente)
  unique (id_municipio, nome)
);

create table comissao_membros (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  comissao_id uuid references comissoes,   -- null quando o nome bruto não bate com nenhuma comissão atual
  nome_comissao_bruto text not null,        -- sempre o nome exato raspado, auditável mesmo com FK preenchida
  vereador_id uuid not null references vereadores,
  papel text not null,                      -- Presidente | Relator | Membro
  data_inicio date,
  data_fim date,                            -- null quando ainda em andamento
  ativo boolean not null default false,
  created_at timestamptz default now(), updated_at timestamptz,
  unique (id_municipio, vereador_id, nome_comissao_bruto, papel, data_inicio, data_fim)
);
create index on comissao_membros (comissao_id);
create index on comissao_membros (vereador_id);

alter table comissoes enable row level security;
create policy comissoes_public_select on comissoes for select using (true);
create policy comissoes_service_role_all on comissoes for all to service_role using (true) with check (true);

alter table comissao_membros enable row level security;
create policy comissao_membros_public_select on comissao_membros for select using (true);
create policy comissao_membros_service_role_all on comissao_membros for all to service_role using (true) with check (true);
