-- A chave de upsert de `convenios_federais` era instável, e o site publicou
-- o DOBRO do dinheiro federal de Betim por causa disso.
--
-- ═══ O QUE ACONTECEU, MEDIDO EM 2026-08-13 ═══
--
-- A migration 0014 escolheu `(id_municipio, id_externo)` como chave única, e
-- o comentário dela diz `id_externo bigint not null, -- campo "id" da API —
-- chave de upsert`. Só que o campo `id` do Portal da Transparência NÃO é
-- estável entre rodadas: a API devolve um `id` novo para o MESMO convênio
-- real. Então cada execução do ETL não atualizava a linha — inseria outra.
--
-- Medido no banco local, Betim (3106705):
--
--   linhas .................. 501
--   `codigo` distintos ...... 167
--   `numero_convenio` dist... 167
--   `id_externo` distintos .. 501   ← um por INSERÇÃO, não por convênio
--
-- E o efeito foi ao ar. `/[municipio]/emendas` publica `valorTotal`, que é
-- uma SOMA. Conferido contra a produção no mesmo dia:
--
--   publicado em controlepopular.com.br/betim/emendas .. R$ 597.217.053
--   soma real, deduplicada ............................. R$ 298.608.526,57
--   razão .............................................. 2,0000
--
-- Exatamente o dobro. Num portal de transparência, publicar dinheiro público
-- inflado em 100% é o pior tipo de erro que existe — é a acusação que o
-- portal faz aos outros.
--
-- ═══ POR QUE `codigo` E NÃO `numero_convenio` ═══
--
-- `numero_convenio` PARECE a chave natural e não é. Medido: 77 pares
-- (id_municipio, numero_convenio) têm `valor` divergente, porque órgãos
-- diferentes reaproveitam a mesma numeração — agrupar por ele fundiria
-- convênios que são de verdade distintos. No agregado: 6.636 `codigo`
-- distintos contra 6.471 `numero_convenio`, e a diferença está em BH e SP,
-- os dois municípios com volume suficiente para a colisão aparecer.
--
-- `codigo` é o `dimConvenio.codigo`, o identificador que a PRÓPRIA API usa
-- para endereçar o recurso na URL de detalhe (`/convenios/{codigo}`) — ver
-- migration 0024. Um id que serve para buscar o registro de novo amanhã é,
-- por definição, estável. É essa a diferença entre ele e o `id`.
--
-- ═══ POR QUE APAGAR É SEGURO AQUI ═══
--
-- Conferido antes: das 6.636 chaves, apenas **6** têm conteúdo divergente
-- entre suas cópias (objeto, valor, valor_liberado, situação, órgão,
-- convenente). Essas 6 são atualização real da fonte entre rodadas, e ficar
-- com a linha mais recente é exatamente o que o upsert teria feito se a
-- chave estivesse certa. As outras 809 linhas excedentes são cópias byte a
-- byte da mesma informação.
--
-- `id_externo` continua existindo como coluna: é dado da fonte e pode servir
-- para depurar. O que ele deixa de ser é chave.
-- ═══ ONDE ESTA MIGRATION AINDA NÃO RODOU — LEIA ANTES DE ACHAR QUE ACABOU ═══
--
-- Ela foi aplicada em 2026-08-13 SÓ no Postgres LOCAL da máquina de build,
-- que é de onde o `next build` lê e, portanto, o que decide o número que o
-- site publica. A correção do valor de Betim está garantida por aí.
--
-- A NEON NÃO FOI TOCADA, e isso é de propósito: esta máquina tem regra de
-- nunca apontar para a Neon (`docs/build-em-outro-pc.md` — um build local
-- que conectou nela custou HTTP 402 por estouro de egress), e a Neon segue
-- em 402 até 2026-09-01.
--
-- Consequência prática, para quem pegar isto depois: os 6 workflows de ETL
-- do GitHub continuam apontando para a Neon. Enquanto esta migration não
-- rodar LÁ, aquele banco continua com a chave instável e vai voltar a
-- acumular cópia a cada execução. Se um dia alguém restaurar o local a
-- partir de um dump da Neon, a duplicata volta junto — e o site volta a
-- publicar o dobro.
--
-- Rodar esta migration na Neon é o passo que fecha o assunto. O `delete`
-- abaixo é seguro de repetir: ele só remove o que sobra por chave.

begin;

-- Fica a linha de maior `id` por (id_municipio, codigo) — o `id` serial
-- cresce a cada inserção, então o maior é o mais recente, que é o que o
-- upsert correto teria deixado.
delete from convenios_federais c
using convenios_federais mais_novo
where c.id_municipio = mais_novo.id_municipio
  and c.codigo = mais_novo.codigo
  and c.id < mais_novo.id;

-- A unicidade antiga é o defeito em si: ela permitia N linhas por convênio,
-- desde que o `id` da API mudasse. Sai.
alter table convenios_federais drop constraint if exists convenios_federais_id_municipio_id_externo_key;
drop index if exists convenios_federais_id_municipio_id_externo_key;

-- A nova. Se esta criação falhar, é porque ainda há duplicata — e falhar
-- aqui é o comportamento certo: melhor a migration parar do que o site somar
-- errado de novo em silêncio.
create unique index if not exists convenios_federais_municipio_codigo_uk
  on convenios_federais (id_municipio, codigo);

commit;
