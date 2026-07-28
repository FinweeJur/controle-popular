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
