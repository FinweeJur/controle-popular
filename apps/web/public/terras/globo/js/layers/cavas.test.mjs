import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LAYER_REGISTRY, CAMADAS, resolverCamada } from '../config.js';
import { ROTULOS, formatarValor } from '../ui/rotulos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAMADAS_DIR = path.resolve(__dirname, '..', '..', 'dados', 'camadas');
const PROVENIENCIA = path.resolve(__dirname, '..', '..', 'dados', 'proveniencia.json');
// apps/web/data — a MESMA série que alimenta /mineraicao/cavas. Cruzar as duas
// pontas aqui é o que impede globo e página de publicarem números diferentes.
const SERIE = path.resolve(__dirname, '..', '..', '..', '..', '..', 'data',
  'cavas-serie-mineracao-mg.json');

const IDS = ['mineracao-sem-cadastro', 'cavas-monitoradas'];

function lerGeoJSON(id) {
  const p = path.join(CAMADAS_DIR, `${id}.geojson`);
  assert.ok(existsSync(p), `${id}.geojson deve existir em dados/camadas/`);
  return JSON.parse(readFileSync(p, 'utf8'));
}

test('As 2 camadas da Fase 5 estão no LAYER_REGISTRY, desligadas e marcadas pesadas', () => {
  for (const id of IDS) {
    const reg = LAYER_REGISTRY.find((l) => l.id === id);
    assert.ok(reg, `${id} deve estar no LAYER_REGISTRY`);
    assert.equal(reg.render, 'fill', `${id} é área, não ponto`);
    assert.equal(reg.on, false, `${id} deve nascer desligada: 7.668 polígonos somados não podem abrir sozinhos`);
    assert.equal(reg.pesada, true, `${id} deve ser pesada — "ligar tudo" não pode puxar estas 7.668 formas`);
    assert.ok(typeof reg.color === 'number', `${id} deve ter cor hex`);
    assert.ok(reg.hint && reg.aviso, `${id} deve declarar hint e aviso`);
    // O inspetor só vira isto num link clicável se o campo existir — sem ele,
    // quem olhou o polígono não tem para onde ir (deep-link Fase 5).
    assert.equal(reg.portal, '/mineraicao/cavas', `${id} deve apontar para a página da série`);
  }
});

// apps/web/app/mineraicao/cavas/page.tsx — o outro lado do deep-link.
const PAGINA = path.resolve(__dirname, '..', '..', '..', '..', '..', 'app',
  'mineraicao', 'cavas', 'page.tsx');

test('Os links da página /mineraicao/cavas apontam para camadas que existem e não vazias', () => {
  const fonte = readFileSync(PAGINA, 'utf8');
  const ids = [...fonte.matchAll(/terras\/globo\/\?camada=([a-z0-9-]+)/g)].map((m) => m[1]);
  // Extrair do .tsx em vez de repetir a lista aqui: id renomeado de um lado só
  // quebra o teste antes de virar link morto no navegador.
  assert.ok(ids.length >= 2, `a página deve ter ao menos 2 links de camada; achei ${ids.length}`);

  for (const id of ids) {
    assert.ok(LAYER_REGISTRY.some((l) => l.id === id), `${id} deve estar no LAYER_REGISTRY`);
    // O `portal` vive na FONTE (é o inspetor que o lê) e é conferido no teste
    // acima; aqui o que importa é a camada do PAINEL existir e desenhar.
    const camada = CAMADAS.find((item) => item.id === id);
    assert.ok(camada, `${id} deve estar em CAMADAS`);
    assert.equal(resolverCamada(camada).vazia, false,
      `${id} não pode estar vazia: o painel acenderia uma linha que não desenha nada`);
  }
});

test('As 2 camadas estão em CAMADAS, no assunto territorio-mineracao, fonte única', () => {
  for (const id of IDS) {
    const c = CAMADAS.find((item) => item.id === id);
    assert.ok(c, `${id} deve existir em CAMADAS`);
    assert.equal(c.assunto, 'territorio-mineracao');
    assert.deepEqual(c.fontes, [id]);
  }
});

test('Os 2 GeoJSON existem, têm feição e coordenada dentro de Minas Gerais', () => {
  for (const id of IDS) {
    const fc = lerGeoJSON(id);
    assert.equal(fc.type, 'FeatureCollection');
    assert.ok(fc.features.length > 0, `${id} deve ter feições`);
    for (const f of fc.features) {
      // A fonte traz as duas formas: polígono único e multipolígono. Aceitar
      // só uma delas derrubaria a camada inteira por um detalhe de formato.
      assert.ok(
        f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon',
        `${id}: geometria deve ser polígono, veio ${f.geometry.type}`,
      );
      const anel = f.geometry.type === 'Polygon'
        ? f.geometry.coordinates[0]
        : f.geometry.coordinates[0][0];
      for (const [lon, lat] of anel) {
        assert.ok(lon >= -51.1 && lon <= -39.8, `${id}: longitude ${lon} fora de MG`);
        assert.ok(lat >= -23.0 && lat <= -14.0, `${id}: latitude ${lat} fora de MG`);
      }
    }
  }
});

test('Toda feição traz ano, área, estado e RESOLUÇÃO escrita (AGENTS § 8)', () => {
  for (const id of IDS) {
    for (const f of lerGeoJSON(id).features) {
      const p = f.properties;
      assert.ok(Number.isFinite(p.ano), `${id}: ano deve ser número`);
      assert.ok(p.area_ha > 0, `${id}: area_ha deve ser maior que zero`);
      assert.ok(p.estado, `${id}: estado deve vir preenchido`);
      assert.equal(p.resolucao_m, 30, `${id}: a resolução vem escrita em toda ficha`);
      assert.equal(typeof p.dentro_sigmine, 'boolean', `${id}: dentro_sigmine deve ser booleano`);
    }
  }
});

test('Contagem e área batem com a série publicada — globo e página se cobrem', () => {
  const serie = JSON.parse(readFileSync(SERIE, 'utf8'));
  const totalAnos = serie.serie.reduce((n, l) => n + l.qtd, 0);
  const fora = serie.serie.reduce((n, l) => n + l.area_fora_sigmine, 0);

  const semCadastro = lerGeoJSON('mineracao-sem-cadastro').features;
  const ativas = lerGeoJSON('cavas-monitoradas').features;

  // As duas pontas arredondam de um jeito diferente: a série soma o valor cru
  // e arredonda o TOTAL, o GeoJSON arredonda CADA feição em 3 casas. A folga
  // é 0,0005 ha por feição — o resto seria diferença de verdade.
  const soma = (fs) => fs.reduce((n, f) => n + f.properties.area_ha, 0);
  const fecha = (fs, esperado) => Math.abs(soma(fs) - esperado) <= 0.0005 * fs.length + 1e-9;

  // 3.869 / 2.589,5 ha: já medido na Fase 1 e de novo aqui — segunda verificação.
  assert.equal(semCadastro.length, 3869);
  assert.ok(fecha(semCadastro, fora), 'área fora do SIGMINE do globo deve fechar com a série');

  // Janela ativa = ano >= 2024, que é o último ano da série (publicação 2026).
  const ultimo = serie.serie[serie.serie.length - 1];
  assert.equal(ativas.length, ultimo.qtd, 'camada ativa deve ter os polígonos do último ano');
  assert.ok(fecha(ativas, ultimo.area), 'área da camada ativa deve fechar com o Δ daquele ano');

  // Nenhuma das duas pode inventar feição fora da série.
  assert.ok(semCadastro.length + ativas.length <= totalAnos);
});

test('Proveniência declara as duas origens — nenhuma sai como não declarada', () => {
  const prov = JSON.parse(readFileSync(PROVENIENCIA, 'utf8'));
  assert.ok(!prov.camadas_sem_origem_declarada.includes('mineracao-sem-cadastro'));
  assert.ok(!prov.camadas_sem_origem_declarada.includes('cavas-monitoradas'));
  const todas = [...prov.fontes_automaticas, ...prov.fontes_manuais];
  for (const id of IDS) {
    const f = todas.find((x) => x.camada === id);
    assert.ok(f, `${id} deve constar no proveniencia.json`);
    assert.equal(f.feicoes > 0, true, `${id} deve ter feição contada no manifesto`);
    assert.ok(f.sha256 && f.sha256.length === 64, `${id} deve ter impressão digital`);
    assert.equal(f.obtencao, 'automatica');
  }
});

test('A ficha traduz estado, resolução e dentro_sigmine — nunca chave crua', () => {
  assert.equal(ROTULOS.estado, 'Estado desta cava');
  assert.equal(ROTULOS.resolucao_m, 'Resolução da imagem');
  assert.equal(ROTULOS.dentro_sigmine, 'Dentro de processo da ANM');

  const estado = formatarValor('estado', 'sem_cadastro_anm');
  assert.ok(!estado.includes('_'), 'estado não pode sair em snake_case');
  assert.ok(estado.includes('ANM'));

  assert.ok(formatarValor('resolucao_m', 30).includes('metros por pixel'));
  assert.equal(formatarValor('dentro_sigmine', false), 'não — fora de todo polígono da ANM');
  assert.equal(formatarValor('dentro_sigmine', true), 'sim');
});
