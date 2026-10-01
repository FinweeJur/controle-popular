/**
 * Testes da memória local das camadas do globo (`camadas-salvas.js`).
 *
 *   node --test apps/web/public/terras/globo/js/ui/camadas-salvas.test.mjs
 *
 * O que se garante, e por que cada um importa:
 *   1. `normalizarIds` limpa o que vier torto — string de URL, array do JSON —
 *      e nunca deixa um id repetido ou vazio passar;
 *   2. `camadasDoEndereco` distingue AUSENTE (null = não mexe em nada) de
 *      PRESENTE (lista, mesmo vazia = o link manda), ignora id inexistente com
 *      aviso e recusa camada estruturalmente vazia;
 *   3. `lerCamadasSalvas`/`gravarCamadasSalvas` sobrevivem a armazenamento
 *      ausente, JSON corrompido, valor que não é lista e id que saiu do app —
 *      memória quebrada não pode impedir o globo de abrir;
 *   4. `montarUrlComCamadas` produz o `?camadas=a,b,c` legível, tira o
 *      `?camada=` singular e o `#area=`, preserva o resto da query e, com
 *      lista vazia, NÃO escreve `?camadas=` (não desliga tudo na outra ponta);
 *   5. contra as CAMADAS_RESOLVIDAS reais: os ids de exemplo continuam
 *      existindo e a camada vazia continua vazia — se isso mudar, o teste da
 *      memória avisa junto.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CHAVE_CAMADAS_SALVAS,
  normalizarIds,
  filtrarCamadasValidas,
  camadasDoEndereco,
  lerCamadasSalvas,
  gravarCamadasSalvas,
  montarUrlComCamadas,
} from './camadas-salvas.js';
import { CAMADAS_RESOLVIDAS } from '../config.js';

/** `localStorage` de mentira: um Map com a mesma cara da API nativa. */
function armazenamentoFalso(inicial = {}) {
  const mapa = new Map(Object.entries(inicial));
  return {
    mapa,
    getItem: (k) => (mapa.has(k) ? mapa.get(k) : null),
    setItem: (k, v) => mapa.set(k, String(v)),
    removeItem: (k) => mapa.delete(k),
  };
}

/** Roda a função capturando `console.warn`, para o aviso virar asserção. */
function comAviso(fn) {
  const avisos = [];
  const original = console.warn;
  console.warn = (m) => avisos.push(m);
  try {
    return { resultado: fn(), avisos };
  } finally {
    console.warn = original;
  }
}

// --- normalizarIds ----------------------------------------------------------

test('normalizarIds limpa espaços, vazios e duplicatas, preservando a ordem', () => {
  assert.deepEqual(normalizarIds(' a , b ,a,,c '), ['a', 'b', 'c']);
  assert.deepEqual(normalizarIds(['x', 'x', ' y ']), ['x', 'y']);
  assert.deepEqual(normalizarIds(''), []);
  assert.deepEqual(normalizarIds(null), []);
  assert.deepEqual(normalizarIds(undefined), []);
  assert.deepEqual(normalizarIds('   '), []);
});

test('normalizarIds não quebra com vírgula solta nem com valor não-texto', () => {
  assert.deepEqual(normalizarIds(',,a,,'), ['a']);
  assert.deepEqual(normalizarIds([1, 2, 2]), ['1', '2']);
});

// --- filtrarCamadasValidas ---------------------------------------------------

test('filtrarCamadasValidas aceita só id que existe e não é vazia', () => {
  const camadas = [
    { id: 'a' },
    { id: 'b', vazia: false },
    { id: 'v', vazia: true },
  ];
  assert.deepEqual(filtrarCamadasValidas(['a', 'v', 'sumiu', 'b'], camadas), ['a', 'b']);
  assert.deepEqual(filtrarCamadasValidas([], camadas), []);
});

// --- camadasDoEndereco -------------------------------------------------------

test('sem ?camadas= devolve null — ausência é diferente de lista vazia', () => {
  assert.equal(camadasDoEndereco('', CAMADAS_RESOLVIDAS), null);
  assert.equal(camadasDoEndereco('?outro=x', CAMADAS_RESOLVIDAS), null);
  assert.equal(camadasDoEndereco('?camada=assentamentos', CAMADAS_RESOLVIDAS), null);
});

test('?camadas= devolve os ids válidos na ordem do link', () => {
  const ids = camadasDoEndereco(
    '?camadas=vazio-cadastral,assentamentos',
    CAMADAS_RESOLVIDAS,
  );
  assert.deepEqual(ids, ['vazio-cadastral', 'assentamentos']);
});

test('?camadas= presente mas vazio devolve [] — o link manda, e manda nada', () => {
  assert.deepEqual(camadasDoEndereco('?camadas=', CAMADAS_RESOLVIDAS), []);
});

test('?camadas= ignora id inexistente e AVISA', () => {
  const { resultado, avisos } = comAviso(() =>
    camadasDoEndereco('?camadas=assentamentos,nao-existe', CAMADAS_RESOLVIDAS));
  assert.deepEqual(resultado, ['assentamentos']);
  assert.equal(avisos.length, 1, 'silêncio aqui vira link morto com cara de certo');
  assert.match(avisos[0], /nao-existe/);
});

test('?camadas= recusa camada estruturalmente vazia — acenderia chave que não desenha', () => {
  const { resultado, avisos } = comAviso(() =>
    camadasDoEndereco('?camadas=devolutas-arrecadadas', CAMADAS_RESOLVIDAS));
  assert.deepEqual(resultado, []);
  assert.match(avisos[0], /devolutas-arrecadadas/);
});

test('?camadas= normaliza duplicata e espaço', () => {
  assert.deepEqual(
    camadasDoEndereco('?camadas=assentamentos, assentamentos ,vazio-cadastral', CAMADAS_RESOLVIDAS),
    ['assentamentos', 'vazio-cadastral'],
  );
});

// --- lerCamadasSalvas / gravarCamadasSalvas ----------------------------------

test('gravar e ler fazem round-trip com o conjunto normalizado', () => {
  const storage = armazenamentoFalso();
  const camadas = [{ id: 'a' }, { id: 'b' }];
  assert.equal(gravarCamadasSalvas(storage, ['a', 'a', 'b']), true);
  assert.equal(storage.mapa.get(CHAVE_CAMADAS_SALVAS), JSON.stringify(['a', 'b']));
  assert.deepEqual(lerCamadasSalvas(storage, camadas), ['a', 'b']);
});

test('sem nada salvo devolve null — nunca salvou é diferente de salvou nada', () => {
  assert.equal(lerCamadasSalvas(armazenamentoFalso(), CAMADAS_RESOLVIDAS), null);
  assert.equal(lerCamadasSalvas(null, CAMADAS_RESOLVIDAS), null);
});

test('lista vazia SALVA devolve [] — "desliguei tudo" é memória válida', () => {
  const storage = armazenamentoFalso({ [CHAVE_CAMADAS_SALVAS]: '[]' });
  assert.deepEqual(lerCamadasSalvas(storage, CAMADAS_RESOLVIDAS), []);
});

test('JSON corrompido devolve null — memória ilegível conta como sem memória', () => {
  const storage = armazenamentoFalso({ [CHAVE_CAMADAS_SALVAS]: '{isso não é json' });
  assert.equal(lerCamadasSalvas(storage, CAMADAS_RESOLVIDAS), null);
});

test('valor que não é lista devolve null — objeto não é conjunto de camadas', () => {
  const storage = armazenamentoFalso({ [CHAVE_CAMADAS_SALVAS]: '{"a":1}' });
  assert.equal(lerCamadasSalvas(storage, CAMADAS_RESOLVIDAS), null);
});

test('id salvo que saiu do app é descartado em silêncio, e o válido fica', () => {
  const storage = armazenamentoFalso({
    [CHAVE_CAMADAS_SALVAS]: JSON.stringify(['assentamentos', 'camada-que-nao-existe-mais']),
  });
  const { resultado, avisos } = comAviso(() => lerCamadasSalvas(storage, CAMADAS_RESOLVIDAS));
  assert.deepEqual(resultado, ['assentamentos']);
  assert.equal(avisos.length, 0, 'memória velha do aparelho não é erro de link');
});

test('getItem que lança devolve null — armazenamento bloqueado não derruba o globo', () => {
  const storage = { getItem() { throw new Error('SecurityError'); } };
  assert.equal(lerCamadasSalvas(storage, CAMADAS_RESOLVIDAS), null);
});

test('setItem que lança devolve false — gravar é extra, não pode quebrar o clique', () => {
  const storage = { setItem() { throw new Error('QuotaExceeded'); } };
  assert.equal(gravarCamadasSalvas(storage, ['a']), false);
});

// --- montarUrlComCamadas -----------------------------------------------------

test('monta ?camadas= legível (vírgula crua) e preserva outras chaves', () => {
  const url = montarUrlComCamadas('https://exemplo.com/terras/globo/?vooLat=-19&vooLon=-44', ['a', 'b']);
  assert.equal(url, 'https://exemplo.com/terras/globo/?vooLat=-19&vooLon=-44&camadas=a,b');
});

test('remove o ?camada= singular para não haver duas fontes de verdade', () => {
  const url = montarUrlComCamadas('https://exemplo.com/terras/globo/?camada=antigo', ['a']);
  assert.equal(url, 'https://exemplo.com/terras/globo/?camadas=a');
});

test('limpa o #area= — o link das camadas é sobre as camadas, não sobre a área', () => {
  const url = montarUrlComCamadas('https://exemplo.com/terras/globo/#area=assentamentos:3', ['a']);
  assert.equal(url, 'https://exemplo.com/terras/globo/?camadas=a');
});

test('lista vazia NÃO escreve ?camadas= — um link sem camadas não desliga nada', () => {
  const url = montarUrlComCamadas('https://exemplo.com/terras/globo/?camadas=antigas&x=1', []);
  assert.equal(url, 'https://exemplo.com/terras/globo/?x=1');
});

test('id repetido no link vira uma ocorrência só', () => {
  const url = montarUrlComCamadas('https://exemplo.com/', ['a', 'a', 'b']);
  assert.equal(url, 'https://exemplo.com/?camadas=a,b');
});

// --- contra as camadas reais -------------------------------------------------

test('os ids usados nestes testes existem de verdade nas CAMADAS_RESOLVIDAS', () => {
  const porId = new Map(CAMADAS_RESOLVIDAS.map((c) => [c.id, c]));
  assert.ok(porId.has('assentamentos'), 'assentamentos precisa existir');
  assert.ok(porId.has('vazio-cadastral'), 'vazio-cadastral precisa existir');
  assert.equal(porId.get('devolutas-arrecadadas')?.vazia, true,
    'devolutas-arrecadadas é o exemplo real de camada vazia recusada pelo link');
});

test('um link real ?camadas= é a lista que o painel entrega ao main.js', () => {
  const ids = camadasDoEndereco(
    '?camadas=vazio-cadastral,territorios-quilombolas',
    CAMADAS_RESOLVIDAS,
  );
  for (const id of ids) {
    assert.ok(CAMADAS_RESOLVIDAS.some((c) => c.id === id && !c.vazia));
  }
});
