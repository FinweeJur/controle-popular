-- terras — schema NOVO do eixo Terras Devolutas dentro do Controle Popular.
--
-- Integra o projeto acadêmico `terras-devolutas` (escopo: vazio cadastral
-- por método `limite_municipal − cadastro − exclusões`, ver
-- X:\DevCoder\terras-devolutas\docs\METODO.md) como SEÇÃO da zona Cidades
-- (`app/[municipio]/terras`), não como zona própria.
--
-- POLÍGONO NUNCA ENTRA AQUI. Medido em 2026-08-08: os 131 GPKGs de saída
-- do pipeline somam 160,8 MB — mais que o storage livre do projeto Neon
-- (0,5 GB/projeto, já em ~78% de uso pelos 3 eixos existentes). As camadas
-- que o app precisa servir (já geradas e comprimidas pelo pipeline, em
-- `terras-devolutas/backend/data/camadas/*.geojson.gz`) somam 1,55 MB e vão
-- como Static Asset do Worker — não pesam no teto de 3 MiB gzip, não usam
-- storage nem egress da Neon. Só o ROLLUP numérico por município mora aqui.
--
-- DOIS MÉTODOS, DENOMINADORES DIFERENTES — nunca somar entre si:
--   vazio_cadastral   → área municipal total menos CAR menos exclusões.
--   candidatos_bacia  → área pública certificada (INCRA) que é pastagem
--                        persistente (MapBiomas classe 15, 2020-2024).
-- Ver METODO.md §1.1. Conflar os dois inventaria dado que a metodologia do
-- próprio projeto trata como perguntas distintas.

create schema if not exists terras;

create table terras.vazio_municipio (
  id_municipio text not null references public.municipios(id_municipio),
  metodo text not null check (metodo in ('vazio_cadastral', 'candidatos_bacia')),
  recorte text not null check (recorte in ('paraopeba', 'jequitinhonha', 'mucuri', 'vales')),

  -- Denominador: área total do universo que o método mede (município
  -- inteiro para vazio_cadastral; área pública certificada para
  -- candidatos_bacia). NUNCA exibir o numerador sem este par.
  area_universo_ha numeric not null,
  area_candidata_ha numeric not null,
  qtd_poligonos integer not null,

  -- proveniencia: a regra exata que gerou a linha (ex.: "limite_municipal
  -- − cadastro − exclusoes"), copiada de dados/PROVENIENCIA.json do
  -- pipeline. Nunca um resumo escrito à mão — é a mesma disciplina de
  -- `congresso.rubrica.json`: se o pipeline mudar a regra e este texto não
  -- acompanhar, o site afirma um método que não é o que rodou.
  proveniencia text not null,
  metodo_versao_data date not null,

  gerado_em timestamptz not null default now(),

  primary key (id_municipio, metodo, recorte)
);

comment on table terras.vazio_municipio is
  'Rollup por município do pipeline terras-devolutas. Sem geometria — ver nota no topo da migration.';
