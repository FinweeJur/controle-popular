-- 0006 — Agenda legislativa: eventos das comissões e do Plenário.
--
-- O QUE ISTO RESPONDE que o portal não respondia: "quando esse projeto vai
-- ser discutido, e como eu participo?". Até aqui o app mostrava o que já
-- aconteceu (tramitação) e o que foi classificado (análise), nunca o que
-- está marcado. Audiência pública é o único momento em que sociedade civil
-- fala dentro da comissão — e ela é anunciada com data, local e lista de
-- convidados, no campo `descricao` do evento.
--
-- FONTE: `dadosabertos.camara.leg.br/api/v2/eventos`, verificada ao vivo
-- em 2026-07-29. A LISTA já traz órgão, situação, local e `urlRegistro`
-- (o vídeo), então uma requisição por janela de datas cobre quase tudo;
-- só a PAUTA exige uma chamada por evento.
--
-- `cod_tipo` é guardado junto de `tipo` porque o texto muda de grafia entre
-- anos e o código não (120 = Audiência Pública, 125 = Audiência Pública e
-- Deliberação, 112 = Reunião Deliberativa — de `referencias/tiposEvento`).
-- Filtrar "audiência pública" por LIKE no texto é o tipo de acoplamento que
-- quebra em silêncio quando a fonte reescreve o rótulo.
set search_path = congresso, public;

create table if not exists congresso.eventos (
  id          uuid primary key default gen_random_uuid(),
  casa_id     text not null references congresso.casas(id),
  id_externo  text not null,
  cod_tipo    integer,
  tipo        text,
  descricao   text,
  situacao    text,
  inicio      timestamptz,
  fim         timestamptz,
  local_nome  text,
  local_externo text,
  -- Link do vídeo/registro quando existe (só depois do evento, em geral).
  url_registro text,
  -- Página pública do evento. Montada pelo ETL, porque a API não devolve a
  -- URL para humano — só a dela mesma.
  url_fonte   text,
  -- Siglas dos órgãos promotores. Array em vez de FK: um evento pode ser
  -- conjunto (duas comissões) e órgão extinto continua tendo de aparecer,
  -- pela mesma razão registrada em `proposicoes.orgao_atual`.
  orgaos      text[],
  raw         jsonb,
  updated_at  timestamptz default now(),
  unique (casa_id, id_externo)
);

-- A agenda é sempre consultada por janela de data.
create index if not exists eventos_inicio_idx on congresso.eventos (inicio desc);
create index if not exists eventos_cod_tipo_idx on congresso.eventos (cod_tipo);
create index if not exists eventos_orgaos_idx on congresso.eventos using gin (orgaos);

-- Pauta: o que será apreciado no evento.
--
-- `proposicao_id` é NULÁVEL de propósito. A pauta cita proposições de
-- qualquer ano (o exemplo real medido cita um PL de 2014), e este banco só
-- sincronizou 2026 — exigir a FK descartaria a maior parte da pauta, que é
-- justamente a informação útil. `titulo` sempre existe; a FK é um bônus
-- quando a proposição já está aqui e dá para linkar a análise.
create table if not exists congresso.evento_pauta (
  evento_id      uuid not null references congresso.eventos(id) on delete cascade,
  ordem          integer not null,
  titulo         text not null,
  topico         text,
  regime         text,
  relator_nome   text,
  relator_partido text,
  relator_uf     text,
  texto_parecer  text,
  proposicao_id  uuid references congresso.proposicoes(id) on delete set null,
  proposicao_id_externo text,
  primary key (evento_id, ordem, titulo)
);

create index if not exists evento_pauta_proposicao_idx
  on congresso.evento_pauta (proposicao_id) where proposicao_id is not null;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on congresso.eventos, congresso.evento_pauta to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on congresso.eventos, congresso.evento_pauta to authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on congresso.eventos, congresso.evento_pauta to service_role;
  end if;
end $$;
