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
