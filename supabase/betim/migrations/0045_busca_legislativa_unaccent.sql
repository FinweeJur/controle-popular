-- Busca legislativa por tema/palavra-chave/território (plano 2026-08, Bloco 2).
--
-- `unaccent` não existia em lugar nenhum do projeto: nenhum índice de texto
-- completo passava o termo por um normalizador de acento antes de indexar ou
-- comparar, então "saude" nunca achava "saúde". `atos_oficiais`
-- (leis/decretos/resoluções) e `proposicoes` (requerimentos e projetos de
-- lei da Câmara municipal) além disso nunca tiveram índice de texto completo
-- nenhum — a página de legislação (`lib/betim/legislacao.ts`) sempre
-- devolveu o acervo inteiro e filtrou em memória porque o dataset é pequeno
-- (~660 atos), mas a busca combinada nova (tema + palavra-chave +
-- território) precisa rankear por relevância entre VÁRIAS cidades ao mesmo
-- tempo, e isso exige índice.

create extension if not exists unaccent;

-- unaccent() é STABLE (depende do dicionário de regras carregado), não
-- IMMUTABLE — e um índice de expressão exige IMMUTABLE. O contorno padrão
-- (documentado no wiki do Postgres para esta extensão) é embrulhar a
-- chamada numa função SQL marcada IMMUTABLE: o dicionário de regras não
-- muda em produção, então o risco que essa marcação assume — "o resultado
-- nunca muda para o mesmo input" — é aceitável na prática.
--
-- `search_path` fixo em vez de confiar no search_path de quem chama: os
-- schemas mais antigos deste banco (`congresso`, `judiciario`, ver
-- 0001_schema.sql de cada um) vêm de projetos Supabase que instalavam
-- extensão em `extensions`; o schema `public` deste projeto sempre instalou
-- solto. Sem fixar os dois aqui, a função resolveria `unaccent()` de forma
-- imprevisível conforme o search_path de sessão de quem chama.
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

-- Qualquer consulta que filtre por `@@` precisa embrulhar o termo de busca
-- no MESMO `unaccent_immutable(...)` usado aqui. Se a expressão da consulta
-- não bater com a do índice ao pé da letra, o Postgres não usa o índice e
-- cai para varredura sequencial — resultado continua certo, só fica lento
-- sem avisar.

create index if not exists atos_oficiais_to_tsvector_idx
  on atos_oficiais using gin (
    to_tsvector('portuguese', public.unaccent_immutable(coalesce(ementa, '')))
  );

-- `proposicoes` (requerimentos/projetos de lei da Câmara municipal) só tinha
-- o GIN de `temas` (classificação por regex, mesmo classificador de
-- `atos_oficiais.temas` — ver `etl/temas.py`). Nunca teve índice de texto
-- completo.
create index if not exists proposicoes_to_tsvector_idx
  on proposicoes using gin (
    to_tsvector('portuguese', public.unaccent_immutable(coalesce(ementa, '')))
  );

-- Retrofit: mesmo buraco do unaccent, mesmo remédio. Este índice já existia
-- desde 0001_schema.sql; recriado com o MESMO nome (em vez de um índice
-- novo ao lado) para não deixar o antigo morto ocupando espaço e disputando
-- com o novo — dois índices sobre a mesma coluna, um deles nunca usado pela
-- consulta, é puro desperdício de escrita e storage.
drop index if exists contratos_to_tsvector_idx;
create index contratos_to_tsvector_idx
  on contratos using gin (
    to_tsvector('portuguese', public.unaccent_immutable(objeto))
  );

-- Nenhum dos três `create index` acima usa CONCURRENTLY: o script que
-- aplica migration (`apps/web/scripts/aplicar-migration.mts`) manda o
-- arquivo inteiro como uma consulta simples de múltiplos statements, que o
-- Postgres envolve numa transação implícita — e CONCURRENTLY é proibido
-- dentro de transação. As tabelas afetadas vão de centenas a poucos
-- milhares de linhas; o lock breve de um CREATE INDEX comum não pesa aqui.
