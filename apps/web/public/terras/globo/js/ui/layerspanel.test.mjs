/**
 * Teste do agrupamento do painel de camadas, fora do navegador.
 *
 *   node --test apps/web/public/terras/globo/js/ui/layerspanel.test.mjs
 *
 * ⟲ 13/08/2026 — este arquivo testava `agruparPorRegiao`, a função que agrupava
 * o painel por REGIÃO DE ESTUDO. O painel passou a agrupar por ASSUNTO e a
 * tratar região como filtro à parte (ver o cabeçalho de layerspanel.js), então
 * os testes foram REESCRITOS para o comportamento novo — não apagados. Tudo o
 * que `agruparPorRegiao` garantia continua garantido aqui sobre
 * `agruparPorAssunto`, porque as armadilhas são as mesmas: o jeito de uma
 * camada sumir do painel é um agrupamento engolir a camada em silêncio, e
 * ninguém percebe até procurá-la.
 *
 * O que se garante:
 *   1. contra as CAMADAS/ASSUNTOS REAIS de config.js: as 20 linhas de hoje caem
 *      nos grupos certos, NENHUMA se perde, e a ordem dos grupos é a de
 *      ASSUNTOS;
 *   2. camada com `assunto` que não existe cai em "outras" e AVISA — sem se
 *      perder (era o bug do `push` num grupo `undefined`, consertado em 12/08 e
 *      que não pode voltar por uma reescrita);
 *   3. grupo declarado em ASSUNTOS sem nenhuma camada não aparece;
 *   4. ⚠️ O CONTRATO PÚBLICO: todo id de FONTE continua existindo, e toda fonte
 *      pertence a exatamente uma camada. É o que mantém vivos os deep-links
 *      `#area=<fonte>:<índice>` já compartilhados e os links de
 *      `detalhe.html?camada=<fonte>`;
 *   5. `notaDeRegiao` diz a verdade sobre o que o filtro faz — inclusive quando
 *      a verdade é "esta fonte não sabe separar Jequitinhonha de Mucuri".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { agruparPorAssunto, notaDeRegiao } from './layerspanel.js';
import {
  ASSUNTOS, CAMADAS, CAMADAS_RESOLVIDAS, CAMADA_POR_FONTE, LAYER_REGISTRY,
} from '../config.js';

test('CAMADAS reais: 20 linhas, nenhuma perdida, grupos na ordem de ASSUNTOS', () => {
  const grupos = agruparPorAssunto(CAMADAS_RESOLVIDAS, ASSUNTOS);

  assert.equal(
    CAMADAS.length, 20,
    'sentinela: se este número mudou, CAMADAS cresceu/encolheu e as contagens abaixo precisam ser revistas junto',
  );
  const totalAgrupado = grupos.reduce((n, g) => n + g.camadas.length, 0);
  assert.equal(totalAgrupado, CAMADAS.length, 'nenhuma camada pode desaparecer no agrupamento');

  assert.deepEqual(
    grupos.map((g) => g.id),
    ['sem-cadastro', 'terra-publica', 'territorio-mineracao', 'cidade', 'pistas', 'referencia'],
  );

  // Checagem cruzada 1:1 contra o registro, não só a contagem.
  const grupoPorCamada = new Map();
  for (const g of grupos) for (const c of g.camadas) grupoPorCamada.set(c.id, g.id);
  for (const camada of CAMADAS) {
    assert.equal(
      grupoPorCamada.get(camada.id), camada.assunto,
      `camada "${camada.id}" devia cair em "${camada.assunto}"`,
    );
  }
});

test('a reorganização de fato UNIFICOU: 25 fontes em 20 linhas, e as 5 que somem são as irmãs', () => {
  assert.equal(LAYER_REGISTRY.length, 25, 'sentinela: o número de FONTES mudou');
  assert.equal(CAMADAS.length, 20, 'sentinela: o número de LINHAS mudou');

  // As cinco camadas com mais de uma fonte continuam sendo exatamente os
  // conceitos que apareciam repetidos, um por região — as seis camadas de
  // território/mineração de 13/08 são cada uma fonte única (nenhuma tem
  // irmã regional: ver a nota em config.js sobre `regioes` ausente nelas).
  const comVariasFontes = CAMADAS.filter((c) => c.fontes.length > 1).map((c) => c.id).sort();
  assert.deepEqual(comVariasFontes, [
    'assentamentos',
    'spu-imoveis-uniao',
    'terra-publica-certificada',
    'territorios-quilombolas',
    'vazio-cadastral',
  ]);

  // E o total fecha: 25 fontes distribuídas em 20 linhas.
  const somaDasFontes = CAMADAS.reduce((n, c) => n + c.fontes.length, 0);
  assert.equal(somaDasFontes, LAYER_REGISTRY.length);
});

test('CONTRATO PÚBLICO: todo id de fonte sobreviveu, e cada um pertence a uma só camada', () => {
  // Esta lista É o contrato. Cada id já apareceu num endereço compartilhável
  // (`#area=<fonte>:<índice>`), num link de vista 2D
  // (`detalhe.html?camada=<fonte>`) e no nome de um arquivo publicado
  // (`dados/camadas/<fonte>.geojson`). Tirar ou renomear qualquer um mata links
  // que já estão em circulação — por isso a reorganização de 13/08 mexeu na
  // APRESENTAÇÃO e não nos ids.
  const IDS_PUBLICADOS = [
    'assentamentos', 'assentamentos-vales',
    'checagem-g0', 'devolutas-arrecadadas',
    'embargos-ambientais-vales', 'lotes-vagos-bh', 'municipios-mg',
    'normas-geolocalizadas', 'pesquisa-noticias', 'satelites-orbita',
    'spu-imoveis-uniao', 'spu-imoveis-uniao-vales',
    'terra-publica-certificada', 'terra-publica-certificada-vales',
    'territorios-quilombolas', 'territorios-quilombolas-vales',
    'vazio-cadastral', 'vazio-cadastral-bacia', 'vazio-cadastral-vales',
    // Território indígena, mineração e barragens (13/08/2026) — ver
    // docs/FONTES-TERRITORIO-E-MINERACAO.md.
    'zas-barragens', 'mancha-inundacao-barragens', 'terras-indigenas',
    'alerta-ti-mancha', 'sigmine-operacao', 'sigmine-interesse',
  ];

  const existentes = LAYER_REGISTRY.map((f) => f.id).sort();
  assert.deepEqual(existentes, [...IDS_PUBLICADOS].sort(),
    'um id de fonte foi criado, removido ou renomeado — deep-links publicados quebram');

  for (const id of IDS_PUBLICADOS) {
    assert.ok(CAMADA_POR_FONTE.has(id), `a fonte "${id}" não pertence a nenhuma camada: some do painel`);
  }

  // Nenhuma fonte em duas camadas: ligaria e desligaria em dois lugares, e o
  // contador de cada um mentiria sobre o outro.
  const vezes = new Map();
  for (const c of CAMADAS) for (const f of c.fontes) vezes.set(f, (vezes.get(f) ?? 0) + 1);
  const repetidas = [...vezes].filter(([, n]) => n > 1);
  assert.deepEqual(repetidas, [], 'fonte citada por mais de uma camada');
});

test('camada com `assunto` inexistente cai em "outras", avisa, e não se perde', () => {
  const avisos = [];
  const originalWarn = console.warn;
  console.warn = (msg) => avisos.push(msg);
  try {
    const camadas = [{ id: 'orfa', assunto: 'assunto-que-nao-existe', fontes: [] }];
    const assuntos = [{ id: 'sem-cadastro', titulo: 'Terra sem cadastro' }];
    const grupos = agruparPorAssunto(camadas, assuntos);
    const total = grupos.reduce((n, g) => n + g.camadas.length, 0);
    assert.equal(total, 1, 'a camada órfã não pode desaparecer');
    assert.equal(grupos.find((g) => g.camadas.some((c) => c.id === 'orfa'))?.id, 'outras');
    assert.equal(avisos.length, 1, 'tem que avisar — assunto que não bate é o tipo de bug que só aparece quando alguém procura e não acha');
    assert.match(avisos[0], /orfa/);
  } finally {
    console.warn = originalWarn;
  }
});

test('camada SEM `assunto` também não se perde', () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const grupos = agruparPorAssunto([{ id: 'a', fontes: [] }], [{ id: 'cidade', titulo: 'Cidade' }]);
    const total = grupos.reduce((n, g) => n + g.camadas.length, 0);
    assert.equal(total, 1);
    assert.equal(grupos[0].id, 'outras');
  } finally {
    console.warn = originalWarn;
  }
});

test('grupo declarado em ASSUNTOS sem nenhuma camada não aparece no resultado', () => {
  const camadas = [{ id: 'a', assunto: 'cidade', fontes: [] }];
  const assuntos = [
    { id: 'sem-cadastro', titulo: 'Terra sem cadastro' }, // ninguém cai aqui
    { id: 'cidade', titulo: 'Cidade' },
    { id: 'referencia', titulo: 'Referência' },           // nem aqui
  ];
  assert.deepEqual(agruparPorAssunto(camadas, assuntos).map((g) => g.id), ['cidade']);
});

// ---------------------------------------------------------------------------
// notaDeRegiao — o texto em que o painel confessa o que o dado não sustenta
// ---------------------------------------------------------------------------

const fonteBacia = { id: 'f-bacia', regioes: ['bacia'] };
const fonteVales = { id: 'f-vales', regioes: ['jequitinhonha', 'mucuri'] };
const fonteValesIndistinta = { id: 'f-vales-i', regioes: ['jequitinhonha', 'mucuri'], mesoIndistinta: true };
const fonteSemRegiao = { id: 'f-livre' };

test('sem região escolhida, só a ressalva de mesorregião indistinta aparece', () => {
  assert.equal(notaDeRegiao({ fontesResolvidas: [fonteBacia, fonteVales] }, null), null);
  assert.match(
    notaDeRegiao({ fontesResolvidas: [fonteBacia, fonteValesIndistinta] }, null),
    /não diz de qual/,
  );
});

test('camada sem região declarada diz que o filtro não a toca', () => {
  const nota = notaDeRegiao({ semRegiao: true, fontesResolvidas: [fonteSemRegiao] }, 'bacia');
  assert.match(nota, /não é de uma região/);
});

test('camada sem fonte na região escolhida diz isso, em vez de sumir', () => {
  assert.match(notaDeRegiao({ fontesResolvidas: [fonteVales] }, 'bacia'), /não tem área na região/);
});

test('num vale, fonte indistinta avisa que traz o OUTRO vale — e nomeia qual', () => {
  assert.match(
    notaDeRegiao({ fontesResolvidas: [fonteValesIndistinta] }, 'mucuri'),
    /Vale do Jequitinhonha/,
  );
  assert.match(
    notaDeRegiao({ fontesResolvidas: [fonteValesIndistinta] }, 'jequitinhonha'),
    /Vale do Mucuri/,
  );
});

test('na bacia, a fonte indistinta nem entra — nada a avisar sobre vales', () => {
  // A ressalva é sobre não separar um vale do outro; com o filtro na bacia, a
  // fonte dos vales está fora, e repetir a ressalva ali seria ruído.
  const nota = notaDeRegiao({ fontesResolvidas: [fonteBacia, fonteValesIndistinta] }, 'bacia');
  assert.equal(nota, null);
});

test('fonte separável NÃO ganha a ressalva de indistinta', () => {
  assert.equal(notaDeRegiao({ fontesResolvidas: [fonteVales] }, 'mucuri'), null);
});

test('as camadas REAIS marcadas como indistintas são exatamente as três do INCRA nos Vales', () => {
  // Se alguém marcar/desmarcar `mesoIndistinta` sem medir o dado, este teste
  // reprova. As três não trazem `codigo_ibge` nem `municipio` — só `area_ha` —
  // e por isso não há como dizer de qual vale é cada área.
  const indistintas = LAYER_REGISTRY.filter((f) => f.mesoIndistinta).map((f) => f.id).sort();
  assert.deepEqual(indistintas, [
    'assentamentos-vales',
    'terra-publica-certificada-vales',
    'territorios-quilombolas-vales',
  ]);
});
