-- Betim.ai — initial schema
-- Source of truth: "Betim.ai — Executable Plan.md" §4
-- Multi-city backbone: every data table carries id_municipio (FK -> municipios)

create extension if not exists pgcrypto;
create extension if not exists vector;
create extension if not exists pg_trgm;

-- 0. Multi-city registry
create table municipios (
  id_municipio text primary key,          -- '3106705'
  nome text not null, uf text not null,
  cnpj_prefeitura text, lat numeric, lng numeric,
  dominio text, branding jsonb,           -- colors, crest, portal name ("Betim.ai")
  fontes jsonb,                            -- per-source config/flags (camara module, portal hosts)
  ativo boolean default true
);

-- 1. Procurement & contracts (PNCP)
create table licitacoes (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  numero_controle_pncp text unique,       -- '18715391000196-1-000201/2025'
  orgao_cnpj text, orgao_nome text, unidade_nome text,
  modalidade_id int, modalidade_nome text,
  objeto text, processo text, srp boolean,
  valor_estimado numeric(15,2), valor_homologado numeric(15,2),
  situacao text, data_publicacao_pncp timestamptz,
  data_abertura timestamptz, data_encerramento timestamptz,
  link_sistema_origem text, raw jsonb,
  created_at timestamptz default now(), updated_at timestamptz
);

create table contratos (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  numero_controle_pncp text unique,
  numero_contrato text, ano int,
  orgao_cnpj text, orgao_nome text, unidade_nome text,
  categoria text, tipo text,
  objeto text,
  fornecedor_cnpj text, fornecedor_nome text,
  valor_inicial numeric(15,2), valor_global numeric(15,2), aditivos_total numeric(15,2) default 0,
  data_assinatura date, vigencia_inicio date, vigencia_fim date,
  numero_parcelas int, status text,       -- derived: ativo|encerrado
  alerta boolean default false, motivos_alerta text[],
  resumo_ia text,                          -- filled on demand, cached
  link_fonte text, raw jsonb,
  created_at timestamptz default now(), updated_at timestamptz
);
create index on contratos (id_municipio, ano);
create index on contratos using gin (to_tsvector('portuguese', objeto));

-- 2. Suppliers, partners, economic groups (br_me_cnpj)
create table fornecedores (
  cnpj text primary key,
  razao_social text, nome_fantasia text,
  situacao_cadastral text, cnae_principal text, cnae_descricao text,
  capital_social numeric(15,2), porte text, data_abertura date,
  municipio_sede text, uf_sede text,
  sancionado_ceis boolean default false, ceis_detalhes jsonb,
  atualizado_em date,
  created_at timestamptz default now(), updated_at timestamptz
);
create table socios (
  id uuid primary key default gen_random_uuid(),
  cnpj text references fornecedores,
  nome_socio text, documento_mascarado text, qualificacao text,
  unique (cnpj, nome_socio),
  created_at timestamptz default now(), updated_at timestamptz
);
create table grupos_economicos (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  nome_grupo text, setor text,
  cnpjs text[], socios_comuns text[],
  valor_total_contratos numeric(15,2), qtd_contratos int,
  detectado_em date,
  created_at timestamptz default now(), updated_at timestamptz
);

-- 3. Council (câmara)
create table vereadores (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  slug text, nome text, nome_urna text, partido text, cargo_mesa text,
  foto_url text, email text,
  mandato_inicio date, mandato_fim date, ativo boolean default true,
  votos_eleicao int, ano_eleicao int,
  id_candidato_tse text,                   -- sequencial TSE, key to donations
  declaracao_cotas text,
  unique (id_municipio, slug),
  created_at timestamptz default now(), updated_at timestamptz
);
create table proposicoes (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  vereador_id uuid references vereadores,
  tipo text,        -- projeto_lei | resolucao | decreto_legislativo | requerimento | indicacao | mocao
  numero int, ano int, ementa text, situacao text,   -- em_tramitacao | aprovado | recusado | protocolado
  data_apresentacao date, autores text[],
  resumo_ia text, link_fonte text,
  created_at timestamptz default now(), updated_at timestamptz
);
create table subsidios (        -- monthly councilor pay
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  vereador_id uuid references vereadores,
  competencia date, valor_bruto numeric(15,2), verbas_extras numeric(15,2) default 0,
  fonte text, unique (vereador_id, competencia),
  created_at timestamptz default now(), updated_at timestamptz
);
create table diarias (          -- per-diems & travel (council AND city hall)
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  orgao text,                    -- 'camara' | 'prefeitura'
  beneficiario text, vereador_id uuid references vereadores,
  destino text, data_inicio date, data_fim date, qtd_diarias numeric,
  valor numeric(15,2), motivo text, link_fonte text,
  created_at timestamptz default now(), updated_at timestamptz
);
create table doacoes_campanha (  -- br_tse_eleicoes.receitas_candidato
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  vereador_id uuid references vereadores,
  ano_eleicao int, doador_nome text, doador_tipo text,  -- PF | PJ
  doador_documento_mascarado text, valor numeric(15,2), data_doacao date,
  created_at timestamptz default now(), updated_at timestamptz
);
create table processos_judiciais (  -- Datajud/CNJ
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  vereador_id uuid references vereadores,
  numero_processo text, tribunal text,   -- TJMG | TRE-MG
  classe text, assuntos text[], papel text,   -- autor | reu
  status text, qtd_movimentacoes int,
  data_distribuicao date, ultima_movimentacao date,
  sentenca_data date, sentenca_tipo text,
  resumo_ia text, revisao_solicitada boolean default false,
  atualizado_em date,
  unique (vereador_id, numero_processo),
  created_at timestamptz default now(), updated_at timestamptz
);
create table pautas_atas (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  tipo text,          -- pauta | ata | sessao
  titulo text, data_sessao date, conteudo text, link_fonte text,
  created_at timestamptz default now(), updated_at timestamptz
);

-- 4. Public finance (SICONFI via BD)
create table receitas (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  ano int, estagio text, conta text, valor numeric(15,2),
  fonte text default 'br_me_siconfi',
  unique (id_municipio, ano, estagio, conta),
  created_at timestamptz default now(), updated_at timestamptz
);
create table despesas (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  ano int, estagio text, funcao text, conta text, valor numeric(15,2),
  fonte text default 'br_me_siconfi',
  unique (id_municipio, ano, estagio, funcao, conta),
  created_at timestamptz default now(), updated_at timestamptz
);

-- 5. City-hall people & acts
create table servidores (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  orgao text,                 -- prefeitura | camara
  nome text, cargo text, lotacao text, vinculo text,
  resumo_ia text, unique (id_municipio, orgao, nome, cargo),
  created_at timestamptz default now(), updated_at timestamptz
);
create table folha_pagamento (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  orgao text, competencia date,
  total_bruto numeric(15,2), qtd_servidores int,
  fonte text, unique (id_municipio, orgao, competencia),
  created_at timestamptz default now(), updated_at timestamptz
);
create table atos_oficiais (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  tipo text,      -- decreto | portaria | lei | lei_organica
  numero text, ano int, ementa text, data_publicacao date, link_fonte text,
  created_at timestamptz default now(), updated_at timestamptz
);
create table obras (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  nome text, situacao text, valor numeric(15,2), percentual_execucao numeric,
  bairro text, lat numeric, lng numeric, link_fonte text,
  created_at timestamptz default now(), updated_at timestamptz
);

-- 6. Indicators & thematic data
create table indicadores (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  nome text, valor text, valor_numerico numeric, ano_referencia int,
  fonte text, unidade text,
  unique (id_municipio, nome, ano_referencia),
  created_at timestamptz default now(), updated_at timestamptz
);
create table saude_estabelecimentos (   -- CNES
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  id_cnes text, nome text, tipo text, endereco text, bairro text,
  lat numeric, lng numeric, profissionais_count int, atualizado_em date,
  unique (id_municipio, id_cnes),
  created_at timestamptz default now(), updated_at timestamptz
);
create table saude_internacoes (        -- SIH yearly aggregates
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  ano int, carater text,                -- eletiva | urgencia
  qtd int, obitos int, permanencia_media numeric,
  unique (id_municipio, ano, carater),
  created_at timestamptz default now(), updated_at timestamptz
);
create table arboviroses (              -- InfoDengue
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  doenca text,   -- dengue | chikungunya | zika
  semana_epidemiologica int, ano int, casos int, nivel_alerta int,
  unique (id_municipio, doenca, ano, semana_epidemiologica),
  created_at timestamptz default now(), updated_at timestamptz
);
create table mortalidade (              -- SIM aggregates
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  ano int, grupo_causa text, obitos int, obitos_infantis int,
  unique (id_municipio, ano, grupo_causa),
  created_at timestamptz default now(), updated_at timestamptz
);
create table escolas (                  -- INEP censo escolar + IDEB
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  id_inep text, nome text, rede text, etapas text[],
  matriculas int, ideb_anos_iniciais numeric(4,2), ideb_anos_finais numeric(4,2),
  infraestrutura jsonb, lat numeric, lng numeric,
  unique (id_municipio, id_inep),
  created_at timestamptz default now(), updated_at timestamptz
);
create table beneficios_sociais (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  programa text, competencia date, beneficiarios int, valor_total numeric(15,2),
  fonte text, unique (id_municipio, programa, competencia),
  created_at timestamptz default now(), updated_at timestamptz
);
create table seguranca_ocorrencias (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  ano int, mes int, natureza text, qtd int, fonte text,
  unique (id_municipio, ano, mes, natureza),
  created_at timestamptz default now(), updated_at timestamptz
);
create table meio_ambiente (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  indicador text, ano int, valor numeric, unidade text, fonte text,
  unique (id_municipio, indicador, ano),
  created_at timestamptz default now(), updated_at timestamptz
);
create table emendas (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  esfera text,        -- federal | estadual
  parlamentar text, partido_uf text, ano int,
  valor_empenhado numeric(15,2), valor_pago numeric(15,2),
  objeto text, funcao text, link_fonte text,
  created_at timestamptz default now(), updated_at timestamptz
);
create table pntp (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  ano int, poder text,          -- executivo | legislativo
  indice numeric(5,2), nivel text, posicao_estado int, total_estado int,
  criterios_essenciais numeric(5,2), raw jsonb,
  unique (id_municipio, ano, poder),
  created_at timestamptz default now(), updated_at timestamptz
);
create table postos_anp (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  cnpj text, razao_social text, endereco text, bairro text,
  bandeira text, produtos text[], nota_anp int,
  infracoes jsonb, interditado boolean default false,
  lat numeric, lng numeric, atualizado_em date,
  created_at timestamptz default now(), updated_at timestamptz
);

-- 7. Citizen services (own data)
create table farmacias_plantao (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  nome text, endereco text, telefone text, foto_url text,
  plantao_inicio date, plantao_fim date, h24 boolean default false,
  lat numeric, lng numeric,
  created_at timestamptz default now(), updated_at timestamptz
);
create table coleta_lixo (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  bairro text, tipo text,       -- comum | seletiva
  dias_semana text[], horario text,
  created_at timestamptz default now(), updated_at timestamptz
);
create table contatos_uteis (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  nome text, telefone text, categoria text, ordem int,
  created_at timestamptz default now(), updated_at timestamptz
);
create table zap_estabelecimentos (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  nome text, whatsapp text, categoria text, descricao text,
  aprovado boolean default false,        -- admin moderation
  cliques int default 0,
  created_at timestamptz default now(), updated_at timestamptz
);
create table classificados (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  categoria text,    -- imoveis | veiculos | eletronicos | agro | servicos | outros
  titulo text, descricao text, preco numeric(15,2), fotos text[],
  contato_whatsapp text, aprovado boolean default false,
  expira_em date,
  created_at timestamptz default now(), updated_at timestamptz
);
create table anuncios (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  nome_comercio text, plano text,        -- basico | premium
  banner_url text, link text, ativo boolean default false,
  data_inicio date, data_fim date,
  created_at timestamptz default now(), updated_at timestamptz
);
create table newsletter_inscritos (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  email text, confirmado boolean default false, criado_em timestamptz default now(),
  unique (id_municipio, email)
);

-- 8. AI infrastructure
create table cache_ia (
  id uuid primary key default gen_random_uuid(),
  hash_prompt text unique, tipo text,    -- resumo_contrato | resumo_processo | chat | resumo_servidor
  entidade_id uuid, resposta text, modelo text, criado_em timestamptz default now()
);
create table embeddings (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  entidade text, entidade_id uuid, chunk_text text,
  embedding vector(384)                  -- MiniLM-L6-v2
);
create index on embeddings using hnsw (embedding vector_cosine_ops);

create table fontes_externas (
  nome text primary key, url text, tipo_dados text, ultima_atualizacao timestamptz
);
create table clima_cache (
  id_municipio text primary key references municipios,
  atual jsonb, diario jsonb, chuva_7d numeric, atualizado_em timestamptz
);

-- ─────────────────────────────────────────────────────────────────
-- Seed: Betim-MG (IBGE 3106705 — NOT 3106200, that's Belo Horizonte)
-- ─────────────────────────────────────────────────────────────────
insert into municipios (id_municipio, nome, uf, cnpj_prefeitura, lat, lng, dominio, branding, fontes, ativo)
values (
  '3106705', 'Betim', 'MG', '18715391000196', -19.9681, -44.1983,
  'betim.ai',
  '{"nome_portal": "Betim.ai"}'::jsonb,
  '{
    "prefeitura_transparencia_host": "http://servicos.betim.mg.gov.br/transparencia/",
    "prefeitura_transparencia_api": "REST",
    "camara_host": "https://camarabetim.mg.gov.br/",
    "camara_render": "spa",
    "diario_oficial": "https://www.betim.mg.gov.br/portal/diario-oficial/",
    "estado_municipios_count": 853
  }'::jsonb,
  true
);
