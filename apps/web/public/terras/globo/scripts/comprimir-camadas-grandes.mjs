/**
 * comprimir-camadas-grandes.mjs — gera `.geojson.gz` para as camadas grandes
 * demais para o teto do Workers Static Assets.
 *
 *   node scripts/comprimir-camadas-grandes.mjs
 *
 * ═══ POR QUE ESTE SCRIPT EXISTE ═══
 *
 * O deploy publica `apps/web/public/` como Workers Static Assets, cujo teto
 * por arquivo é 25 MiB — IGUAL no plano free e no pago, não é limite de
 * dinheiro. `dados/camadas/sigmine-interesse.geojson` sozinho pesa 32,4 MiB:
 * o deploy FALHA nesse arquivo, sempre, hoje.
 *
 * A saída escolhida (dono do projeto, 13/08/2026): guardar o `.geojson`
 * comprimido (`gzip -9`) e descomprimir NO NAVEGADOR com
 * `DecompressionStream('gzip')` — API nativa de todo navegador moderno, zero
 * biblioteca nova. `js/data/api.js` (`fetchLayer`) já sabe fazer isso quando
 * `LAYER_REGISTRY` marca a camada com `comprimida: true` — ver o comentário
 * lá para o porquê de marcar em vez de adivinhar por HTTP.
 *
 * ═══ QUEM ENTRA NA LISTA, E QUEM FICA DE FORA ═══
 *
 * Toda camada acima de ~8 MiB, medido em 13/08/2026:
 *
 *   sigmine-interesse.geojson              32,37 MiB  (só esta já estoura o teto)
 *   mancha-inundacao-barragens.geojson     14,36 MiB
 *   zas-barragens.geojson                  12,08 MiB
 *
 * `sigmine-operacao.geojson` (5,67 MiB) e tudo abaixo disso FICA CRU, de
 * propósito: gzip -9 leva ~1-2 ms por MiB de CPU no navegador e cada camada
 * comprimida exige um branch a mais no carregador (`fetchLayer`) e um flag a
 * mais no registro. Pagar essa complexidade sem precisar dela — nenhuma
 * camada pequena chega perto do teto — seria complicar o carregador à toa.
 * Se uma camada pequena crescer e cruzar ~8 MiB algum dia, rode este script
 * de novo apontando para ela e marque `comprimida: true` na entrada dela em
 * `js/config.js`.
 *
 * ═══ COMO REFAZER O .gz DEPOIS QUE O REPOSITÓRIO PAROU DE TER O .geojson CRU ═══
 *
 * O `.geojson` cru de cada uma das três camadas acima SAIU do repositório
 * (ver o commit desta entrega) — manter as duas versões dobraria o peso do
 * repo sem servir a ninguém, já que só o `.gz` é servido. Para regenerar o
 * `.gz` do zero:
 *
 *   1. Rode o script de ingestão que produz o `.geojson` cru daquela camada:
 *        - sigmine-interesse            -> scripts/ingerir_sigmine.py
 *        - mancha-inundacao-barragens   -> scripts/ingerir_feam_zas_mancha.py
 *        - zas-barragens                -> scripts/ingerir_feam_zas_mancha.py
 *      Isso grava o `.geojson` de novo em `dados/camadas/`.
 *   2. Rode este script: `node scripts/comprimir-camadas-grandes.mjs`. Ele lê
 *      o `.geojson` que acabou de aparecer, grava o `.geojson.gz` ao lado e
 *      IMPRIME o antes/depois medido — não confie em número deste comentário,
 *      o arquivo de origem muda a cada rodada de ingestão.
 *   3. Apague o `.geojson` cru nas três camadas de novo antes de commitar
 *      (`git rm dados/camadas/<id>.geojson`) — ele não deve voltar ao
 *      repositório, só o `.gz` é publicado.
 *
 * Para inspecionar um `.gz` já publicado sem escrever nada (ex.: conferir que
 * ele descomprime para o mesmo GeoJSON válido), use `--verificar`, que roda
 * sempre depois de cada compressão nesta execução E pode ser chamado sozinho:
 *
 *   node scripts/comprimir-camadas-grandes.mjs --verificar
 */
import { gzipSync, gunzipSync } from 'node:zlib';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const DIR_CAMADAS = join(AQUI, '..', 'dados', 'camadas');

/** As três camadas acima de ~8 MiB, medidas em 13/08/2026 — ver o cabeçalho. */
const CAMADAS_GRANDES = [
  'sigmine-interesse',
  'mancha-inundacao-barragens',
  'zas-barragens',
];

const MiB = 1024 * 1024;
const fmtMiB = (bytes) => `${(bytes / MiB).toFixed(2)} MiB`;

/** Comprime UMA camada: lê o .geojson cru, grava o .geojson.gz, mede e confere. */
function comprimirUma(id) {
  const caminhoCru = join(DIR_CAMADAS, `${id}.geojson`);
  const caminhoGz = join(DIR_CAMADAS, `${id}.geojson.gz`);

  if (!existsSync(caminhoCru)) {
    if (existsSync(caminhoGz)) {
      console.log(`- ${id}: sem .geojson cru (já comprimida e removida) — pulando. Use "COMO REFAZER" no cabeçalho se precisar regenerar.`);
      return null;
    }
    throw new Error(`${id}: nem .geojson nem .geojson.gz existem em ${DIR_CAMADAS}`);
  }

  const bruto = readFileSync(caminhoCru);
  // nível 9 = compressão máxima do zlib. Custa mais CPU na hora de gerar (uma
  // vez, aqui, offline) e ganha os bytes que importam: os que atravessam a
  // rede e o teto do Workers Static Assets.
  const comprimido = gzipSync(bruto, { level: 9 });
  writeFileSync(caminhoGz, comprimido);

  // Confere ANTES de declarar sucesso: descomprime de volta e checa que é
  // JSON válido com a mesma contagem de feições do arquivo de origem. Um .gz
  // corrompido silencioso quebraria o globo só quando alguém abrisse aquela
  // camada em produção — tarde demais para pegar aqui, de graça, agora.
  const voltou = gunzipSync(comprimido);
  const fcOriginal = JSON.parse(bruto.toString('utf8'));
  const fcVoltou = JSON.parse(voltou.toString('utf8'));
  if (fcVoltou.features?.length !== fcOriginal.features?.length) {
    throw new Error(`${id}: verificação falhou — ${fcOriginal.features?.length} feições no original, ${fcVoltou.features?.length} depois de gzip+gunzip`);
  }

  const razao = bruto.length / comprimido.length;
  console.log(`✓ ${id}: ${fmtMiB(bruto.length)} -> ${fmtMiB(comprimido.length)}  (${razao.toFixed(1)}×, ${fcOriginal.features.length} feições, verificado)`);
  return { id, antes: bruto.length, depois: comprimido.length, feicoes: fcOriginal.features.length };
}

/** Só confere um .gz já existente, sem recomprimir — usado por --verificar. */
function verificarUma(id) {
  const caminhoGz = join(DIR_CAMADAS, `${id}.geojson.gz`);
  if (!existsSync(caminhoGz)) {
    console.log(`✗ ${id}: ${caminhoGz} não existe`);
    return false;
  }
  const comprimido = readFileSync(caminhoGz);
  try {
    const fc = JSON.parse(gunzipSync(comprimido).toString('utf8'));
    if (fc?.type !== 'FeatureCollection' || !Array.isArray(fc.features)) {
      throw new Error('não é uma FeatureCollection');
    }
    console.log(`✓ ${id}: ${fmtMiB(comprimido.length)} comprimido, descomprime para ${fc.features.length} feições válidas`);
    return true;
  } catch (err) {
    console.log(`✗ ${id}: ${caminhoGz} não descomprime para GeoJSON válido — ${err.message}`);
    return false;
  }
}

function main() {
  const soVerificar = process.argv.includes('--verificar');

  if (soVerificar) {
    const ok = CAMADAS_GRANDES.map(verificarUma).every(Boolean);
    process.exit(ok ? 0 : 1);
  }

  console.log(`Comprimindo ${CAMADAS_GRANDES.length} camadas grandes (gzip -9) em ${DIR_CAMADAS}\n`);
  const resultados = CAMADAS_GRANDES.map(comprimirUma).filter(Boolean);
  if (resultados.length === 0) {
    console.log('\nNada para comprimir (nenhum .geojson cru encontrado — ver "COMO REFAZER" no cabeçalho).');
    return;
  }

  const somaAntes = resultados.reduce((n, r) => n + r.antes, 0);
  const somaDepois = resultados.reduce((n, r) => n + r.depois, 0);
  console.log(`\nTotal: ${fmtMiB(somaAntes)} -> ${fmtMiB(somaDepois)}  (${(somaAntes / somaDepois).toFixed(1)}×)`);

  const TETO = 25 * MiB;
  for (const r of resultados) {
    const caminhoGz = join(DIR_CAMADAS, `${r.id}.geojson.gz`);
    const tamanhoReal = statSync(caminhoGz).size;
    if (tamanhoReal > TETO) {
      console.error(`\n✗ ${r.id}.geojson.gz ainda passa do teto de 25 MiB (${fmtMiB(tamanhoReal)}) — gzip sozinho não resolveu, precisa de outra saída (ex.: particionar a camada).`);
      process.exitCode = 1;
    }
  }
}

main();
