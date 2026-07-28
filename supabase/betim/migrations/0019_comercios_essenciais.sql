-- Supermercados e farmácias de Betim (pedido do usuário 2026-07-24:
-- "publicidade gratuita e informação pública relevante").
--
-- Fonte: OpenStreetMap (Overpass API), shop=supermarket + amenity=pharmacy.
-- NÃO é o CNPJ da Receita Federal (via Base dos Dados) -- a tabela
-- `br_me_cnpj.estabelecimentos` teria cobertura mais completa e telefone
-- oficial, mas é uma tabela histórica gigante (todo o Brasil, vários meses)
-- que estoura a cota gratuita do BigQuery com um filtro só por município;
-- migrar pra ela fica de backlog pra quando a cota permitir. OSM é público,
-- sem cota, mas crowdsourced -- cobertura incompleta (só 27 confirmados
-- dentro do polígono real de Betim, de ~106 candidatos brutos que incluíam
-- bairros de cidades vizinhas e pelo menos um erro de tag: "Droga Norte"
-- tinha addr:suburb="Centro" mas coordenadas reais fora do município).
create table comercios_essenciais (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  osm_id bigint not null,
  nome text not null,
  tipo text not null,           -- supermercado | farmacia
  bairro text,                  -- como o OSM registrou (addr:suburb), pode ser null
  endereco text,
  telefone text,
  lat numeric,
  lng numeric,
  fonte text default 'openstreetmap',
  unique (id_municipio, osm_id),
  created_at timestamptz default now(), updated_at timestamptz
);

alter table comercios_essenciais enable row level security;
create policy comercios_essenciais_public_select on comercios_essenciais for select using (true);
create policy comercios_essenciais_service_role_all on comercios_essenciais for all to service_role using (true) with check (true);
