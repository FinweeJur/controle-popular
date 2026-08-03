-- CNPJ do fornecedor na verba indenizatória (`etl/camaras/sp.py`).
--
-- O XML do Auxílio-Encargos Gerais da CMSP é item-a-item COM o CNPJ:
--   <CNPJ>60.895.653/0001-08</CNPJ><FORNECEDOR>POSTO PAISAGEM LTDA</FORNECEDOR>
-- Zero itens sem CNPJ nos 9.117 de 2025+2026, medido em 2026-08-03.
--
-- A tabela só tinha `fornecedor` em texto livre — justamente o campo que NÃO
-- permite cruzar com `contratos`/`licitacoes` (chaveados por CNPJ) nem com
-- CEIS/CNEP. "EMP. BRAS. CORREIOS - AGF SAO GA" não casa por nome com nada.
--
-- Aditiva e nula em Betim, cuja fonte (grid Blazor da Câmara) publica só o
-- nome do fornecedor.
--
-- As outras duas mudanças de schema que `etl/camaras/sp.py` precisa já vêm
-- prontas de migrations escritas para Belo Horizonte no mesmo dia — não são
-- repetidas aqui:
--   `vereadores.id_externo`  -> 0028_vereador_id_externo.sql
--   chave natural de proposicoes -> 0029_proposicoes_chave_natural.sql
alter table verbas_indenizatorias
  add column if not exists cnpj_fornecedor text;

comment on column verbas_indenizatorias.cnpj_fornecedor is
  'CNPJ do fornecedor como a fonte publica (com pontuação). Preenchido onde a fonte é item-a-item com identificação do fornecedor (CMSP); NULL em Betim.';
