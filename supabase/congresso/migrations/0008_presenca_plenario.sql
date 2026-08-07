-- 0008 — Presença em plenário: a folha de ponto oficial.
--
-- "Faltas / dias efetivamente trabalhados" tem UMA fonte primária de verdade
-- em todo o Controle Popular, e é esta. Verificada ao vivo em 2026-08-06:
--
--   GET https://www.camara.leg.br/deputados/{id}/presenca-plenario/{ano}
--   → HTTP 200, HTML, tabela
--     "Data | Frequência por Sessão | Frequência por Dia/Justificativa"
--
-- É a folha de ponto da própria Casa: dia a dia, sessão a sessão, com a
-- justificativa que ela mesma registrou. Nenhuma câmara municipal do projeto
-- publica equivalente — lá a presença só existe DERIVADA do voto nominal, que
-- é medida mais fraca, fica na consulta e não ganha tabela.
--
-- ⚠ NÃO ESTÁ NA API DE DADOS ABERTOS. É raspagem de HTML do portal `www`, e
-- portanto quebra quando a Câmara redesenha a página — diferente de tudo o
-- mais do eixo Congresso, que vem de `dadosabertos.camara.leg.br`. O coletor
-- ABORTA quando não encontra o cabeçalho esperado, em vez de gravar zero
-- presença: um scraper mudo que reporta "0 dias" acusaria 513 deputados de
-- não trabalhar.
--
-- ═══ GRANULARIDADE: UMA LINHA POR (PARLAMENTAR, DIA) ═══
--
-- A fonte tem dois níveis e eles não são redundantes: num mesmo dia há sessão
-- ordinária e extraordinárias, e o deputado pode constar numa e não na outra.
-- Guardar só o dia perderia isso; guardar só a sessão impediria responder
-- "quantos DIAS ele trabalhou", que é a pergunta que o leitor faz. Por isso o
-- dia é a linha e as sessões viram contagem (`sessoes_total`,
-- `sessoes_presente`) — os dois números na mesma linha, nenhum derivado do
-- outro, mesma disciplina do placar × linhas de voto da 0041 do eixo Cidades.
--
-- ═══ AUSÊNCIA JUSTIFICADA NÃO É FALTA ═══
--
-- A Casa distingue falta de missão oficial, licença médica e
-- licença-maternidade. Tratar as duas como a mesma coisa puniria quem estava
-- em missão autorizada — e puniria de forma enviesada, porque licença-
-- maternidade recai sobre um grupo específico. `situacao_dia` guarda o
-- veredito da FONTE na grafia dela e `justificativa` guarda o texto ao lado;
-- o portal não reescreve o que a Câmara declarou, e a régua de pontuação
-- decide em `lib/` — não aqui — o que conta como falta.
set search_path = congresso, public;

create table if not exists presencas_plenario (
  id             uuid primary key default gen_random_uuid(),
  casa_id        text not null references casas(id),
  parlamentar_id uuid not null references parlamentares(id) on delete cascade,
  data           date not null,
  ano            integer not null,
  -- Grafia da fonte: 'Presença' | 'Ausência' | 'Ausência justificada'.
  -- Sem CHECK nem enum: a Câmara acrescenta rótulo de justificativa novo sem
  -- avisar, e uma lista fechada quebraria a carga inteira por causa de um
  -- rótulo novo. Mesma razão de `votos_camara.voto` não ter enum.
  situacao_dia   text not null,
  justificativa  text,
  sessoes_total    integer,
  sessoes_presente integer,
  link_fonte     text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique (parlamentar_id, data)
);

create index if not exists presencas_plenario_parlamentar_ano_idx
    on presencas_plenario (parlamentar_id, ano);
create index if not exists presencas_plenario_casa_data_idx
    on presencas_plenario (casa_id, data desc);

comment on table presencas_plenario is
  'Folha de ponto oficial do plenario, raspada de camara.leg.br/deputados/{id}/presenca-plenario/{ano} (HTML do portal www, NAO da API de dados abertos). Uma linha por (parlamentar, dia); as sessoes do dia viram contagem.';
comment on column presencas_plenario.situacao_dia is
  'Veredito do dia na grafia da fonte. Ausencia justificada NAO e falta: e missao oficial ou licenca declarada pela Casa.';

-- Leitura publica, escrita so pelo service_role — mesma politica das demais
-- tabelas de fato do eixo (ver 0002_rls.sql).
alter table presencas_plenario enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'congresso' and tablename = 'presencas_plenario'
       and policyname = 'presencas_plenario_leitura_publica'
  ) then
    create policy presencas_plenario_leitura_publica
      on presencas_plenario for select using (true);
  end if;
end $$;

-- No Neon os papeis `anon`/`authenticated` do Supabase nao existem — conceder
-- sem checar aborta a migration inteira.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'grant select on congresso.presencas_plenario to anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'grant select on congresso.presencas_plenario to authenticated';
  end if;
end $$;
