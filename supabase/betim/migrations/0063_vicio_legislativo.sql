-- 0063_vicio_legislativo.sql
-- Análise de VÍCIO LEGISLATIVO / indício de inconstitucionalidade no eixo
-- Cidades — companheira de `public.analises` / `analise_itens` (0033), não
-- substituta, e espelho de `congresso.vicios_legislativos` /
-- `vicio_itens` (0011 do /congresso) pela mesma razão que 0033 espelha
-- `congresso.analises`: a régua de vício mora num lugar só
-- (`apps/web/lib/congresso/rubrica/vicio_legislativo.json`) e vale para
-- Câmara Municipal do mesmo jeito que vale para Congresso — só muda qual
-- CATEGORIA se aplica a qual eixo (`vicio_legislativo.json:categorias.*.eixos`),
-- não a régua em si.
--
-- ═══ MESMA DIFERENÇA ESTRUTURAL DE 0033, PELO MESMO MOTIVO ═══
--
-- Cidades têm DOIS objetos analisáveis (ato já sancionado × projeto em
-- tramitação); Congresso só tem um. Duas colunas nuláveis + CHECK
-- `num_nonnulls(...) = 1` em vez de par polimórfico, para que cada uma
-- tenha FK de verdade — ver o raciocínio completo no comentário de 0033.
--
-- ═══ id_municipio EM `vicio_itens` TAMBÉM ═══
--
-- Mesma denormalização deliberada de `analise_itens.id_municipio`: é o que
-- permite "quais categorias de vício mais aparecem nesta cidade" sem passar
-- por `vicios_legislativos`.
--
-- ═══ SEM RLS ═══ — ver o comentário equivalente em 0011 do /congresso.
-- `public.analises` (0033) tampouco tem RLS (medido:
-- `pg_tables.rowsecurity = false` para `public.analises`); esta tabela seguiu
-- o mesmo precedente, não o de `public.proposicoes`.

create table if not exists public.vicios_legislativos (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references public.municipios(id_municipio) on delete cascade,

  ato_id uuid references public.atos_oficiais(id) on delete cascade unique,
  proposicao_id uuid references public.proposicoes(id) on delete cascade unique,
  constraint vicios_legislativos_um_objeto_so check (num_nonnulls(ato_id, proposicao_id) = 1),

  eixo text not null default 'municipal' check (eixo = 'municipal'),

  nivel_gravidade text not null default 'sem_indicio'
    check (nivel_gravidade in ('sem_indicio', 'indicio_leve', 'indicio_grave')),

  resumo text,   -- 1-3 frases pro cidadão, sempre com a ressalva de indício

  modelo text,
  versao_rubrica text,
  versao_prompt text,
  status text default 'ok' check (status in ('ok', 'requer_revisao', 'falhou')),
  criado_em timestamptz default now()
);

create index if not exists vicios_legislativos_municipio_nivel_idx on public.vicios_legislativos (id_municipio, nivel_gravidade);
create index if not exists vicios_legislativos_municipio_status_idx on public.vicios_legislativos (id_municipio, status);

create table if not exists public.vicio_itens (
  id uuid primary key default gen_random_uuid(),
  vicio_id uuid not null references public.vicios_legislativos(id) on delete cascade,
  id_municipio text not null references public.municipios(id_municipio) on delete cascade,

  categoria text not null check (categoria in (
    'vicio_iniciativa', 'vicio_competencia', 'inconstitucionalidade_material',
    'vicio_formal', 'contrabando_legislativo'
  )),
  dispositivo text not null,
  justificativa text,
  trecho text,
  confianca numeric(3,2)
);

create index if not exists vicio_itens_vicio_idx on public.vicio_itens (vicio_id);
create index if not exists vicio_itens_municipio_categoria_idx on public.vicio_itens (id_municipio, categoria);
