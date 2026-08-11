-- Desativa uma comissão de TESTE que a própria API da Câmara devolve como
-- se fosse real, e que a auditoria de 2026-08-11 achou publicada em produção.
--
-- ═══ O ACHADO ═══
--
-- `/congresso/comissoes` mostrava, misturada às comissões reais:
--
--     TESTECOM — "TESTE PARA GERAÇÃO DO ESPELHO DA COMISSÃO (COMISSÃO FICTÍCIA)"
--
-- Não é dado nosso incorreto: é o que `/orgaos?codTipoOrgao=3` da própria
-- Câmara dos Deputados devolve, com `sigla=TESTECOM` e `nome` dizendo
-- explicitamente "FICTÍCIA". A Câmara usa esse órgão como fixture interno de
-- teste (para conferir a geração do "espelho" — o relatório de composição de
-- comissão) e ele vaza pela API pública como qualquer comissão de verdade,
-- inclusive com `ativo: true` no payload.
--
-- `etl.camara.orgaos` importa fielmente o que a fonte devolve — é o comportamento
-- certo na esmagadora maioria dos casos. Este é o caso em que a fonte publica
-- lixo de teste, e o próprio nome do registro ("FICTÍCIA") é sinal claro o
-- bastante para filtrar sem risco de descartar comissão real por engano.
--
-- ═══ POR QUE DESATIVAR, E NÃO APAGAR ═══
--
-- `orgao_membros` referencia `orgao_id`; apagar quebraria a integridade se
-- algum membro chegou a ser sincronizado para este órgão fictício.
-- `listarOrgaosAtivos()` (lib/db/queries/congresso.ts) já filtra por
-- `ativo = true` — desativar basta para tirar da tela.
--
-- O coletor (`etl/congresso/etl/camara/orgaos.py`) ganhou o mesmo filtro por
-- nome, para a próxima sincronização não reimportar isto com `ativo: true`.

update congresso.orgaos
   set ativo = false
 where sigla = 'TESTECOM'
    or nome ilike '%FICTÍCIA%'
    or nome ilike '%FICTICIA%';
