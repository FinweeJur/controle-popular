/**
 * medir-lista.mjs — os números do conserto de virtualização de 12/08 em
 * ../js/ui/listapanel.js, para qualquer um reproduzir.
 *
 *   node scripts/medir-lista.mjs
 *
 * Por que existe: o comentário no topo de listapanel.js cita quantos nós e
 * quanto tempo o render antigo (uma passada só, com as 8.525 linhas de
 * `lotes-vagos-bh`) custava contra o novo (só a janela visível) — e este
 * repo trata número em comentário sem forma de reproduzir como o mesmo tipo
 * de risco que dado inventado com cara de oficial (ver o aviso sobre
 * `fixture` em config.js). Este script é essa forma.
 *
 * Por que mede fora do navegador: não havia um navegador de verdade
 * disponível para cronometrar dentro dele nesta ferramenta — mesma
 * limitação, pela mesma razão, que já levou `realce.test.mjs` a montar um
 * LayerManager falso em vez de abrir um navegador. O que se mede aqui é a
 * CONSTRUÇÃO DA STRING HTML (`entradas.map(linhaHtml).join('')`), que é
 * exatamente o trabalho síncrono de JS que os dois `render()` fazem antes de
 * entregar a string para `innerHTML =` — o parse desse HTML em nós de
 * verdade, o layout e o paint do navegador vêm DEPOIS, e só piorariam a
 * proporção a favor da janela (mais nós de verdade para o navegador
 * processar no caso antigo, não menos).
 *
 * Por que processo novo por medição, e não um `for` com várias repetições no
 * mesmo processo: um toggle de camada no app acontece uma vez, frio — medir
 * em loop aquecido dentro do mesmo processo mistura GC e otimização do V8
 * de execuções que o usuário nunca vê de verdade, e a variância observada
 * assim (a primeira medição deste script, feita em loop, chegou a variar de
 * 2,5 s a 6,3 s entre repetições do MESMO processo) mostra isso: é ruído de
 * medição, não o custo real. Por isso o script chama a si mesmo via
 * `spawnSync` para cada modo, um processo por medição.
 *
 * `linhaHtml`/`resumoDaArea`/`TITULARIDADE_CURTA` são copiados aqui verbatim
 * de listapanel.js (não são exportados de lá — são detalhe interno do
 * módulo). `calcularJanela`, `descreverAreaCurta` e `formatarValor` são
 * IMPORTADOS de verdade: são o contrato público que este script verifica,
 * não uma cópia que pode divergir do código real sem ninguém notar.
 */
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';

const AQUI = dirname(fileURLToPath(import.meta.url));
const GLOBO = join(AQUI, '..');

const { descreverAreaCurta, formatarValor } = await import(`file://${join(GLOBO, 'js/ui/rotulos.js')}`);
const { calcularJanela } = await import(`file://${join(GLOBO, 'js/ui/listapanel.js')}`);

function escapar(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Cópia verbatim de listapanel.js — ver o aviso no cabeçalho deste arquivo.
const TITULARIDADE_CURTA = {
  sem_registro_conhecido: 'ninguém consta como dono',
  publica_certificada: '★ consta terra pública',
  assentamento: 'encosta em assentamento',
  territorio_tradicional: 'encosta em território quilombola',
};
function resumoDaArea(props) {
  const partes = [];
  if (props.compacidade != null) partes.push(String(formatarValor('compacidade', props.compacidade)).split(' (')[0]);
  if (props.largura_media_m != null) partes.push(`${Math.round(props.largura_media_m)} m de largura`);
  if (props.veg_nativa_pct != null) partes.push(`${Number(props.veg_nativa_pct).toLocaleString('pt-BR')}% de mata`);
  if (props.uso_antropico_pct != null) partes.push(`${Math.round(props.uso_antropico_pct)}% em uso`);
  if (props.titularidade) partes.push(TITULARIDADE_CURTA[props.titularidade] ?? props.titularidade);
  return partes.join(' · ');
}
function linhaHtml({ layerId, cfg, idx, feature }, i) {
  const p = feature.properties ?? {};
  const nome = p.municipio || cfg?.label || 'Área';
  const cor = `#${(cfg?.color ?? 0xa78bfa).toString(16).padStart(6, '0')}`;
  return `
    <button class="lista-item" type="button" data-i="${i}"
            data-layer="${escapar(layerId)}" data-idx="${idx}">
      <span class="lista-item-topo">
        <span class="lista-dot" style="background:${cor}"></span>
        <span class="lista-item-nome">${escapar(nome)}${
          cfg?.fixture ? '<span class="lista-fake">FICTÍCIO</span>' : ''}</span>
        <span class="lista-item-area">${
          p.area_ha != null ? escapar(descreverAreaCurta(p.area_ha)) : ''}</span>
      </span>
      <span class="lista-item-sub">${escapar(resumoDaArea(p))}</span>
    </button>`;
}
function contarNos(html) { return (html.match(/<(button|span)\b/g) ?? []).length; }

function carregarEntradas() {
  const caminho = join(GLOBO, 'dados/camadas/lotes-vagos-bh.geojson');
  const fc = JSON.parse(readFileSync(caminho, 'utf-8'));
  const cfg = { id: 'lotes-vagos-bh', label: 'Lotes vagos em Belo Horizonte', color: 0x8a8f98 };
  const entradas = fc.features.map((feature, idx) => ({ layerId: 'lotes-vagos-bh', cfg, idx, feature }));
  entradas.sort((a, b) => (b.feature.properties?.area_ha ?? 0) - (a.feature.properties?.area_ha ?? 0));
  return entradas;
}

const ALTURA_VIEWPORT = 640; // painel de lista típico no desktop (ver css/hud.css)
const PASSO_ESTIMADO = 48;   // mesmo valor de js/ui/listapanel.js — não exportado, replicado aqui
const BUFFER_LINHAS = 8;     // idem

const ESTE_ARQUIVO = fileURLToPath(import.meta.url);

/** Roda UMA medição, num processo filho novo (frio) — ver o aviso do cabeçalho. */
function medirEmProcessoNovo(modo) {
  const r = spawnSync(process.execPath, [ESTE_ARQUIVO, '--medir', modo], {
    encoding: 'utf-8',
  });
  if (r.status !== 0) throw new Error(`medição "${modo}" falhou: ${r.stderr}`);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

function rodarUmaMedicao(modo) {
  const entradas = carregarEntradas();
  // Aquecimento: um Intl/toLocaleString primeiro-uso NÃO é o custo que o app
  // real paga no toggle (já rodou antes, no footer/status bar) — sem isto a
  // medição de "depois" (só ~30 linhas) fica dominada pelo custo fixo de
  // carregar o ICU, não pelo trabalho de fato proporcional ao tamanho da
  // janela. Ver aviso equivalente no cabeçalho de listapanel.test.mjs? não —
  // lá é aritmética pura, sem Intl; o aviso mora só aqui.
  linhaHtml({ layerId: 'x', cfg: entradas[0].cfg, idx: 0, feature: { properties: { area_ha: 1 } } }, 0);

  let fatia, offset;
  if (modo === 'antes') {
    fatia = entradas; offset = 0;
  } else {
    const { inicio, fim } = calcularJanela(entradas.length, 0, ALTURA_VIEWPORT, PASSO_ESTIMADO, BUFFER_LINHAS);
    fatia = entradas.slice(inicio, fim); offset = inicio;
  }
  const t0 = performance.now();
  const html = fatia.map((e, k) => linhaHtml(e, offset + k)).join('');
  const ms = performance.now() - t0;
  return { modo, totalEntradas: entradas.length, linhas: fatia.length, nos: contarNos(html), ms };
}

// Modo "filho": chamado via spawnSync acima, imprime UM resultado JSON e sai.
if (process.argv.includes('--medir')) {
  const modo = process.argv[process.argv.indexOf('--medir') + 1];
  console.log(JSON.stringify(rodarUmaMedicao(modo)));
  process.exit(0);
}

// Modo "pai": orquestra N execuções frias de cada modo e resume.
function resumir(rotulo, resultados) {
  const tempos = resultados.map((r) => r.ms).sort((a, b) => a - b);
  const mediana = tempos[Math.floor(tempos.length / 2)];
  const { linhas, nos, totalEntradas } = resultados[0];
  console.log(`${rotulo}: ${linhas} linhas / ${nos} nós (de ${totalEntradas} áreas em lotes-vagos-bh) — mediana de ${tempos.length} processos frios: ${mediana.toFixed(1)} ms (min ${tempos[0].toFixed(1)}, max ${tempos[tempos.length - 1].toFixed(1)})`);
  return { linhas, nos, mediana };
}

console.log(`lotes-vagos-bh.geojson: ${carregarEntradas().length} áreas (contagem real do arquivo)\n`);

const REPETICOES = 3;
const antes = resumir('ANTES (render antigo, todas as linhas de uma vez)',
  Array.from({ length: REPETICOES }, () => medirEmProcessoNovo('antes')));
const depois = resumir('DEPOIS (renderJanela, só a fatia visível)',
  Array.from({ length: REPETICOES }, () => medirEmProcessoNovo('depois')));

console.log(`\nnós: ${antes.nos} → ${depois.nos}  (${(antes.nos / depois.nos).toFixed(0)}× menos)`);
console.log(`tempo de construção da string: ${antes.mediana.toFixed(0)} ms → ${depois.mediana.toFixed(1)} ms  (${(antes.mediana / depois.mediana).toFixed(0)}× mais rápido)`);
