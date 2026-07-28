-- Tags temáticas (pedido do usuário 2026-07-22): requerimentos, projetos
-- de lei e contratos devem carregar tags de tema (Saúde, Educação,
-- Segurança Pública, Adm. Pública...) pra dar pra filtrar e entender as
-- áreas de foco de atuação de cada vereador/prefeitura -- não só QUANTO
-- cada um legisla (ranking ponderado já existente), mas SOBRE O QUÊ.
--
-- `text[]` (não uma tabela de junção): mesmo padrão já usado em
-- `contratos.motivos_alerta` (0001_schema.sql) -- uma proposição/contrato
-- pode ter vários temas ao mesmo tempo, filtro por `.contains()` já é o
-- padrão estabelecido em `lib/contratos.ts`. Classificação por
-- palavra-chave em `etl/temas.py`, não por LLM (ver docstring do módulo).
alter table proposicoes add column temas text[];
alter table contratos add column temas text[];

create index on proposicoes using gin (temas);
create index on contratos using gin (temas);
