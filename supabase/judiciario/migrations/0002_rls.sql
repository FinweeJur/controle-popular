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
