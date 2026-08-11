-- APLICAR-TUDO.sql — os 7 arquivos concatenados, na ordem.
-- Cole INTEIRO no SQL Editor do Supabase (projeto compartilhado dos irmãos).
-- Depois: Settings → API → Exposed schemas → acrescentar 'judiciario'.
-- As 3 chaves do .env são as MESMAS do /betim e do /congresso.
-- NOTA: 0007 (seed do TSE) já foi aplicado via Python em 2026-07-25 —
-- os upserts são idempotentes (on conflict), pode rodar de novo sem medo.

-- ═══ 0001_schema.sql ═══
-- Controle Popular — Judiciário · schema inicial
--
-- A CADEIRA é a entidade central, não a pessoa. `cadeiras` é durável (cota
-- de origem + cadeia de sucessão via `ocupacoes`); um magistrado é ocupante
-- temporário. É o que permite responder "quantas vagas da cota OAB abrem
-- até 2030" — a pergunta que o produto existe para responder.
--
-- Multi-tribunal desde o dia 1: toda cadeira pertence a um `tribunal`
-- (stf, stj, tst, stm, tse, depois tjmg, trf6...). Um tribunal novo é um
-- módulo ETL novo + linhas de seed, zero mudança de schema ou frontend —
-- o mesmo princípio que fez os apps irmãos escalarem.

-- ═══════════════════════════════════════════════════════════════
-- SCHEMA PRÓPRIO — leia antes de rodar
--
-- Este app divide o projeto Supabase com o /betim e o /congresso. Os três
-- colidem em `documentos`, `envios`, `perfis`, `monitoramentos`, `alertas`
-- e `cache_ia`. Por isso tudo aqui vive no schema `judiciario`. Ganha-se
-- de brinde o Auth compartilhado: mesmas contas entre os três eixos.
--
-- DEPOIS DE RODAR ESTE ARQUIVO, no dashboard do Supabase:
--   Settings → API → Exposed schemas → acrescentar `judiciario`
-- Sem isso o PostgREST não enxerga nada daqui e o app vê banco vazio.
--
-- O `set search_path` abaixo vale para a SESSÃO. Rode o arquivo INTEIRO de
-- uma vez no SQL Editor — um trecho solto criaria tabela no schema errado,
-- em cima das de um app irmão que já está no ar.
-- ═══════════════════════════════════════════════════════════════

create schema if not exists judiciario;

-- `extensions` entra no path porque é onde o Supabase instala `pg_trgm`.
set search_path = judiciario, public, extensions;

create extension if not exists pg_trgm with schema extensions;

-- ═══════════════════════════════════════════════════════════════
-- Tribunais e cadeiras
-- ═══════════════════════════════════════════════════════════════
create table if not exists tribunais (
  id text primary key,                      -- 'stf' | 'stj' | 'tst' | 'stm' | 'tse' | 'tjmg' | ...
  ramo text not null,                       -- constitucional | superior | trabalho | militar | eleitoral | federal | estadual
  instancia text not null default 'superior', -- superior | segunda
  esfera text not null default 'federal',   -- federal | estadual
  nome text not null, sigla text, uf text,
  n_cadeiras int,                           -- composição LEGAL vigente (efetiva pode ter vaga aberta)
  autoridade_nomeante text,                 -- presidente_republica | governador | eletiva
  exige_sabatina_senado boolean default false,
  base_legal text,
  url_composicao text, ativo boolean default true
);

create table if not exists cadeiras (      -- ENTIDADE DURÁVEL — a decisão de modelagem central
  id uuid primary key default gen_random_uuid(),
  tribunal_id text not null references tribunais,
  numero int,                               -- nº da cadeira quando o tribunal numera
  cota text not null,                       -- livre | carreira | quinto_oab | quinto_mp | terco_trf |
                                            -- terco_tj | terco_oab | terco_mp | militar_marinha |
                                            -- militar_exercito | militar_aeronautica | civil_stm | eletiva_tse
  dispositivo text,                         -- 'CF art. 104, § único, I' — extraído da ementa da MSF
  observacao text,
  unique (tribunal_id, numero)
);
create index if not exists idx_cadeiras_tribunal on cadeiras (tribunal_id, cota);

create table if not exists magistrados (
  id uuid primary key default gen_random_uuid(),
  nome text not null, nome_completo text,
  data_nascimento date,                     -- PII NECESSÁRIA: base de toda projeção. Sem CPF, sem filiação.
  uf_origem text, genero text, raca_cor text,   -- autodeclarados/censo CNJ quando houver; nullable
  origem_carreira text,                     -- magistratura | advocacia | mp | militar | academia
  url_foto text, url_curriculo text,
  slug text unique
);

create table if not exists ocupacoes (     -- cadeia de sucessão da cadeira
  id uuid primary key default gen_random_uuid(),
  cadeira_id uuid not null references cadeiras,
  magistrado_id uuid not null references magistrados,
  data_posse date, data_saida date,
  motivo_saida text,                        -- compulsoria_75 | voluntaria | falecimento | renuncia |
                                            -- promocao | fim_mandato | remocao | transferencia_reserva
  nomeacao_id uuid,                         -- FK lógica para nomeacoes (nullable: histórico pré-API)
  -- `atual` PODE ser coluna gerada: referencia só a própria linha.
  atual boolean generated always as (data_saida is null) stored,
  unique (cadeira_id, magistrado_id, data_posse)
);
create index if not exists idx_ocupacoes_atual on ocupacoes (atual);

-- ═══════════════════════════════════════════════════════════════
-- vw_vacancia — a projeção determinística
--
-- POR QUE UMA VIEW, e não uma coluna gerada:
-- o plano original escrevia `vacancia_projetada` como
-- `generated always as (... subquery em magistrados ...) stored`. O
-- Postgres RECUSA isso: coluna gerada só pode referenciar colunas da
-- própria linha, nunca uma subconsulta. A view resolve sem duplicar a
-- data de nascimento (que é PII) dentro de `ocupacoes`.
--
-- A regra dos 75 anos vive em regras/regras.json (versão 1.0.0), lida por
-- lib/regras.ts e etl/vacancia.py. Aqui ela aparece uma vez, no SQL, com
-- o número explícito — se a régua mudar (nova EC), esta view muda junto,
-- com bump de versão. NÃO espalhar o "75" por outros lugares.
-- ═══════════════════════════════════════════════════════════════
create or replace view vw_vacancia as
select
  o.id           as ocupacao_id,
  o.cadeira_id,
  o.magistrado_id,
  c.tribunal_id,
  c.cota,
  m.nome         as magistrado_nome,
  m.data_nascimento,
  o.data_posse,
  o.atual,
  case
    when o.data_saida is null and m.data_nascimento is not null
      then (m.data_nascimento + interval '75 years')::date
  end as vacancia_projetada
from ocupacoes o
  join cadeiras c on c.id = o.cadeira_id
  join magistrados m on m.id = o.magistrado_id;

-- ═══════════════════════════════════════════════════════════════
-- Nomeação: o rastro oficial (o que a F0 já colhe do Senado)
-- ═══════════════════════════════════════════════════════════════
create table if not exists nomeacoes (
  id uuid primary key default gen_random_uuid(),
  magistrado_id uuid references magistrados,
  cadeira_id uuid references cadeiras,
  tribunal_id text references tribunais,
  autoridade_nomeante text,                 -- nome da autoridade ('Luiz Inácio Lula da Silva')
  cargo_nomeante text,                      -- presidente_republica | governador
  senado_id_externo text unique,            -- id do processo na API do Senado
  senado_identificacao text,                -- 'MSF 31/2025'
  senado_ementa text,
  dispositivo_vaga text,                    -- 'CF art. 104, § único, I' ← regex sobre a ementa
  data_mensagem date, data_deliberacao date,
  resultado text,                           -- aprovada_no_plenario | rejeitada | retirada | em_tramitacao
  antecessor_nome text,                     -- 'na vaga decorrente da aposentadoria do Ministro X'
  motivo_vacancia text,
  url_fonte text, raw jsonb
);
create index if not exists idx_nomeacoes_tribunal on nomeacoes (tribunal_id, data_deliberacao);

-- ═══════════════════════════════════════════════════════════════
-- Eleições internas e mandatos de direção (o eixo "eleições")
-- ═══════════════════════════════════════════════════════════════
create table if not exists mandatos_direcao (
  id uuid primary key default gen_random_uuid(),
  tribunal_id text references tribunais,
  magistrado_id uuid references magistrados,
  cargo text,                               -- presidente | vice_presidente | corregedor |
                                            -- membro_orgao_especial | ministro_tse_efetivo | ministro_tse_substituto
  data_inicio date, data_fim date,
  biennio text, eleito boolean default true, fonte text
);

-- ═══════════════════════════════════════════════════════════════
-- Vagas abertas (o alerta)
-- ═══════════════════════════════════════════════════════════════
create table if not exists vagas (
  id uuid primary key default gen_random_uuid(),
  cadeira_id uuid references cadeiras,
  data_abertura date, motivo text,
  fase text,                                -- aberta | lista_sextupla | lista_triplice | indicado |
                                            -- sabatina_marcada | aprovada | nomeada | preenchida
  prazo_nomeacao date,                      -- art. 94 § único: 20 dias a partir da lista tríplice
  nomeacao_id uuid references nomeacoes,
  atualizada_em timestamptz default now(),
  -- Sem isso, rodar o seed duas vezes duplica a vaga aberta: o `on
  -- conflict` do 0004 precisa de uma chave para saber "essa vaga já existe".
  unique (cadeira_id, data_abertura)
);

-- ═══════════════════════════════════════════════════════════════
-- Usuário: monitoramento, alertas, ofícios (idêntico ao /congresso)
-- ═══════════════════════════════════════════════════════════════
create table if not exists perfis (
  user_id uuid primary key references auth.users on delete cascade,
  nome text, organizacao text, email_alertas boolean default true
);
create table if not exists monitoramentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  nome text,
  tribunais text[], cotas text[], ufs text[], ramos text[],
  horizonte_meses int default 24,
  frequencia text default 'semanal',        -- imediata | diaria | semanal
  ativo boolean default true
);
create table if not exists alertas (
  id uuid primary key default gen_random_uuid(),
  monitoramento_id uuid references monitoramentos on delete cascade,
  user_id uuid references auth.users on delete cascade,
  vaga_id uuid references vagas,
  motivo text,                              -- vaga_projetada | vaga_aberta | sabatina_marcada | preenchida
  lido boolean default false, criado_em timestamptz default now(),
  unique (monitoramento_id, vaga_id, motivo)
);
create table if not exists documentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  vaga_id uuid references vagas, nomeacao_id uuid references nomeacoes,
  tipo text,                                -- nota_apoio | nota_repudio | oficio | comentario
  destinatarios jsonb, titulo text, corpo text,
  status text default 'rascunho',           -- rascunho | final | enviado
  criado_em timestamptz default now()
);
create table if not exists envios (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid references documentos, user_id uuid references auth.users,
  canal text, destinatario text, status text, erro text,
  enviado_em timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- Infra
-- ═══════════════════════════════════════════════════════════════
create table if not exists cache_ia (
  hash text primary key, tipo text, resposta jsonb, modelo text,
  criado_em timestamptz default now()
);
create table if not exists feriados (        -- BrasilAPI + forenses (contagem de prazo, F4)
  data date, nome text, tipo text, uf text,  -- uf null = nacional
  primary key (data, uf)
);
create table if not exists fontes_externas (
  nome text primary key, url text, tipo_dados text,
  ultima_atualizacao timestamptz, ultimo_status text
);

-- Conferência: deve listar as tabelas no schema `judiciario`.
select table_name from information_schema.tables
  where table_schema = 'judiciario' order by table_name;

-- ═══ 0002_rls.sql ═══
-- RLS · Controle Popular — Judiciário
--
-- Rode DEPOIS de 0001_schema.sql, no mesmo projeto Supabase dos irmãos.
-- Tudo aqui opera sobre o schema `judiciario`.
--
-- Duas classes de tabela, sem meio-termo:
--   (a) DADO PÚBLICO (composição, cadeiras, indicações) → SELECT para
--       qualquer um, escrita só service_role (o ETL).
--   (b) DADO DO USUÁRIO (monitoramentos, alertas, ofícios) → só o dono.

set search_path = judiciario, public, extensions;

-- ── (0) Permissões do schema ──────────────────────────────────
-- OBRIGATÓRIO e fácil de esquecer: um schema criado à mão não concede
-- `usage` a ninguém. No `public` o Supabase pré-concede aos papéis do
-- PostgREST; aqui não. Sem este bloco, todas as policies abaixo estariam
-- corretas e mesmo assim toda consulta voltaria "permission denied for
-- schema judiciario", sem nenhuma pista de que é permissão de schema e
-- não RLS. (Custou tempo no /congresso.)
grant usage on schema judiciario to anon, authenticated, service_role;
grant all on all tables in schema judiciario to anon, authenticated, service_role;
grant all on all sequences in schema judiciario to anon, authenticated, service_role;
grant all on all routines in schema judiciario to anon, authenticated, service_role;

-- Tabelas criadas em migrations futuras também precisam do grant.
alter default privileges in schema judiciario
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema judiciario
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema judiciario
  grant all on routines to anon, authenticated, service_role;

-- ── (a) Dado público ──────────────────────────────────────────
-- Tabelas qualificadas com `judiciario.` explicitamente: `format('%I')`
-- monta o SQL como string e roda num contexto onde um search_path
-- diferente do esperado acertaria silenciosamente a tabela homônima de um
-- app irmão.
do $$
declare t text;
begin
  foreach t in array array[
    'tribunais', 'cadeiras', 'magistrados', 'ocupacoes', 'nomeacoes',
    'mandatos_direcao', 'vagas', 'feriados', 'fontes_externas'
  ] loop
    execute format('alter table judiciario.%I enable row level security', t);
    execute format(
      'create policy %I on judiciario.%I for select to anon, authenticated using (true)',
      t || '_select_publico', t
    );
  end loop;
end $$;

-- Sem policy de INSERT/UPDATE/DELETE nessas tabelas: service_role ignora
-- RLS, então o ETL escreve e mais ninguém.

-- `cache_ia` é infra interna: RLS ligada e nenhuma policy = só service_role.
alter table judiciario.cache_ia enable row level security;

-- ── (b) Dado do usuário ───────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'perfis', 'monitoramentos', 'alertas', 'documentos', 'envios'
  ] loop
    execute format('alter table judiciario.%I enable row level security', t);
  end loop;
end $$;

-- `perfis` usa a PK `user_id`; as demais têm coluna `user_id`.
create policy perfis_dono on judiciario.perfis for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['monitoramentos', 'alertas', 'documentos', 'envios'] loop
    execute format(
      'create policy %I on judiciario.%I for all to authenticated
         using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t || '_dono', t
    );
  end loop;
end $$;

-- Conferência: lista as policies criadas no schema.
select tablename, policyname from pg_policies
  where schemaname = 'judiciario' order by tablename, policyname;

-- ═══ 0003_seed_tribunais.sql ═══
-- Seed de tribunais e cadeiras — GERADO por etl/seed_tribunais.py
-- a partir de regras/regras.json versão 1.0.0. NÃO editar à mão.
-- Rode depois de 0001 e 0002.

set search_path = judiciario, public, extensions;

insert into tribunais (id, ramo, instancia, esfera, nome, sigla, n_cadeiras, autoridade_nomeante, exige_sabatina_senado, base_legal) values
  ('stf', 'constitucional', 'superior', 'federal', 'Supremo Tribunal Federal', 'STF', 11, 'presidente_republica', true, 'CF art. 101'),
  ('stj', 'superior', 'superior', 'federal', 'Superior Tribunal de Justiça', 'STJ', 33, 'presidente_republica', true, 'CF art. 104, parágrafo único'),
  ('tst', 'trabalho', 'superior', 'federal', 'Tribunal Superior do Trabalho', 'TST', 27, 'presidente_republica', true, 'CF art. 111-A'),
  ('stm', 'militar', 'superior', 'federal', 'Superior Tribunal Militar', 'STM', 15, 'presidente_republica', true, 'CF art. 123'),
  ('tse', 'eleitoral', 'superior', 'federal', 'Tribunal Superior Eleitoral', 'TSE', 7, 'eletiva', false, 'CF arts. 119 e 121, §2º')
on conflict (id) do update set
  n_cadeiras = excluded.n_cadeiras, base_legal = excluded.base_legal,
  nome = excluded.nome;

-- Cadeiras: N por tribunal, numeradas, com a cota da régua.
-- Idempotente por (tribunal_id, numero).

-- STF · Supremo Tribunal Federal (11 cadeiras)
insert into cadeiras (tribunal_id, numero, cota) values
  ('stf', 1, 'livre'),
  ('stf', 2, 'livre'),
  ('stf', 3, 'livre'),
  ('stf', 4, 'livre'),
  ('stf', 5, 'livre'),
  ('stf', 6, 'livre'),
  ('stf', 7, 'livre'),
  ('stf', 8, 'livre'),
  ('stf', 9, 'livre'),
  ('stf', 10, 'livre'),
  ('stf', 11, 'livre')
on conflict (tribunal_id, numero) do update set cota = excluded.cota;

-- STJ · Superior Tribunal de Justiça (33 cadeiras)
insert into cadeiras (tribunal_id, numero, cota) values
  ('stj', 1, 'terco_trf'),
  ('stj', 2, 'terco_trf'),
  ('stj', 3, 'terco_trf'),
  ('stj', 4, 'terco_trf'),
  ('stj', 5, 'terco_trf'),
  ('stj', 6, 'terco_trf'),
  ('stj', 7, 'terco_trf'),
  ('stj', 8, 'terco_trf'),
  ('stj', 9, 'terco_trf'),
  ('stj', 10, 'terco_trf'),
  ('stj', 11, 'terco_trf'),
  ('stj', 12, 'terco_tj'),
  ('stj', 13, 'terco_tj'),
  ('stj', 14, 'terco_tj'),
  ('stj', 15, 'terco_tj'),
  ('stj', 16, 'terco_tj'),
  ('stj', 17, 'terco_tj'),
  ('stj', 18, 'terco_tj'),
  ('stj', 19, 'terco_tj'),
  ('stj', 20, 'terco_tj'),
  ('stj', 21, 'terco_tj'),
  ('stj', 22, 'terco_tj'),
  ('stj', 23, 'terco_oab'),
  ('stj', 24, 'terco_oab'),
  ('stj', 25, 'terco_oab'),
  ('stj', 26, 'terco_oab'),
  ('stj', 27, 'terco_oab'),
  ('stj', 28, 'terco_oab'),
  ('stj', 29, 'terco_mp'),
  ('stj', 30, 'terco_mp'),
  ('stj', 31, 'terco_mp'),
  ('stj', 32, 'terco_mp'),
  ('stj', 33, 'terco_mp')
on conflict (tribunal_id, numero) do update set cota = excluded.cota;

-- TST · Tribunal Superior do Trabalho (27 cadeiras)
insert into cadeiras (tribunal_id, numero, cota) values
  ('tst', 1, 'quinto_oab_mpt'),
  ('tst', 2, 'quinto_oab_mpt'),
  ('tst', 3, 'quinto_oab_mpt'),
  ('tst', 4, 'quinto_oab_mpt'),
  ('tst', 5, 'quinto_oab_mpt'),
  ('tst', 6, 'carreira_trt'),
  ('tst', 7, 'carreira_trt'),
  ('tst', 8, 'carreira_trt'),
  ('tst', 9, 'carreira_trt'),
  ('tst', 10, 'carreira_trt'),
  ('tst', 11, 'carreira_trt'),
  ('tst', 12, 'carreira_trt'),
  ('tst', 13, 'carreira_trt'),
  ('tst', 14, 'carreira_trt'),
  ('tst', 15, 'carreira_trt'),
  ('tst', 16, 'carreira_trt'),
  ('tst', 17, 'carreira_trt'),
  ('tst', 18, 'carreira_trt'),
  ('tst', 19, 'carreira_trt'),
  ('tst', 20, 'carreira_trt'),
  ('tst', 21, 'carreira_trt'),
  ('tst', 22, 'carreira_trt'),
  ('tst', 23, 'carreira_trt'),
  ('tst', 24, 'carreira_trt'),
  ('tst', 25, 'carreira_trt'),
  ('tst', 26, 'carreira_trt'),
  ('tst', 27, 'carreira_trt')
on conflict (tribunal_id, numero) do update set cota = excluded.cota;

-- STM · Superior Tribunal Militar (15 cadeiras)
insert into cadeiras (tribunal_id, numero, cota) values
  ('stm', 1, 'militar_marinha'),
  ('stm', 2, 'militar_marinha'),
  ('stm', 3, 'militar_marinha'),
  ('stm', 4, 'militar_exercito'),
  ('stm', 5, 'militar_exercito'),
  ('stm', 6, 'militar_exercito'),
  ('stm', 7, 'militar_exercito'),
  ('stm', 8, 'militar_aeronautica'),
  ('stm', 9, 'militar_aeronautica'),
  ('stm', 10, 'militar_aeronautica'),
  ('stm', 11, 'civil_stm'),
  ('stm', 12, 'civil_stm'),
  ('stm', 13, 'civil_stm'),
  ('stm', 14, 'civil_stm'),
  ('stm', 15, 'civil_stm')
on conflict (tribunal_id, numero) do update set cota = excluded.cota;

-- TSE · Tribunal Superior Eleitoral (7 cadeiras)
insert into cadeiras (tribunal_id, numero, cota) values
  ('tse', 1, 'eletiva_stf'),
  ('tse', 2, 'eletiva_stf'),
  ('tse', 3, 'eletiva_stf'),
  ('tse', 4, 'eletiva_stj'),
  ('tse', 5, 'eletiva_stj'),
  ('tse', 6, 'advogado_lista_stf'),
  ('tse', 7, 'advogado_lista_stf')
on conflict (tribunal_id, numero) do update set cota = excluded.cota;

-- Conferência: contagem de cadeiras por tribunal deve bater com n_cadeiras.
select t.id, t.n_cadeiras, count(c.id) as cadeiras_criadas
  from tribunais t left join cadeiras c on c.tribunal_id = t.id
  group by t.id, t.n_cadeiras order by t.id;

-- ═══ 0004_seed_stf.sql ═══
-- Seed de magistrados do STF — GERADO por etl/magistrados.py
-- a partir de etl/dados/magistrados-stf.json. NÃO editar à mão.
-- Rode depois de 0001, 0002 e 0003.

set search_path = judiciario, public, extensions;

insert into magistrados (slug, nome, nome_completo, data_nascimento, origem_carreira) values
  ('gilmar-mendes', 'Gilmar Mendes', 'Gilmar Ferreira Mendes', '1955-12-30', 'advocacia'),
  ('carmen-lucia', 'Cármen Lúcia', 'Cármen Lúcia Antunes Rocha', '1954-04-19', 'advocacia'),
  ('dias-toffoli', 'Dias Toffoli', 'José Antonio Dias Toffoli', '1967-11-15', 'advocacia'),
  ('luiz-fux', 'Luiz Fux', 'Luiz Fux', '1953-04-26', 'magistratura'),
  ('edson-fachin', 'Edson Fachin', 'Luiz Edson Fachin', '1958-02-08', 'advocacia'),
  ('alexandre-de-moraes', 'Alexandre de Moraes', 'Alexandre de Moraes', '1968-12-13', 'advocacia'),
  ('nunes-marques', 'Nunes Marques', 'Kassio Nunes Marques', '1972-05-16', 'magistratura'),
  ('andre-mendonca', 'André Mendonça', 'André Luiz de Almeida Mendonça', '1972-12-27', 'advocacia'),
  ('cristiano-zanin', 'Cristiano Zanin', 'Cristiano Zanin Martins', '1975-11-15', 'advocacia'),
  ('flavio-dino', 'Flávio Dino', 'Flávio Dino de Castro e Costa', '1968-04-30', 'magistratura')
on conflict (slug) do update set
  data_nascimento = excluded.data_nascimento,
  nome_completo = excluded.nome_completo, origem_carreira = excluded.origem_carreira;

-- Ocupações: liga cada ministro à sua cadeira.
-- v.posse sai da VALUES como `text` (o VALUES-como-subconsulta perde o tipo
-- "unknown" que os literais teriam num INSERT ... VALUES direto) -- por isso
-- o cast explícito, senão "coluna data_posse é do tipo date mas expressão é
-- do tipo text".
insert into ocupacoes (cadeira_id, magistrado_id, data_posse)
  select c.id, mg.id, v.posse::date from cadeiras c, magistrados mg,
    (values
      ('gilmar-mendes', 1, '2002-06-20'),
      ('carmen-lucia', 2, '2006-06-21'),
      ('dias-toffoli', 3, '2009-10-23'),
      ('luiz-fux', 4, '2011-03-03'),
      ('edson-fachin', 5, '2015-06-16'),
      ('alexandre-de-moraes', 6, '2017-03-22'),
      ('nunes-marques', 7, '2020-11-05'),
      ('andre-mendonca', 8, '2021-12-16'),
      ('cristiano-zanin', 9, '2023-08-03'),
      ('flavio-dino', 10, '2024-02-22')
    ) as v(slug, numero, posse)
  where c.tribunal_id = 'stf' and c.numero = v.numero and mg.slug = v.slug
on conflict (cadeira_id, magistrado_id, data_posse) do nothing;

-- Nomeações históricas: alimentam o poder de indicação.
insert into nomeacoes (senado_id_externo, tribunal_id, magistrado_id, autoridade_nomeante, cargo_nomeante, data_deliberacao)
  select 'seed:stf:'||v.slug, 'stf', mg.id, v.nomeante, 'presidente_republica', v.posse::date
  from magistrados mg,
    (values
      ('gilmar-mendes', 'Fernando Henrique Cardoso', '2002-06-20'),
      ('carmen-lucia', 'Luiz Inácio Lula da Silva', '2006-06-21'),
      ('dias-toffoli', 'Luiz Inácio Lula da Silva', '2009-10-23'),
      ('luiz-fux', 'Dilma Rousseff', '2011-03-03'),
      ('edson-fachin', 'Dilma Rousseff', '2015-06-16'),
      ('alexandre-de-moraes', 'Michel Temer', '2017-03-22'),
      ('nunes-marques', 'Jair Bolsonaro', '2020-11-05'),
      ('andre-mendonca', 'Jair Bolsonaro', '2021-12-16'),
      ('cristiano-zanin', 'Luiz Inácio Lula da Silva', '2023-08-03'),
      ('flavio-dino', 'Luiz Inácio Lula da Silva', '2024-02-22')
    ) as v(slug, nomeante, posse)
  where mg.slug = v.slug
on conflict (senado_id_externo) do update set autoridade_nomeante = excluded.autoridade_nomeante;

-- Vaga aberta hoje (dado de produto — o app existe para mostrar isto).
insert into vagas (cadeira_id, data_abertura, motivo, fase)
  select c.id, '2025-10-18', 'aposentadoria', 'aberta'
  from cadeiras c where c.tribunal_id = 'stf' and c.numero = 11
on conflict (cadeira_id, data_abertura) do nothing;

-- Conferência: ocupantes atuais e vacância projetada (nascimento + 75).
select magistrado_nome, vacancia_projetada from vw_vacancia
  where tribunal_id = 'stf' and atual order by vacancia_projetada;

-- ═══ 0005_alertas_extensao.sql ═══
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

-- ═══ 0006_mandatos_unique.sql ═══
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

-- ═══ 0007_seed_tse.sql ═══
-- Seed do TSE — GERADO por etl/magistrados.py --seed-sql-tse
-- a partir de etl/dados/magistrados-tse.json. NÃO editar à mão.
-- Rode depois de 0001-0004 (magistrados do STF já semeados).

set search_path = judiciario, public, extensions;

-- Só os magistrados que NÃO vêm do STF (esses já existem via seed-stf).
insert into magistrados (slug, nome, nome_completo, data_nascimento, origem_carreira) values
  ('floriano-azevedo-marques', 'Floriano de Azevedo Marques', 'Floriano Peixoto de Azevedo Marques Neto', '1968-06-04', 'advocacia'),
  ('estela-aranha', 'Estela Aranha', 'Estela Aranha', null, 'advocacia'),
  ('naue-pinheiro-azevedo', 'Nauê Bernardo Pinheiro de Azevedo', 'Nauê Bernardo Pinheiro de Azevedo', null, 'advocacia'),
  ('antonio-carlos-ferreira', 'Antonio Carlos Ferreira', 'Antonio Carlos Ferreira', null, 'magistratura'),
  ('villas-boas-cueva', 'Villas Bôas Cueva', 'Ricardo Villas Bôas Cueva', null, 'magistratura'),
  ('sebastiao-reis-junior', 'Sebastião Reis Júnior', 'Sebastião Alves dos Reis Júnior', null, 'magistratura'),
  ('marco-aurelio-bellizze', 'Marco Aurélio Bellizze', 'Marco Aurélio Bellizze Oliveira', null, 'magistratura')
on conflict (slug) do update set
  data_nascimento = excluded.data_nascimento,
  nome_completo = excluded.nome_completo, origem_carreira = excluded.origem_carreira;

-- Mandatos (composição + direção) — todos por slug, STF ou novo.
-- v.data_inicio/v.data_fim saem da VALUES como `text` (mesmo motivo do
-- seed do STF acima: VALUES-como-subconsulta resolve os literais pra texto,
-- não pro `unknown` que um INSERT ... VALUES direto teria) -- cast explícito
-- pra não colidir com as colunas `date`.
insert into mandatos_direcao (tribunal_id, magistrado_id, cargo, data_inicio, data_fim, biennio, eleito)
  select 'tse', mg.id, v.cargo, v.data_inicio::date, v.data_fim::date, v.biennio, true
  from magistrados mg,
    (values
  ('nunes-marques', 'efetivo_eletiva_stf', '2025-05-25', '2027-05-25', '2'),
  ('nunes-marques', 'presidente', '2025-05-25', '2027-05-25', '2'),
  ('andre-mendonca', 'efetivo_eletiva_stf', '2026-06-25', '2028-06-25', '2'),
  ('andre-mendonca', 'vice_presidente', '2026-06-25', '2028-06-25', '2'),
  ('dias-toffoli', 'efetivo_eletiva_stf', '2026-06-09', '2028-06-09', '1'),
  ('antonio-carlos-ferreira', 'efetivo_eletiva_stj', '2024-09-19', '2026-09-19', '1'),
  ('antonio-carlos-ferreira', 'corregedor_eleitoral', '2024-09-19', '2026-09-19', '1'),
  ('villas-boas-cueva', 'efetivo_eletiva_stj', '2025-12-16', '2027-12-16', '1'),
  ('floriano-azevedo-marques', 'efetivo_advogado', '2025-08-01', '2027-08-01', '2'),
  ('estela-aranha', 'efetivo_advogado', '2025-08-01', '2027-08-01', '1'),
  ('gilmar-mendes', 'substituto_eletiva_stf', null, null, '2'),
  ('cristiano-zanin', 'substituto_eletiva_stf', null, null, '1'),
  ('flavio-dino', 'substituto_eletiva_stf', null, null, '1'),
  ('sebastiao-reis-junior', 'substituto_eletiva_stj', null, null, '1'),
  ('marco-aurelio-bellizze', 'substituto_eletiva_stj', null, null, '1'),
  ('naue-pinheiro-azevedo', 'substituto_advogado', null, null, '1')
    ) as v(slug, cargo, data_inicio, data_fim, biennio)
  where mg.slug = v.slug
on conflict (tribunal_id, magistrado_id, cargo, biennio) do update set
  data_inicio = excluded.data_inicio, data_fim = excluded.data_fim;

-- Conferência: mandatos do TSE por cargo.
select md.cargo, mg.nome, md.data_inicio, md.data_fim from mandatos_direcao md
  join magistrados mg on mg.id = md.magistrado_id
  where md.tribunal_id = 'tse' order by md.cargo;

