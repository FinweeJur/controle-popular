-- Barragens cadastradas no SNISB (Sistema Nacional de Informações sobre
-- Segurança de Barragens, ANA), por município.
--
-- Motivo de existir: as fontes de barragens já documentadas em
-- `docs/ambiental/F0-discovery.md` §5 — FEAM (inventário anual de MG) e o
-- dashboard da ANM (`Barragens_Dashboard_Publico`) — cobrem só barragem de
-- MINERAÇÃO. O SNISB é o cadastro nacional CONSOLIDADO pós-Lei 14.066/2020, que
-- reúne também as barragens que ANM/FEAM não veem: abastecimento de água
-- (IGAM/ANA), irrigação, hidrelétrica (ANEEL). Medido ao vivo em 2026-08-09:
-- **1.871 barragens em MG** (IGAM 1.523 + ANEEL 277 + ANA 71) que não aparecem
-- nem na FEAM nem no dashboard da ANM — inclusive a BARRAGEM VARGEM DAS FLORES,
-- da COPASA, que abastece água em Betim (categoria de risco Médio, dano
-- potencial Alto, sem Plano de Ação de Emergência — POSSUI_PAE='Não').
--
-- ═══ O QUE ESTE CADASTRO NÃO SUBSTITUI ═══
--
-- `nivel_perigo` (o semáforo Normal/Atenção/Alerta/Emergência) está VAZIO em
-- ~97% das linhas, nacional e em MG — não é a fonte de "está em emergência
-- agora". Para as barragens de mineração de MG, a FEAM continua sendo a fonte
-- primária de DCE/nível de emergência (ela está 249/249 preenchida). O SNISB
-- contribui `categoria_risco`/`dano_potencial`/`possui_pae`/`possui_plano_seguranca`,
-- que SÃO bem preenchidos nas barragens não-minerárias que só ele cobre.
--
-- ═══ [VERIFY] aberto, registrado e não resolvido aqui ═══
--
-- Três números diferentes para "barragens de mineração em MG": FEAM 249,
-- WFS IDE-Sisema (`ide_1901_mg_barragens_rejeitos_residuos_pto`) 259, SNISB
-- (linhas atribuídas à ANM) 320. Não reconciliado — fica para quem for cruzar
-- as três fontes por `id_sigibar`/nome.

create table if not exists snisb_barragens (
  id                          uuid primary key default gen_random_uuid(),
  id_municipio                text not null references municipios(id_municipio) on delete cascade,
  codigo_snisb                bigint not null,        -- BAR_CD_SNISB, chave natural da ANA
  nome                        text,
  empreendedor                text,
  uso_principal               text,
  uso_complementar            text,
  orgao_fiscalizador          text,                    -- ANM | ANA | ANEEL | MG - IGAM | MG - FEAM | ...
  categoria_risco             text,
  dano_potencial               text,
  nivel_perigo                text,                    -- quase sempre NULL na fonte — não é dado ausente do coletor
  regulada_pnsb               text,                    -- Sim | Não | Não Classificada
  possui_pae                  text,
  possui_plano_seguranca      text,
  possui_revisao_periodica    text,
  barragem_autuada            text,
  completude                  text,
  curso_dagua                 text,
  capacidade_reservatorio     numeric(18, 4),          -- unidade não confirmada na fonte; guardado como publicado
  latitude                    numeric(14, 9),
  longitude                   numeric(14, 9),
  data_cadastro               date,
  municipio_fonte             text,                    -- ING_NM_MUNICIPIO tal como a ANA grafa (guarda de identidade)
  uf_fonte                    text,
  atualizado_em                date default current_date,
  created_at                  timestamptz default now(),
  updated_at                  timestamptz,
  unique (id_municipio, codigo_snisb)
);

create index if not exists snisb_barragens_municipio_idx
  on snisb_barragens (id_municipio);
create index if not exists snisb_barragens_risco_idx
  on snisb_barragens (id_municipio, categoria_risco);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on snisb_barragens to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on snisb_barragens to authenticated;
  end if;
end $$;
