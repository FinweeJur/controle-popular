-- 0072_patrimonio_tombado_iepha.sql
-- Patrimônio cultural tombado por Minas Gerais (pedido do dono, 2026-08-13,
-- Tarefa 2b da unificação de legislação: "isso hoje NÃO está no portal — o
-- acervo é ambiental. A fonte natural em Minas é o IEPHA-MG").
--
-- ═══ POR QUE TOMBAMENTO ENTRA NO PORTAL — NÃO É TEMA SOLTO ═══
--
-- Tombamento RESTRINGE o que pode ser feito com um território, exatamente
-- como unidade de conservação ambiental restringe. Uma serra tombada e uma
-- serra com lavra autorizada em cima é o mesmo tipo de conflito que
-- `ambiental_legislacao`/COPAM/licenciamento já mapeiam — o portal só
-- enxergava metade. Casos reais medidos na investigação que precedeu esta
-- migration: Serra do Curral (MPMG contra licenciamento de mineração sem
-- estudo de impacto no patrimônio) e Serra da Piedade (fraude investigada
-- para tentar destombar a serra e viabilizar lavra).
--
-- ═══ DE ONDE VEM O DADO ═══
--
-- CKAN de dados abertos de MG, dataset "Patrimônio Cultural Tombado"
-- (https://dados.mg.gov.br/dataset/bens-tombados), publicado pelo próprio
-- IEPHA-MG (Diretoria de Proteção e Memória) com curadoria da
-- Controladoria-Geral do Estado. Licença CC-BY-4.0, declarada no
-- `datapackage.json` do próprio dataset — a mesma abertura que já vale para
-- as outras fontes do portal. Espelho público em
-- https://github.com/transparencia-mg/bens-tombados. Baixado e medido em
-- 2026-08-13: 153 bens tombados (arquivo semente
-- `etl/betim/dados-seed/patrimonio-tombado-iepha.csv`, o mesmo schema do
-- `datapackage.json` da fonte — sem coluna inventada aqui).
--
-- ═══ O QUE NÃO ENTROU, E POR QUÊ (lacuna declarada, não escondida) ═══
--
-- GEOMETRIA: existe (camada `ide_2017_mg_tombamento_iepha_pto`, ponto, WMS/
-- WFS público no IDE-Sisema) mas não foi ingerida aqui — integrar ao mapa 3D
-- é trabalho de outra frente (`apps/web/public/terras/globo/**` está fora do
-- escopo desta tarefa por instrução explícita). Fica como próximo passo
-- registrado, não forçado.
--
-- BUSCA POR PROCESSO/API PRÓPRIA: o IEPHA não publica nenhuma — medido
-- (a orientação oficial pra consultar processo é ida presencial à
-- biblioteca do instituto). `ato_legal` abaixo é o texto livre que o CSV
-- fonte já dá (ex. "Decreto 19908, de 22 de maio de 1979"), não um link pro
-- diploma — diferente de `ambiental_legislacao.link_pdf`, que aponta pro
-- documento. Não é omissão deste ingestor: a fonte não linka.
--
-- ═══ POR QUE TABELA PRÓPRIA, NÃO DENTRO DE `ambiental_legislacao` ═══
--
-- Cada linha aqui é um BEM (um imóvel, um conjunto), não uma NORMA — o
-- `ato_legal` é só o instrumento que tombou aquele bem, não o assunto
-- principal do registro (mesma distinção que já vale entre
-- `direito_critico_normas`, que é norma, e `direito_critico_precedentes`,
-- que é decisão — formas de dado diferentes não viram uma tabela só
-- fingindo shape comum).

create table if not exists patrimonio_tombado_iepha (
  id                  uuid primary key default gen_random_uuid(),
  origem              text not null default 'iepha-bens-tombados',
  -- "PTE001/1979" — processo e ano de abertura, único na fonte.
  processo_ano        text not null,
  denominacao         text not null,
  denominacao_completa text not null,
  -- BI = bem imóvel; BM = bem móvel; CH = centro histórico; CP = conjunto
  -- paisagístico — os 4 valores que o datapackage.json da fonte declara,
  -- checados aqui pra pegar valor novo/typo da fonte como erro, não como
  -- categoria nova silenciosa.
  categoria           text not null check (categoria in ('BI', 'BM', 'CH', 'CP')),
  classe_subclasse    text,
  municipio           text not null,
  distrito             text,
  ato_legal           text,
  -- "I, II, III" etc — texto livre da fonte (Livro do Tombo, Decreto
  -- Estadual 14.260/1972), não normalizado pra array: os valores compostos
  -- da fonte ("I, II, III, IV") não têm separador consistente o bastante
  -- pra virar `text[]` sem risco de parsing errado.
  livro_de_tombo      text,
  created_at          timestamptz default now(),
  updated_at          timestamptz,
  -- NÃO é `unique (origem, processo_ano)`: medido no CSV fonte (2026-08-13)
  -- que `processo_ano` identifica o PROCESSO de tombamento, não o bem — 5
  -- processos cobrem mais de um bem cada (ex. PTE072/1984 tomba a Praça
  -- Hugo Werneck E os prédios da Maternidade Hilda Brandão E do Hospital
  -- Borges da Costa, três linhas, mesmo processo). A chave real de
  -- deduplicação é processo + denominação do bem.
  unique (origem, processo_ano, denominacao)
);

create index if not exists patrimonio_tombado_iepha_municipio_idx
  on patrimonio_tombado_iepha (municipio);
create index if not exists patrimonio_tombado_iepha_categoria_idx
  on patrimonio_tombado_iepha (categoria);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on patrimonio_tombado_iepha to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on patrimonio_tombado_iepha to authenticated;
  end if;
end $$;
