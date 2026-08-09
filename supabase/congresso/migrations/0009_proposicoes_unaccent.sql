-- Retrofit do índice de texto completo de `proposicoes` com unaccent —
-- mesma correção geral aplicada à legislação municipal em
-- `supabase/betim/migrations/0045_busca_legislativa_unaccent.sql` (ver lá o
-- raciocínio completo: por que a função precisa ser IMMUTABLE, por que sem
-- CONCURRENTLY). Sem isto, buscar "saude" na busca legislativa combinada
-- não achava proposição nenhuma com "saúde" na ementa — mesmo buraco do
-- lado Cidades, agora fechado também no Congresso.
--
-- Extensão e função repetidas aqui (idempotentes: `if not exists` /
-- `create or replace`) para este arquivo não depender da ordem entre pastas
-- de migration de zonas diferentes — as três pastas (`betim`, `congresso`,
-- `judiciario`) aplicam no MESMO banco Neon, mas cada uma continua sendo
-- aplicável sozinha, como as extensões declaradas em cada 0001_schema.sql
-- já fazem.

create extension if not exists unaccent;

create or replace function public.unaccent_immutable(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = public, extensions
as $$
  select unaccent($1)
$$;

-- Mesmo nome do índice original (0001_schema.sql), mesma expressão-base
-- (ementa + keywords) — só embrulhada em unaccent. Índice novo ao lado do
-- antigo ficaria morto: a consulta só usa o índice cuja expressão bate ao
-- pé da letra com a cláusula WHERE.
drop index if exists congresso.proposicoes_to_tsvector_idx;
create index proposicoes_to_tsvector_idx
  on congresso.proposicoes using gin (
    to_tsvector(
      'portuguese',
      public.unaccent_immutable(coalesce(ementa, '') || ' ' || coalesce(keywords, ''))
    )
  );
