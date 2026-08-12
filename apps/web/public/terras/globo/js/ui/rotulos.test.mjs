/**
 * Teste de `rotulos.js` fora do navegador — foco no ponto calculado.
 *
 *   node --test backend/static/globe/js/ui/rotulos.test.mjs
 *
 * O resto de rotulos.js (descreverArea, formatarValor, a régua de área) já é
 * coberto por exportar.test.mjs, que importa daqui. Este arquivo cobre o que
 * mudou para consertar o defeito real: 839 áreas em quatro camadas
 * (assentamentos, territórios quilombolas, terra pública certificada,
 * embargos ambientais — e as irmãs `-vales`) chegam sem `ponto_lat`/
 * `ponto_lon`, e a ficha perdia os botões de copiar SEM dizer por quê.
 *
 * O que se garante, em ordem de dano:
 *   1. com contorno e sem ponto da fonte, agora HÁ coordenada — o próprio
 *      defeito, ao contrário;
 *   2. o ponto calculado se DISTINGUE do publicado, na tela e no texto
 *      copiado — quem lê tem direito de saber que aquele par não veio junto
 *      com o resto do dado;
 *   3. quando o dado JÁ traz ponto, nada muda — a distinção só aparece
 *      quando é verdade;
 *   4. sem ponto da fonte E sem contorno (nem isso a área tem), continua
 *      devolvendo nada — nunca um palpite;
 *   5. `permiteOficio=false` esconde só "Copiar para ofício ou LAI" — para
 *      camada sem `listavel` (divisa do IBGE, por exemplo), cujo texto de
 *      ofício ("quem confirma é o INCRA, a SPU ou a Justiça") não faz
 *      sentido nenhum. "Copiar coordenada" continua: saber onde fica é
 *      legítimo mesmo aí;
 *   6. `textoParaPedido` não lança com `props` nulo/indefinido, mesmo quando
 *      `coordenadasDaArea` já devolve um ponto calculado só a partir do
 *      contorno (TypeError latente, nunca alcançado pelos chamadores de
 *      hoje — mas latente é defeito).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  blocoDeCoordenadas,
  coordenadasDaArea,
  ligarCopiar,
  textoParaPedido,
} from './rotulos.js';

/** Quadrado de 1° de lado, centrado em (-41.5, -17.5) — fácil de conferir de cabeça. */
const QUADRADO = { type: 'Polygon', coordinates: [[[-42, -18], [-42, -17], [-41, -17], [-41, -18], [-42, -18]]] };

const PROPS_SEM_PONTO = { municipio: 'Curvelo', area_ha: 168.7 };
const PROPS_COM_PONTO = { municipio: 'Curvelo', area_ha: 168.7, ponto_lat: -18.75, ponto_lon: -44.43 };

/* ---------- 1. com contorno e sem ponto da fonte, agora há coordenada --- */

test('sem ponto_lat/lon mas com geometry: coordenadasDaArea calcula a partir do contorno', () => {
  const c = coordenadasDaArea(PROPS_SEM_PONTO, QUADRADO);

  assert.ok(c, 'devia ter calculado um ponto a partir do polígono');
  assert.equal(c.calculado, true);
  assert.match(c.paraColar, /-17\.5/);
  assert.match(c.paraColar, /-41\.5/);
});

test('blocoDeCoordenadas() não sai mais vazio quando falta só o ponto da fonte', () => {
  const html = blocoDeCoordenadas(PROPS_SEM_PONTO, false, QUADRADO);

  assert.notEqual(html, '', 'a ficha ficou sem o bloco de coordenadas inteiro — o próprio defeito');
  assert.match(html, /data-copiar="ponto"/);
  assert.match(html, /data-copiar="pedido"/);
});

test('ligarCopiar() liga os botões quando só há geometry — antes retornava cedo e não ligava nada', () => {
  const html = blocoDeCoordenadas(PROPS_SEM_PONTO, false, QUADRADO);
  const { raiz, ligados } = domFalso(html);

  ligarCopiar(raiz, PROPS_SEM_PONTO, 'Assentamentos', false, QUADRADO);

  assert.equal(ligados.length, 2, 'os dois botões deviam ter recebido o listener de clique');
});

/* ---------- 2. o ponto calculado se distingue do publicado -------------- */

test('blocoDeCoordenadas() marca o ponto calculado com selo e nota — não some no meio das outras linhas', () => {
  const html = blocoDeCoordenadas(PROPS_SEM_PONTO, false, QUADRADO);

  assert.match(html, /ficha-coord-calc/, 'sem o selo, o ponto calculado passa por dado da fonte');
  assert.match(html, /calculado agora, nesta tela/i);
});

test('blocoDeCoordenadas() nunca mostra UTM para um ponto calculado', () => {
  // Um UTM ao lado de um ponto calculado pareceria ter vindo da mesma fonte
  // que o par decimal — mas não veio: não existe UTM da fonte para esta área.
  const html = blocoDeCoordenadas(PROPS_SEM_PONTO, false, QUADRADO);

  assert.ok(!html.includes('UTM 23S'));
});

test('textoParaPedido() abre o bloco de coordenada dizendo que foi calculado', () => {
  const txt = textoParaPedido(PROPS_SEM_PONTO, 'Assentamentos', false, QUADRADO);

  assert.match(txt, /calculado NESTA TELA a partir do contorno/);
});

test('textoParaPedido() lista a ressalva do ponto calculado nas ressalvas do ofício', () => {
  const txt = textoParaPedido(PROPS_SEM_PONTO, 'Assentamentos', false, QUADRADO);

  assert.match(txt, /NÃO veio da fonte/);
  assert.match(txt, /Ressalvas, que fazem parte do dado/);
});

/* ---------- 3. com ponto da fonte, nada muda ----------------------------- */

test('com ponto_lat/lon presentes, coordenadasDaArea NÃO calcula nada — usa o da fonte', () => {
  const c = coordenadasDaArea(PROPS_COM_PONTO, QUADRADO);

  assert.equal(c.calculado, false);
  assert.match(c.paraColar, /-18\.75/);
});

test('com ponto da fonte, o selo "ponto calculado" não aparece', () => {
  const html = blocoDeCoordenadas(PROPS_COM_PONTO, false, QUADRADO);

  assert.ok(!html.includes('ficha-coord-calc'));
});

test('com ponto da fonte, textoParaPedido não menciona cálculo nenhum', () => {
  const txt = textoParaPedido(PROPS_COM_PONTO, 'Assentamentos', false, QUADRADO);

  assert.ok(!txt.includes('calculado NESTA TELA'));
  assert.ok(!/NÃO veio da fonte/.test(txt));
});

/* ---------- 4. sem ponto e sem contorno: continua devolvendo nada -------- */

test('sem ponto_lat/lon e sem geometry: coordenadasDaArea devolve null, não um palpite', () => {
  assert.equal(coordenadasDaArea(PROPS_SEM_PONTO), null);
  assert.equal(coordenadasDaArea(PROPS_SEM_PONTO, null), null);
});

test('sem ponto e sem geometry, blocoDeCoordenadas volta a ficar vazio — não inventa selo', () => {
  assert.equal(blocoDeCoordenadas(PROPS_SEM_PONTO, false, null), '');
});

test('sem ponto e sem geometry, ligarCopiar não liga nada (nada para copiar)', () => {
  const { raiz, ligados } = domFalso('<div class="ficha-coord"><button data-copiar="ponto"></button></div>');

  ligarCopiar(raiz, PROPS_SEM_PONTO, 'Assentamentos', false, null);

  assert.equal(ligados.length, 0);
});

/* ---------- 5. camada sem `listavel`: "Copiar coordenada" fica, "Copiar
   para ofício ou LAI" some (o botão de baixar segue a mesma regra em
   inspector.js — este arquivo só cobre o bloco de coordenadas) ----------- */

test('permiteOficio=false: o botão de ofício some, mas "Copiar coordenada" continua', () => {
  const html = blocoDeCoordenadas(PROPS_COM_PONTO, false, QUADRADO, false);

  assert.match(html, /data-copiar="ponto"/, '"Copiar coordenada" não devia sumir — saber onde fica continua legítimo');
  assert.ok(!html.includes('data-copiar="pedido"'), '"Copiar para ofício ou LAI" devia ter sumido');
  assert.ok(!html.includes('Copiar para ofício ou LAI'));
});

test('permiteOficio default (omitido): continua mostrando os dois botões — não muda nada para quem já chamava a função', () => {
  const html = blocoDeCoordenadas(PROPS_COM_PONTO, false, QUADRADO);

  assert.match(html, /data-copiar="ponto"/);
  assert.match(html, /data-copiar="pedido"/);
});

test('permiteOficio=false também esconde o botão quando o ponto é CALCULADO — o selo "ponto calculado" fica', () => {
  const html = blocoDeCoordenadas(PROPS_SEM_PONTO, false, QUADRADO, false);

  assert.ok(!html.includes('data-copiar="pedido"'));
  assert.match(html, /ficha-coord-calc/, 'o selo de ponto calculado não devia sumir — só o botão de ofício');
});

/* ---------- 6. textoParaPedido não derruba com props nulo --------------- */

test('textoParaPedido(null, ...) com geometry presente não lança — props nulo vira {}', () => {
  // coordenadasDaArea(null, QUADRADO) calcula um ponto a partir só do
  // contorno (não olha props quando o cálculo roda) e devolve não-nulo; o
  // resto da função lê `props.foo` várias vezes. Antes da correção, isto
  // lançava TypeError em `props.proveniencia`.
  assert.doesNotThrow(() => textoParaPedido(null, 'Assentamentos', false, QUADRADO));
  const txt = textoParaPedido(null, 'Assentamentos', false, QUADRADO);
  assert.match(txt, /calculado NESTA TELA/);
});

test('textoParaPedido(undefined, ...) com geometry presente também não lança', () => {
  assert.doesNotThrow(() => textoParaPedido(undefined, 'Assentamentos', false, QUADRADO));
});

/* ---------- DOM mínimo para ligarCopiar --------------------------------- */

/**
 * O menor DOM que `ligarCopiar` precisa: `querySelectorAll('[data-copiar]')`
 * devolvendo botões com `addEventListener` de mentira. O que se mede é só
 * SE o listener foi ligado — não o clique em si, que já é comportamento de
 * `copiar()`/`mostrarParaSelecionar()`, fora do que este arquivo testa.
 * Mesma ideia de `realce.test.mjs`: em vez de um DOM real, só o que a função
 * usa.
 */
function domFalso(html) {
  const ligados = [];
  // "Parse" ingênuo: basta achar os `data-copiar="..."` do HTML gerado, não
  // interpretar HTML de verdade — é só o que os testes acima precisam.
  const botoes = [...html.matchAll(/data-copiar="(\w+)"/g)].map(([, tipo]) => ({
    dataset: { copiar: tipo },
    addEventListener: (evento, fn) => { if (evento === 'click') ligados.push(fn); },
  }));
  return { raiz: { querySelectorAll: () => botoes }, ligados };
}
