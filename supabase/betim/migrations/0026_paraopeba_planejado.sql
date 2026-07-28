-- 0026_paraopeba_planejado.sql
-- Correção do avanço físico dos projetos da FGV/Paraopeba (usuário
-- reportou 2026-07-24: a página mostrava 0% e a FGV mostra 42%).
-- Causa: o ETL lia "Percentual Realizado do Projeto" (aba Iniciativas,
-- que dá 0 pra vários), não o "Avanço Físico" real. O correto está na aba
-- "Avanço Físico": `Executado (%)` (progresso físico, = os 42% da FGV) e
-- `Planejado (%)` (o quanto deveria estar pronto até agora — a barra
-- preta "Planejado" do gráfico da FGV). `percentual_realizado` passa a
-- guardar o Executado; esta coluna guarda o Planejado, pra comparar
-- executado x planejado (quem está atrasado). Coluna opcional: o ETL
-- degrada (grava sem ela) até esta migration rodar.

alter table paraopeba_iniciativas
  add column if not exists percentual_planejado numeric;
