/**
 * Teste de `agruparPorRegiao()`, fora do navegador.
 *
 *   node --test backend/static/globe/js/ui/layerspanel.test.mjs
 *
 * `agruparPorRegiao` é a função que decide em qual seção do painel de
 * camadas cada linha do LAYER_REGISTRY cai — e não tinha teste nenhum até
 * agora, apesar de ser o item central da reorganização por região de estudo
 * (ver o comentário grande no topo de layerspanel.js). Pura — sem tocar em
 * `document` — então testa sem montar painel nenhum.
 *
 * O que se garante:
 *   1. contra o LAYER_REGISTRY/REGIOES_CAMADAS REAIS de config.js: as 19
 *      camadas de hoje caem nos grupos certos, NENHUMA se perde, e a ordem
 *      dos grupos devolvidos é a ordem de REGIOES_CAMADAS (bacia, vales,
 *      geral — ver o comentário de reordenação em config.js);
 *   2. camada sem `regiao` cai em 'geral';
 *   3. camada com `regiao` que não existe em `regioes` cai em 'geral' e avisa
 *      no console — sem perder a camada;
 *   4. se nem 'geral' existir em `regioes` (alguém removeu a entrada), a
 *      camada ainda assim não se perde — cai num grupo 'geral' criado na
 *      hora, com aviso. Antes do conserto de 12/08 isto era um
 *      `geral?.camadas.push(layer)` que virava no-op silencioso enquanto o
 *      aviso da linha de cima afirmava "caiu em geral" — mentira. Ver o
 *      comentário de `agruparPorRegiao` em layerspanel.js;
 *   5. grupo sem nenhuma camada não aparece no resultado (REGIOES_CAMADAS
 *      pode declarar uma região que, num registry reduzido de teste, não tem
 *      camada nenhuma — o painel não deve mostrar uma seção vazia).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { agruparPorRegiao } from './layerspanel.js';
import { LAYER_REGISTRY, REGIOES_CAMADAS } from '../config.js';

test('LAYER_REGISTRY real: 19 camadas, nenhuma perdida, grupos na ordem de REGIOES_CAMADAS', () => {
  const grupos = agruparPorRegiao(LAYER_REGISTRY, REGIOES_CAMADAS);

  const totalAgrupado = grupos.reduce((n, g) => n + g.camadas.length, 0);
  assert.equal(LAYER_REGISTRY.length, 19, 'sentinela: se este número mudou, LAYER_REGISTRY cresceu/encolheu e as contagens abaixo precisam ser revistas junto');
  assert.equal(totalAgrupado, LAYER_REGISTRY.length, 'nenhuma camada pode desaparecer no agrupamento');

  // Ordem dos grupos = ordem de REGIOES_CAMADAS (bacia, vales, geral),
  // filtrando só quem tem camada — hoje os três têm.
  assert.deepEqual(grupos.map((g) => g.id), ['bacia', 'vales', 'geral']);

  // Cada camada cai no grupo que o próprio campo `regiao` pede (ou 'geral'
  // se omitido) — checagem cruzada 1:1 contra o registry, não só a contagem.
  const grupoPorCamada = new Map();
  for (const g of grupos) for (const l of g.camadas) grupoPorCamada.set(l.id, g.id);
  for (const layer of LAYER_REGISTRY) {
    assert.equal(
      grupoPorCamada.get(layer.id),
      layer.regiao ?? 'geral',
      `camada "${layer.id}" devia cair em "${layer.regiao ?? 'geral'}"`,
    );
  }
});

test('camada sem `regiao` cai em "geral"', () => {
  const registry = [{ id: 'a', regiao: undefined }];
  const regioes = [{ id: 'geral', titulo: 'Geral' }];
  const [grupo] = agruparPorRegiao(registry, regioes);
  assert.equal(grupo.id, 'geral');
  assert.deepEqual(grupo.camadas.map((l) => l.id), ['a']);
});

test('camada com `regiao` que não existe em `regioes` cai em "geral", sem se perder', () => {
  const avisos = [];
  const originalWarn = console.warn;
  console.warn = (msg) => avisos.push(msg);
  try {
    const registry = [{ id: 'orfa', regiao: 'regiao-que-nao-existe' }];
    const regioes = [{ id: 'geral', titulo: 'Geral' }, { id: 'bacia', titulo: 'Bacia' }];
    const grupos = agruparPorRegiao(registry, regioes);
    const total = grupos.reduce((n, g) => n + g.camadas.length, 0);
    assert.equal(total, 1, 'a camada órfã não pode desaparecer');
    assert.equal(grupos.find((g) => g.camadas.some((l) => l.id === 'orfa'))?.id, 'geral');
    assert.equal(avisos.length, 1, 'tem que avisar — id de regiao que não bate é o tipo de bug que só aparece quando alguém procura e não acha');
    assert.match(avisos[0], /orfa/);
  } finally {
    console.warn = originalWarn;
  }
});

test('mesmo sem grupo "geral" em `regioes`, a camada não é descartada em silêncio', () => {
  // Reproduz o bug relatado: alguém tira 'geral' de REGIOES_CAMADAS.
  // `geral?.camadas.push(layer)` virava no-op — nenhuma exceção, nenhuma
  // pista, só uma camada a menos no painel.
  const avisos = [];
  const originalWarn = console.warn;
  console.warn = (msg) => avisos.push(msg);
  try {
    const registry = [{ id: 'sem-regiao-nenhuma' }]; // regiao undefined -> pediria 'geral'
    const regioes = [{ id: 'bacia', titulo: 'Bacia' }]; // 'geral' não existe aqui
    const grupos = agruparPorRegiao(registry, regioes);
    const total = grupos.reduce((n, g) => n + g.camadas.length, 0);
    assert.equal(total, 1, 'a camada não pode ser descartada só porque "geral" não está em REGIOES_CAMADAS');
    const grupoAchado = grupos.find((g) => g.camadas.some((l) => l.id === 'sem-regiao-nenhuma'));
    assert.ok(grupoAchado, 'a camada tem de aparecer em ALGUM grupo do resultado');
    assert.equal(grupoAchado.id, 'geral', 'o grupo de emergência criado tem de se chamar "geral", coerente com o resto do painel');
  } finally {
    console.warn = originalWarn;
  }
});

test('grupo declarado em `regioes` sem nenhuma camada não aparece no resultado', () => {
  const registry = [{ id: 'a', regiao: 'bacia' }];
  const regioes = [
    { id: 'bacia', titulo: 'Bacia' },
    { id: 'vales', titulo: 'Vales' }, // ninguém cai aqui neste teste
    { id: 'geral', titulo: 'Geral' }, // nem aqui
  ];
  const grupos = agruparPorRegiao(registry, regioes);
  assert.deepEqual(grupos.map((g) => g.id), ['bacia']);
});
