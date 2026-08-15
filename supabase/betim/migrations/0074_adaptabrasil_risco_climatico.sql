-- 0074_adaptabrasil_risco_climatico.sql
-- Índice de risco climático por município (AdaptaBrasil MCTI/INPE/RNP),
-- primeira fatia de `docs/PLANO-BASES-CLIMA-E-RISCO.md` (§1 e "Ordem
-- sugerida", item 1). Coletor: `etl/betim/etl/apis/adaptabrasil_risco.py`.
--
-- O que esta rodada mediu — e por que a CARGA não rodou (nenhum Postgres
-- alcançável nesta máquina; a Neon segue em HTTP 402 até 01/09) — está em
-- `docs/CLIMA-ADAPTABRASIL-E-INMET.md`, com contagem por execução real.
-- **Esta migration está commitada e NÃO foi aplicada em banco nenhum.**
--
-- ═══ ISTO É ÍNDICE, NÃO CONTAGEM DE GENTE — A REGRA DA TABELA ═══
--
-- Todo valor de `valor` é um índice composto normalizado de 0 a 1, calculado
-- pela metodologia do AdaptaBrasil (peso de cada subindicador publicado em
-- `complete_description` de cada nível da hierarquia da fonte). NÃO é
-- porcentagem, NÃO é número de pessoas, NÃO é número de domicílios. O plano
-- antecipa exatamente o erro que esta nota existe para impedir: o
-- subindicador 60039 chama-se "Domicílios em áreas de risco" e vale 0,32 em
-- Brumadinho — isso não é "32 domicílios" nem "32%", é a posição relativa do
-- município na escala do índice.
--
-- Quem quiser publicar CONTAGEM DE PESSOAS expostas precisa da outra fonte
-- do mesmo plano (§2, IBGE/CEMADEN — BATER: 1.377.577 pessoas expostas em
-- MG, Censo 2010 + mapeamento de risco até abril/2017), que NÃO está nesta
-- migration e cuja geometria segue bloqueada por desafio do Cloudflare no
-- site do IBGE. Misturar as duas coisas na mesma tela sem dizer qual é qual
-- seria publicar opinião técnica com cara de fato — é o motivo de `faixa`
-- (o rótulo da própria fonte: Muito baixo..Muito alto) vir junto do número:
-- a faixa é o que o AdaptaBrasil autoriza dizer, o `valor` sozinho não.
--
-- ═══ O CASO QUE PROVA A REGRA: BELO HORIZONTE VALE 0,00 ═══
--
-- Medido em 2026-08-15, nas 853 cidades: **Belo Horizonte pontua 0,00
-- ("Muito baixo") nos DOIS índices de manchete**, deslizamento (60001) e
-- inundação (60041) — junto com Funilândia, as duas únicas cidades de MG a
-- zerar. É a mesma capital que o BATER/IBGE mede com 389.218 pessoas em área
-- de risco (16,4% da população).
--
-- Não é falha de coleta. Na mesma chamada, para BH:
--
--   Ameaça (60004) ........................... 0,86  Muito alto
--   Exposição (60003) ........................ 0,91  Muito alto
--   Domicílios em áreas de risco (60039) ..... 1,00  Muito alto (o teto)
--   Vulnerabilidade (60002) .................. 0,00  Muito baixo
--   Risco (60001) = Ameaça × Exposição × Vulnerabilidade → 0,00
--
-- A capacidade adaptativa da capital zera o produto e leva junto a ameaça, a
-- exposição e as moradias em risco. É por isso que esta tabela guarda as
-- COMPONENTES (60002/60003/60004 e 60042/60043/60044) ao lado dos índices de
-- manchete, e não só os dois números: publicar o 60001 sozinho diria à
-- cidade com mais gente em área de risco de Minas que o risco dela é muito
-- baixo. Qualquer tela que mostre `valor` de um indicador de nível 2 tem de
-- poder abrir as três componentes ao lado.
--
-- ═══ LICENÇA ═══
--
-- CC-BY-SA, confirmada em `adaptabrasil.mcti.gov.br/sobre/termos-de-uso`,
-- uso comercial permitido, com citação obrigatória no formato exigido pela
-- própria fonte:
--
--   "AdaptaBrasil MCTI – Setor(es) Estratégico(s) [nome], acessado em
--    [data] através do link [LINK]"
--
-- Por isso `setor_nome` e `atualizado_em` são colunas NOT NULL e não
-- conveniência: sem elas a citação não pode ser montada na tela, e sem a
-- citação o uso do dado descumpre a licença. `fonte_url` guarda o link exato
-- chamado para aquela linha, não uma URL genérica do site.
--
-- ═══ ARMADILHAS DA API, MEDIDAS (2026-08-15) ═══
--
-- 1. Cada indicador tem `years` PRÓPRIO na hierarquia. Chamar
--    `/mapa-dados/MG/municipio/60001/2020/null/adaptabrasil` devolve
--    HTTP 200 com `[]` — silêncio, não erro. Por isso o coletor lê o ano da
--    hierarquia e aborta quando a resposta vem vazia, em vez de gravar zero
--    linha e declarar sucesso.
-- 2. Ano futuro (2030/2050) NÃO aceita `null` no lugar do cenário: devolve
--    `[]` do mesmo jeito. O id do cenário está no nó do SETOR (60000 →
--    cenários 40 "Otimista"/RCP4.5 e 41 "Pessimista"), não no nó do
--    indicador (60001 tem `scenarios: null`). Medido: 60001/2030/40 → 853
--    registros, 172.785 bytes. Esta rodada carrega só o presente (2015);
--    projeção é decisão de produto, não de esquema, e a tabela já cabe.
-- 3. Sem `User-Agent`, a API responde **HTTP 403** (919 bytes) — armadilha
--    que o plano não registrou e que faria o coletor parecer quebrado.
--
-- ═══ POR QUE `unique nulls not distinct` ═══
--
-- `cenario_id` é NULL no presente (a fonte manda `scenario_id: null` em
-- 2015) e inteiro nas projeções. Num UNIQUE comum do Postgres, NULL é
-- distinto de NULL: `unique (id_municipio, indicador_id, ano, cenario_id)`
-- NUNCA casaria as linhas de 2015 e o `on conflict` do coletor viraria
-- INSERT puro — 1.706 linhas novas a cada rodada, crescendo em silêncio,
-- e a tela somando o mesmo município várias vezes. `nulls not distinct`
-- (Postgres 15+; a Neon roda 17.6 e a máquina de build, 18) faz o NULL
-- casar com NULL e o upsert do coletor funcionar como todo o resto do ETL.
-- A alternativa seria inventar um sentinela (`cenario_id = 0` para
-- "presente"), que mentiria sobre o que a fonte respondeu.

create table if not exists adaptabrasil_indicadores (
  id                uuid primary key default gen_random_uuid(),
  id_municipio      text not null references ref_municipios_mg(id_ibge) on delete cascade,
  -- 60001 = Deslizamento de terra; 60041 = Inundações, enxurradas e
  -- alagamentos. Os ids são os da hierarquia da fonte, não renumerados aqui.
  indicador_id      integer not null,
  indicador_nome    text not null,
  -- `indicator_id_master` da hierarquia, e o `level` do nó.
  --
  -- POR QUE ISTO NÃO É ORNAMENTO: os nomes das componentes se REPETEM entre
  -- os dois índices de manchete. "Vulnerabilidade" é o 60002 (de
  -- deslizamento) E o 60042 (de inundação); "Exposição" é 60003 e 60043;
  -- "Ameaça" é 60004 e 60044. Uma tela que agrupasse por `indicador_nome`
  -- mostraria "Vulnerabilidade" duas vezes, com números diferentes e sem
  -- dizer de quê. O pai é o que desempata, e ele vem da fonte — não é
  -- convenção inventada aqui.
  indicador_pai_id  integer not null,
  nivel             integer not null,
  -- Nó de nível 1 da hierarquia (o "Setor Estratégico" do AdaptaBrasil).
  -- 60000 = Desastres geo-hidrológicos. Guardado junto porque a citação
  -- obrigatória da licença nomeia o SETOR, não o indicador.
  setor_id          integer not null,
  setor_nome        text not null,
  -- Ano-base do INDICADOR (2015 para os dois desta rodada), nunca o ano da
  -- coleta. Um município "de 2015" continua sendo de 2015 depois de
  -- reprocessado.
  ano               integer not null,
  -- NULL = presente (é o que a fonte manda). 40/41 = cenários de projeção.
  cenario_id        integer,
  -- ÍNDICE de 0,000 a 1,000. Ver o bloco de doutrina acima antes de
  -- formatar isto como "%" em qualquer tela.
  valor             numeric(4, 3) not null check (valor >= 0 and valor <= 1),
  -- `rangelabel` da fonte: Muito baixo | Baixo | Médio | Alto | Muito alto |
  -- Dado indisponível. Sem `check`: a faixa é vocabulário da fonte e pode
  -- ganhar rótulo novo numa coleção nova — travar aqui recusaria dado bom.
  faixa             text not null,
  -- `valuecolor` da fonte (#02C650..#F40000). Guardado para a camada do
  -- globo pintar exatamente como o AdaptaBrasil pinta, em vez de o portal
  -- inventar uma escala própria e discordar da fonte que ele cita.
  cor_hex           text not null,
  -- URL exata chamada para esta linha — parte da citação exigida pela
  -- licença CC-BY-SA.
  fonte_url         text not null,
  atualizado_em     date not null default current_date,
  created_at        timestamptz default now(),
  updated_at        timestamptz,
  unique nulls not distinct (id_municipio, indicador_id, ano, cenario_id)
);

-- A consulta da página do município: "os índices da minha cidade".
create index if not exists adaptabrasil_indicadores_municipio_idx
  on adaptabrasil_indicadores (id_municipio);
-- A consulta da camada do globo: "o indicador X, ano Y, para as 853".
create index if not exists adaptabrasil_indicadores_indicador_ano_idx
  on adaptabrasil_indicadores (indicador_id, ano);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on adaptabrasil_indicadores to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on adaptabrasil_indicadores to authenticated;
  end if;
end $$;
