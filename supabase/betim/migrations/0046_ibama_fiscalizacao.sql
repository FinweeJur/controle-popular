-- Autos de infração e embargos ambientais do IBAMA, por município.
--
-- Motivo de existir: é a primeira fonte ambiental NACIONAL do eixo /ambiental —
-- vale para toda cidade do projeto, não só as de MG. Achado na F0 de 2026-08-09
-- depois de uma pesquisa anterior (docs/betim/ambiental-pecma-research.md,
-- 2026-07-21) ter olhado só PECMA e o site do MPMG e concluído "sem fonte";
-- o IBAMA nunca tinha sido investigado. Escrito por
-- `etl/betim/etl/apis/ibama_fiscalizacao.py` — a docstring dele tem as
-- armadilhas medidas na fonte (`dadosabertos.ibama.gov.br`, catálogo CKAN).
--
-- ═══ POR QUE DUAS TABELAS, NÃO UMA ═══
--
-- Auto de infração e termo de embargo são instrumentos jurídicos DIFERENTES: um
-- auto pode existir sem embargo (multa sem interdição de área) e um embargo
-- referencia um auto (`CD_TERMOS_EMBARGOS`/`SEQ_AUTO_INFRACAO`), quando existe.
-- A fonte publica os dois como datasets CKAN separados, e a tela vai querer
-- listar cada um com colunas próprias — mantê-los separados evita uma tabela
-- com metade das colunas NULL dependendo do tipo de linha.
--
-- ═══ O QUE ESTES DADOS NÃO PROVAM ═══
--
-- `COD_MUNICIPIO` é o município onde o AUTO foi lavrado, não necessariamente
-- onde o dano ambiental ocorreu — o próprio coletor documenta exemplos antigos
-- de Betim que são autuações de transporte (provável barreira rodoviária na
-- BR-381), não fiscalização de propriedade dentro do município. Não é um
-- bloqueio técnico, mas a tela não pode alegar "dano ambiental em <cidade>" só
-- por causa de uma linha aqui — precisa olhar `tipo_infracao`/`descricao_infracao`.
--
-- CPF/CNPJ do autuado/embargado vem em claro na fonte (sem redação), ao lado de
-- nome completo, endereço e coordenada — o mesmo "Risco 1" já registrado para o
-- WFS de licenciamento estadual em `docs/ambiental/F0-discovery.md` §1.3. Grava-se
-- fiel ao que a fonte publica (é dado público federal, não nosso a redigir); a
-- tela decide como exibir.

create table if not exists ibama_autos_infracao (
  id                     uuid primary key default gen_random_uuid(),
  id_municipio           text not null references municipios(id_municipio) on delete cascade,
  seq_auto_infracao      bigint not null,
  numero_auto            text,
  tipo_auto              text,
  tipo_multa             text,
  valor_multa            numeric(14, 2),
  gravidade              text,
  data_fato              date,             -- DT_FATO_INFRACIONAL: quando o fato ocorreu
  data_lavratura         timestamptz,      -- DAT_HORA_AUTO_INFRACAO: quando o auto foi lavrado
  codigo_infracao        text,
  descricao_infracao     text,
  tipo_infracao          text,             -- Fauna | Flora | Pesca | Poluição | ...
  infrator_tipo_pessoa   text,             -- PF | PJ
  infrator_nome          text,
  infrator_cpf_cnpj      text,
  latitude               numeric(14, 9),
  longitude              numeric(14, 9),
  local_infracao         text,
  numero_termo_embargo   text,             -- CD_TERMOS_EMBARGOS: liga a ibama_embargos.numero_tad, quando houver
  municipio_fonte        text,             -- MUNICIPIO tal como o IBAMA grafa (auditoria/guarda de identidade)
  uf_fonte                text,
  atualizado_em          timestamptz,      -- ULTIMA_ATUALIZACAO_RELATORIO da fonte
  created_at             timestamptz default now(),
  updated_at             timestamptz,
  unique (id_municipio, seq_auto_infracao)
);

create index if not exists ibama_autos_infracao_municipio_data_idx
  on ibama_autos_infracao (id_municipio, data_fato desc);
create index if not exists ibama_autos_infracao_tipo_idx
  on ibama_autos_infracao (id_municipio, tipo_infracao);

create table if not exists ibama_embargos (
  id                     uuid primary key default gen_random_uuid(),
  id_municipio           text not null references municipios(id_municipio) on delete cascade,
  seq_tad                bigint not null,
  numero_tad             text,
  data_embargo           timestamptz,
  embargado_nome         text,
  embargado_cpf_cnpj     text,
  descricao              text,
  localizacao            text,
  latitude               numeric(14, 9),
  longitude              numeric(14, 9),
  area_embargada         numeric(16, 4),
  tipo_area              text,             -- TIPO_AREA: "Atividade" | "Imóvel" | ... (o que foi embargado, não a unidade de medida)
  situacao_desembargo    text,
  data_desembargo        timestamptz,
  seq_auto_infracao      bigint,           -- liga a ibama_autos_infracao.seq_auto_infracao, quando presente
  numero_auto_infracao   text,
  municipio_fonte        text,
  uf_fonte                text,
  atualizado_em          timestamptz,
  created_at             timestamptz default now(),
  updated_at             timestamptz,
  unique (id_municipio, seq_tad)
);

create index if not exists ibama_embargos_municipio_data_idx
  on ibama_embargos (id_municipio, data_embargo desc);

-- Grants: no Neon os papéis `anon`/`authenticated` do Supabase não existem, e
-- um grant a papel inexistente aborta a migration inteira. Ver
-- `apps/web/scripts/aplicar-migration.mts`.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on ibama_autos_infracao, ibama_embargos to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on ibama_autos_infracao, ibama_embargos to authenticated;
  end if;
end $$;
