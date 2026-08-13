/**
 * Teste de fetchLayer (js/data/api.js), fora do navegador.
 *
 *   node --test apps/web/public/terras/globo/js/data/api.test.mjs
 *
 * ⟲ 13/08/2026 — `fetchLayer` ganhou um segundo caminho: camadas marcadas
 * `comprimida` (config.js) buscam `<id>.geojson.gz` e passam por
 * `DecompressionStream('gzip')` antes do `JSON.parse` — ver o cabeçalho de
 * api.js para o porquê (teto de 25 MiB do Workers Static Assets). Este
 * arquivo testa os DOIS caminhos sem precisar de um navegador nem de uma
 * rede de verdade: `fetch` e `DecompressionStream` são globais nativos do
 * Node (18+ e 22 respectivamente) — o mesmo runtime que este projeto já usa
 * para rodar todos os outros `*.test.mjs`.
 *
 * O que se garante:
 *   1. caminho comum (sem `comprimida`): pede `<id>.geojson`, devolve a
 *      FeatureCollection tal qual;
 *   2. caminho comprimido: pede `<id>.geojson.gz`, o corpo chega como bytes
 *      gzip de verdade (comprimidos aqui com `CompressionStream`, o par do
 *      `DecompressionStream` que o código usa), e o resultado é a MESMA
 *      FeatureCollection do outro lado — a viagem de ida e volta não perde
 *      nem inventa feição;
 *   3. `DecompressionStream` ausente falha com mensagem CLARA e não derruba
 *      o processo — é o requisito do dono: navegador sem a API não pode
 *      quebrar o globo inteiro, só a linha desta camada (ver o `catch` de
 *      `LayerManager._carregar`, que trata qualquer erro de `fetchLayer` da
 *      mesma forma, comprimida ou não);
 *   4. HTTP não-OK e payload inválido continuam se comportando como antes —
 *      a mudança é aditiva, não reescreveu o caminho que já funcionava.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { fetchLayer } from './api.js';

const FC_EXEMPLO = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { nome: 'área 1' }, geometry: { type: 'Point', coordinates: [1, 2] } },
    { type: 'Feature', properties: { nome: 'área 2' }, geometry: { type: 'Point', coordinates: [3, 4] } },
  ],
};

/** Comprime uma string em gzip de verdade, com o par nativo de DecompressionStream. */
async function gzipDeVerdade(texto) {
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(new TextEncoder().encode(texto));
  writer.close();
  return new Response(cs.readable).arrayBuffer();
}

/** Troca `global.fetch` por um fake durante o corpo de `fn`, e sempre restaura depois. */
async function comFetchFalso(handler, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  try {
    await fn();
  } finally {
    globalThis.fetch = original;
  }
}

test('sem `comprimida`: busca <id>.geojson, devolve a FeatureCollection tal qual', async () => {
  const pedidos = [];
  await comFetchFalso(
    async (url) => {
      pedidos.push(url);
      return new Response(JSON.stringify(FC_EXEMPLO), { status: 200 });
    },
    async () => {
      const fc = await fetchLayer('minha-camada');
      assert.deepEqual(fc, FC_EXEMPLO);
    },
  );
  assert.deepEqual(pedidos, ['/terras/globo/dados/camadas/minha-camada.geojson']);
});

test('`comprimida: true`: busca <id>.geojson.gz, descomprime e chega na MESMA FeatureCollection', async () => {
  const gz = await gzipDeVerdade(JSON.stringify(FC_EXEMPLO));
  const pedidos = [];
  await comFetchFalso(
    async (url) => {
      pedidos.push(url);
      return new Response(gz, { status: 200 });
    },
    async () => {
      const fc = await fetchLayer('sigmine-interesse', { comprimida: true });
      assert.deepEqual(fc, FC_EXEMPLO, 'a ida e volta por gzip não pode perder nem inventar feição');
    },
  );
  assert.deepEqual(pedidos, ['/terras/globo/dados/camadas/sigmine-interesse.geojson.gz'],
    'tem que pedir o .gz, nunca o .geojson cru, quando a camada está marcada comprimida');
});

test('`comprimida: true` sem DecompressionStream: falha com mensagem clara, não derruba o processo', async () => {
  const original = globalThis.DecompressionStream;
  // Simula um navegador antigo. `delete` e não `= undefined`: `typeof` teria
  // que enxergar 'undefined' de qualquer jeito, e apagar a chave é o mais
  // próximo de "a API não existe" que dá para simular sem sair do processo.
  delete globalThis.DecompressionStream;
  try {
    await comFetchFalso(
      async () => { throw new Error('fetch não deveria ser chamado — a checagem de DecompressionStream vem antes da rede'); },
      async () => {
        await assert.rejects(
          () => fetchLayer('zas-barragens', { comprimida: true }),
          (err) => {
            assert.match(err.message, /zas-barragens/);
            assert.match(err.message, /DecompressionStream/);
            return true;
          },
        );
      },
    );
  } finally {
    globalThis.DecompressionStream = original;
  }
});

test('HTTP não-OK continua rejeitando com o status, comprimida ou não', async () => {
  await comFetchFalso(
    async () => new Response('não achei', { status: 404 }),
    async () => {
      await assert.rejects(() => fetchLayer('sumiu'), /HTTP 404/);
      await assert.rejects(() => fetchLayer('sumiu', { comprimida: true }), /HTTP 404/);
    },
  );
});

test('payload que não é FeatureCollection continua rejeitando — no caminho comprimido também', async () => {
  const gz = await gzipDeVerdade(JSON.stringify({ oi: 'não sou um geojson' }));
  await comFetchFalso(
    async () => new Response(gz, { status: 200 }),
    async () => {
      await assert.rejects(
        () => fetchLayer('errada', { comprimida: true }),
        /FeatureCollection válida/,
      );
    },
  );
});

test('erro de rede (fetch lança) vira mensagem amigável, no caminho comum', async () => {
  await comFetchFalso(
    async () => { throw new Error('DNS caiu'); },
    async () => {
      await assert.rejects(() => fetchLayer('qualquer'), /Falha de rede.*DNS caiu/);
    },
  );
});
