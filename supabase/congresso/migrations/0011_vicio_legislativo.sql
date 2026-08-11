-- 0011_vicio_legislativo.sql
-- Análise de VÍCIO LEGISLATIVO / indício de inconstitucionalidade —
-- companheira da análise garantista (`congresso.analises` / `analise_itens`,
-- 0001_schema.sql), não substituta. Mesma proposição pode ter as duas: uma
-- lê direção de direito, a outra lê quem propôs / que competência / que
-- rito. Tabelas separadas de propósito — misturar as duas num `analises`
-- só faria `rotulo` (garantista) e `nivel_gravidade` (vício) competirem pelo
-- mesmo espaço conceitual sem serem a mesma pergunta.
--
-- ═══ REGRA INEGOCIÁVEL, TAMBÉM NO BANCO ═══
--
-- `nivel_gravidade` só aceita 'sem_indicio' | 'indicio_leve' | 'indicio_grave'
-- — não existe 'inconstitucional' na taxonomia. Quem decide
-- inconstitucionalidade é o Judiciário; este app aponta indício com
-- dispositivo citado. Ver a régua completa em
-- `apps/web/lib/congresso/rubrica/vicio_legislativo.json`.
--
-- ═══ POR QUE `nivel_gravidade` NÃO É CALCULADO POR TRIGGER ═══
--
-- Mesma escolha da análise garantista: o cálculo determinístico
-- (`rubrica_vicio.calcular()` / `calcularVicio()`) roda no ETL e no
-- frontend, não no banco — auditável nos dois lugares que o produto expõe,
-- sem lógica escondida numa trigger que ninguém lê ao revisar o código.
--
-- ═══ SEM RLS, DE PROPÓSITO ═══
--
-- `congresso.analises` ganhou RLS em 0002_rls.sql (`to anon, authenticated`),
-- mas essas roles são do Supabase Auth e não existem no Postgres local desta
-- máquina (medido: `select rolname from pg_roles` não lista nem `anon` nem
-- `authenticated`) — o app conecta como `postgres` (superusuário), que
-- ignora RLS de qualquer jeito. Espelhando `public.analises` (0033 do
-- /betim, que tampouco tem RLS), esta migration fica sem `enable row level
-- security`: rodar `create policy ... to anon, authenticated` aqui
-- quebraria a aplicação local com "role does not exist". Se este projeto
-- voltar a apontar para Supabase hospedado, replicar o bloco (a) de
-- 0002_rls.sql para estas duas tabelas fica pendente, não esquecido.

create table if not exists congresso.vicios_legislativos (
  id uuid primary key default gen_random_uuid(),
  proposicao_id uuid not null unique references congresso.proposicoes(id) on delete cascade,

  -- Constante nesta tabela (só existe proposição federal aqui), mas a
  -- coluna existe mesmo assim: o par com `public.vicios_legislativos`
  -- (eixo 'municipal') dá ao frontend um contrato único — nenhuma tela
  -- precisa adivinhar o eixo pelo nome do schema de onde a linha veio.
  eixo text not null default 'federal' check (eixo = 'federal'),

  nivel_gravidade text not null default 'sem_indicio'
    check (nivel_gravidade in ('sem_indicio', 'indicio_leve', 'indicio_grave')),

  resumo text,   -- 1-3 frases pro cidadão, sempre com a ressalva de indício

  modelo text,
  versao_rubrica text,
  versao_prompt text,
  status text default 'ok' check (status in ('ok', 'requer_revisao', 'falhou')),
  criado_em timestamptz default now()
);

create index if not exists vicios_legislativos_nivel_idx on congresso.vicios_legislativos (nivel_gravidade);
create index if not exists vicios_legislativos_status_idx on congresso.vicios_legislativos (status);

create table if not exists congresso.vicio_itens (
  id uuid primary key default gen_random_uuid(),
  vicio_id uuid not null references congresso.vicios_legislativos(id) on delete cascade,

  categoria text not null check (categoria in (
    'vicio_iniciativa', 'vicio_competencia', 'inconstitucionalidade_material',
    'vicio_formal', 'contrabando_legislativo'
  )),
  -- Obrigatório pela mesma razão de `analise_itens.dispositivo`: item sem
  -- dispositivo citável é descartado ANTES de contar
  -- (`rubrica_vicio.validar_itens`). O `not null` é a última barreira.
  dispositivo text not null,
  justificativa text,   -- 1-2 frases, sempre "há indício de...", nunca veredito
  trecho text,           -- citação literal da ementa
  confianca numeric(3,2)
);

create index if not exists vicio_itens_vicio_idx on congresso.vicio_itens (vicio_id);
create index if not exists vicio_itens_categoria_idx on congresso.vicio_itens (categoria);
