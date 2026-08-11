-- Local geocodificado de uma norma (`atos_oficiais`), quando a ementa cita um
-- logradouro/bairro/distrito reconhecível. Alimenta a camada
-- `normas-geolocalizadas` do globo 3D (`/funcaosocialterra/mapa`).
--
-- ═══ VIABILIDADE MEDIDA ANTES ═══ (docs/normas-mapa-viabilidade.md)
--
-- 11,2% dos 10.317 atos oficiais (1.160) têm alguma menção de logradouro/
-- bairro/distrito na ementa. Testado também o texto completo da norma (API
-- do DOM-web de BH, PDF de Itinga via pymupdf): não aumenta a cobertura real
-- -- só adicionou ruído (BH) ou não tem texto extraível (Itinga, 94% scan de
-- imagem). Por isso esta tabela só usa `ementa`, nunca PDF.
--
-- Revisão manual de 30 casos: 90% são referência real de lugar (a maioria em
-- nível de bairro/distrito, uma parte com rua + número em decretos de São
-- Paulo). O corte de confiança abaixo reflete essa distinção: `alta` quando
-- a ementa cita um logradouro com nome próprio (rua/avenida/praça/travessa/
-- alameda/estrada/rodovia/largo/viela + nome capturável), `media` quando só
-- há bairro/distrito/vila/loteamento -- geocodificável, mas com precisão de
-- bairro, não de endereço.
--
-- ═══ POR QUE NÃO MEXE EM `atos_oficiais` ═══
--
-- É extração DERIVADA (regex + geocodificação), não dado da fonte. Guardar
-- separado deixa claro que "sem linha aqui" é "não conseguimos localizar",
-- nunca "esta norma não existe" -- e permite reprocessar (mudar o regex,
-- regeocodificar) sem tocar na tabela que os coletores de legislação já
-- escrevem toda semana.
--
-- ═══ `feature_index` ═══
--
-- Índice da feature dentro do GeoJSON estático gerado por
-- `etl/betim/etl/normas_geo/gerar_geojson.py`
-- (`apps/web/public/terras/globo/dados/camadas/normas-geolocalizadas.geojson`).
-- O globo abre uma feature específica por `#area=<camada>:<índice>` -- não
-- por id estável -- então o link "Ver no mapa" da página da norma precisa
-- saber, EM BUILD TIME, qual índice aquele ato_id ocupa no arquivo atual.
-- `gerar_geojson.py` escreve o GeoJSON e este campo NA MESMA rodada, para os
-- dois nunca dessincronizarem.

create table if not exists atos_oficiais_geo (
  id                     uuid primary key default gen_random_uuid(),
  ato_id                 uuid not null unique references atos_oficiais(id) on delete cascade,
  tipo_local             text not null,   -- rua | avenida | praca | travessa | alameda | estrada | rodovia | largo | viela | bairro | distrito | vila | loteamento
  texto_extraido         text not null,   -- nome capturado da ementa, ex. "Rua Centralina"
  confianca              text not null check (confianca in ('alta', 'media')),
  query_geocodificacao   text not null,   -- string exata enviada ao Nominatim, para auditoria
  lat                    double precision,
  lng                    double precision,
  geocodificado_em       timestamptz,
  feature_index          integer,         -- posição no GeoJSON gerado; null até gerar_geojson.py rodar
  created_at             timestamptz default now()
);

create index if not exists atos_oficiais_geo_ato_idx
  on atos_oficiais_geo (ato_id);
-- A consulta do link "Ver no mapa": "este ato tem geocodificação com
-- feature_index preenchido?"
create index if not exists atos_oficiais_geo_feature_idx
  on atos_oficiais_geo (feature_index) where feature_index is not null;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on atos_oficiais_geo to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on atos_oficiais_geo to authenticated;
  end if;
end $$;
