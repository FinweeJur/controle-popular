// core/voo.test.mjs — teste do deep link "voe até aqui".
//
// Por que existe: o parsing é o ponto que pode mentir. Um `voe` inválido que
// passasse viraria um voo para o oceano em cima de um link publicado. Aqui se
// afirma o CONTEÚDO do retorno, não só a forma.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { vooDoEndereco, enderecoVoarAte } from './voo.js';

test('lê um voo completo (lat, lon, nome, ctx, z)', () => {
  const v = vooDoEndereco('?voe=-20.3856,-43.5036&nome=Ouro%20Preto&ctx=ouro-preto&z=1.02');
  assert.deepEqual(v, { lat: -20.3856, lon: -43.5036, nome: 'Ouro Preto', ctx: 'ouro-preto', distance: 1.02 });
});

test('sem `z`, a distância fica indefinida (o chamador usa o padrão)', () => {
  const v = vooDoEndereco('?voe=-15.8,-47.9');
  assert.equal(v.lat, -15.8);
  assert.equal(v.lon, -47.9);
  assert.equal(v.distance, undefined);
});

test('sem `voe` devolve null', () => {
  assert.equal(vooDoEndereco('?camada=terras-indigenas'), null);
  assert.equal(vooDoEndereco(''), null);
  assert.equal(vooDoEndereco(null), null);
});

test('latitude/longitude fora da faixa devolve null (não voa para o oceano)', () => {
  assert.equal(vooDoEndereco('?voe=95,-43'), null);
  assert.equal(vooDoEndereco('?voe=-20,181'), null);
});

test('`voe` mal formado devolve null', () => {
  assert.equal(vooDoEndereco('?voe=-20'), null);
  assert.equal(vooDoEndereco('?voe=-20,-43,-1'), null);
  assert.equal(vooDoEndereco('?voe=a,b'), null);
});

test('ctx fora do formato de slug é descartado, o voo continua', () => {
  const v = vooDoEndereco('?voe=-20,-43&ctx=' + encodeURIComponent('<script>alert(1)</script>'));
  assert.equal(v.ctx, null);
  assert.equal(v.lat, -20);
});

test('z fora da faixa cai no padrão', () => {
  assert.equal(vooDoEndereco('?voe=-20,-43&z=99').distance, undefined);
  assert.equal(vooDoEndereco('?voe=-20,-43&z=0.5').distance, undefined);
  assert.equal(vooDoEndereco('?voe=-20,-43&z=abc').distance, undefined);
});

test('enderecoVoarAte e vooDoEndereco fecham o ciclo', () => {
  const url = enderecoVoarAte({ lat: -20.3856, lon: -43.5036, nome: 'Ouro Preto', ctx: 'ouro-preto' });
  assert.ok(url.startsWith('/terras/globo/?'));
  const search = url.slice(url.indexOf('?'));
  const v = vooDoEndereco(search);
  assert.deepEqual(v, { lat: -20.3856, lon: -43.5036, nome: 'Ouro Preto', ctx: 'ouro-preto', distance: undefined });
});

test('nome com acento e espaço sobrevive ao ciclo', () => {
  const url = enderecoVoarAte({ lat: -20.1, lon: -44.1, nome: 'Araçuaí, Coronel Murta' });
  const v = vooDoEndereco(url.slice(url.indexOf('?')));
  assert.equal(v.nome, 'Araçuaí, Coronel Murta');
});
