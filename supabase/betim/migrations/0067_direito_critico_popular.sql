-- 0067_direito_critico_popular.sql
-- Seção "legislação e precedentes por tema de direito protegido" (pedido do
-- dono, 2026-08-12): consultar legislação NACIONAL/INTERNACIONAL e
-- precedente judicial na mesma busca, filtrando por tema de direito
-- protegido (serras, rios, flora/fauna, quilombola, indígena, povos e
-- comunidades tradicionais, direitos humanos).
--
-- ═══ DE ONDE VEM O DADO, E POR QUE DUAS TABELAS ═══
--
-- Fonte semente: `etl/betim/dados-seed/direito-critico-popular.html`, HTML
-- curado "Direito Crítico Popular" com dois arrays JS embutidos — `LAWS`
-- (30 instrumentos normativos) e `JURIS` (15 precedentes). São coisas
-- estruturalmente diferentes (norma vs. decisão judicial: uma tem artigos,
-- a outra tem ementa/tribunal) — achatar as duas num "acervo" só faria a
-- tela perder a distinção que o pedido do dono exige ("legislação e
-- precedente [...] distinguíveis"). Duas tabelas, ingestor único
-- (`scripts/ingest-direito-critico-popular.mts`) lendo o mesmo HTML.
--
-- ═══ POR QUE `temas` É ARRAY, NÃO TABELA-PONTE (mesmo raciocínio da 0066) ═══
--
-- 45 linhas ao todo — nem de longe o volume que justificaria uma
-- tabela-ponte. A tela filtra no cliente (mesma decisão de
-- `lib/db/queries/legislacao-ambiental.ts`), e `temas && array[...]` com
-- índice GIN resolve a consulta sem JOIN.
--
-- ═══ POR QUE `temas` NÃO É CLASSIFICAÇÃO AUTOMÁTICA ═══
--
-- Diferente de `ambiental_legislacao.temas` (palavra-chave na ementa,
-- reprodutível por script), aqui não há campo de tema nenhum na fonte — a
-- atribuição por lei/precedente é leitura humana do `relevance`/`articles`
-- de cada entrada (documentada linha a linha no dicionário `TEMAS_POR_ID`
-- do ingestor, com o trecho do texto que justifica cada tema). Fica
-- reexecutável (o ingestor sempre produz o mesmo resultado a partir do
-- mesmo HTML + do mesmo dicionário), mas não é "indício automático" —
-- é curadoria declarada como tal.
--
-- ═══ O BURACO NO ACERVO, DECLARADO AQUI PORQUE A TAREFA PEDIU ═══
--
-- O HTML semente foi curado inteiramente em torno de barragens e atingidos
-- (Mariana, Brumadinho, MAB). Medido nas 45 entradas: ZERO instrumento
-- toca proteção de serras (nenhuma ocorrência de "serra" fora de nome
-- próprio) e ZERO toca proteção de espécie de flora/fauna especificamente
-- (nenhuma ocorrência de "fauna", "flora", "espécie" ou "biodiversidade").
-- Esses dois temas continuam OFERECIDOS no filtro — não somem da lista —
-- mas a tela precisa dizer "nenhum instrumento catalogado ainda" quando
-- selecionados, nunca fingir com um resultado vazio mudo. Rios, indígena,
-- quilombola, povos tradicionais e direitos humanos têm cobertura real,
-- desigual entre si (ver contagem publicada pela própria tela).

create table if not exists direito_critico_normas (
  id             uuid primary key default gen_random_uuid(),
  origem         text not null default 'direito-critico-popular',
  id_fonte       integer not null,       -- LAWS[i].id no HTML semente, estável
  numero         text,
  nome_curto     text not null,
  nome_completo  text not null,
  natureza       text not null check (natureza in ('nacional', 'internacional')),
  destaque       boolean not null default false,   -- LAWS[i].key
  link_oficial   text not null,
  -- HTML já sanitizado pelo ingestor (só <strong> sobrevive — ver
  -- `sanitizarHtmlCurado` no script). Nunca grave aqui o campo bruto da
  -- fonte sem passar por ele: é o mesmo tipo de furo corrigido em
  -- `6549ae3` (Mapa 3D, 2026-08-12), só que aqui a fonte é curada por nós
  -- em vez de raspada de terceiro — mesmo assim não é motivo para pular a
  -- sanitização, porque HTML variando por ingest não é dado confiável só
  -- por ser "nosso".
  relevancia_html text not null,
  -- [{id, destaque, titulo, texto}] — `texto` já em texto puro (tooltips
  -- de glossário do HTML original são descartados no ingestor, não
  -- reproduzidos: ver comentário em `extrairArtigos`).
  artigos        jsonb not null default '[]',
  temas          text[] not null default '{}',
  created_at     timestamptz default now(),
  updated_at     timestamptz,
  unique (origem, id_fonte)
);

create table if not exists direito_critico_precedentes (
  id             uuid primary key default gen_random_uuid(),
  origem         text not null default 'direito-critico-popular',
  id_fonte       integer not null,       -- JURIS[i].id no HTML semente
  tribunal       text not null,          -- STJ | STF | TJMG | Corte IDH | ONU
  natureza       text not null check (natureza in ('nacional', 'internacional')),
  destaque       boolean not null default false,
  link_oficial   text,
  titulo         text not null,
  referencia     text,                   -- ex.: "REsp 1.374.284/MG"
  ementa         text not null,          -- texto puro na fonte, sem HTML — medido
  relevancia     text not null,          -- idem
  tags           text[] not null default '{}',  -- vocabulário próprio da fonte (ex.: "Risco Integral")
  temas          text[] not null default '{}',  -- os mesmos temas de direito protegido de `direito_critico_normas`
  created_at     timestamptz default now(),
  updated_at     timestamptz,
  unique (origem, id_fonte)
);

create index if not exists direito_critico_normas_natureza_idx
  on direito_critico_normas (natureza);
create index if not exists direito_critico_normas_temas_idx
  on direito_critico_normas using gin (temas);

create index if not exists direito_critico_precedentes_natureza_idx
  on direito_critico_precedentes (natureza);
create index if not exists direito_critico_precedentes_temas_idx
  on direito_critico_precedentes using gin (temas);
create index if not exists direito_critico_precedentes_tags_idx
  on direito_critico_precedentes using gin (tags);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on direito_critico_normas to anon;
    grant select on direito_critico_precedentes to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on direito_critico_normas to authenticated;
    grant select on direito_critico_precedentes to authenticated;
  end if;
end $$;
