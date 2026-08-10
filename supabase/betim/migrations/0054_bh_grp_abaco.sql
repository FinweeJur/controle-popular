-- Belo Horizonte declara que roda o GRP da Ábaco.
--
-- ═══ O DEFEITO, E ELE ERA SILENCIOSO DO JEITO CARO ═══
--
-- `etl.pbh.contratos` e `etl.pbh.folha` abortam quando a cidade não declara
-- `fontes.prefeitura_grp: true`. O guarda é bom e está certo: os dois módulos
-- falam com o GRP da Ábaco **instalado em Belo Horizonte**, e outra cidade com
-- GRP tem host e nome de procedimento diferentes — rodar às cegas coletaria
-- dado de outra prefeitura e gravaria com o id errado, que é o dano de
-- 2026-08-03 outra vez.
--
-- Só que a chave **nunca foi escrita em migration nenhuma**: `prefeitura_grp`
-- aparece no repo apenas onde é LIDA (os dois módulos). Ela existia no banco
-- da Neon, posta à mão, e não sobreviveu ao dump que originou o Postgres
-- local.
--
-- O efeito medido em 2026-08-10, depois de rodar o ETL inteiro de BH: a cidade
-- ficou com **0 contratos e 0 servidores**, enquanto proposições (3.742),
-- despesas (4.036), escolas (2.580) e convênios (3.000) entraram normalmente.
-- Dois buracos no meio de uma cidade cheia, e o log só dizia "ABORT" — nada
-- apontava para uma chave de configuração ausente.
--
-- Configuração que só existe fora do versionamento é dívida esperando um
-- restore. Fica aqui.
--
-- ═══ POR QUE SÓ BH ═══
--
-- `prefeitura_grp` NÃO é "a cidade tem GRP". É "esta cidade foi verificada
-- contra o GRP da Ábaco que estes dois módulos sabem falar". Marcar outra
-- cidade sem verificar host e procedimento é exatamente o que o guarda existe
-- para impedir — e o comentário fica aqui para quem for tentado a copiar a
-- linha para São Paulo.

update municipios
   set fontes = coalesce(fontes, '{}'::jsonb) || jsonb_build_object('prefeitura_grp', true)
 where id_municipio = '3106200';
