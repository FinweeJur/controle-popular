-- 0066_ambiental_legislacao_temas.sql
-- Filtro temático em `/ambiental/legislacao` (pedido do usuário
-- 2026-08-12): as 6.378 normas de ALMG/Semad/Siam hoje só filtram por
-- fonte/tipo/ano — quem quer "o que existe sobre mineração" tem que ler
-- ementa por ementa. Classificação em `etl/temas_ambientais.py`, script
-- reexecutável em `etl/apis/classificar_temas_ambientais.py` — esta
-- migration só abre as colunas, mesmo padrão de `0025_atos_temas.sql`
-- (array, não tabela-ponte: a tela já filtra tudo no cliente, ver o
-- comentário "POR QUE listarLegislacaoAmbiental TRAZ TUDO" em
-- `lib/db/queries/legislacao-ambiental.ts`).
--
-- ═══ POR QUE `indexacao` ENTRA AQUI, NÃO SÓ `temas`/`tags` ═══
--
-- `etl.apis.legislacao_almg` já busca o campo `indexacao` da API da ALMG
-- (a taxonomia OFICIAL que a própria ALMG atribui a cada norma) — mas só
-- pra FILTRAR localmente ("Meio Ambiente" aparece no caminho?) e depois
-- descarta o valor (`_eh_ambiental`, nunca gravado em `_linha`). Guardar o
-- texto bruto aqui é o que permite classificar `temas` pra ALMG a partir
-- da taxonomia oficial, não só por palavra-chave na ementa — e permite
-- reclassificar sem bater na API de novo se o mapeamento mudar. Só
-- preenchida pra `fonte='almg'` (única fonte com o campo — Semad e Siam
-- não têm equivalente, medido nos dois parsers de HTML, ver
-- `etl/temas_ambientais.py`).

alter table ambiental_legislacao
  add column if not exists indexacao text,
  add column if not exists temas text[] not null default '{}',
  add column if not exists tags text[] not null default '{}';

-- GIN pra `where temas && array['mineracao']` / `where tags && array[...]`
-- não varrer as 6.378 linhas a cada filtro (mesmo raciocínio do índice de
-- tsvector da 0065, um índice funcional idempotente).
create index if not exists ambiental_legislacao_temas_idx
  on ambiental_legislacao using gin (temas);
create index if not exists ambiental_legislacao_tags_idx
  on ambiental_legislacao using gin (tags);
