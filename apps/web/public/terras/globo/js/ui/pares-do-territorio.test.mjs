/**
 * Teste de `pares-do-territorio.js` contra o arquivo REAL do raio de 8 km.
 *
 *   node --test public/terras/globo/js/
 *
 * Os números pinçados foram medidos no arquivo em 15/08/2026: 328 pares,
 * 30 nomes de território distintos, MACHADINHO com 10 (Kinross a 72,9 m),
 * KIRIRI DE CALDAS com 51, XACRIABÁ com 11.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { normalizarNome, paresDoTerritorio, secaoDePares } from './pares-do-territorio.js';

const CAMADAS = join(fileURLToPath(new URL('.', import.meta.url)), '../../dados/camadas');
const raio = JSON.parse(
  readFileSync(join(CAMADAS, 'alerta-raio-territorio-sigmine-operacao.geojson'), 'utf8'),
);
const ti = JSON.parse(readFileSync(join(CAMADAS, 'terras-indigenas.geojson'), 'utf8'));
const quil = JSON.parse(readFileSync(join(CAMADAS, 'territorios-quilombolas.geojson'), 'utf8'));

/* ---------- invariantes do arquivo ---------- */

test('o arquivo tem 328 pares, de 30 territórios distintos (medido em 15/08)', () => {
  assert.equal(raio.features.length, 328);
  const nomes = new Set(raio.features.map((f) => f.properties.territorio_nome));
  assert.equal(nomes.size, 30);
});

/* ---------- o cruzamento ---------- */

test('MACHADINHO tem 10 pares, o mais próximo é a Kinross a 73 m', () => {
  const pares = paresDoTerritorio(raio, 'MACHADINHO');
  assert.equal(pares.length, 10);
  assert.ok(pares.every((p) => normalizarNome(p.territorio_nome) === 'MACHADINHO'));
  const proximo = pares.find((p) => p.distancia_ao_territorio_m > 0);
  assert.equal(proximo.sigmine_nome, 'KINROSS BRASIL MINERACAO S/A');
  assert.equal(Math.round(proximo.distancia_ao_territorio_m), 73);
});

test('KIRIRI DE CALDAS tem 51 pares — o maior acervo da faixa', () => {
  assert.equal(paresDoTerritorio(raio, 'Kiriri de Caldas').length, 51);
});

test('XACRIABÁ tem 11 pares, achado com ou sem acento', () => {
  assert.equal(paresDoTerritorio(raio, 'Xacriabá').length, 11);
  assert.equal(paresDoTerritorio(raio, 'XACRIABA').length, 11);
});

test('pares vêm ordenados do mais próximo ao mais longe', () => {
  const pares = paresDoTerritorio(raio, 'MACHADINHO');
  const dists = pares.map((p) => (p.distancia_ao_territorio_m == null ? Infinity : p.distancia_ao_territorio_m));
  for (let i = 1; i < dists.length; i++) assert.ok(dists[i - 1] <= dists[i]);
});

test('sem distância medida fica no fim, nunca no meio da ordenação', () => {
  const fake = {
    features: [
      { properties: { territorio_nome: 'TESTE', distancia_ao_territorio_m: 500, sigmine_nome: 'B' } },
      { properties: { territorio_nome: 'TESTE', distancia_ao_territorio_m: null, sigmine_nome: 'A' } },
      { properties: { territorio_nome: 'TESTE', distancia_ao_territorio_m: 100, sigmine_nome: 'C' } },
    ],
  };
  const pares = paresDoTerritorio(fake, 'teste');
  assert.deepEqual(
    pares.map((p) => p.distancia_ao_territorio_m),
    [100, 500, null],
  );
});

/* ---------- limites do cruzamento, medidos e documentados ---------- */

test('28 dos 30 nomes do raio casam com os polígonos do mapa — os 2 órfãos são conhecidos', () => {
  const alvos = new Set([
    ...ti.features.map((f) => normalizarNome(f.properties.nome)),
    ...quil.features.map((f) => normalizarNome(f.properties.nome)),
  ]);
  const nomesRaio = new Set(raio.features.map((f) => normalizarNome(f.properties.territorio_nome)));
  const orfaos = [...nomesRaio].filter((n) => !alvos.has(n)).sort();
  assert.equal(nomesRaio.size - orfaos.length, 28);
  assert.deepEqual(orfaos, ['FAMILIATEODORODEOLIVEIRAEVENTURA', 'NOGUEIRA']);
});

test('SÃO SEBASTIÃO não tem par na faixa — a ficha diz 0, não inventa', () => {
  assert.equal(paresDoTerritorio(raio, 'SÃO SEBASTIÃO').length, 0);
});

/* ---------- o HTML da seção ---------- */

test('a seção diz quantos pares e o nome do empreendedor mais próximo', () => {
  const html = secaoDePares(paresDoTerritorio(raio, 'MACHADINHO'));
  assert.match(html, /Na faixa de 8 km \(10\)/);
  assert.match(html, /KINROSS BRASIL MINERACAO S\/A/);
  assert.match(html, /a 73 m do território/);
});

test('par que encosta ganha o selo; os outros, não', () => {
  const pares = paresDoTerritorio(raio, 'MACHADINHO');
  const comSelo = secaoDePares(pares.filter((p) => p.ja_sobrepoe_territorio_publicado));
  assert.match(comSelo, /encosta no território/);
  const semSelo = secaoDePares(pares.filter((p) => !p.ja_sobrepoe_territorio_publicado));
  assert.doesNotMatch(semSelo, /encosta no território/);
});

test('com zero pares a seção diz "nenhum" em vez de sumir', () => {
  const html = secaoDePares([]);
  assert.match(html, /Na faixa de 8 km \(0\)/);
  assert.match(html, /Nenhum processo de mina em operação/);
});

test('nome de empreendedor com caractere HTML não quebra nem injeta', () => {
  const fake = {
    features: [
      { properties: { territorio_nome: 'TESTE', sigmine_nome: '<img src=x onerror=alert(1)>', sigmine_subs: 'a & b', distancia_ao_territorio_m: 100 } },
    ],
  };
  const html = secaoDePares(paresDoTerritorio(fake, 'TESTE'));
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
  assert.match(html, /a &amp; b/);
});

/* ---------- normalização ---------- */

test('normalizarNome apaga acento, caixa e pontuação', () => {
  assert.equal(normalizarNome('SÃO SEBASTIÃO'), 'SAOSEBASTIAO');
  assert.equal(normalizarNome('Mundo Verde/Cachoeirinha'), 'MUNDOVERDECACHOEIRINHA');
  assert.equal(normalizarNome('xakriabá rancharia'), 'XAKRIABARANCHARIA');
});