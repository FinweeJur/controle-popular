/**
 * tema.test.mjs — auditoria automatizada de temas, sincronia e contraste WCAG
 * do globo Terras 3D (`index.html`) e da vista 2D (`detalhe.html`).
 *
 * Papel no portal:
 *   Garante por medição matemática (luminância relativa IEC 61966-2-1 / WCAG 2.x)
 *   que todos os 8 temas do Controle Popular (`pequi`, `cerrado`,
 *   `mata-atlantica`, `caatinga`, `pantanal`, `light`, `dark`, `high-contrast`)
 *   e o modo de daltonismo (`data-cvd="on"`) funcionam no mapa 3D e respeitam
 *   os pisos de legibilidade:
 *     - WCAG AA (≥ 4,5:1) para textos e links nos 7 temas padrão;
 *     - WCAG AAA (≥ 7,0:1) para textos e links no tema `high-contrast`;
 *     - WCAG 2.4.11 / 1.4.11 (≥ 3,0:1) para anéis de foco e marcadores;
 *     - Legibilidade sobre fundos translúcidos (`--glass-fill`,
 *       `--glass-fill-strong` e `--scrim-imagery`) compostos sobre os seis
 *       chãos reais do mapa: espaço (`#04060a`), oceano iluminado (`#386890`),
 *       satélite (floresta `#4a7a3a`, asfalto `#6b6b6b`, areia `#cbb187`) e o
 *       mapa de ruas claro OpenStreetMap (`#f2efe9`) — medidos com todos os
 *       tokens de texto, inclusive `--caution` e `--danger`.
 *
 * Execução:
 *   node --test apps/web/public/terras/globo/js/ui/tema.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TEMAS_GLOBO,
  IDS_TEMAS_VALIDOS,
  TEMA_PADRAO,
  normalizarTema,
  normalizarCvd,
  lerEstadoTema,
  aplicarTemaNoDocumento,
  iniciarSincroniaDeTema,
} from './tema.js';
import { formatarValor } from './rotulos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GLOBO_DIR = path.resolve(__dirname, '..', '..');
const COLORS_CSS = readFileSync(path.join(GLOBO_DIR, 'css', 'tokens', 'colors.css'), 'utf-8');
const HUD_CSS = readFileSync(path.join(GLOBO_DIR, 'css', 'hud.css'), 'utf-8');
const INDEX_HTML = readFileSync(path.join(GLOBO_DIR, 'index.html'), 'utf-8');
const DETALHE_HTML = readFileSync(path.join(GLOBO_DIR, 'detalhe.html'), 'utf-8');

/* ───────────────────────────────────────────────────────────────────────────
 * Utilitários matemáticos de cor e contraste (WCAG 2.x / sRGB IEC 61966-2-1)
 * ─────────────────────────────────────────────────────────────────────────── */

/**
 * Converte cor hexadecimal `#rrggbb` em tripla `[r, g, b]` de 0 a 255.
 * @param {string} hex
 * @returns {[number, number, number]}
 */
function hexParaRgb(hex) {
  const limpo = hex.trim().replace(/^#/, '');
  const n = parseInt(limpo, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Interpreta `rgba(r, g, b, a)`, `rgb(r g b / a)` ou `#rrggbb` em
 * `{ rgb: [r,g,b], alpha: number }`.
 * @param {string} valorCss
 * @returns {{ rgb: [number, number, number], alpha: number }}
 */
function parsearCorCss(valorCss) {
  const v = valorCss.trim();
  if (v.startsWith('#')) {
    return { rgb: hexParaRgb(v), alpha: 1 };
  }
  const m = v.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:\s*[,/]\s*([0-9.]+))?\s*\)/i);
  if (!m) {
    throw new Error(`Formato de cor não suportado no teste: "${valorCss}"`);
  }
  return {
    rgb: [Number(m[1]), Number(m[2]), Number(m[3])],
    alpha: m[4] !== undefined ? Number(m[4]) : 1,
  };
}

/**
 * Compõe uma cor com transparência (`fg`) sobre um fundo opaco (`bgRgb`).
 * @param {{ rgb: [number, number, number], alpha: number }} fg
 * @param {[number, number, number]} bgRgb
 * @returns {[number, number, number]}
 */
function comporSobreFundo(fg, bgRgb) {
  const a = fg.alpha;
  return [
    Math.round(fg.rgb[0] * a + bgRgb[0] * (1 - a)),
    Math.round(fg.rgb[1] * a + bgRgb[1] * (1 - a)),
    Math.round(fg.rgb[2] * a + bgRgb[2] * (1 - a)),
  ];
}

/**
 * Calcula a luminância relativa WCAG 2.x de uma tripla `[r, g, b]`.
 * @param {[number, number, number]} rgb
 * @returns {number}
 */
function luminanciaRelativa([r, g, b]) {
  const canal = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/**
 * Calcula a razão de contraste WCAG entre duas triplas RGB (1,00 a 21,00).
 * @param {[number, number, number]} rgbA
 * @param {[number, number, number]} rgbB
 * @returns {number}
 */
function razaoContraste(rgbA, rgbB) {
  const l1 = luminanciaRelativa(rgbA);
  const l2 = luminanciaRelativa(rgbB);
  const claro = Math.max(l1, l2);
  const escuro = Math.min(l1, l2);
  return (claro + 0.05) / (escuro + 0.05);
}

/**
 * Extrai os tokens `--nome: valor;` de qualquer regra CSS cujo cabeçalho de
 * seletores (separados por vírgula) contenha exatamente `seletorAlvo`.
 * @param {string} css
 * @param {string} seletorAlvo
 * @returns {Record<string, string>}
 */
function extrairTokensDoSeletor(css, seletorAlvo) {
  const semComentarios = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const tokens = {};
  for (const m of semComentarios.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const listaSeletores = m[1].split(',').map((s) => s.trim());
    if (!listaSeletores.includes(seletorAlvo)) continue;
    const bloco = m[2];
    for (const par of bloco.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
      tokens[par[1].trim()] = par[2].trim();
    }
  }
  return tokens;
}

/**
 * Resolve o mapa completo de tokens de um tema combinando `:root` + seletor do
 * tema + eventual modo daltônico (`data-cvd="on"`).
 * @param {string} idTema
 * @param {boolean} [cvd=false]
 * @returns {Record<string, string>}
 */
function resolverTokensDoTema(idTema, cvd = false) {
  const base = extrairTokensDoSeletor(COLORS_CSS, ':root');
  const tema = extrairTokensDoSeletor(COLORS_CSS, `[data-theme="${idTema}"]`);
  const resolvido = { ...base, ...tema };
  if (cvd) {
    const cvdGeral = extrairTokensDoSeletor(COLORS_CSS, '[data-cvd="on"]');
    const cvdTema = extrairTokensDoSeletor(COLORS_CSS, `[data-theme="${idTema}"][data-cvd="on"]`);
    Object.assign(resolvido, cvdGeral, cvdTema);
  }
  return resolvido;
}

/* ───────────────────────────────────────────────────────────────────────────
 * 1. Auditoria de contraste WCAG 2.x nos 8 temas + modo daltônico (CVD)
 * ─────────────────────────────────────────────────────────────────────────── */

test('Todos os 8 temas do portal estão declarados em TEMAS_GLOBO e em colors.css', () => {
  const esperados = [
    'pequi', 'cerrado', 'mata-atlantica', 'caatinga',
    'pantanal', 'light', 'dark', 'high-contrast',
  ];
  assert.deepEqual(TEMAS_GLOBO.map((t) => t.id), esperados);
  for (const id of esperados) {
    assert.ok(IDS_TEMAS_VALIDOS.has(id), `${id} deve constar em IDS_TEMAS_VALIDOS`);
    const tokens = extrairTokensDoSeletor(COLORS_CSS, `[data-theme="${id}"]`);
    assert.ok(Object.keys(tokens).length >= 15, `Bloco [data-theme="${id}"] deve definir os tokens do tema`);
  }
});

test('Contraste WCAG AA (≥ 4,5:1) em todos os 7 temas padrão e AAA (≥ 7,0:1) em high-contrast', () => {
  const superficies = ['--color-base', '--color-surface-1', '--color-surface-2'];
  const textos = ['--text-1', '--text-2', '--text-3', '--accent-text', '--caution', '--danger'];

  for (const { id } of TEMAS_GLOBO) {
    for (const cvd of [false, true]) {
      const tokens = resolverTokensDoTema(id, cvd);
      const pisoTexto = id === 'high-contrast' ? 7.0 : 4.5;
      const sufixo = `${id}${cvd ? '+cvd' : ''}`;

      for (const sup of superficies) {
        const bgRgb = hexParaRgb(tokens[sup]);
        for (const txt of textos) {
          const fgRgb = hexParaRgb(tokens[txt]);
          const razao = razaoContraste(fgRgb, bgRgb);
          assert.ok(
            razao >= pisoTexto,
            `[${sufixo}] ${txt} (${tokens[txt]}) sobre ${sup} (${tokens[sup]}) = ${razao.toFixed(2)}:1 (mínimo ${pisoTexto}:1)`,
          );
        }
      }

      // Texto sobre botão de destaque preenchido (--text-on-accent sobre --accent)
      const razaoBotao = razaoContraste(
        hexParaRgb(tokens['--text-on-accent']),
        hexParaRgb(tokens['--accent']),
      );
      assert.ok(
        razaoBotao >= pisoTexto,
        `[${sufixo}] --text-on-accent (${tokens['--text-on-accent']}) sobre --accent (${tokens['--accent']}) = ${razaoBotao.toFixed(2)}:1`,
      );

      // Selo de ponto calculado / fictício (--color-surface-2 sobre --caution)
      const razaoSelo = razaoContraste(
        hexParaRgb(tokens['--color-surface-2']),
        hexParaRgb(tokens['--caution']),
      );
      assert.ok(
        razaoSelo >= 4.5,
        `[${sufixo}] selo --color-surface-2 sobre --caution = ${razaoSelo.toFixed(2)}:1 (mínimo 4,5:1)`,
      );

      // Anel de foco (--focus-ring sobre --color-base e --color-surface-1) ≥ 3,0:1 (WCAG 2.4.11)
      const razaoFocoBase = razaoContraste(
        hexParaRgb(tokens['--focus-ring']),
        hexParaRgb(tokens['--color-base']),
      );
      const razaoFocoSup1 = razaoContraste(
        hexParaRgb(tokens['--focus-ring']),
        hexParaRgb(tokens['--color-surface-1']),
      );
      assert.ok(
        razaoFocoBase >= 3.0 && razaoFocoSup1 >= 3.0,
        `[${sufixo}] --focus-ring (${tokens['--focus-ring']}) deve ter ≥ 3:1 sobre base (${razaoFocoBase.toFixed(2)}) e surface-1 (${razaoFocoSup1.toFixed(2)})`,
      );
    }
  }
});

test('Painéis translúcidos (--glass-fill, --glass-fill-strong, --scrim-imagery) mantêm legibilidade sobre satélite e mapa de ruas', () => {
  // Os seis fundos reais que passam por trás dos painéis, na ordem em que a
  // `colors.css` os declara: espaço sideral, oceano/costa iluminada da textura
  // Blue Marble, e as quatro imagens que o globo e a vista 2D usam — satélite
  // (floresta, asfalto, areia) e o mapa de ruas claro do OpenStreetMap.
  const fundosDeCena = [
    { nome: 'espaço (#04060a)', rgb: [4, 6, 10] },
    { nome: 'oceano iluminado (#386890)', rgb: [56, 104, 144] },
    { nome: 'mapa de ruas OSM (#f2efe9)', rgb: [242, 239, 233] },
    { nome: 'satélite: floresta (#4a7a3a)', rgb: [74, 122, 58] },
    { nome: 'satélite: asfalto (#6b6b6b)', rgb: [107, 107, 107] },
    { nome: 'satélite: areia (#cbb187)', rgb: [203, 177, 135] },
  ];

  // `--caution` e `--danger` entram na lista: são texto de aviso e de erro
  // dentro dos painéis (`#layers-panel .layer-error`, notas da ficha). Ficavam
  // de fora e foi exatamente por ali que o tema cerrado reprovou — o `--danger`
  // #f87171 dava 4,43:1 sobre vidro + rua clara. Corrigido para #fb8a82.
  const textosNoVidro = ['--text-1', '--text-2', '--text-3', '--accent-text', '--caution', '--danger'];

  for (const { id } of TEMAS_GLOBO) {
    const tokens = resolverTokensDoTema(id, false);
    const piso = id === 'high-contrast' ? 7.0 : 4.5;

    for (const vidro of ['--glass-fill', '--glass-fill-strong', '--scrim-imagery']) {
      const corVidro = parsearCorCss(tokens[vidro]);
      for (const fundo of fundosDeCena) {
        const bgComposto = comporSobreFundo(corVidro, fundo.rgb);
        for (const txt of textosNoVidro) {
          const fgRgb = hexParaRgb(tokens[txt]);
          const razao = razaoContraste(fgRgb, bgComposto);
          assert.ok(
            razao >= piso,
            `[${id}] ${txt} (${tokens[txt]}) em ${vidro} sobre ${fundo.nome} = ${razao.toFixed(2)}:1 (mínimo ${piso}:1)`,
          );
        }
      }
    }
  }
});

/* ───────────────────────────────────────────────────────────────────────────
 * 2. Testes unitários do módulo `ui/tema.js` (normalização, leitura e sincronia)
 * ─────────────────────────────────────────────────────────────────────────── */

test('normalizarTema e normalizarCvd devolvem valores canônicos seguros', () => {
  assert.equal(normalizarTema('cerrado'), 'cerrado');
  assert.equal(normalizarTema('high-contrast'), 'high-contrast');
  assert.equal(normalizarTema('tema-inexistente'), TEMA_PADRAO);
  assert.equal(normalizarTema(null), TEMA_PADRAO);
  assert.equal(normalizarTema(''), TEMA_PADRAO);

  assert.equal(normalizarCvd('on'), 'on');
  assert.equal(normalizarCvd(true), 'on');
  assert.equal(normalizarCvd('off'), 'off');
  assert.equal(normalizarCvd(null), 'off');
});

test('lerEstadoTema prioriza o documento pai (iframe) sobre o localStorage', () => {
  const parentDoc = {
    documentElement: {
      getAttribute: (attr) => (attr === 'data-theme' ? 'pantanal' : attr === 'data-cvd' ? 'on' : null),
    },
  };
  const storage = {
    getItem: (k) => (k === 'theme' ? 'light' : 'off'),
  };

  const comPai = lerEstadoTema({ parentDoc, storage });
  assert.deepEqual(comPai, { theme: 'pantanal', cvd: 'on' });

  const semPai = lerEstadoTema({ parentDoc: null, storage });
  assert.deepEqual(semPai, { theme: 'light', cvd: 'off' });
});

test('aplicarTemaNoDocumento atualiza data-theme, data-cvd e colorScheme corretamente', () => {
  const attrs = new Map();
  const doc = {
    documentElement: {
      setAttribute: (k, v) => attrs.set(k, v),
      removeAttribute: (k) => attrs.delete(k),
      style: {},
    },
  };

  aplicarTemaNoDocumento(doc, { theme: 'light', cvd: 'on' });
  assert.equal(attrs.get('data-theme'), 'light');
  assert.equal(attrs.get('data-cvd'), 'on');
  assert.equal(doc.documentElement.style.colorScheme, 'light');

  aplicarTemaNoDocumento(doc, { theme: 'caatinga', cvd: 'off' });
  assert.equal(attrs.get('data-theme'), 'caatinga');
  assert.equal(attrs.has('data-cvd'), false);
  assert.equal(doc.documentElement.style.colorScheme, 'dark');
});

test('iniciarSincroniaDeTema propaga mudanças de definirTema, storage e postMessage', () => {
  const attrsFilho = new Map();
  const attrsPai = new Map([['data-theme', 'cerrado'], ['data-cvd', 'off']]);
  const store = new Map();
  const listeners = new Map();

  const doc = {
    documentElement: {
      getAttribute: (k) => attrsFilho.get(k) ?? null,
      setAttribute: (k, v) => attrsFilho.set(k, v),
      removeAttribute: (k) => attrsFilho.delete(k),
      style: {},
    },
  };
  const parentDoc = {
    documentElement: {
      getAttribute: (k) => attrsPai.get(k) ?? null,
      setAttribute: (k, v) => attrsPai.set(k, v),
      removeAttribute: (k) => attrsPai.delete(k),
    },
  };
  const storage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
  };
  const win = {
    parent: { document: parentDoc },
    localStorage: storage,
    addEventListener: (ev, fn) => listeners.set(ev, fn),
    removeEventListener: (ev) => listeners.delete(ev),
  };

  const historico = [];
  const ctrl = iniciarSincroniaDeTema({
    doc,
    win,
    onChange: (estado) => historico.push(estado),
  });

  // Estado inicial lido do documento pai ('cerrado')
  assert.equal(ctrl.estado.theme, 'cerrado');
  assert.equal(attrsFilho.get('data-theme'), 'cerrado');

  // Troca iniciada pelo seletor interno do globo
  ctrl.definirTema('high-contrast');
  assert.equal(attrsFilho.get('data-theme'), 'high-contrast');
  assert.equal(attrsPai.get('data-theme'), 'high-contrast');
  assert.equal(store.get('theme'), 'high-contrast');
  assert.equal(historico.at(-1)?.theme, 'high-contrast');

  // Troca vinda por postMessage
  listeners.get('message')?.({ data: { type: 'cp-theme-change', theme: 'mata-atlantica', cvd: 'on' } });
  assert.equal(attrsFilho.get('data-theme'), 'mata-atlantica');
  assert.equal(attrsFilho.get('data-cvd'), 'on');
  assert.equal(historico.at(-1)?.theme, 'mata-atlantica');
  assert.equal(historico.at(-1)?.cvd, 'on');

  ctrl.stop();
  assert.equal(listeners.size, 0);
});

/* ───────────────────────────────────────────────────────────────────────────
 * 3. Verificação das correções de links e marcadores em rotulos.js, hud.css,
 *    index.html e detalhe.html
 * ─────────────────────────────────────────────────────────────────────────── */

test('link_oficial em rotulos.js usa --accent-text para manter contraste em temas claros e escuros', () => {
  const html = formatarValor('link_oficial', 'https://sei.ibama.gov.br/processo');
  assert.match(html, /var\(--accent-text/, 'link_oficial deve usar --accent-text em vez de --cp-primary isolado');
});

test('hud.css estiliza links da ficha, seletor de tema e anéis de contraste para temas claros', () => {
  assert.match(HUD_CSS, /#inspector\s+\.inspector-table\s+a\s*\{/, 'hud.css deve estilizar links dentro de .inspector-table');
  assert.match(HUD_CSS, /#statusbar\s+\.tema-select\s*\{/, 'hud.css deve estilizar o seletor .tema-select na statusbar');
  assert.match(HUD_CSS, /:root\[data-theme="light"\]\s+#layers-panel\s+\.layer-marca/, 'hud.css deve contornar .layer-marca no tema light');
  assert.match(HUD_CSS, /:root\[data-theme="high-contrast"\]\s+\.hud-panel/, 'hud.css deve reforçar bordas no tema high-contrast');
});

test('index.html e detalhe.html possuem script anti-flash síncrono e atributo data-theme inicial', () => {
  assert.match(INDEX_HTML, /<html[^>]+data-theme="pequi"/);
  assert.match(INDEX_HTML, /localStorage\.getItem\('theme'\)/);
  assert.match(DETALHE_HTML, /<html[^>]+data-theme="pequi"/);
  assert.match(DETALHE_HTML, /id="select-tema"/);
  assert.match(DETALHE_HTML, /\.painel\s+table\s+a\s*\{/);
});
