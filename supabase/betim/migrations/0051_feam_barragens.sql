-- Inventário anual de barragens de MG da FEAM, por município.
-- Coletor: `etl/betim/etl/apis/feam_barragens.py`.
--
-- ═══ POR QUE ESTA TABELA EXISTE AO LADO DE `snisb_barragens` (0049) ═══
--
-- O SNISB cobre 2.212 barragens em MG contra 249 aqui, mas o campo que responde
-- "está perigosa AGORA" (`snisb_barragens.nivel_perigo`) vem VAZIO em ~97% das
-- linhas de lá. A FEAM preenche exatamente isso para as barragens de mineração
-- e indústria de MG:
--
--   condicao_estabilidade  Atestada 216 · Não Atestada 21 · Não apresentou 10
--   nivel_emergencia       0 → 231 · 1 → 11 · 2 → 4 · 3 → 3
--   metodo_construtivo     Montante 34 (o método de Mariana e Brumadinho)
--   suspensao              Sim 32
--
-- São as três colunas que o projeto queria do SIGIBAR e não coleta de lá
-- (reCAPTCHA Enterprise — `docs/ambiental/F0-discovery.md` §13.1). Para
-- MINERAÇÃO em MG, esta fonte entrega o mesmo conteúdo por caminho aberto.
--
-- ═══ `id_sigibar` É TEXTO, E NÃO É CHAVE ═══
--
-- Duas barragens da Massa Falida da Mundo Mineração (Rio Acima) trazem o
-- literal "Não cadastrado" no lugar do número. Guardar como bigint exigiria
-- inventar um valor ou perder a linha; guardar como texto preserva o que a
-- fonte diz e continua casando com o `id_sigibar` do WFS IDE-Sisema quando ele
-- existe. A chave natural é (município, nome) — medida sem colisão nas 249.
--
-- ═══ COORDENADA JÁ CHEGA CONFERIDA ═══
--
-- 5 das 249 linhas trazem a coordenada como inteiro de 8 dígitos, sem separador
-- decimal (-19645284 para -19,645284). O coletor reconstrói o decimal E confere
-- contra a caixa de MG; o que cai fora entra como NULL, de propósito —
-- coordenada errada num mapa mente mais alto que coordenada ausente.
--
-- ═══ O QUE ESTA TABELA NÃO PROVA ═══
--
-- Cobertura é mineração (209) e indústria (40). Não cobre abastecimento de
-- água, irrigação nem hidrelétrica. "Zero linhas aqui" NÃO é "nenhuma barragem
-- no município" — para essas outras, `snisb_barragens`.
--
-- Frescor: o XLSX é ANUAL (base 2024). O mesmo dado é atualizado mensalmente no
-- Painel de Indicadores do SISEMA (Power BI público), cuja URL estava dada como
-- não encontrada na §5 do F0-discovery e está registrada agora na docstring do
-- coletor. Painel não é dataset — não vira carga.

create table if not exists feam_barragens (
  id                        uuid primary key default gen_random_uuid(),
  id_municipio              text not null references municipios(id_municipio) on delete cascade,
  id_sigibar                text,                    -- pode ser "Não cadastrado"; ver nota
  nome                      text not null,
  empreendedor              text,
  ura                       text,                    -- unidade regional da SEMAD
  atividade                 text,                    -- Mineração | Indústria
  finalidade                text,
  situacao                  text,                    -- Operação | Desativada | Instalada
  condicao_estabilidade     text,                    -- a DCE: Atestada | Não Atestada | Não apresentou
  metodo_construtivo        text,                    -- rótulo canônico (4 grafias na fonte)
  metodo_construtivo_fonte  text,                    -- texto original, para auditoria
  altura_m                  numeric(10, 2),
  volume_reservatorio_m3    numeric(20, 2),
  categoria_risco           text,                    -- BAIXO | MEDIO | ALTO
  dano_potencial            text,                    -- BAIXO | MÉDIO | ALTO
  classe                    text,                    -- A..E
  nivel_emergencia          integer,                 -- 0..3
  suspensao                 text,                    -- Sim | Não
  latitude                  numeric(12, 8),
  longitude                 numeric(12, 8),
  municipio_fonte           text,                    -- grafia da FEAM (guarda de identidade)
  atualizado_em             date default current_date,
  created_at                timestamptz default now(),
  updated_at                timestamptz,
  unique (id_municipio, nome)
);

create index if not exists feam_barragens_municipio_idx
  on feam_barragens (id_municipio);
-- As duas consultas que a tela faz: "tem alguma em emergência?" e "quantas a
-- montante?". Ambas partem do município.
create index if not exists feam_barragens_emergencia_idx
  on feam_barragens (id_municipio, nivel_emergencia desc);
create index if not exists feam_barragens_metodo_idx
  on feam_barragens (id_municipio, metodo_construtivo);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on feam_barragens to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on feam_barragens to authenticated;
  end if;
end $$;
