-- Internações hospitalares do SIH-SUS agregadas por CID-10 e município de
-- residência do paciente.
-- Coletor: `etl/betim/etl/bd/sih_cid.py`.
-- Fonte: `basedosdados.br_ms_sih.aihs_reduzidas` (código DATASUS de 6
-- dígitos em `id_municipio_paciente` — nunca usar o IBGE de 7, devolve
-- zero linhas em silêncio), capítulo via `br_bd_diretorios_brasil.cid_10`.
--
-- `cid_codigo` é normalizado pelo coletor (maiúsculo, sem ponto:
-- "J18.0" vira "J18") para casar com a taxonomia de vigilância em
-- `apps/web/lib/saude/cid.ts`.
--
-- Upsert por chave natural (id_municipio, ano, cid_codigo): a coleta é
-- incremental e a fonte é a mesma — reaplicar nunca duplica nem apaga
-- histórico de ano anterior.

create table if not exists saude_internacoes_cid (
  id                     uuid primary key default gen_random_uuid(),
  id_municipio           text not null,
  ano                    integer not null,
  cid_codigo             text not null,
  capitulo               text,
  internacoes_total      integer not null default 0,
  obitos_total           integer not null default 0,
  dias_permanencia_total numeric,
  valor_total            numeric,
  atualizado_em          date default current_date,
  created_at             timestamptz default now(),
  updated_at             timestamptz,
  constraint saude_internacoes_cid_id_municipio_fkey
    foreign key (id_municipio) references municipios (id_municipio),
  unique (id_municipio, ano, cid_codigo)
);
