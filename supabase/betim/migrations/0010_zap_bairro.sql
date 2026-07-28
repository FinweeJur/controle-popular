-- Zap Betim: adiciona bairro opcional pro cadastro, usado pra filtrar
-- negócios por região (ex. página /citrolandia, pedido do usuário
-- 2026-07-21) sem precisar de uma tabela nova.
alter table zap_estabelecimentos add column bairro text;
