-- Autos de infração ambiental ESTADUAIS de Minas Gerais, por município, do
-- sistema CAP (Consulta Geral de Autos de Infração e Arrecadação) da SEMAD-MG,
-- em `ecosistemas.meioambiente.mg.gov.br/consulta-ai`.
--
-- Motivo de existir: `ibama_fiscalizacao` (migration 0048) cobre a autuação
-- FEDERAL. O CAP é a estadual — SEMAD, IEF, FEAM, IGAM, PMMA — e no município
-- médio de MG é uma ordem de grandeza maior. Medido ao vivo em 2026-08-09:
-- Belo Horizonte 26.764 · Diamantina 25.292 · Gov. Valadares 23.372 ·
-- Araçuaí 11.368 · Betim 9.621 · Itinga 4.994 linhas.
--
-- ═══ O GRÃO: UMA LINHA NÃO É UM AUTO DE INFRAÇÃO ═══
--
-- A chave natural da fonte (`id_cap`) é (auto × dispositivo legal infringido).
-- O AI 316052 de Itinga são DUAS linhas: uma pelo Decreto 47383/18 (código
-- 213) e outra pela Lei 13199/99 (sem código). Contar linhas e chamar de
-- "autuações" infla o número — a contagem de autos é
-- `count(distinct numero_ai)`. Qualquer tela que use esta tabela precisa
-- escolher explicitamente qual das duas está mostrando.
--
-- ═══ O QUE ESTA TABELA NÃO PROVA ═══
--
-- Auto lavrado não é dano ambiental provado nem multa paga. `status_ai`,
-- `status_processo` e `status_debito` existem exatamente para isso: há linha
-- com multa de R$ 808.639,21 de 2013 ainda "Em Aberto". Mostrar o valor sem o
-- status vira acusação sem processo.
--
-- ═══ PRIVACIDADE (diferente das outras fontes ambientais) ═══
--
-- `cpf_cnpj` guarda o que a fonte publica, e a fonte JÁ MASCARA CPF de pessoa
-- física (`***.327.536-**`); CNPJ vem inteiro. É postura melhor que a do IBAMA
-- (CPF em claro, `docs/ambiental/F0-discovery.md` §10) e que a do XLSX de
-- outorga do IGAM (§12.2). Não há redação a fazer aqui na carga — mas se a
-- fonte mudar de postura um dia, o lugar de tratar é o coletor, não a tela.
--
-- ═══ AS PENALIDADES SÃO 'S'/'N'/NULL DE PROPÓSITO ═══
--
-- A fonte serializa cada penalidade como flag de texto (`bit_advert`: "S",
-- "N" ou ""), e "" não é o mesmo que "N" — é ausência de informação no
-- cadastro. Guardar como `boolean` apagaria essa diferença; mesma escolha já
-- feita em `snisb_barragens.possui_pae` (migration 0049).

create table if not exists cap_autos_infracao (
  id                          uuid primary key default gen_random_uuid(),
  id_municipio                text not null references municipios(id_municipio) on delete cascade,
  id_cap                      bigint not null,        -- `id` da fonte: (auto x dispositivo), não o auto
  numero_ai                   text,                   -- repete entre linhas do mesmo auto
  data_lavratura              date,
  nome_autuado                text,
  cpf_cnpj                    text,                   -- CPF já mascarado NA FONTE; CNPJ inteiro
  municipio_fonte             text,                   -- `mun_infracao`, CAIXA ALTA (guarda de identidade)
  orgao_autuante              text,                   -- SEMAD | IEF | FEAM | IGAM | PMMA
  unidade_atual               text,                   -- ex. URFIS JEQUITINHONHA

  -- recorte DI (Dados da Infração)
  dispositivo_legal           text,                   -- `num_lei`, ex. "47383/18 Alt47837/20"
  codigo_infracao             text,                   -- vazio na fonte em parte das linhas

  -- recorte PA (Penalidades Aplicadas) — 'S' | 'N' | NULL, ver nota acima
  pen_advertencia             text,
  pen_multa_simples           text,
  pen_multa_diaria            text,
  pen_apreensao               text,
  pen_embargo_obra            text,
  pen_embargo_atividade       text,
  pen_suspensao_atividade     text,
  pen_suspensao_venda         text,
  pen_suspensao_fabricacao    text,
  pen_demolicao               text,
  pen_restritiva_direito      text,
  descricao_embargo           text,
  descricao_apreensao         text,
  -- (18,4) e não (18,2) de propósito: `val_total` vem com ATÉ 4 casas na fonte
  -- (medido em Betim: expoentes -4, -3 e -2 na mesma página; ex. 6296.125).
  -- Em numeric(18,2) o Postgres arredondaria em silêncio.
  valor_multa                 numeric(18, 4),

  -- recorte DA (Decisão e Andamento)
  decisao                     text,
  descricao_julgamento        text,
  data_decisao                timestamp,              -- "" na fonte quando não houve decisão
  status_ai                   text,                   -- ex. Emitido
  status_processo             text,                   -- ex. Simples Parcelamento

  -- recorte CA (Cobrança e Arrecadação)
  valor_plano_vigente         numeric(18, 2),
  valor_quitado               numeric(18, 2),
  valor_remanescente          numeric(18, 2),
  qtde_parcelas               text,                   -- vem como "1 /1 ", não é inteiro
  observacao_plano            text,
  status_debito               text,                   -- ex. Em Aberto

  atualizado_em               date default current_date,
  created_at                  timestamptz default now(),
  updated_at                  timestamptz,
  unique (id_municipio, id_cap)
);

create index if not exists cap_autos_infracao_municipio_idx
  on cap_autos_infracao (id_municipio);
create index if not exists cap_autos_infracao_auto_idx
  on cap_autos_infracao (id_municipio, numero_ai);
create index if not exists cap_autos_infracao_lavratura_idx
  on cap_autos_infracao (id_municipio, data_lavratura desc);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on cap_autos_infracao to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on cap_autos_infracao to authenticated;
  end if;
end $$;
