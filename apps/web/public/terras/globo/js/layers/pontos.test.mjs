/**
 * Teste de `pontos.js` — a conversão que impediu os imóveis da União de
 * virarem quadrados de ~38 km no globo.
 *
 *   node --test public/terras/globo/js/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { tamanhoDePontoEmPx } from './pontos.js';

test('pointSize em radianos (0,005–0,007, os valores do registro) vira pixel de 5–7 px', () => {
  assert.equal(tamanhoDePontoEmPx(0.005), 5);
  assert.equal(tamanhoDePontoEmPx(0.006), 6);
  assert.equal(tamanhoDePontoEmPx(0.007), 7);
});

test('valor ≥ 1 já é pixel e passa direto', () => {
  assert.equal(tamanhoDePontoEmPx(8), 8);
});

test('sem valor ou zero cai no padrão de 5 px — nunca num quadrado de quilômetros', () => {
  assert.equal(tamanhoDePontoEmPx(undefined), 5);
  assert.equal(tamanhoDePontoEmPx(0), 5);
  assert.equal(tamanhoDePontoEmPx(null), 5);
});