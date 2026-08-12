/**
 * Teste de `calcularJanela()`, fora do navegador.
 *
 *   node --test backend/static/globe/js/ui/listapanel.test.mjs
 *
 * `calcularJanela` é a matemática pura por trás da virtualização da lista
 * (ver o comentário grande no topo de listapanel.js, conserto de 12/08):
 * dado o total de entradas e o quanto já se rolou, decide QUAIS índices
 * viram DOM. É pura de propósito — sem tocar em `document` — porque o que
 * precisa de garantia aqui é a aritmética do intervalo, não o navegador: um
 * `inicio`/`fim` errado tanto pode deixar um buraco em branco na lista
 * (janela curta demais) quanto devolver a lista inteira de novo, o problema
 * que a virtualização existe para resolver (janela grande demais).
 *
 * O que se garante:
 *   1. total vazio ou passo inválido (0/negativo) não quebra — devolve
 *      janela vazia, não NaN nem índice negativo;
 *   2. no topo da rolagem, `inicio` nunca fica negativo (o buffer não deve
 *      empurrar para antes do início real do array);
 *   3. no meio da rolagem, a janela fica centrada em `scrollTop / passo`,
 *      com o buffer de cada lado;
 *   4. no fim da rolagem, `fim` nunca passa de `total` (o buffer não deve
 *      pedir linhas que não existem);
 *   5. a largura da janela cresce com o viewport e com o buffer, na conta
 *      exata — é o que decide quantos nós vira DOM por quadro;
 *   6. lista menor que uma janela inteira devolve a lista inteira (a
 *      virtualização não deve inventar um recorte onde não precisa de um).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calcularJanela } from './listapanel.js';

test('total zero devolve janela vazia, sem dividir por zero', () => {
  assert.deepEqual(calcularJanela(0, 0, 600, 48), { inicio: 0, fim: 0 });
});

test('passo zero ou negativo devolve janela vazia em vez de Infinity/NaN', () => {
  assert.deepEqual(calcularJanela(1000, 0, 600, 0), { inicio: 0, fim: 0 });
  assert.deepEqual(calcularJanela(1000, 0, 600, -10), { inicio: 0, fim: 0 });
});

test('topo da rolagem: inicio nunca fica negativo mesmo com buffer', () => {
  // scrollTop=0 -> floor(0/48)-8 = -8, precisa grudar em 0.
  const { inicio } = calcularJanela(1000, 0, 600, 48, 8);
  assert.equal(inicio, 0);
});

test('meio da rolagem: janela centrada em scrollTop/passo, com buffer de cada lado', () => {
  // scrollTop=4800 -> linha 100 é o topo visível. buffer=8 linhas antes.
  const { inicio, fim } = calcularJanela(1000, 4800, 480, 48, 8);
  assert.equal(inicio, 100 - 8);
  // linhasNaTela = ceil(480/48) + 8*2 = 10 + 16 = 26
  assert.equal(fim, inicio + 26);
});

test('fim da rolagem: fim nunca passa de total mesmo com buffer pedindo mais', () => {
  const { inicio, fim } = calcularJanela(1000, 47500, 480, 48, 8);
  assert.equal(fim, 1000);
  assert.ok(inicio < fim, 'janela não pode inverter perto do fim da lista');
});

test('viewport maior pede mais linhas na janela, na conta exata', () => {
  const janelaCurta = calcularJanela(5000, 0, 480, 48, 8);
  const janelaAlta = calcularJanela(5000, 0, 960, 48, 8);
  assert.ok(janelaAlta.fim > janelaCurta.fim, 'tela mais alta tem de renderizar mais linhas, não menos');
  // ceil(960/48) + 16 = 20 + 16 = 36, contra ceil(480/48) + 16 = 26
  assert.equal(janelaAlta.fim - janelaAlta.inicio, 36);
  assert.equal(janelaCurta.fim - janelaCurta.inicio, 26);
});

test('buffer maior alarga a janela para os dois lados, não só um', () => {
  const semBuffer = calcularJanela(5000, 4800, 480, 48, 0);
  const comBuffer = calcularJanela(5000, 4800, 480, 48, 20);
  assert.equal(semBuffer.inicio, 100);
  assert.equal(comBuffer.inicio, 100 - 20);
  assert.equal(comBuffer.fim - comBuffer.inicio, (semBuffer.fim - semBuffer.inicio) + 40);
});

test('lista menor que uma janela inteira devolve a lista inteira, sem recorte artificial', () => {
  // 20 entradas, buffer generoso: fim clampado em 20, inicio clampado em 0 --
  // não deve sobrar um "resto" de janela menor que o total quando o total
  // já cabe de sobra no que a tela pediria.
  const { inicio, fim } = calcularJanela(20, 0, 600, 48, 8);
  assert.equal(inicio, 0);
  assert.equal(fim, 20);
});

test('viewport ou scrollTop negativos (não deveriam acontecer, mas não podem travar) não geram janela invertida', () => {
  const { inicio, fim } = calcularJanela(1000, 0, -50, 48, 8);
  assert.ok(inicio <= fim, 'inicio nunca pode passar de fim, mesmo com entrada anômala');
});
