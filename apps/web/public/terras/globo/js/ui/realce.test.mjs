/**
 * Teste de `realce.js` fora do navegador.
 *
 *   node --test backend/static/globe/js/ui/realce.test.mjs
 *
 * Existe porque o efeito não é verificável no painel do navegador desta
 * ferramenta: `requestAnimationFrame` não avança enquanto o painel está oculto
 * (não compõe frames), então nem a animação roda nem `getComputedStyle` devolve
 * valor final. Em vez de contorcer o navegador, o contrato do módulo é medido
 * aqui com um LayerManager falso e um rAF controlado por mim.
 *
 * O que se garante:
 *   1. a opacidade original de cada material é restaurada EXATAMENTE;
 *   2. opacidade nunca passa de 1, mesmo com material que já estava em 0,9;
 *   3. a camada em foco sobe e as outras descem;
 *   4. `--dur-base: 0ms` (que é o que prefers-reduced-motion produz) troca de
 *      estado num quadro só, sem trajeto;
 *   5. sair do painel solta tudo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

/* ---------- ambiente mínimo de navegador ------------------------------ */
function montarAmbiente(duracao = '200ms') {
  const ouvintes = new Map();
  const painel = {
    addEventListener: (t, fn) => ouvintes.set(t, fn),
    contains: () => true,
    querySelectorAll: () => [],
  };
  const fila = [];
  globalThis.requestAnimationFrame = (fn) => { fila.push(fn); return fila.length; };
  globalThis.cancelAnimationFrame = () => {};
  globalThis.getComputedStyle = () => ({ getPropertyValue: () => duracao });
  globalThis.document = { body: { dataset: {} } };
  /** Roda a fila de rAF até esvaziar, com teto para não travar se algo ficar preso. */
  const rodar = (max = 400) => {
    let n = 0;
    while (fila.length && n++ < max) fila.shift()();
    return n;
  };
  const disparar = (tipo, alvo) => ouvintes.get(tipo)?.({
    target: { closest: (sel) => (sel === '.layer-row' ? alvo : null) },
    relatedTarget: null,
  });
  return { painel, rodar, disparar };
}

/** LayerManager falso: dois materiais por camada, opacidades diferentes. */
function fakeLayers(opacidades) {
  const state = new Map();
  const registry = new Map();
  for (const [id, ops] of Object.entries(opacidades)) {
    const mats = ops.map((o) => ({ opacity: o }));
    registry.set(id, { id });
    state.set(id, {
      object: { traverse(fn) { for (const m of mats) fn({ material: m }); } },
      _mats: mats,
    });
  }
  return {
    state, registry,
    isEnabled: (id) => state.get(id)?.object != null,
    mats: (id) => state.get(id)._mats.map((m) => +m.opacity.toFixed(4)),
  };
}

const linha = (id) => ({ dataset: { layerId: id }, classList: { add() {}, remove() {} }, contains: () => false });

test('restaura a opacidade original exatamente ao soltar', async () => {
  const { painel, rodar, disparar } = montarAmbiente();
  const { criarRealce } = await import('./realce.js');
  const layers = fakeLayers({ a: [0.28, 0.9], b: [0.28] });
  criarRealce(layers, painel);

  const antes = { a: layers.mats('a'), b: layers.mats('b') };
  disparar('pointerover', linha('a'));
  rodar();
  disparar('pointerout', linha('a'));
  rodar();

  assert.deepEqual(layers.mats('a'), antes.a, 'camada em foco não voltou ao original');
  assert.deepEqual(layers.mats('b'), antes.b, 'camada recuada não voltou ao original');
});

test('nunca passa de 1, mesmo partindo de 0,9', async () => {
  const { painel, rodar, disparar } = montarAmbiente('0ms');
  const { criarRealce } = await import('./realce.js');
  const layers = fakeLayers({ a: [0.9] });
  criarRealce(layers, painel);

  disparar('pointerover', linha('a'));
  rodar();

  assert.equal(layers.mats('a')[0], 1, '0,9 × 2,2 deveria ser limitado a 1');
});

test('a camada em foco sobe e as outras descem', async () => {
  const { painel, rodar, disparar } = montarAmbiente('0ms');
  const { criarRealce } = await import('./realce.js');
  const layers = fakeLayers({ foco: [0.28], outra: [0.28] });
  criarRealce(layers, painel);

  disparar('pointerover', linha('foco'));
  rodar();

  const f = layers.mats('foco')[0], o = layers.mats('outra')[0];
  assert.ok(f > 0.28, `a em foco deveria subir de 0,28 (deu ${f})`);
  assert.ok(o < 0.28, `a outra deveria recuar de 0,28 (deu ${o})`);
  assert.ok(f > o, 'a em foco tem de ficar acima da recuada');
});

test('com duração zero — o que prefers-reduced-motion produz — troca num quadro', async () => {
  const { painel, rodar, disparar } = montarAmbiente('0ms');
  const { criarRealce } = await import('./realce.js');
  const layers = fakeLayers({ a: [0.28], b: [0.28] });
  criarRealce(layers, painel);

  disparar('pointerover', linha('a'));
  const quadros = rodar();

  assert.ok(quadros <= 2, `deveria assentar em 1–2 quadros, gastou ${quadros}`);
  assert.ok(layers.mats('a')[0] > 0.28, 'chegou ao alvo sem trajeto');
});

test('soltar pelo painel devolve tudo ao repouso', async () => {
  const { painel, rodar, disparar } = montarAmbiente('0ms');
  const { criarRealce } = await import('./realce.js');
  const layers = fakeLayers({ a: [0.28], b: [0.9] });
  const realce = criarRealce(layers, painel);

  disparar('pointerover', linha('a'));
  rodar();
  realce.soltar();
  rodar();

  assert.deepEqual(layers.mats('a'), [0.28]);
  assert.deepEqual(layers.mats('b'), [0.9]);
});

test('a animação para sozinha — não deixa rAF girando', async () => {
  const { painel, rodar, disparar } = montarAmbiente('200ms');
  const { criarRealce } = await import('./realce.js');
  const layers = fakeLayers({ a: [0.28], b: [0.28] });
  criarRealce(layers, painel);

  disparar('pointerover', linha('a'));
  const subindo = rodar();
  disparar('pointerout', linha('a'));
  const voltando = rodar();

  assert.ok(subindo < 400, 'a subida não convergiu — rAF ficaria girando');
  assert.ok(voltando < 400, 'o retorno não convergiu');
});
