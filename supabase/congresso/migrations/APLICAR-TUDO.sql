-- ═══════════════════════════════════════════════════════════════
-- CONTROLE POPULAR — CONGRESSO · aplicar tudo de uma vez
--
-- Gerado a partir de 0001_schema.sql + 0002_rls.sql + 0003_seed_casas.sql.
-- NÃO editar este arquivo: edite as migrations e gere de novo.
--
-- ONDE RODAR: SQL Editor do projeto Supabase que JÁ EXISTE (o do /betim).
-- Cole o arquivo INTEIRO e rode de uma vez só. Não rode em pedaços: o
-- `set search_path` do topo vale para a sessão, e um trecho solto criaria
-- as tabelas no schema `public`, em cima das do /betim, que está no ar.
--
-- DEPOIS DE RODAR, no dashboard:
--   Settings → API → Exposed schemas → acrescentar `congresso`
-- Sem isso o PostgREST não enxerga nada e o app mostra banco vazio.
--
-- O final devolve 2 linhas (camara, senado). Se devolver, deu certo.
-- ═══════════════════════════════════════════════════════════════



-- ───────────────────────────────────────────────────────────────
-- 0001_schema.sql
-- ───────────────────────────────────────────────────────────────
-- Controle Popular — Congresso · schema inicial
--
-- Multi-esfera desde o dia 1: toda proposição pertence a uma `casa`
-- (federal/camara, federal/senado, e depois estadual/almg,
-- municipal/cmbetim). É o análogo do `id_municipio` que fez o /betim
-- escalar para BH/SP sem reescrita — uma casa nova é um módulo ETL novo,
-- zero mudança de schema ou de frontend.

-- ═══════════════════════════════════════════════════════════════
-- SCHEMA PRÓPRIO — leia antes de rodar
--
-- Este app divide o projeto Supabase com o /betim (Controle Popular
-- municipal). Os dois schemas colidem em quatro tabelas — `proposicoes`,
-- `cache_ia`, `embeddings` e `fontes_externas` — e a colisão de
-- `proposicoes` é séria: no /betim ela guarda proposição de vereador
-- (`id_municipio`, `vereador_id`); aqui, proposição federal (`casa_id`,
-- `id_externo`). São coisas diferentes com o mesmo nome.
--
-- Por isso tudo daqui vive no schema `congresso`. Ganha-se de brinde o
-- Auth compartilhado: quando o /betim tiver login, são as mesmas contas.
--
-- DEPOIS DE RODAR ESTE ARQUIVO, no dashboard do Supabase:
--   Settings → API → Exposed schemas → acrescentar `congresso`
-- Sem isso o PostgREST não enxerga nada daqui e o app vê banco vazio.
--
-- O `set search_path` abaixo vale para a SESSÃO. Rode o arquivo INTEIRO
-- de uma vez no SQL Editor — rodar um trecho solto criaria as tabelas no
-- schema errado, em cima das do /betim.
-- ═══════════════════════════════════════════════════════════════

create schema if not exists congresso;

-- `extensions` entra no path porque é onde o Supabase instala `vector` e
-- `pg_trgm`; sem ele, `vector(384)` e `vector_cosine_ops` não resolvem.
set search_path = congresso, public, extensions;

create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ═══════════════════════════════════════════════════════════════
-- 1. Entidades legislativas (dado público, escrita só service_role)
-- ═══════════════════════════════════════════════════════════════

create table casas (
  id text primary key,                    -- 'camara' | 'senado' | 'almg' | 'cmbetim'
  esfera text not null check (esfera in ('federal', 'estadual', 'municipal')),
  nome text not null,
  uf text,
  url_api text,
  url_site text,
  ativo boolean default true,
  created_at timestamptz default now()
);

create table parlamentares (
  id uuid primary key default gen_random_uuid(),
  casa_id text not null references casas,
  id_externo text not null,               -- id na API de origem
  nome text not null,
  nome_eleitoral text,
  partido text,
  uf text,
  -- E-mail institucional público (a API da Câmara já entrega:
  -- dep.nome@camara.leg.br). É o destinatário do ofício gerado.
  email text,
  url_foto text,
  url_perfil text,
  legislatura int,
  ativo boolean default true,
  raw jsonb,
  updated_at timestamptz default now(),
  unique (casa_id, id_externo)
);
create index on parlamentares (casa_id, ativo);
create index on parlamentares using gin (nome gin_trgm_ops);

create table orgaos (                     -- comissões, mesa, plenário
  id uuid primary key default gen_random_uuid(),
  casa_id text not null references casas,
  id_externo text not null,
  sigla text,
  nome text,
  tipo text,                              -- 'Comissão Permanente' | 'Comissão Temporária' | ...
  email text,                             -- ver docs/F0-discovery.md: a API não expõe; semeado à mão
  url_site text,
  ativo boolean default true,
  unique (casa_id, id_externo)
);

-- Frentes parlamentares (as "bancadas temáticas": ruralista, evangélica,
-- da segurança...), blocos e federações partidárias. Tudo na mesma tabela
-- porque a leitura do usuário é a mesma — "que grupo está por trás disto".
create table bancadas (
  id uuid primary key default gen_random_uuid(),
  casa_id text not null references casas,
  id_externo text,
  tipo text not null check (tipo in ('frente', 'bloco', 'federacao', 'partido')),
  nome text not null,
  legislatura int,
  url_site text,
  unique (casa_id, tipo, id_externo)
);

create table bancada_membros (
  bancada_id uuid references bancadas on delete cascade,
  parlamentar_id uuid references parlamentares on delete cascade,
  papel text,
  primary key (bancada_id, parlamentar_id)
);

-- ═══════════════════════════════════════════════════════════════
-- 2. Proposições
-- ═══════════════════════════════════════════════════════════════

create table proposicoes (
  id uuid primary key default gen_random_uuid(),
  casa_id text not null references casas,
  id_externo text not null,
  sigla_tipo text,                        -- PL | PEC | PLP | MPV | PDL ...
  numero int,
  ano int,
  identificacao text,                     -- 'PL 4764/2026' — como o humano busca
  ementa text,
  ementa_detalhada text,
  -- Indexação oficial da própria casa. A Câmara já classifica cada
  -- proposição por tema (codTema) e por palavras-chave; não replicamos
  -- esse trabalho, só acrescentamos por cima o eixo garantista/reducionista.
  keywords text,
  temas_oficiais text[],
  data_apresentacao timestamptz,
  situacao text,
  orgao_atual text,
  regime text,
  apreciacao text,
  url_inteiro_teor text,
  url_fonte text,
  texto_integral text,                    -- extraído do PDF/RTF em etl.inteiro_teor
  tramitando boolean default true,
  data_ultima_tramitacao timestamptz,
  raw jsonb,
  updated_at timestamptz default now(),
  unique (casa_id, id_externo)
);
create index on proposicoes (casa_id, ano, tramitando);
create index on proposicoes (data_apresentacao desc);
create index on proposicoes using gin (temas_oficiais);
create index on proposicoes using gin (
  to_tsvector('portuguese', coalesce(ementa, '') || ' ' || coalesce(keywords, ''))
);

create table proposicao_autores (
  proposicao_id uuid references proposicoes on delete cascade,
  parlamentar_id uuid references parlamentares on delete cascade,
  ordem int,
  proponente boolean default false,
  primary key (proposicao_id, parlamentar_id)
);

create table tramitacoes (
  id uuid primary key default gen_random_uuid(),
  proposicao_id uuid references proposicoes on delete cascade,
  sequencia int,
  data_hora timestamptz,
  sigla_orgao text,
  descricao text,
  despacho text,
  unique (proposicao_id, sequencia)
);
create index on tramitacoes (proposicao_id, data_hora desc);

create table votacoes (
  id uuid primary key default gen_random_uuid(),
  casa_id text not null references casas,
  id_externo text not null,
  proposicao_id uuid references proposicoes,
  data date,
  sigla_orgao text,
  descricao text,
  aprovacao boolean,
  unique (casa_id, id_externo)
);

create table votos (
  votacao_id uuid references votacoes on delete cascade,
  parlamentar_id uuid references parlamentares on delete cascade,
  voto text,                              -- Sim | Não | Abstenção | Obstrução | Art. 17
  primary key (votacao_id, parlamentar_id)
);

-- ═══════════════════════════════════════════════════════════════
-- 3. Análise garantista × reducionista
--
-- O LLM NÃO devolve o rótulo. Ele preenche `analise_itens` (direito +
-- dispositivo legal obrigatório + direção + mecanismo + grau + trecho
-- citado), e `score`/`rotulo` saem de um cálculo determinístico sobre
-- essas linhas (lib/rubrica.ts). Por isso a classificação é auditável:
-- o usuário clica no score e chega até o trecho do PL que o gerou.
-- ═══════════════════════════════════════════════════════════════

create table analises (
  id uuid primary key default gen_random_uuid(),
  proposicao_id uuid not null references proposicoes on delete cascade unique,
  score numeric(6,2),
  rotulo text,        -- garantista_forte|garantista|neutro|misto|reducionista|reducionista_forte
  -- Constitucionalidade não entra no score: é selo próprio, não questão
  -- de grau. Somar "fere cláusula pétrea" com "amplia acesso" produziria
  -- um número sem significado.
  clausula_petrea boolean default false,
  vedacao_retrocesso boolean default false,
  resumo_neutro text,                     -- ficha técnica: o que muda, na letra
  parecer_critico text,                   -- opinião, rotulada como tal na UI
  legislacao_relacionada jsonb,           -- saída determinística de etl/normas.py
  modelo text,
  versao_rubrica text,
  versao_prompt text,
  status text default 'ok' check (status in ('ok', 'requer_revisao', 'falhou')),
  criado_em timestamptz default now()
);
create index on analises (rotulo);
create index on analises (status);

create table analise_itens (
  id uuid primary key default gen_random_uuid(),
  analise_id uuid not null references analises on delete cascade,
  direito text not null,
  -- Obrigatório. Item sem dispositivo válido é descartado ANTES de entrar
  -- no score — é o que impede o modelo de alucinar um artigo e mesmo assim
  -- mover o rótulo.
  dispositivo text not null,
  direcao text not null check (direcao in ('amplia', 'restringe', 'neutro')),
  mecanismo text,
  titulares text[],
  grau text check (grau in ('marginal', 'moderado', 'estrutural')),
  trecho text,                            -- citação literal do PL
  confianca numeric(3,2),
  peso numeric(6,2)
);
create index on analise_itens (analise_id);

create table analise_contestacoes (
  id uuid primary key default gen_random_uuid(),
  analise_id uuid not null references analises on delete cascade,
  user_id uuid references auth.users on delete set null,
  texto text not null,
  criado_em timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- 4. Dados do usuário (produto público multi-usuário)
-- ═══════════════════════════════════════════════════════════════

create table perfis (
  user_id uuid primary key references auth.users on delete cascade,
  nome text,
  organizacao text,
  email_alertas boolean default true,
  criado_em timestamptz default now()
);

create table monitoramentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nome text not null,                     -- "Direitos trabalhistas"
  palavras_chave text[],
  temas text[],
  direitos text[],                        -- taxonomia da rubrica (lib/rubrica.ts)
  casas text[],
  orgaos uuid[],
  bancadas uuid[],
  parlamentares uuid[],
  so_reducionistas boolean default false,
  frequencia text default 'diaria' check (frequencia in ('imediata', 'diaria', 'semanal')),
  ativo boolean default true,
  criado_em timestamptz default now()
);
create index on monitoramentos (user_id, ativo);

create table alertas (
  id uuid primary key default gen_random_uuid(),
  monitoramento_id uuid not null references monitoramentos on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  proposicao_id uuid not null references proposicoes on delete cascade,
  motivo text not null,                   -- nova_proposicao|nova_tramitacao|pauta_comissao|votacao
  lido boolean default false,
  criado_em timestamptz default now(),
  unique (monitoramento_id, proposicao_id, motivo)
);
create index on alertas (user_id, lido, criado_em desc);

create table documentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  proposicao_id uuid references proposicoes on delete set null,
  tipo text not null,                     -- oficio_apoio|oficio_repudio|nota_publica|comentario
  destinatarios jsonb,                    -- [{tipo, id, nome, email}]
  titulo text,
  corpo text,
  status text default 'rascunho' check (status in ('rascunho', 'final', 'enviado')),
  criado_em timestamptz default now(),
  updated_at timestamptz default now()
);
create index on documentos (user_id, criado_em desc);

-- Log de auditoria de tudo que saiu do app em nome do usuário — inclusive
-- downloads. Se o envio direto por e-mail for ligado algum dia, é aqui que
-- fica o registro do que foi enviado, para quem e quando.
create table envios (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references documentos on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  canal text not null,                    -- email|download_pdf|download_docx|download_txt|mailto
  destinatario text,
  status text,
  erro text,
  enviado_em timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- 5. Infraestrutura de IA
-- ═══════════════════════════════════════════════════════════════

-- Chave = hash de (texto + versão do prompt + modelo). Com ~4.400 PLs/ano
-- só na Câmara e reanálises a cada evolução da rubrica, o cache é a
-- diferença entre viável e inviável num modelo local.
create table cache_ia (
  hash text primary key,
  tipo text,
  resposta jsonb,
  modelo text,
  criado_em timestamptz default now()
);

create table embeddings (
  id uuid primary key default gen_random_uuid(),
  proposicao_id uuid not null references proposicoes on delete cascade,
  chunk_text text,
  embedding vector(384)                   -- all-MiniLM-L6-v2
);
create index on embeddings using hnsw (embedding vector_cosine_ops);

create table fontes_externas (
  nome text primary key,
  url text,
  tipo_dados text,
  ultima_atualizacao timestamptz,
  ultimo_status text
);


-- ───────────────────────────────────────────────────────────────
-- 0002_rls.sql
-- ───────────────────────────────────────────────────────────────
-- RLS · Controle Popular — Congresso
--
-- Rode DEPOIS de 0001_schema.sql, no mesmo projeto Supabase do /betim.
-- Tudo aqui opera sobre o schema `congresso` (ver cabeçalho do 0001).
--
-- Duas classes de tabela, sem meio-termo:
--   (a) DADO PÚBLICO legislativo → SELECT para qualquer um, escrita só
--       service_role (o ETL). É informação pública por definição.
--   (b) DADO DO USUÁRIO (monitoramentos, alertas, ofícios) → só o dono.
--       Um usuário nunca lê o ofício de outro. Sem exceção.

set search_path = congresso, public, extensions;

-- ── (0) Permissões do schema ──────────────────────────────────
-- OBRIGATÓRIO e fácil de esquecer: um schema criado à mão não concede
-- `usage` a ninguém. No `public` o Supabase já pré-concede aos papéis do
-- PostgREST, mas aqui não — sem este bloco, todas as policies abaixo
-- estariam corretas e mesmo assim toda consulta voltaria
-- "permission denied for schema congresso", sem nenhuma pista de que o
-- problema é permissão de schema e não de RLS.
--
-- Os grants são grosseiros de propósito: quem de fato controla o acesso é
-- a RLS logo abaixo. É o modelo do próprio Supabase — GRANT abre a porta,
-- RLS decide quem passa.
grant usage on schema congresso to anon, authenticated, service_role;

grant all on all tables in schema congresso to anon, authenticated, service_role;
grant all on all sequences in schema congresso to anon, authenticated, service_role;
grant all on all routines in schema congresso to anon, authenticated, service_role;

-- Tabelas criadas DEPOIS desta migration (migrations futuras) também
-- precisam do grant; sem os default privileges, cada tabela nova voltaria
-- a dar "permission denied" e o motivo já teria sido esquecido.
alter default privileges in schema congresso
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema congresso
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema congresso
  grant all on routines to anon, authenticated, service_role;

-- ── (a) Dado público ──────────────────────────────────────────
-- As tabelas são qualificadas com `congresso.` explicitamente em vez de
-- depender do search_path: `format('%I')` monta o SQL como string e é
-- executado num contexto onde um search_path diferente do esperado
-- silenciosamente acertaria a tabela homônima do /betim.
do $$
declare t text;
begin
  foreach t in array array[
    'casas', 'parlamentares', 'orgaos', 'bancadas', 'bancada_membros',
    'proposicoes', 'proposicao_autores', 'tramitacoes', 'votacoes', 'votos',
    'analises', 'analise_itens', 'fontes_externas'
  ] loop
    execute format('alter table congresso.%I enable row level security', t);
    execute format(
      'create policy %I on congresso.%I for select to anon, authenticated using (true)',
      t || '_select_publico', t
    );
  end loop;
end $$;

-- Sem policy de INSERT/UPDATE/DELETE nessas tabelas: service_role ignora
-- RLS, então o ETL escreve normalmente e mais ninguém escreve.

-- `cache_ia` e `embeddings` são infraestrutura interna: RLS ligada e
-- nenhuma policy = ninguém lê com anon/authenticated, só o service_role.
alter table congresso.cache_ia enable row level security;
alter table congresso.embeddings enable row level security;

-- ── (b) Dado do usuário ───────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'perfis', 'monitoramentos', 'alertas', 'documentos', 'envios'
  ] loop
    execute format('alter table congresso.%I enable row level security', t);
    execute format(
      'create policy %I on congresso.%I for all to authenticated
         using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t || '_dono', t
    );
  end loop;
end $$;

-- Contestações ("discordo desta classificação"): o usuário cria e lê as
-- suas; a moderação lê todas via service_role. Não são públicas para não
-- virar caixa de comentários.
alter table congresso.analise_contestacoes enable row level security;
create policy analise_contestacoes_dono on congresso.analise_contestacoes
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Perfil criado automaticamente no signup ───────────────────
-- Função e trigger levam sufixo `_congresso` porque `auth.users` é
-- COMPARTILHADA com o /betim: um trigger chamado `on_auth_user_created`
-- seco colidiria no dia em que o /betim ganhar login, e o erro apareceria
-- como "signup falhou" sem pista da causa.
create or replace function congresso.handle_new_user_congresso()
returns trigger language plpgsql security definer
set search_path = congresso, public as $$
begin
  insert into congresso.perfis (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created_congresso on auth.users;
create trigger on_auth_user_created_congresso
  after insert on auth.users
  for each row execute function congresso.handle_new_user_congresso();


-- ───────────────────────────────────────────────────────────────
-- 0003_seed_casas.sql
-- ───────────────────────────────────────────────────────────────
-- Casas legislativas iniciais. Rode depois de 0001 e 0002.
--
-- Só as duas federais entram agora. Estadual (ALMG) e municipal (Câmara de
-- Betim, via PROLEGIS — já mapeado e raspado no app /betim, código
-- reaproveitável) entram em F10/F11 como linhas novas aqui, sem nenhuma
-- mudança de schema.

set search_path = congresso, public, extensions;

insert into congresso.casas (id, esfera, nome, uf, url_api, url_site) values
  ('camara', 'federal', 'Câmara dos Deputados', null,
   'https://dadosabertos.camara.leg.br/api/v2', 'https://www.camara.leg.br'),
  ('senado', 'federal', 'Senado Federal', null,
   'https://legis.senado.leg.br/dadosabertos', 'https://www.senado.leg.br')
on conflict (id) do nothing;

-- Conferência rápida: deve devolver 2 linhas. Se devolver erro de relação
-- inexistente, o 0001 não rodou inteiro ou rodou com outro search_path.
select id, esfera, nome from congresso.casas order by id;
