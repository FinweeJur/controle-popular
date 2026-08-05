-- Votação nominal nas câmaras municipais: quem votou o quê.
--
-- O ranking de atuação mede o que o vereador APRESENTA. Voto é a outra
-- metade — e a maior parte da atuação legislativa é votar o que os outros
-- propõem. Esta é a tabela que permite, onde a casa publica, aplicar a régua
-- do "Quem Foi Quem" (votação nominal, grau de disputa) em vez de só a de
-- autoria.
--
-- NEM TODA CÂMARA PUBLICA. Medido em 2026-08-04, com verificação cética:
--   São Paulo  — SIM. XML anual em dados abertos, com IDParlamentar.
--   Betim      — SIM, em PDF por votação.
--   Belo Horizonte — NÃO. A CMBH publica placar agregado na ata e nada mais;
--                    o voto individual NÃO EXISTE em fonte nenhuma. Não é
--                    limitação de raspagem. A tela terá de dizer isso.
--
-- ═══ POR QUE `vereador_id` É ANULÁVEL ═══
--
-- Seria mais limpo exigir a FK. Mas o XML de São Paulo tem DUAS formas de
-- registrar voto individual, e só uma traz identificador:
--
--   <Vereador Nome Partido IDParlamentar Voto/>   -> nominal, tem a chave
--   <VotoContrario Partido_Vereador="NOME - PARTIDO"/>  -> só o texto
--
-- O segundo aparece dentro de votação SIMBÓLICA, para registrar quem votou
-- contra quando a casa não abre o painel. São 504 ocorrências só em 2025 e
-- ~4.9 mil na série 2012-2026 — e a votação nominal DESABOU nos anos
-- recentes (2026: 10 nominais contra 271 VotoContrario). Exigir a FK
-- descartaria em silêncio justamente o registro de dissidência dos anos em
-- que ele é quase tudo o que sobrou.
--
-- Por isso `nome_fonte`/`partido_fonte` guardam o que a fonte disse, e
-- `origem` diz de qual das duas formas o voto veio — a distinção importa
-- para o leitor: "votou não no painel" e "consta como voto contrário numa
-- simbólica" não são a mesma afirmação.
create table if not exists votacoes_camara (
  id             uuid primary key default gen_random_uuid(),
  id_municipio   text not null references municipios(id_municipio),
  id_externo     text not null,
  data           date,
  sessao         text,
  -- 'Nominal' | 'Simbólica' na grafia da fonte.
  tipo_votacao   text,
  materia        text,
  ementa         text,
  resultado      text,
  -- PLACAR DECLARADO PELA FONTE, guardado como fato SEPARADO das linhas de
  -- voto. Em São Paulo os dois divergem em 526 de 2.117 votações nominais
  -- (24,9%) — normalmente sobra uma linha em relação ao placar. Derivar um
  -- do outro, em qualquer direção, inventaria número: o certo é gravar os
  -- dois e deixar a divergência visível para quem for auditar.
  presentes      integer,
  placar_sim     integer,
  placar_nao     integer,
  placar_abstencao integer,
  placar_branco  integer,
  notas          text,
  link_fonte     text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique (id_municipio, id_externo)
);

create table if not exists votos_camara (
  id           uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios(id_municipio),
  votacao_id   uuid not null references votacoes_camara(id) on delete cascade,
  -- Anulável de propósito — ver o bloco no topo.
  vereador_id  uuid references vereadores(id),
  nome_fonte   text,
  partido_fonte text,
  -- 'Sim' | 'Não' | 'Abstenção' — e, na eleição da Mesa, o NOME DO CANDIDATO.
  -- Sem CHECK nem enum: em São Paulo 103 linhas trazem "Jose Americo (PT)" e
  -- afins no lugar do voto, porque ali se vota EM ALGUÉM. Uma lista fechada
  -- quebraria a carga inteira por causa de uma sessão solene de 2013.
  voto         text not null,
  -- 'nominal' (painel aberto) | 'voto_contrario' (dissidência anotada em
  -- votação simbólica).
  origem       text not null default 'nominal',
  created_at   timestamptz default now(),
  unique (votacao_id, vereador_id, nome_fonte, voto)
);

create index if not exists votacoes_camara_municipio_data_idx
    on votacoes_camara (id_municipio, data desc);
create index if not exists votos_camara_vereador_idx
    on votos_camara (id_municipio, vereador_id);
create index if not exists votos_camara_votacao_idx
    on votos_camara (votacao_id);

comment on table votacoes_camara is
  'Votacoes das camaras municipais. Placar declarado e linhas de voto sao fontes INDEPENDENTES: em SP divergem em 24,9% das nominais.';
comment on column votos_camara.origem is
  'nominal = painel aberto com IDParlamentar; voto_contrario = dissidencia anotada em votacao simbolica, sem identificador (so nome).';
