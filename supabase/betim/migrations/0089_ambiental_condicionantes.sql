-- Condicionantes ambientais de barragens/empreendimentos — piloto Irapé +
-- Setúbal. Plano: docs/planos/PLANO-CONDICIONANTES-AMBIENTAIS.md.
-- Descoberta e downloads medidos: docs/06-fontes/FONTES.md § Condicionantes.
--
-- ═══ TRÊS TABELAS E A REGRA DO STATUS (decisão 1 do dono, 23/09) ═══
--
-- `cumprida` / `nao_cumprida` / `parcial` SÓ com evidência linkada em
-- `condicionantes_evidencias` (DCE, PAE, auto, relatório, ata oficial).
-- Sem evidência: `nao_informado` (+ o que existe perto na tela). A coluna
-- `metodo_status` grava COMO o status foi decidido para a página poder
-- rotular ("sem evidência pública até 23/09/2026") — nunca inventar
-- descumprimento item a item a partir de contagem de licença (AGENTS §7).
--
-- LLM só preenche `resumo_ia`, com data e modelo (decisão 5). Nunca toca
-- em `status`.
--
-- ═══ TEXTO INTEGRAL NÃO MORA AQUI (decisão 3) ═══
--
-- O PDF completo vai para o espelho R2 (`hash_sha256` + `url_r2`).
-- Postgres guarda metadado, trecho da condicionante, resumo e status.
-- Neon está em ~94% (470/500 MB, ESTADO 22/09); o app novo coleta no
-- Postgres do Guara — esta migration entra no mesmo destino das cargas
-- de 22/09.
--
-- ═══ PÚBLICO ACADÊMICO FICA DE FORA ═══
--
-- Dissertação, tese, artigo e relatório GESTA não viram linha de
-- `condicionantes` (decisão 6). Vão no rodapé "Para saber mais" da página
-- da barragem, em `lib/ambiental/publicacoes-barragens.ts`.
--
-- ═══ POR QUE `empreendimento` É TEXTO E `barragem_ref` É NULLABLE ═══
--
-- Piloto: Irapé (hidrelétrica CEMIG) e Setúbal (uso múltiplo Ruralminas/
-- COPASA — corrigido em 23/09: não é UHE em operação). Nem toda
-- condicionante nasce de barragem cadastrada em FEAM/SNISB; `barragem_ref`
-- casa por código/id da fonte (AGENTS §6), nunca por nome, e fica NULL
-- quando não há correspondência — visível, não descartado.
--
-- ═══ VOCABULÁRIO FECHADO EM CHECK, VALIDAÇÃO NO ETL ═══
--
-- Mesmo raciocínio da migration 0078: vocabulário de status/tipo em CHECK
-- para a tela confiar; tipo de documento deixa `text` sem CHECK extremo
-- porque a fonte pode trazer rótulo novo — o ETL reporta desconhecido em
-- vez de derrubar a carga no meio da madrugada.

create table if not exists documentos_ambientais (
  id                  uuid primary key default gen_random_uuid(),
  url_fonte           text not null,
  url_r2              text,                          -- espelho; preenche após sincronizar-documentos-r2
  hash_sha256         text,                          -- do bytes do PDF (decisão 3)
  orgao               text not null,                 -- CBH/COPAM | IEF | FEAM | MPF | …
  empreendimento      text not null,                 -- rótulo estável do piloto (Irapé | Setúbal)
  tipo_documento      text not null,                 -- lp | li | lo | tac | parecer | ata | cap | outro
  data_documento      date,                          -- quando a fonte publica data
  numero_processo     text,                          -- cru; NUNCA chave única sozinho (AGENTS §6)
  metodo_texto        text not null default 'nativo'
                        check (metodo_texto in ('nativo', 'ocr', 'sem_texto')),
  aprovado_para_publicacao boolean not null default false,  -- só true após varredura CPF no texto
  created_at          timestamptz default now(),
  updated_at          timestamptz,
  unique (url_fonte, hash_sha256)
);

create index if not exists documentos_ambientais_empreendimento_idx
  on documentos_ambientais (empreendimento);
create index if not exists documentos_ambientais_tipo_idx
  on documentos_ambientais (tipo_documento);
create index if not exists documentos_ambientais_hash_idx
  on documentos_ambientais (hash_sha256);

create table if not exists condicionantes (
  id                  uuid primary key default gen_random_uuid(),
  documento_id        uuid not null references documentos_ambientais(id) on delete cascade,
  empreendimento      text not null,
  -- FK opcional para FEAM/SNISB por código/id da fonte; NULL = sem casamento
  barragem_ref_fonte  text,                          -- ex. id_sigibar / id SNISB, texto
  barragem_ref_origem text,                          -- 'feam' | 'snisb' | null
  ordem_na_fonte      int,                           -- posição na licença, para reproduzir a ordem
  texto               text not null,                 -- trecho da condicionante (não o PDF inteiro)
  tipo                text not null default 'outra'
                        check (tipo in (
                          'reassentamento', 'ambiental', 'social', 'cultural',
                          'seguranca', 'monitoramento', 'relatorio', 'prazo',
                          'compensacao', 'outra'
                        )),
  prazo               text,                          -- texto da fonte ("até a próxima fase"); não inventar data
  orgao               text not null,
  status              text not null default 'nao_informado'
                        check (status in (
                          'cumprida', 'parcial', 'nao_cumprida',
                          'nao_informado', 'em_analise'
                        )),
  metodo_status       text not null default 'sem_evidencia'
                        check (metodo_status in (
                          'evidencia_estruturada', 'evidencia_documental', 'sem_evidencia'
                        )),
  confianca           numeric(3, 2),                 -- 0..1; null = não medida
  resumo_ia           text,                          -- só rótulo "gerado por máquina" + data + modelo na UI
  resumo_ia_modelo    text,
  resumo_ia_em        date,
  created_at          timestamptz default now(),
  updated_at          timestamptz
);

create index if not exists condicionantes_empreendimento_idx
  on condicionantes (empreendimento);
create index if not exists condicionantes_status_idx
  on condicionantes (status);
create index if not exists condicionantes_tipo_idx
  on condicionantes (tipo);
create index if not exists condicionantes_documento_idx
  on condicionantes (documento_id);
create index if not exists condicionantes_barragem_idx
  on condicionantes (barragem_ref_origem, barragem_ref_fonte);

create table if not exists condicionantes_evidencias (
  id                uuid primary key default gen_random_uuid(),
  condicionante_id  uuid not null references condicionantes(id) on delete cascade,
  tipo              text not null
                      check (tipo in ('dce', 'pae', 'auto', 'relatorio', 'ata', 'outro')),
  -- URL ESPECÍFICA do ato (nunca home genérica) — AGENTS §8
  url_especifica    text not null,
  data              date,
  observacao        text,
  created_at        timestamptz default now()
);

create index if not exists condicionantes_evidencias_cond_idx
  on condicionantes_evidencias (condicionante_id);
create index if not exists condicionantes_evidencias_tipo_idx
  on condicionantes_evidencias (tipo);

-- Sem evidência não há status cumprida/nao_cumprida (decisão 1).
-- `em_analise` e `nao_informado` passam sem evidência.
alter table condicionantes drop constraint if exists condicionantes_status_exige_evidencia;
alter table condicionantes
  add constraint condicionantes_status_exige_evidencia
  check (
    status not in ('cumprida', 'nao_cumprida', 'parcial')
    or metodo_status <> 'sem_evidencia'
  );

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on documentos_ambientais to anon;
    grant select on condicionantes to anon;
    grant select on condicionantes_evidencias to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on documentos_ambientais to authenticated;
    grant select on condicionantes to authenticated;
    grant select on condicionantes_evidencias to authenticated;
  end if;
end $$;
