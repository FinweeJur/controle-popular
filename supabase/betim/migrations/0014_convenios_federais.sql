-- Convênios e repasses federais (pedido do usuário 2026-07-22 — item
-- "Emendas Parlamentares" do TODO.md/PDF de referência).
--
-- ACHADO QUE MUDOU O DESENHO: testado ao vivo, o endpoint que o plano
-- previa (`/emendas` do Portal da Transparência, filtrado por
-- `localidadeDoGasto`) não filtra por município nenhum parâmetro testado
-- (codigoIBGE, codigoIbge, localidadeDoGasto, municipio — todos ignorados
-- em silêncio) e, varrendo os 3 últimos anos inteiros (~19.400 registros),
-- achou 1 (um) registro pra Betim, com valor R$ 0,00. `localidadeDoGasto`
-- também vem como "MÚLTIPLO" ou "Nacional" pra boa parte das emendas, então
-- boa parte não é sequer atribuível a um município nomeado.
--
-- `/convenios?codigoIBGE=3106705` **filtra de verdade** (confirmado
-- comparando com outro município) e devolveu 167 convênios/instrumentos
-- reais pra Betim desde 1995, R$298,6mi pactuados / R$131,6mi liberados,
-- por Ministério (FNDE, Esporte, Saúde, MDS, Cidades, Segurança...).
-- Não é o mesmo dado que "emenda parlamentar individual" (não há campo de
-- parlamentar/autor no retorno) — por isso a tabela é nova, não uma
-- reforma da `emendas` (que fica como estava, esperando uma fonte real de
-- atribuição por parlamentar).
create table convenios_federais (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  id_externo bigint not null,             -- campo "id" da API — chave de upsert
  numero_convenio text,
  objeto text,
  orgao_nome text, orgao_sigla text,
  convenente_nome text,                   -- quem recebeu: a Prefeitura ou uma entidade local (APAE etc.)
  situacao text,
  tipo_instrumento text,
  valor numeric(15,2),
  valor_liberado numeric(15,2),
  valor_contrapartida numeric(15,2),
  data_inicio_vigencia date,
  data_final_vigencia date,
  data_publicacao date,
  fonte text default 'portal_transparencia',
  unique (id_municipio, id_externo),
  created_at timestamptz default now(), updated_at timestamptz
);

alter table convenios_federais enable row level security;
create policy convenios_federais_public_select on convenios_federais for select using (true);
create policy convenios_federais_service_role_all on convenios_federais for all to service_role using (true) with check (true);
