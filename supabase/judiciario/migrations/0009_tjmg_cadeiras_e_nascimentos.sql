-- 0009 — corrige a contagem de cadeiras do TJMG (auditoria 2026-08-11, item 18).
--
-- A migration 0008 deixou `tribunais.n_cadeiras` NULO para o TJMG de propósito:
-- o scraper (F8) mediu 148 desembargadores ATIVOS (em exercício), mas isso não é
-- o mesmo que o número de CARGOS fixado em lei — alguém em exercício pode estar
-- num cargo de juiz auxiliar de 2º grau equiparado, não num cargo efetivo de
-- desembargador, e o inverso (cargo vago, ninguém em exercício) também é possível.
-- `n_cadeiras` é "composição LEGAL vigente" (comentário original da coluna,
-- migration 0001) — não é o mesmo dado que "148 ativos" já capturava.
--
-- FONTE (primária, legislativa): Lei Complementar nº 59, de 18/1/2001 (Código de
-- Organização e Divisão Judiciárias do Estado de Minas Gerais), art. 11, § 1º,
-- na redação dada pela Lei Complementar nº 105, de 14/8/2008 — fixa em 140 o
-- número de cargos de Desembargador do TJMG (1 Presidente + 3 Vice-Presidentes +
-- 1 Corregedor-Geral de Justiça, dentro desses 140).
-- Textos: almg.gov.br/legislacao-mineira/texto/LCP/59/2001/ (original) e o
-- consolidado (migalhas.com.br/arquivos/2022/4/CAE708F2D5A82C_lc59mg.pdf).
--
-- NOTA SOBRE A DIVERGÊNCIA COM OS "148 ATIVOS" DO SCRAPER: a Lei Complementar
-- 174 (a partir do Projeto de Lei Complementar 40/23 do próprio TJMG, alterando
-- a LC 59/2001) criou 10 cargos de juiz auxiliar de 2º grau com direito à
-- diferença de subsídio de desembargador — não são cargos efetivos de
-- desembargador, mas explicam por que a página oficial de "desembargadores"
-- pode listar mais gente em exercício (148) do que o número de cargos titulares
-- (140). Registrado aqui para não confundir os dois números no futuro; os
-- 148 nomes coletados continuam corretos como "quem está em exercício hoje" —
-- não foram alterados por esta migration.
set search_path = judiciario, public;

update judiciario.tribunais
  set n_cadeiras = 140
  where id = 'tjmg';

-- Conferência: deve devolver 140.
select id, nome, n_cadeiras from judiciario.tribunais where id = 'tjmg';
