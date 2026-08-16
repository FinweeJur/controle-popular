-- 0077_atos_diario.sql
-- Diário oficial: uma linha por matéria publicada — plano `docs/planos/
-- diario-oficial-plano.md`, fase D1. Primeira fonte: SIGPub/AMM-MG
-- (Diamantina — Prefeitura e Câmara), mecanismo de busca confirmado em
-- 16/08/2026 (GET + CSRF `_token` ligado à sessão + datas `dataInicio`/
-- `dataFim` obrigatórias em `dd/mm/yyyy` + tabela de resultados + paginação
-- por mês). A COLETA em si não começa antes da decisão de LGPD do usuário
-- (o plano: "o corte de LGPD é decisão do usuário"); esta migration é a
-- engenharia que pode avançar antes dela.
--
-- ═══ `link_fonte` OBRIGATÓRIO ═══
--
-- A lição de `contratos`, que passou 1.268 linhas sem link nenhum: um portal
-- que mostra ato administrativo sem apontar para o diário pede confiança.
-- Nenhuma linha desta tabela pode existir sem o link da matéria na fonte
-- (para o SIGPub, o `/amm-mg/load/<HASH>` opaco da matéria).
--
-- ═══ POR QUE `chave_natural` EMBUTINHA O FORNECEDOR ═══
--
-- O plano não tem coluna `fonte` (o fornecedor por município vive em
-- `municipios.fontes`, migration 0052). Para o upsert idempotente não
-- colidir se a mesma cidade trocar de fornecedor um dia, a chave natural
-- carrega o prefixo do fornecedor no PRÓPRIO VALOR: `sigpub:<hash>` hoje,
-- `dom_web:<...>` ou `diario_sp:<...>` depois. O par (id_municipio,
-- chave_natural) é a chave do `ON CONFLICT`, no mesmo molde de
-- `diarias` (0031).
--
-- ═══ `edicao`/`pagina`: vêm da página de detalhe ═══
--
-- A busca do SIGPub devolve entidade, título, órgão, data e link — a edição
-- e a página do diário estão na página de detalhe (`/amm-mg/load/<HASH>`).
-- Ficam nulas até o coletor as preencher a partir do detalhe; a cobertura
-- por dia (o modo de falha silencioso da paginação) usa `data_publicacao`.
--
-- ═══ `tipo` NOT NULL e sem default ═══
--
-- A classificação é determinística (`apps/web/lib/diario/classificarAto.ts`,
-- calibrada contra 70 títulos reais) e sempre devolve um dos 7 tipos —
-- `outro` incluso. NOT NULL faz falhar alto se um coletor tentar gravar
-- matéria sem classificar, em vez de aceitar silenciosamente um buraco.

create table if not exists atos_diario (
  id              uuid primary key default gen_random_uuid(),
  id_municipio    text not null references municipios,
  data_publicacao date not null,
  edicao          text,
  pagina          text,
  tipo            text not null
                    check (tipo in ('decreto', 'portaria', 'edital',
                                    'contrato', 'convenio', 'lei', 'outro')),
  numero_ato      text,
  orgao           text,
  ementa          text,
  texto           text,
  link_fonte      text not null,
  chave_natural   text,
  raw             jsonb,
  coletado_em     timestamptz not null default now()
);

comment on table atos_diario is
  'Diário oficial: uma linha por matéria publicada. Primeira fonte: SIGPub/AMM-MG '
  '(Diamantina). link_fonte obrigatório — a lição de contratos.';
comment on column atos_diario.tipo is
  'Tipo do ato, classificação determinística por título (classificarAto.ts): '
  'decreto | portaria | edital | contrato | convenio | lei | outro.';
comment on column atos_diario.chave_natural is
  'Id determinístico para upsert idempotente, com o prefixo do fornecedor embutido '
  '(ex.: sigpub:<hash>). Unique com id_municipio.';

-- "o que saiu" por município e a verificação de cobertura por dia (buraco de
-- dias é o modo de falha silencioso da paginação do SIGPub).
create index if not exists atos_diario_id_municipio_data_idx
  on atos_diario (id_municipio, data_publicacao desc);

-- "quantos decretos saíram esta semana" (contagem por tipo no resumo).
create index if not exists atos_diario_tipo_idx
  on atos_diario (tipo);

-- Guarda por `pg_class`, não por `pg_constraint`: constraint e índice dividem
-- o mesmo namespace de relações (mesma lição de 0031/0029 — nunca mexer a
-- quente com outra sessão).
do $$
begin
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relname = 'atos_diario_id_municipio_chave_natural_key'
      and n.nspname = 'public'
  ) then
    alter table atos_diario
      add constraint atos_diario_id_municipio_chave_natural_key
      unique (id_municipio, chave_natural);
  end if;
end
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on atos_diario to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on atos_diario to authenticated;
  end if;
end $$;
