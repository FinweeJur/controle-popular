-- Reuniões do COPAM e itens de pauta, por município.
-- Coletor: `etl/betim/etl/apis/copam_reunioes.py`.
-- Viabilidade medida em 2026-08-11 ANTES desta migration, ao vivo, contra a
-- fonte real — ver `docs/ambiental/F0-discovery.md` §14 e o commit
-- `2de85af`: 21 reuniões, 176 itens substantivos, 97,2% com município
-- recuperado (100% dos que de fato tratam de um lugar).
--
-- ═══ DUAS TABELAS, NÃO TRÊS — MUNICÍPIO É ARRAY, NÃO TABELA DE JUNÇÃO ═══
--
-- O F0 §14.4 mediu um item com MAIS DE UM município (plano de compensação da
-- Vale, id=1979, três cidades num item só). Uma FK escalar em
-- `copam_pauta_itens.id_municipio` perderia essa linha ou obrigaria escolher
-- uma cidade arbitrariamente. `municipios_ids text[]` guarda todas, e
-- `municipios_nomes text[]` (paralelo, mesma ordem) guarda a grafia como a
-- fonte escreveu — sem isso, auditar um match errado exigiria voltar à
-- fonte toda vez. Postgres não tem FK de elemento de array, então a
-- integridade fica a cargo do coletor (que só grava id resolvido contra
-- `ref_municipios_mg`, nunca inventa) — mesma postura de
-- `resolver_municipio_mg`: abaixo do limiar de confiança, não entra.
--
-- ═══ POR QUE UPSERT POR CHAVE NATURAL, NÃO refresh_completo_seguro ═══
--
-- `refresh_completo_seguro` (delete+insert) pressupõe um recorte que pode
-- ENCOLHER por engano (ex. cidade cuja raspagem trouxe menos linhas). Reunião
-- do COPAM não tem esse risco: `id_fonte` é o `?id=` da própria fonte,
-- estável, e a coleta é incremental (nova reunião publicada, reunião
-- existente ganha Decisão/Ata que não tinha antes) — upsert por
-- `id_fonte`/`(id_reuniao, numero_item)` é o padrão que `anp.py`,
-- `feriados.py` e `transparencia_gov.py` já usam para catálogo crescente
-- com chave estável da própria fonte.
--
-- ═══ NEM TODO ITEM DE PAUTA TEM MUNICÍPIO, E ESTÁ CERTO ═══
--
-- §14.3: das 5 lacunas que sobraram depois das duas camadas de extração,
-- nenhuma era falha — eram itens genuinamente sem local (minuta normativa,
-- apresentação de programa, ata mal-rotulada). Por isso `municipios_ids` é
-- `text[]` DEFAULT '{}', não NOT NULL com valor obrigatório: array vazio
-- significa "sem local — item de política geral", não "falha de extração".
-- Itens puramente administrativos (abertura, hino, comunicados, "assuntos
-- gerais", encerramento) o coletor nem grava aqui — não são pauta de
-- deliberação, são procedimento de toda reunião.

create table if not exists copam_reunioes (
  id                uuid primary key default gen_random_uuid(),
  id_fonte          integer not null,             -- o ?id= de view-externo
  titulo            text not null,
  data              date not null,
  camara_tecnica    text,                          -- "URC CM - Copam" (coluna 4 da listagem)
  regional          text,                          -- "URC CM - Central Metropolitana do Copam" (coluna 5)
  situacao          text not null,                 -- agendada | aguardando_decisao | concluida
  link_detalhe      text not null,                 -- view-externo?id=<id_fonte>, sempre gerável
  link_pauta_pdf    text,                           -- pauta consolidada usada pelo coletor (camada 2)
  link_decisao_pdf  text,
  link_ata_pdf      text,
  qtd_itens_pauta   integer not null default 0,     -- itens substantivos gravados desta reunião
  atualizado_em     date default current_date,
  created_at        timestamptz default now(),
  updated_at        timestamptz,
  unique (id_fonte)
);

create index if not exists copam_reunioes_data_idx
  on copam_reunioes (data desc);
create index if not exists copam_reunioes_situacao_idx
  on copam_reunioes (situacao);

create table if not exists copam_pauta_itens (
  id                uuid primary key default gen_random_uuid(),
  id_reuniao        uuid not null references copam_reunioes(id) on delete cascade,
  numero_item       text not null,                  -- "6.1", "7.1", "5" — como a pauta numera
  processo          text,                            -- PA/CAP/Nº, AI/Nº etc. (achado por regex; ver docstring do coletor)
  empreendimento    text,                            -- melhor esforço: 1º segmento antes do primeiro " - "
  municipios_ids     text[] not null default '{}',    -- ref_municipios_mg.id_ibge, um ou mais
  municipios_nomes   text[] not null default '{}',    -- grafia oficial casada, mesma ordem de municipios_ids
  municipio_fonte    text,                            -- campo_estruturado | texto_pauta | null
  decisao           text,                            -- best-effort do PDF de Decisão; NULL = ainda sem decisão
  texto_pauta       text not null,                    -- parágrafo bruto do PDF da Pauta — a verdade-base
  link_documento    text,                             -- 1º anexo (parecer/recurso) deste item, se houver
  created_at        timestamptz default now(),
  updated_at        timestamptz,
  unique (id_reuniao, numero_item)
);

create index if not exists copam_pauta_itens_reuniao_idx
  on copam_pauta_itens (id_reuniao);
-- A consulta que a tela faz: "que itens tratam do meu município". GIN por
-- ser array — `municipios_ids @> ARRAY[$1]` ou `$1 = ANY(municipios_ids)`.
create index if not exists copam_pauta_itens_municipios_idx
  on copam_pauta_itens using gin (municipios_ids);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on copam_reunioes to anon;
    grant select on copam_pauta_itens to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on copam_reunioes to authenticated;
    grant select on copam_pauta_itens to authenticated;
  end if;
end $$;
