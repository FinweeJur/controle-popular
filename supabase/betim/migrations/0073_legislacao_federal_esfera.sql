-- 0073_legislacao_federal_esfera.sql
-- Legislação FEDERAL em `ambiental_legislacao` — o buraco que o dono
-- apontou: a tabela tinha 6.378 normas e **todas eram estaduais de Minas**
-- (Siam 4.077, Semad 2.232, ALMG 69). Nenhuma federal. Nem a Resolução
-- CONAMA que rege o licenciamento que o próprio portal publica — foi por
-- isso que uma busca por proteção animal (Lei 5.197/1967, Lei 9.605/1998)
-- não achava nada.
--
-- O plano medido está em `docs/FONTES-CNJ-JUMA.md` §3 (MMA/CONAMA) e §4
-- (CNDH); o que esta rodada carregou de fato, com números, está em
-- `docs/LEGISLACAO-FEDERAL-MMA-CNDH.md`. Coletores:
-- `etl/betim/etl/apis/legislacao_mma.py` e `legislacao_cndh.py`.
--
-- ═══ POR QUE A MESMA TABELA, E NÃO UMA TABELA "federal" ═══
--
-- Pelo mesmo motivo que a 0065 escolheu uma tabela só para as três fontes
-- estaduais: a tela busca "numa busca só", e três roundtrips por consulta
-- não cabem no teto de subrequests do Worker (`lib/db/client.ts`). Uma
-- norma federal e uma portaria estadual têm a MESMA forma de dado (tipo,
-- número, ano, ementa, data, órgão, link) — o que muda é a esfera, e
-- esfera é uma coluna, não uma tabela.
--
-- ═══ POR QUE `esfera` VIRA COLUNA EM VEZ DE CONTINUAR DERIVADA ═══
--
-- Até aqui a esfera era uma FUNÇÃO da fonte, calculada no app
-- (`esferaEstadual()` em `apps/web/lib/ambiental/legislacao-unificada.ts`,
-- que devolvia a constante `"estadual"` porque ALMG/Semad/Siam são todas
-- estaduais). Isso para de valer no instante em que a mesma tabela recebe
-- MMA e CNDH: a função continuaria devolvendo "estadual" e a tela mentiria
-- o rótulo de 8.8 mil normas federais. Poderia virar um `case` sobre
-- `fonte` no app — mas aí a regra viveria em TypeScript, longe do dado,
-- e cada fonte nova exigiria lembrar de editar dois lugares. Coluna com
-- `check` é a versão que o banco recusa preencher errado.
--
-- ═══ O VOCABULÁRIO É O DA TELA ('nacional'), NÃO O DO RASCUNHO ('federal') ═══
--
-- O plano em `docs/FONTES-CNJ-JUMA.md` §3.4 esboçou
-- `check (esfera in ('estadual','federal'))`. Não é o que está aqui, de
-- propósito: o tipo `EsferaLegislacao` do painel unificado já existia com
-- `municipal | estadual | nacional | internacional`, e `direito_critico_*`
-- já grava `natureza in ('nacional','internacional')` desde a 0067. Criar
-- um quinto rótulo ('federal') significaria manter uma tabela de tradução
-- entre banco e tela para sempre, por nada — "federal" e "nacional" são a
-- mesma esfera com dois nomes. Fica o nome que as duas pontas já usavam.
-- Os quatro valores entram no check agora (e não só os dois em uso) porque
-- o tipo do app já reservava os quatro: 'municipal' é o gancho de
-- `atos_oficiais`, 'internacional' o de `direito_critico_*` — nenhum dos
-- dois inventado aqui.
--
-- ═══ AS 6.378 LINHAS ATUAIS NASCEM 'estadual' PELO DEFAULT ═══
--
-- Nenhum UPDATE de retrocarga: as três fontes que já estavam na tabela são
-- estaduais por natureza (ALMG = Assembleia de MG; Semad/Siam = órgão
-- ambiental estadual), o default cobre 100% delas, e um UPDATE em massa
-- só criaria oportunidade de errar. Fontes novas gravam `esfera`
-- explicitamente — os dois coletores desta rodada mandam 'nacional' em
-- toda linha, nunca confiam no default.
--
-- ═══ POR QUE 'cndh' TAMBÉM ENTRA NO CHECK, E NÃO SÓ 'mma' ═══
--
-- A tarefa pediu 'mma'. 'cndh' entra junto porque a rodada carrega as duas
-- fontes e o plano (§4.7 e §5) já tinha decidido que as resoluções e
-- recomendações do CNDH pertencem a este painel unificado, não a uma tela
-- própria: são atos normativos federais com número, ano, data, ementa e
-- link — a mesma forma de dado. `orgao` distingue 'CONAMA'/'IBAMA'/
-- 'ICMBio'/'CNDH' dentro da esfera federal, exatamente como já distinguia
-- 'IEF'/'Igam'/'Copam' dentro de `fonte='semad'`.
--
-- ═══ `indexacao` DEIXA DE SER EXCLUSIVA DA ALMG ═══
--
-- A 0066 criou `indexacao` para a taxonomia OFICIAL que só a ALMG
-- publicava. O CSV do MMA tem o campo equivalente — a coluna `ASSUNTO`
-- ("BIODIVERSIDADE", "LICENCIAMENTO AMBIENTAL", "PESCA"...), atribuída
-- pelo próprio Ministério —, então `fonte='mma'` também grava `indexacao`.
-- Atenção ao ler: `etl.temas_ambientais.temas_da_indexacao_almg` casa
-- SEGMENTOS DE CAMINHO no formato da ALMG ("/Tema/Mineração"), que o
-- vocabulário plano do MMA nunca produz — na prática as normas do MMA
-- recebem tema só por palavra-chave na ementa, igual a Semad e Siam. A
-- coluna guarda a taxonomia da fonte; ela não promete que o classificador
-- a entenda.
--
-- ═══ `situacao`: PORQUE 1.483 DAS NORMAS DO MMA ESTÃO REVOGADAS ═══
--
-- Medido no CSV de 2025-09-19: dos 8.572 registros, 2.845 são "VIGENTE",
-- 1.483 "REVOGADO", 3.816 "NÃO CONSTA REVOGAÇÃO EXPRESSA", 262 "ATO
-- EXAURIDO", 55 "REVOGAÇÃO TÁCITA" e mais 17 em quatro rótulos raros.
-- Carregar isso sem a coluna significaria devolver, numa busca por
-- proteção de fauna, portarias revogadas com a mesma cara de norma em
-- vigor — o tipo de erro silencioso que este projeto trata como defeito,
-- não como detalhe. A coluna é NULLABLE de propósito: nenhuma das três
-- fontes ESTADUAIS publica situação de vigência (medido na 0065 — SIAM,
-- Semad e ALMG entregam ementa e link, nunca "revogado"), e `null` aqui
-- quer dizer "a fonte não informa", que é diferente de "está vigente".
-- O texto é gravado como a fonte escreve, sem tradução para um
-- vocabulário próprio: quem lê a tela lê o rótulo do Ministério.

alter table ambiental_legislacao
  add column if not exists esfera text not null default 'estadual';

alter table ambiental_legislacao
  add column if not exists situacao text;

alter table ambiental_legislacao
  drop constraint if exists ambiental_legislacao_esfera_check;
alter table ambiental_legislacao
  add constraint ambiental_legislacao_esfera_check
    check (esfera in ('municipal', 'estadual', 'nacional', 'internacional'));

-- O check de `fonte` da 0065 era `('almg','semad','siam')` — sem trocar
-- este, todo INSERT de MMA/CNDH é recusado pelo banco.
alter table ambiental_legislacao
  drop constraint if exists ambiental_legislacao_fonte_check;
alter table ambiental_legislacao
  add constraint ambiental_legislacao_fonte_check
    check (fonte in ('almg', 'semad', 'siam', 'mma', 'cndh'));

create index if not exists ambiental_legislacao_esfera_idx
  on ambiental_legislacao (esfera);
