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

test('CAMADAS reais: 38 linhas, nenhuma perdida, grupos na ordem de ASSUNTOS', () => {
  const grupos = agruparPorAssunto(CAMADAS_RESOLVIDAS, ASSUNTOS);

  assert.equal(
    CAMADAS.length, 38,
    // ⟲ 13/08/2026, mais tarde: subiu de 22 para 30 — as 8 camadas do
    // rompimento real da B1/Brumadinho (docs/PLANO-INTEGRACAO-BRUMADINHO.md,
    // seção 1.2), cada uma numa linha própria, sem irmã regional.
    // ⟲ 15/08/2026: 30 → 38 ao mesclar o trabalho do PC externo. As 8 são
    // as 5 de alerta território × mineração (sobreposição e faixa de 8 km da
    // Portaria 60/2015, mais quilombola × mancha de barragem), as normas que
    // criam área protegida, os documentos do processo por município, e a
    // imagem de satélite. Medido no merge: NENHUM id saiu ou foi renomeado —
    // só entrou. Foi este sentinela que pegou a mudança, que é o trabalho dele.
    'sentinela: se este número mudou, CAMADAS cresceu/encolheu e as contagens abaixo precisam ser revistas junto',
  );
  const totalAgrupado = grupos.reduce((n, g) => n + g.camadas.length, 0);
  assert.equal(totalAgrupado, CAMADAS.length, 'nenhuma camada pode desaparecer no agrupamento');

  // ⟲ 15/08/2026: entrou 'brumadinho' entre 'territorio-mineracao' e
  // 'dinheiro'. A posição é a afirmação: o rompimento é o caso particular do
  // assunto acima, então quem procura barragem encontra primeiro a régua geral
  // (ZAS, mancha, minas) e só então o episódio. Ver o comentário em config.js.
  assert.deepEqual(
    grupos.map((g) => g.id),
    ['sem-cadastro', 'terra-publica', 'territorio-mineracao', 'brumadinho', 'dinheiro', 'cidade', 'pistas', 'referencia'],
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

test('a reorganização de fato UNIFICOU: 42 fontes em 38 linhas, e as 4 que somem são as irmãs', () => {
  // ⟲ 13/08/2026, fim do dia: 36→34 fontes, LINHAS continuam 30. O dono
  // perguntou "qual o sentido de dividir?" sobre as TRÊS fontes de
  // território quilombola (bacia, Vales, demais regiões) e tinha razão: a
  // separação era por REGIÃO, que é justamente o critério que este painel
  // abandonou de manhã ao passar a agrupar por ASSUNTO. As três viraram uma
  // (27 polígonos, 23 territórios, Minas inteira), então somem 2 fontes e
  // a diferença fonte-linha volta de 6 para 4.
  //
  // A unificação não foi cosmética: ao cruzar a fonte única com o SIGMINE,
  // apareceram 9 sobreposições que nenhuma das três camadas antigas pegava
  // — incluindo lavra de OURO autorizada sobre São Domingos e Machadinho.
  // Conceito partido em três arquivos estava escondendo alerta.
  // ⟲ 15/08/2026: 34 → 42 fontes e 30 → 38 linhas, +8 de cada no merge do PC
  // externo. As 8 chegaram com fonte única, então a diferença fonte-linha
  // continua 4 — são as mesmas quatro irmãs regionais de sempre, listadas
  // abaixo. Se um dia a diferença mudar sem esta lista mudar junto, é porque
  // alguém partiu ou unificou conceito sem dizer.
  assert.equal(LAYER_REGISTRY.length, 42, 'sentinela: o número de FONTES mudou');
  assert.equal(CAMADAS.length, 38, 'sentinela: o número de LINHAS mudou');

  // ⟲ Fim do dia: `territorios-quilombolas` SAIU desta lista. Ela tinha 2
  // fontes, chegou a ter 3, e agora tem UMA só — as três foram unificadas.
  // É o caminho inverso do que esta lista costuma registrar: em vez de um
  // conceito repetido por região virar uma linha com várias fontes, aqui a
  // própria multiplicidade acabou. Sobram quatro conceitos com irmãs
  // regionais; as camadas de território/mineração, dinheiro e Brumadinho
  // sempre foram fonte única.
  const comVariasFontes = CAMADAS.filter((c) => c.fontes.length > 1).map((c) => c.id).sort();
  assert.deepEqual(comVariasFontes, [
    'assentamentos',
    'spu-imoveis-uniao',
    'terra-publica-certificada',
    'vazio-cadastral',
  ]);

  // E o total fecha: 34 fontes distribuídas em 30 linhas.
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
    'territorios-quilombolas',
    'vazio-cadastral', 'vazio-cadastral-bacia', 'vazio-cadastral-vales',
    // Território indígena, mineração e barragens (13/08/2026) — ver
    // docs/FONTES-TERRITORIO-E-MINERACAO.md.
    'zas-barragens', 'mancha-inundacao-barragens', 'terras-indigenas',
    'alerta-ti-mancha', 'sigmine-operacao', 'sigmine-interesse',
    // Dinheiro público e mineração (13/08/2026) — ver
    // docs/HANDOFF-CAMADA-DINHEIRO.md.
    'cfem-municipios', 'cruzamento-dinheiro-ambiental-4cidades',
    // O rompimento real da B1, Brumadinho (13/08/2026, mais tarde) — ver
    // docs/PLANO-INTEGRACAO-BRUMADINHO.md.
    'brumadinho-area-atingida', 'brumadinho-monitoramento',
    'brumadinho-remanejamento', 'brumadinho-estruturas-contencao',
    'brumadinho-obras-poligonais', 'brumadinho-obras-pontuais',
    'brumadinho-obras-lineares', 'brumadinho-restauracao',
    // ⟲ 15/08/2026 — as 8 que entraram no merge do PC externo. Elas nascem
    // JÁ dentro do contrato: no instante em que um id é publicado num
    // `#area=`, acrescentá-lo aqui deixa de ser opcional. Conferido no merge
    // que nenhum dos 34 acima saiu ou mudou de nome.
    // Território × mineração — sobreposição e a faixa de 8 km da Portaria
    // 60/2015 (ver docs/HANDOFF-ALERTAS-TERRITORIO.md).
    'alerta-territorio-sigmine-operacao', 'alerta-territorio-sigmine-interesse',
    'alerta-raio-territorio-sigmine-operacao', 'alerta-raio-territorio-sigmine-interesse',
    'alerta-quilombola-mancha',
    // Normas municipais que criam ou alteram área protegida.
    'atos-area-protegida-municipios',
    // Documentos do processo de Brumadinho, por município citado.
    'documentos-processo-municipios',
    // Fundo de imagem de satélite do globo (Esri World Imagery).
    'imagens-satelite',
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
    // `territorios-quilombolas-vales` saiu: a fonte foi absorvida pela
    // unificada, que é estadual e por isso não declara mesorregião.
  ]);
});
