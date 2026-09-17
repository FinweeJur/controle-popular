import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LAYER_REGISTRY, CAMADAS, ASSUNTOS } from '../config.js';
import { ROTULOS, formatarValor } from '../ui/rotulos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAMADAS_DIR = path.resolve(__dirname, '..', '..', 'dados', 'camadas');

test('Assunto ambiental está registrado em ASSUNTOS', () => {
  const ambiental = ASSUNTOS.find((a) => a.id === 'ambiental');
  assert.ok(ambiental, 'Assunto ambiental deve existir em ASSUNTOS');
  assert.equal(ambiental.titulo, 'Meio ambiente e licenciamento');
});

test('As 3 camadas ambientais estão cadastradas no LAYER_REGISTRY com cores e render corretos', () => {
  const idsEsperados = ['licencas-ambientais', 'outorgas-agua', 'infracoes-embargos'];

  for (const id of idsEsperados) {
    const reg = LAYER_REGISTRY.find((l) => l.id === id);
    assert.ok(reg, `Camada ${id} deve estar no LAYER_REGISTRY`);
    assert.equal(reg.render, 'point', `${id} deve ter render point`);
    assert.equal(reg.on, false, `${id} deve nascer desligada para performance a 60 FPS`);
    assert.ok(typeof reg.color === 'number', `${id} deve ter cor hex definida`);
  }
});

test('As 3 camadas ambientais estão no catálogo CAMADAS apontando para o assunto ambiental', () => {
  const ids = ['licencas-ambientais', 'outorgas-agua', 'infracoes-embargos'];
  for (const id of ids) {
    const c = CAMADAS.find((item) => item.id === id);
    assert.ok(c, `Camada ${id} deve existir em CAMADAS`);
    assert.equal(c.assunto, 'ambiental');
    assert.deepEqual(c.fontes, [id]);
  }
});

test('Arquivos GeoJSON das 3 camadas existem e contêm feições geográficas válidas no Brasil', () => {
  const arquivos = [
    'licencas-ambientais.geojson',
    'outorgas-agua.geojson',
    'infracoes-embargos.geojson',
  ];

  for (const fn of arquivos) {
    const p = path.join(CAMADAS_DIR, fn);
    assert.ok(existsSync(p), `Arquivo ${fn} deve existir em dados/camadas/`);

    const raw = readFileSync(p, 'utf-8');
    const fc = JSON.parse(raw);
    assert.equal(fc.type, 'FeatureCollection');
    assert.ok(Array.isArray(fc.features) && fc.features.length > 0, `${fn} deve ter feições`);

    // Valida coordenadas da primeira feição dentro do Brasil
    const f0 = fc.features[0];
    assert.equal(f0.geometry.type, 'Point');
    const [lon, lat] = f0.geometry.coordinates;
    assert.ok(lon >= -75 && lon <= -30, `Longitude ${lon} deve estar dentro do Brasil`);
    assert.ok(lat >= -35 && lat <= 6, `Latitude ${lat} deve estar dentro do Brasil`);

    // Valida propriedades essenciais para o inspetor
    assert.ok(f0.properties.id, 'Feição deve ter id');
    assert.ok(f0.properties.orgao, 'Feição deve ter orgao');
    assert.ok(f0.properties.processo, 'Feição deve ter processo');
  }
});

test('Rótulos e formatação da ficha do inspetor tratam campos ambientais', () => {
  assert.equal(ROTULOS.link_oficial, 'Consulta oficial do processo');
  assert.equal(ROTULOS.orgao, 'Órgão emissor');
  assert.equal(ROTULOS.valor, 'Valor (R$)');

  // Formatação de valor
  const valFormatado = formatarValor('valor', 150000);
  assert.ok(valFormatado.includes('150.000'), 'Valor deve ser formatado em R$');

  // Formatação de link oficial seguro
  const linkHtml = formatarValor('link_oficial', 'https://sei.ibama.gov.br/consulta?proc=123');
  assert.ok(linkHtml.includes('<a href="https://sei.ibama.gov.br/consulta?proc=123"'), 'Link oficial deve gerar <a>');
  assert.ok(linkHtml.includes('target="_blank"'), 'Link oficial deve abrir em nova aba');
});
