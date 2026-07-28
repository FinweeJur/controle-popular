-- Patrimônio declarado na campanha (pedido do usuário 2026-07-22, achado
-- ao pesquisar o backlog "biografia livre do TSE" — essa tabela não
-- existe, mas basedosdados.br_tse_eleicoes.bens_candidato existe e tem
-- dado real: 20 dos 23 vereadores atuais têm bens declarados,
-- R$48.776 a R$2.285.486,71 por candidato, confirmado ao vivo
-- 2026-07-22). Join direto por sequencial_candidato = vereadores.id_candidato_tse
-- (já sincronizado por etl/bd/tse.py, sem trabalho de matching novo).
create table bens_candidato (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  vereador_id uuid references vereadores,
  ano_eleicao int,
  tipo_item text, descricao_item text,
  valor numeric(15,2),
  fonte text default 'br_tse_eleicoes',
  created_at timestamptz default now(), updated_at timestamptz
);
create index on bens_candidato (vereador_id);

alter table bens_candidato enable row level security;
create policy bens_candidato_public_select on bens_candidato for select using (true);
create policy bens_candidato_service_role_all on bens_candidato for all to service_role using (true) with check (true);
