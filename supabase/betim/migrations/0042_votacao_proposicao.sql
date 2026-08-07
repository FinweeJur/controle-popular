-- Liga a VOTAÇÃO à PROPOSIÇÃO votada — o elo que faltava para medir coerência.
--
-- O ranking de atuação mede o que o vereador APRESENTA. A migration 0041
-- trouxe o que ele VOTA. Mas as duas tabelas não se conversavam: uma linha de
-- `votacoes_camara` guardava a matéria só como TEXTO (`materia`), então dava
-- para dizer "fulano votou Sim 412 vezes" e não dava para dizer "fulano votou
-- Sim num projeto que a análise garantista classificou como reducionista".
-- Sem esta coluna, coerência de voto é inmensurável — sobra fidelidade
-- partidária, que é outra coisa e que este portal decidiu NÃO pontuar.
--
-- ═══ POR QUE `on delete set null`, E NÃO CASCADE ═══
--
-- `refresh_completo_seguro` é delete+insert: recarregar as proposições de uma
-- cidade apaga e recria as linhas de `proposicoes`. Com CASCADE, refazer a
-- coleta de proposições apagaria as VOTAÇÕES junto — e votação é dado caro
-- (35 mil votos de Betim saíram de PDF do painel, um por votação). Com
-- `set null` o refresh só derruba o ELO, que `etl.camaras.ligar_votacoes`
-- reconstrói em segundos a partir de `materia`, que continua na linha.
--
-- É a mesma lição do ON DELETE CASCADE que apagava `analises` em silêncio
-- (migration 0033): a pergunta certa não é "o que é referencialmente limpo",
-- é "o que dói perder e o que é barato refazer".
--
-- ═══ POR QUE A COLUNA É ANULÁVEL ═══
--
-- Nem toda votação é sobre uma proposição nossa. Medido em 2026-08-06, sobre
-- as votações cuja `materia` traz número/ano:
--
--   Betim           1.527 com número → 1.254 casam com proposição coletada
--   São Paulo         793 com número →   416 casam
--   Belo Horizonte      1 com número →     1 casa   (coleta ainda em 2 votações)
--
-- O resto é eleição de Mesa, requerimento de urgência, veto, redação final e
-- matéria anterior à janela que o scraper cobre. Exigir a FK descartaria a
-- votação inteira por não termos o texto dela — perderíamos o voto para
-- ganhar integridade referencial.
alter table votacoes_camara
  add column if not exists proposicao_id uuid references proposicoes(id) on delete set null;

create index if not exists votacoes_camara_proposicao_idx
    on votacoes_camara (proposicao_id) where proposicao_id is not null;

comment on column votacoes_camara.proposicao_id is
  'Proposicao votada, casada por (tipo, numero, ano) parseados de `materia` por etl.camaras.ligar_votacoes. Anulavel: nem toda votacao tem materia nossa (eleicao de Mesa, veto, materia fora da janela coletada). ON DELETE SET NULL de proposito — refresh de proposicoes nao pode levar a votacao junto.';

-- A presenca em plenario do Congresso mora em `supabase/congresso/migrations/
-- 0008_presenca_plenario.sql`: as FKs sao para `congresso.parlamentares` e
-- `congresso.casas`, e as duas zonas nao compartilham schema.

--
