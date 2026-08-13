/**
 * Teste da tabela de mesorregiões, fora do navegador.
 *
 *   node --test apps/web/public/terras/globo/js/data/mesorregioes.test.mjs
 *
 * A tabela existe para que o filtro de região possa separar **Vale do
 * Jequitinhonha** de **Vale do Mucuri** — a correção de nomenclatura pedida
 * pelo dono ("é preciso sempre especificar, pq tem vários em MG"). Ela é uma
 * cópia de `pipeline/regioes.py` num app que não tem como importar Python,
 * então o risco é o clássico das cópias: divergir da origem sem ninguém notar.
 *
 * O que se garante:
 *   1. as contagens do IBGE — 51 no Jequitinhonha, 23 no Mucuri, 74 no total —
 *      e nenhum município nos dois ao mesmo tempo;
 *   2. todo código tem 7 dígitos e começa com 31 (Minas Gerais);
 *   3. a resolução por CÓDIGO funciona nos dois vales;
 *   4. a resolução por NOME funciona com e sem acento, com e sem caixa — é o
 *      caminho de `spu-imoveis-uniao-vales`, a única fonte separável que não
 *      traz `codigo_ibge`;
 *   5. ⚠️ o que NÃO se sabe volta `null`, nunca um palpite: propriedades
 *      vazias, município de fora dos Vales, código desconhecido. O filtro de
 *      região trata `null` como "mostra assim mesmo", então um palpite errado
 *      aqui viraria área na região errada, silenciosamente;
 *   6. nenhum nome colide entre os dois vales — se colidisse, o índice por nome
 *      mandaria áreas para a mesorregião errada.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MUNICIPIOS_DOS_VALES, mesorregiaoDe, normalizarNome } from './mesorregioes.js';

test('as contagens do IBGE batem: 51 + 23 = 74, sem sobreposição', () => {
  const porMeso = { jequitinhonha: 0, mucuri: 0 };
  for (const m of MUNICIPIOS_DOS_VALES.values()) porMeso[m.meso]++;

  assert.equal(porMeso.jequitinhonha, 51, 'mesorregião 3103 (Jequitinhonha)');
  assert.equal(porMeso.mucuri, 23, 'mesorregião 3104 (Vale do Mucuri)');
  assert.equal(MUNICIPIOS_DOS_VALES.size, 74, 'total dos dois vales');
  // Map não admite chave repetida, então "sem sobreposição" já está garantido
  // pelo tamanho — mas só enquanto o total for a soma exata das duas partes.
  assert.equal(porMeso.jequitinhonha + porMeso.mucuri, MUNICIPIOS_DOS_VALES.size);
});

test('todo código é de município mineiro (7 dígitos, prefixo 31)', () => {
  for (const [codigo, m] of MUNICIPIOS_DOS_VALES) {
    assert.match(codigo, /^31\d{5}$/, `código estranho para ${m.nome}: ${codigo}`);
  }
});

test('resolve pelo código, nos dois vales', () => {
  assert.equal(mesorregiaoDe({ codigo_ibge: '3121605' }), 'jequitinhonha'); // Diamantina
  assert.equal(mesorregiaoDe({ codigo_ibge: '3168606' }), 'mucuri');        // Teófilo Otoni
  // Número em vez de string — é assim que sai de alguns GeoJSON.
  assert.equal(mesorregiaoDe({ codigo_ibge: 3103405 }), 'jequitinhonha');   // Araçuaí
});

test('resolve pelo nome quando não há código — com acento, sem acento e em caixa alta', () => {
  assert.equal(mesorregiaoDe({ municipio: 'Araçuaí' }), 'jequitinhonha');
  assert.equal(mesorregiaoDe({ municipio: 'Aracuai' }), 'jequitinhonha');
  assert.equal(mesorregiaoDe({ municipio: 'ARAÇUAÍ' }), 'jequitinhonha');
  assert.equal(mesorregiaoDe({ municipio: '  Teófilo Otoni  ' }), 'mucuri');
});

test('o que não se sabe volta null — jamais um palpite', () => {
  assert.equal(mesorregiaoDe(null), null);
  assert.equal(mesorregiaoDe(undefined), null);
  assert.equal(mesorregiaoDe({}), null);
  assert.equal(mesorregiaoDe({ municipio: 'Belo Horizonte' }), null, 'BH não é dos Vales');
  assert.equal(mesorregiaoDe({ municipio: 'Curvelo' }), null, 'Curvelo é da bacia');
  assert.equal(mesorregiaoDe({ codigo_ibge: '3106200' }), null, 'código de BH');
});

test('código presente e desconhecido NÃO cai no nome', () => {
  // As camadas da bacia também trazem `codigo_ibge`. Se um código de fora dos
  // Vales fizesse a busca cair no nome, bastaria um homônimo para uma área da
  // bacia ser classificada como dos Vales.
  assert.equal(mesorregiaoDe({ codigo_ibge: '3120904', municipio: 'Araçuaí' }), null);
});

test('nenhum nome colide entre os dois vales', () => {
  const vistos = new Map();
  for (const m of MUNICIPIOS_DOS_VALES.values()) {
    const chave = normalizarNome(m.nome);
    const antes = vistos.get(chave);
    assert.ok(
      !antes || antes === m.meso,
      `"${m.nome}" aparece no ${antes} e no ${m.meso} — o índice por nome mandaria áreas para o vale errado`,
    );
    vistos.set(chave, m.meso);
  }
  assert.equal(vistos.size, 74, 'nome repetido dentro do mesmo vale também é ambiguidade');
});

test('normalizarNome tira acento e caixa sem comer letra', () => {
  assert.equal(normalizarNome('São Gonçalo do Rio Preto'), 'sao goncalo do rio preto');
  assert.equal(normalizarNome('  ÁGUAS FORMOSAS '), 'aguas formosas');
  assert.equal(normalizarNome(null), '');
});
