/**
 * Teste de `exportar.js` e da descrição de área de `rotulos.js`, fora do navegador.
 *
 *   node --test backend/static/globe/js/ui/exportar.test.mjs
 *
 * Os serializadores são funções puras de propósito — `exportar()` recebe o
 * `baixar` por parâmetro justamente para que `URL.createObjectURL`, que não
 * existe fora do navegador, não seja obstáculo. Assim o contrato do arquivo
 * gerado se verifica aqui, e sobra para o navegador só o que é de navegador
 * (clique, menu, layout).
 *
 * O que se garante, em ordem de dano:
 *   1. camada FICTÍCIA não entra em formato nenhum, e a contagem do que ficou
 *      de fora é devolvida — omitir em silêncio é metade do mesmo erro;
 *   2. nenhuma coluna carrega dado pessoal;
 *   3. a ressalva é POR CAMADA, e não uma só para tudo;
 *   4. CSV abre no Excel brasileiro (BOM + `;`);
 *   5. a régua de área muda com a escala, nas bordas exatas.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  COLUNAS,
  cabecalhoDeRessalvas,
  exportar,
  linhaDe,
  nomeDoArquivo,
  paraCsv,
  paraGeoJson,
  paraTexto,
  ressalvaDaCamada,
  separarExportaveis,
} from './exportar.js';
import { descreverArea, descreverAreaCurta } from './rotulos.js';

const QUANDO = new Date('2026-08-06T12:00:00Z');

// Geometria padrão: um triângulo simples, só para os testes que precisam de
// ALGUMA geometria presente sem se importar com a forma exata.
const GEOMETRIA_PADRAO = { type: 'Polygon', coordinates: [[[-41, -16], [-41, -17], [-42, -17], [-41, -16]]] };

function area(props = {}, cfg = {}, layerId = 'vazio-cadastral-vales', geometry = GEOMETRIA_PADRAO) {
  return {
    layerId,
    cfg: { label: 'Terra sem cadastro', ...cfg },
    idx: 0,
    feature: {
      type: 'Feature',
      geometry,
      properties: {
        municipio: 'Diamantina',
        codigo_ibge: '3121605',
        area_ha: 500,
        ponto_lat: -18.1234,
        ponto_lon: -43.5678,
        ...props,
      },
    },
  };
}

/* ---------- 1. camada fictícia ---------------------------------------- */

test('feição de camada fictícia fica fora, e é contada', () => {
  const entradas = [
    area(),
    area({ municipio: 'Curvelo' }, { label: 'Exemplo de demonstração', fixture: true }, 'candidatos-curvelo'),
  ];
  const { exportaveis, ficticias } = separarExportaveis(entradas);

  assert.equal(exportaveis.length, 1);
  assert.equal(ficticias.length, 1);
});

test('nenhum dos três formatos leva a área inventada', () => {
  const entradas = [
    area(),
    area({ municipio: 'Inventada' }, { label: 'Exemplo de demonstração', fixture: true }, 'candidatos-curvelo'),
  ];
  for (const formato of ['csv', 'geojson', 'texto']) {
    const r = exportar(formato, entradas, { baixar() {}, agora: QUANDO });
    assert.equal(r.areas, 1, `${formato}: exportou área fictícia`);
    assert.equal(r.ficticias, 1);
    assert.ok(!r.conteudo.includes('Inventada'), `${formato}: o município inventado vazou`);
  }
});

test('o arquivo DIZ que deixou área de fora, e quantas', () => {
  const entradas = [area(), area({}, { fixture: true }, 'candidatos-curvelo')];
  const { exportaveis, ficticias } = separarExportaveis(entradas);
  const texto = cabecalhoDeRessalvas(exportaveis, ficticias, QUANDO).join('\n');

  assert.match(texto, /1 área\(s\) NÃO foram exportadas/);
  assert.match(texto, /demonstração|inventado/i);
});

test('lista só com camada fictícia não gera arquivo nenhum', () => {
  const r = exportar('csv', [area({}, { fixture: true }, 'candidatos-curvelo')],
    { baixar() {}, agora: QUANDO });

  assert.equal(r.ok, false);
  assert.equal(r.ficticias, 1);
});

/* ---------- 2. dado pessoal ------------------------------------------- */

test('nenhuma coluna prevista carrega dado pessoal', () => {
  const proibido = /^(fiscalizad|doc_fiscal|cpf|cnpj|nome_|endereco|logradouro)/i;
  const vazando = COLUNAS.map(([c]) => c).filter((c) => proibido.test(c));

  assert.deepEqual(vazando, []);
});

test('campo pessoal que chegue na feição NÃO vai para o CSV', () => {
  // A camada de embargos já descarta isto no pipeline. A garantia tem de valer
  // também aqui: a lista branca é o que impede um campo novo de virar coluna.
  const csv = paraCsv([area({ fiscalizad: 'FULANO LTDA', doc_fiscal: '12345678000199' })], [], QUANDO);

  assert.ok(!csv.includes('FULANO'), 'nome do autuado vazou para o CSV');
  assert.ok(!csv.includes('12345678000199'), 'documento vazou para o CSV');
});

/* ---------- 3. ressalva por camada ------------------------------------ */

test('cada camada tem a sua ressalva, e não uma só para tudo', () => {
  const vazio = ressalvaDaCamada('vazio-cadastral-vales');
  const spu = ressalvaDaCamada('spu-imoveis-uniao');
  const embargo = ressalvaDaCamada('embargos-ambientais-vales');

  assert.notEqual(vazio, spu);
  assert.notEqual(vazio, embargo);
  // O erro concreto que isto evita: rotular imóvel da União como "sem cadastro
  // no CAR", que foi o que o botão de copiar fazia.
  assert.match(vazio, /CAR/);
  assert.ok(!spu.includes('CAR'));
  assert.match(embargo, /não é decisão final/i);
});

test('o sufixo de região não faz a camada perder a ressalva', () => {
  assert.equal(
    ressalvaDaCamada('vazio-cadastral-vales'),
    ressalvaDaCamada('vazio-cadastral-bacia'),
  );
});

test('camada desconhecida cai na ressalva geral, e não em vazio', () => {
  const r = ressalvaDaCamada('camada-que-nao-existe');

  assert.match(r, /Nada aqui afirma/);
});

test('o cabeçalho lista a ressalva de CADA camada presente', () => {
  const entradas = [
    area(),
    area({ rip: '4123000009011' }, { label: 'Imóveis do governo federal' }, 'spu-imoveis-uniao'),
  ];
  const texto = cabecalhoDeRessalvas(entradas, [], QUANDO).join('\n');

  assert.match(texto, /Terra sem cadastro:/);
  assert.match(texto, /Imóveis do governo federal:/);
});

test('toda linha do CSV carrega a própria ressalva', () => {
  // Quem filtra a planilha perde o cabeçalho — daí a coluna repetida.
  const entradas = [area(), area({}, { label: 'Imóveis do governo federal' }, 'spu-imoveis-uniao')];
  // O BOM gruda na PRIMEIRA linha, que é de comentário: sem tirá-lo, o filtro
  // de `#` deixa essa linha passar e a contagem sai por um.
  const linhas = paraCsv(entradas, [], QUANDO).replace('﻿', '')
    .split('\r\n').filter((l) => l && !l.startsWith('#'));

  assert.equal(linhas.length, 3);           // cabeçalho + 2
  for (const l of linhas.slice(1)) assert.ok(l.length > 40, 'linha sem ressalva');
  assert.ok(linhas[0].includes('Ressalvas antes de agir'));
});

/* ---------- 4. CSV que abre no Excel brasileiro ------------------------ */

test('CSV começa com BOM e usa ponto e vírgula', () => {
  const csv = paraCsv([area()], [], QUANDO);

  assert.equal(csv.charCodeAt(0), 0xfeff, 'sem BOM o Excel pt-BR quebra os acentos');
  const cabecalho = csv.split('\r\n').find((l) => !l.startsWith('#') && !l.startsWith('﻿#'));
  assert.ok(cabecalho.includes(';'), 'sem ; o Excel pt-BR joga tudo numa coluna');
});

test('as ressalvas abrem o CSV como comentário', () => {
  const csv = paraCsv([area()], [], QUANDO);
  const primeira = csv.replace('﻿', '').split('\r\n')[0];

  assert.ok(primeira.startsWith('#'));
});

test('a área vira também km² e campos de futebol', () => {
  const l = linhaDe(area({ area_ha: 500 }));

  assert.equal(l.area_ha, 500);
  assert.equal(l.area_km2, 5);
  assert.equal(l.area_campos_futebol, 700);
});

test('coordenada vai para o CSV, ao contrário da ficha', () => {
  // `ponto_lat`/`ponto_lon` estão em OCULTAS na ficha porque lá coordenada é
  // para copiar. Aqui ela É o ponto: sem coordenada a planilha não leva
  // ninguém a lugar nenhum.
  const csv = paraCsv([area()], [], QUANDO);

  assert.ok(csv.includes('-18.1234'));
  assert.ok(csv.includes('Latitude (SIRGAS 2000)'));
});

test('valor com ponto e vírgula não quebra a coluna', () => {
  const csv = paraCsv([area({ municipio: 'Um; Outro' })], [], QUANDO);

  assert.ok(csv.includes('"Um; Outro"'));
});

/* ---------- GeoJSON e texto ------------------------------------------- */

test('GeoJSON volta a fazer parse e mantém geometria e ressalvas', () => {
  const fc = JSON.parse(paraGeoJson([area()], [], QUANDO));

  assert.equal(fc.type, 'FeatureCollection');
  assert.equal(fc.features.length, 1);
  assert.equal(fc.features[0].geometry.type, 'Polygon');
  assert.ok(Array.isArray(fc.ressalvas) && fc.ressalvas.length > 0);
  assert.equal(fc.gerado_em, '2026-08-06');
  assert.equal(fc.camadas[0].id, 'vazio-cadastral-vales');
});

test('o texto para ofício repete o bloco de cada área', () => {
  const txt = paraTexto([area(), area({ municipio: 'Turmalina' })], [], QUANDO);

  assert.match(txt, /Área 1 de 2/);
  assert.match(txt, /Área 2 de 2/);
  assert.match(txt, /Diamantina/);
  assert.match(txt, /Turmalina/);
  assert.match(txt, /Ressalvas/);
});

test('área sem NENHUM ponto — nem da fonte, nem calculável — aparece dizendo isso, em vez de sumir', () => {
  // `geometry: null` simula o caso em que nem sequer há contorno para
  // calcular um ponto a partir dele — só aí a linha de desculpa é o certo.
  const txt = paraTexto([area({ ponto_lat: undefined, ponto_lon: undefined }, {}, 'vazio-cadastral-vales', null)], [], QUANDO);

  assert.match(txt, /não tem ponto de referência/);
});

test('área sem ponto DA FONTE mas com contorno: o texto traz o ponto calculado, não a desculpa', () => {
  // O defeito real: 839 áreas (assentamentos, territórios quilombolas, terra
  // pública certificada, embargos ambientais) chegam sem ponto_lat/lon, mas
  // TÊM contorno. Antes desta correção, todas saíam do ofício com
  // "esta área não tem ponto de referência calculado" — falso, porque dava
  // para calcular a partir do polígono que a própria área já carrega.
  const quadrado = { type: 'Polygon', coordinates: [[[-42, -18], [-42, -17], [-41, -17], [-41, -18], [-42, -18]]] };
  const txt = paraTexto(
    [area({ ponto_lat: undefined, ponto_lon: undefined }, { label: 'Assentamentos' }, 'assentamentos', quadrado)],
    [], QUANDO,
  );

  assert.ok(!txt.includes('não tem ponto de referência'), 'devia ter calculado um ponto, não desistido');
  assert.match(txt, /calculado NESTA TELA/);
  assert.match(txt, /-17\.5000|-41\.5000/); // o centro do quadrado, aproximado
});

test('o nome do arquivo diz quantas áreas e de quando', () => {
  assert.equal(nomeDoArquivo('csv', 522, QUANDO), 'terras-522-areas-2026-08-06.csv');
  assert.equal(nomeDoArquivo('geojson', 1, QUANDO), 'terras-1-areas-2026-08-06.geojson');
});

/* ---------- 5. a régua de área ---------------------------------------- */

test('abaixo de 1 ha, metro quadrado — campo de futebol seria pior', () => {
  // Um campo tem 7.140 m²: um terreno de 420 m² viraria "0,06 campo".
  assert.equal(descreverArea(0.042), '420 m²');
});

test('de 1 a 100 ha, hectare e campo — km² daria menos que 1', () => {
  const r = descreverArea(42);

  assert.match(r, /42,0 hectares/);
  assert.match(r, /campos de futebol/);
  assert.ok(!r.includes('km²'), 'km² abaixo de 1 informa menos que o hectare ao lado');
});

test('de 100 a 1.000 ha, as duas réguas', () => {
  const r = descreverArea(500);

  assert.match(r, /500,0 hectares/);
  assert.match(r, /5,0 km²/);
  assert.match(r, /campos de futebol/);
});

test('acima de 1.000 ha o campo de futebol some — 21 mil campos não é imagem', () => {
  const r = descreverArea(15409);

  assert.match(r, /15\.409,0 hectares/);
  assert.match(r, /154,1 km²/);
  assert.ok(!r.includes('campos de futebol'));
});

test('as bordas exatas caem do lado certo', () => {
  assert.ok(!descreverArea(99.9).includes('km²'));
  assert.ok(descreverArea(100).includes('km²'));
  assert.ok(descreverArea(999).includes('campos de futebol'));
  assert.ok(!descreverArea(1000).includes('campos de futebol'));
  assert.equal(descreverArea(0.999), '9.990 m²');
  assert.match(descreverArea(1), /1,0 hectares/);
});

test('hectare aparece SEMPRE acima de 1 ha — é a unidade do documento', () => {
  for (const ha of [1, 42, 500, 15409, 1_351_806]) {
    assert.match(descreverArea(ha), /hectares/, `${ha} ha saiu sem hectare`);
  }
});

test('a forma curta da lista cabe numa linha', () => {
  assert.equal(descreverAreaCurta(500), '500 ha · 5 km²');
  assert.match(descreverAreaCurta(42), /^42 ha · uns \d+ campos$/);
  assert.equal(descreverAreaCurta(0.042), '420 m²');
});

test('valor ausente não vira "NaN hectares"', () => {
  assert.equal(descreverArea(undefined), '');
  assert.equal(descreverArea(null), '');
  assert.equal(descreverAreaCurta('abc'), '');
});
