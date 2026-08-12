/**
 * Teste de `pontosuperficie.js` fora do navegador.
 *
 *   node --test backend/static/globe/js/ui/pontosuperficie.test.mjs
 *
 * O que se garante, em ordem de dano — dano aqui é "a ficha afirma que o
 * ponto fica dentro da área, e o ponto está fora":
 *
 *   1. o ponto devolvido está SEMPRE dentro do polígono, mesmo em formas
 *      côncavas onde o centroide ingênuo cairia fora — é o próprio defeito
 *      que este módulo existe para não ter;
 *   2. furo exclui: o ponto nunca cai dentro de um anel interno;
 *   3. `MultiPolygon` devolve um ponto dentro de ALGUMA parte, não uma
 *      média entre partes (que poderia cair no vão entre elas);
 *   4. tipos sem "dentro" (`Point`, `LineString`, geometria ausente ou
 *      degenerada) devolvem `null`, não um palpite.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { pontoNaSuperficie } from './pontosuperficie.js';

/** Ray casting simples, independente da implementação testada — serve de
 * árbitro para "o ponto está dentro do polígono?" sem reusar o código que
 * está sendo verificado. */
function dentroDoPoligono(lon, lat, coordinates) {
  const dentroDeUmAnel = (anel) => {
    let dentro = false;
    for (let i = 0, n = anel.length, j = n - 1; i < n; j = i++) {
      const [xi, yi] = anel[i];
      const [xj, yj] = anel[j];
      if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) dentro = !dentro;
    }
    return dentro;
  };
  if (!dentroDeUmAnel(coordinates[0])) return false;
  return !coordinates.slice(1).some(dentroDeUmAnel);
}

/* ---------- 1. nunca cai fora, mesmo côncavo ---------------------------- */

test('quadrado simples: o ponto cai dentro', () => {
  const geometry = {
    type: 'Polygon',
    coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
  };
  const p = pontoNaSuperficie(geometry);
  assert.ok(p);
  assert.ok(dentroDoPoligono(p.lon, p.lat, geometry.coordinates));
  // Num quadrado o polo de inacessibilidade é o próprio centro.
  assert.ok(Math.abs(p.lon - 5) < 1e-3);
  assert.ok(Math.abs(p.lat - 5) < 1e-3);
});

test('forma em U: o centroide cairia no vão — o ponto calculado não', () => {
  // U de 10×10 com uma mordida central de 6×7 saindo do topo: o centroide
  // da caixa envolvente (5,5) cai bem no vão da mordida, fora da forma.
  const geometry = {
    type: 'Polygon',
    coordinates: [[
      [0, 0], [10, 0], [10, 10], [8, 10], [8, 3], [2, 3], [2, 10], [0, 10], [0, 0],
    ]],
  };
  assert.ok(!dentroDoPoligono(5, 5, geometry.coordinates), 'pré-condição: o centro do U está vazio');
  const p = pontoNaSuperficie(geometry);
  assert.ok(p);
  assert.ok(dentroDoPoligono(p.lon, p.lat, geometry.coordinates), 'o ponto calculado caiu no vão do U');
});

test('corredor fino e sinuoso: mesmo aqui o ponto cai dentro', () => {
  // Um "Z" de 2 unidades de largura — o caso que o projeto mede em
  // compacidade e que motivou este módulo (ver cabeçalho do arquivo).
  const geometry = {
    type: 'Polygon',
    coordinates: [[
      [0, 0], [2, 0], [2, 18], [20, 18], [20, 20], [0, 20], [0, 0],
    ]],
  };
  const p = pontoNaSuperficie(geometry);
  assert.ok(p);
  assert.ok(dentroDoPoligono(p.lon, p.lat, geometry.coordinates));
});

test('triângulo bem obtuso (quase uma linha): ainda dentro, ou null — nunca fora', () => {
  const geometry = { type: 'Polygon', coordinates: [[[0, 0], [100, 1], [50, 0.2], [0, 0]]] };
  const p = pontoNaSuperficie(geometry);
  if (p) assert.ok(dentroDoPoligono(p.lon, p.lat, geometry.coordinates));
});

/* ---------- 2. furo exclui ------------------------------------------- */

test('anel (donut): o ponto nunca cai no furo central', () => {
  const geometry = {
    type: 'Polygon',
    coordinates: [
      [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],       // externo
      [[3, 3], [3, 7], [7, 7], [7, 3], [3, 3]],           // furo central
    ],
  };
  const p = pontoNaSuperficie(geometry);
  assert.ok(p);
  const noFuro = p.lon > 3 && p.lon < 7 && p.lat > 3 && p.lat < 7;
  assert.ok(!noFuro, `ponto caiu dentro do furo: ${p.lon},${p.lat}`);
  assert.ok(dentroDoPoligono(p.lon, p.lat, geometry.coordinates));
});

/* ---------- 3. MultiPolygon: dentro de UMA parte ----------------------- */

test('MultiPolygon: o ponto cai dentro de uma das partes, não no vão entre elas', () => {
  const geometry = {
    type: 'MultiPolygon',
    coordinates: [
      [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]],          // parte pequena
      [[[100, 100], [140, 100], [140, 140], [100, 140], [100, 100]]], // parte grande
    ],
  };
  const p = pontoNaSuperficie(geometry);
  assert.ok(p);
  const naPequena = dentroDoPoligono(p.lon, p.lat, geometry.coordinates[0]);
  const naGrande = dentroDoPoligono(p.lon, p.lat, geometry.coordinates[1]);
  assert.ok(naPequena || naGrande, 'o ponto não caiu em nenhuma das duas partes');
  // A parte grande tem raio interno maior (20 contra 2) — é ela que deve vencer.
  assert.ok(naGrande, 'devia ter escolhido a parte com maior raio interno');
});

/* ---------- 4. sem "dentro": null, nunca palpite ----------------------- */

test('Point não tem interior: devolve null', () => {
  assert.equal(pontoNaSuperficie({ type: 'Point', coordinates: [1, 2] }), null);
});

test('LineString não tem interior: devolve null', () => {
  assert.equal(pontoNaSuperficie({ type: 'LineString', coordinates: [[0, 0], [1, 1]] }), null);
});

test('geometria ausente: devolve null, não lança', () => {
  assert.equal(pontoNaSuperficie(null), null);
  assert.equal(pontoNaSuperficie(undefined), null);
});

test('polígono degenerado (menos de 3 vértices): devolve null', () => {
  assert.equal(pontoNaSuperficie({ type: 'Polygon', coordinates: [[[0, 0], [1, 1]]] }), null);
});

test('polígono de área zero (todos os pontos numa reta): devolve null', () => {
  assert.equal(pontoNaSuperficie({ type: 'Polygon', coordinates: [[[0, 0], [1, 0], [2, 0], [0, 0]]] }), null);
});

test('MultiPolygon vazio: devolve null', () => {
  assert.equal(pontoNaSuperficie({ type: 'MultiPolygon', coordinates: [] }), null);
});

/* ---------- precisão: célula menor dá ponto mais fiel ------------------- */

test('mais precisão aproxima melhor do polo verdadeiro (quadrado: o próprio centro)', () => {
  const geometry = { type: 'Polygon', coordinates: [[[0, 0], [7, 0], [7, 7], [0, 7], [0, 0]]] };
  const grosseiro = pontoNaSuperficie(geometry, 1);
  const fino = pontoNaSuperficie(geometry, 1e-6);
  const distFino = Math.hypot(fino.lon - 3.5, fino.lat - 3.5);
  const distGrosseiro = Math.hypot(grosseiro.lon - 3.5, grosseiro.lat - 3.5);
  assert.ok(distFino <= distGrosseiro + 1e-9);
});
