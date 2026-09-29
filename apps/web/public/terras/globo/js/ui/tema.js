/**
 * tema.js — sincronização dos 8 temas visuais e do modo para daltônicos no Globo 3D e na vista 2D.
 *
 * Papel no portal:
 *   Conecta o Globo 3D (`/terras/globo/index.html`) e a inspeção 2D de satélite
 *   (`/terras/globo/detalhe.html`) ao sistema de temas do Controle Popular
 *   (`app/globals.css`, `ThemeSwitcher.tsx` e `CvdToggle.tsx`).
 *
 * Fonte das regras de negócio e acessibilidade:
 *   - Os 8 temas oficiais do portal (`pequi`, `cerrado`, `mata-atlantica`,
 *     `caatinga`, `pantanal`, `light`, `dark`, `high-contrast`) e o modo
 *     daltônico (`data-cvd="on"`) seguem o piso WCAG 2.x AA (≥ 4,5:1 para
 *     texto, ≥ 3,0:1 para foco/elementos gráficos) e WCAG AAA (≥ 7,0:1 no
 *     `high-contrast`), medidos em `css/tokens/colors.css` e `tema.test.mjs`.
 *
 * Decisões técnicas adotadas:
 *   1. O globo roda dentro de um `<iframe>` (`GloboIframe.tsx`) ou aberto em
 *      aba própria. Como `<iframe>` tem seu próprio `<html>`, o atributo
 *      `data-theme` do portal não atravessa a fronteira sozinho.
 *   2. Quando aberto em iframe de mesma origem, um `MutationObserver` observa
 *      diretamente o `<html>` da janela pai (`window.parent.document.documentElement`),
 *      trocando as cores do HUD e do palco 3D no mesmo quadro em que a pessoa
 *      clica no `ThemeSwitcher` ou no `CvdToggle` da barra global (`TopNav`).
 *   3. Quando a pessoa troca o tema pelo seletor do próprio HUD do globo (útil
 *      em telas móveis onde a `TopNav` recolhe o seletor, ou quando o globo é
 *      aberto em aba direta), a escolha grava em `localStorage` e atualiza
 *      também o `<html>` pai para manter todo o portal sincronizado.
 */

export const TEMAS_GLOBO = [
  { id: 'pequi', label: 'Pequi', rotulo: 'Pequi', emoji: '🌰', cor: '#f2701d', desc: 'Padrão (Candeia quente)' },
  { id: 'cerrado', label: 'Cerrado', rotulo: 'Cerrado', emoji: '🌾', cor: '#c97b5a', desc: 'Terracota & ipê' },
  { id: 'mata-atlantica', label: 'Mata Atlântica', rotulo: 'Mata Atlântica', emoji: '🌿', cor: '#3a6b35', desc: 'Verde-serra & dourado' },
  { id: 'caatinga', label: 'Caatinga', rotulo: 'Caatinga', emoji: '🌵', cor: '#d97724', desc: 'Âmbar & sol do sertão' },
  { id: 'pantanal', label: 'Pantanal', rotulo: 'Pantanal', emoji: '💧', cor: '#0284c7', desc: 'Azul-águas & tuiuiú' },
  { id: 'light', label: 'Claro', rotulo: 'Claro', emoji: '☀️', cor: '#ffffff', desc: 'Fundo branco clássico' },
  { id: 'dark', label: 'Escuro', rotulo: 'Escuro', emoji: '🌙', cor: '#0f172a', desc: 'Azul-noite profundo' },
  { id: 'high-contrast', label: 'Alto contraste', rotulo: 'Alto contraste', emoji: '◐', cor: '#000000', desc: 'Preto & branco puro' },
];

export const IDS_TEMAS_VALIDOS = new Set(TEMAS_GLOBO.map((t) => t.id));

export const TEMA_PADRAO = 'pequi';

/**
 * Garante que qualquer identificador lido do `localStorage` ou do DOM seja um
 * dos 8 temas suportados; valores desconhecidos ou vazios caem em `pequi`.
 *
 * @param {string|null|undefined} valor - nome do tema candidato
 * @returns {string} id válido de tema
 */
export function normalizarTema(valor) {
  return typeof valor === 'string' && IDS_TEMAS_VALIDOS.has(valor) ? valor : TEMA_PADRAO;
}

/**
 * Normaliza o estado do modo seguro para daltônicos (`"on"` ou `"off"`).
 *
 * @param {string|boolean|null|undefined} valor - valor bruto do atributo ou storage
 * @returns {'on'|'off'} estado normalizado
 */
export function normalizarCvd(valor) {
  return valor === 'on' || valor === true ? 'on' : 'off';
}

/**
 * Obtém com segurança o elemento `<html>` da janela pai quando o globo roda
 * dentro de um `<iframe>` de mesma origem. Em aba isolada ou origem cruzada,
 * devolve `null` sem lançar exceção.
 *
 * @param {Window} [win] - objeto window atual
 * @param {Document} [parentDoc] - documento pai explícito (opcional, útil em testes)
 * @returns {HTMLElement|null} elemento raiz do documento pai, se acessível
 */
function obterRaizPai(win, parentDoc) {
  if (parentDoc?.documentElement) return parentDoc.documentElement;
  try {
    if (win && win.parent && win.parent !== win && win.parent.document) {
      return win.parent.document.documentElement || null;
    }
  } catch {
    // Acesso bloqueado por política de origem ou ambiente de teste sem parent
  }
  return null;
}

/**
 * Lê o tema e o modo daltônico ativos, priorizando:
 *   1. o atributo `data-theme` / `data-cvd` do `<html>` da janela pai (quando em iframe);
 *   2. as chaves `theme` e `cp_cvd` do `localStorage`;
 *   3. o atributo atual do próprio documento ou o padrão `pequi`.
 *
 * @param {object} [opts]
 * @param {Document} [opts.doc] - documento alvo
 * @param {Window} [opts.win] - janela alvo
 * @param {Document} [opts.parentDoc] - documento pai opcional
 * @param {Storage} [opts.storage] - armazenamento local (padrão `win.localStorage`)
 * @returns {{ theme: string, cvd: 'on'|'off' }}
 */
export function lerEstadoTema({ doc, win, parentDoc, storage } = {}) {
  const w = win ?? (typeof window !== 'undefined' ? window : null);
  const d = doc ?? (typeof document !== 'undefined' ? document : null);
  let st = storage;
  if (!st && w) {
    try { st = w.localStorage; } catch { st = null; }
  }

  const raizPai = obterRaizPai(w, parentDoc);
  const temaPai = raizPai?.getAttribute?.('data-theme');
  const cvdPai = raizPai?.getAttribute?.('data-cvd');

  let temaStorage = null;
  let cvdStorage = null;
  try {
    temaStorage = st?.getItem?.('theme') ?? null;
    cvdStorage = st?.getItem?.('cp_cvd') ?? null;
  } catch {
    // localStorage indisponível (modo privado restrito)
  }

  const temaDoc = d?.documentElement?.getAttribute?.('data-theme') ?? null;
  const cvdDoc = d?.documentElement?.getAttribute?.('data-cvd') ?? null;

  const candidatoTema = temaPai && IDS_TEMAS_VALIDOS.has(temaPai)
    ? temaPai
    : temaStorage && IDS_TEMAS_VALIDOS.has(temaStorage)
      ? temaStorage
      : temaDoc;

  const candidatoCvd = cvdPai ?? cvdStorage ?? cvdDoc;

  return {
    theme: normalizarTema(candidatoTema),
    cvd: normalizarCvd(candidatoCvd),
  };
}

/**
 * Aplica `data-theme`, `data-cvd` e `colorScheme` no elemento `<html>` do
 * documento informado.
 *
 * @param {Document|null|undefined} doc - documento cujo `documentElement` receberá os atributos
 * @param {{ theme: string, cvd?: string }} estado - estado a aplicar
 * @returns {{ theme: string, cvd: 'on'|'off' }} estado efetivamente aplicado
 */
export function aplicarTemaNoDocumento(doc, { theme, cvd = 'off' } = {}) {
  const temaFinal = normalizarTema(theme);
  const cvdFinal = normalizarCvd(cvd);
  const raiz = doc?.documentElement;
  if (raiz?.setAttribute) {
    if (raiz.getAttribute?.('data-theme') !== temaFinal) {
      raiz.setAttribute('data-theme', temaFinal);
    }
    if (cvdFinal === 'on') {
      if (raiz.getAttribute?.('data-cvd') !== 'on') {
        raiz.setAttribute('data-cvd', 'on');
      }
    } else if (raiz.removeAttribute) {
      raiz.removeAttribute('data-cvd');
    } else {
      raiz.setAttribute('data-cvd', 'off');
    }
    if (raiz.style) {
      raiz.style.colorScheme = (temaFinal === 'light' || temaFinal === 'high-contrast') ? 'light' : 'dark';
    }
  }
  return { theme: temaFinal, cvd: cvdFinal };
}

/**
 * Lê uma variável CSS (`--scene-void`, `--globe-glow`, etc.) do `<html>` atual,
 * devolvendo o fallback caso o ambiente (ex.: teste em Node sem CSS) não tenha
 * `getComputedStyle`.
 *
 * @param {string} nomeVar - nome do token CSS (ex.: `'--scene-void'`)
 * @param {string} fallback - cor hexadecimal de segurança
 * @param {Document} [doc] - documento opcional
 * @returns {string} valor resolvido
 */
export function lerTokenCor(nomeVar, fallback, doc) {
  try {
    const d = doc ?? (typeof document !== 'undefined' ? document : null);
    if (!d?.documentElement || typeof getComputedStyle !== 'function') return fallback;
    const val = getComputedStyle(d.documentElement).getPropertyValue(nomeVar)?.trim();
    return val || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Inicia a sincronia contínua de tema e daltonismo entre o portal (janela pai
 * e `localStorage`) e o documento atual do globo.
 *
 * @param {object} [opts]
 * @param {Document} [opts.doc] - documento do globo
 * @param {Window} [opts.win] - janela do globo
 * @param {Document} [opts.parentDoc] - documento pai opcional
 * @param {Storage} [opts.storage] - storage opcional (para testes)
 * @param {(estado: { theme: string, cvd: 'on'|'off' }) => void} [opts.onChange] - callback disparado na carga e em cada troca
 */
export function iniciarSincroniaDeTema({ doc, win, parentDoc, storage, onChange } = {}) {
  const w = win ?? (typeof window !== 'undefined' ? window : null);
  const d = doc ?? (typeof document !== 'undefined' ? document : null);
  let st = storage;
  if (!st && w) {
    try { st = w.localStorage; } catch { st = null; }
  }

  let estadoAtual = aplicarTemaNoDocumento(d, lerEstadoTema({ doc: d, win: w, parentDoc, storage: st }));
  onChange?.(estadoAtual);

  function notificarSeMudou(proximo) {
    const normalizado = aplicarTemaNoDocumento(d, proximo);
    if (normalizado.theme !== estadoAtual.theme || normalizado.cvd !== estadoAtual.cvd) {
      estadoAtual = normalizado;
      onChange?.(estadoAtual);
    }
    return estadoAtual;
  }

  // 1. Observa mutações em `data-theme` e `data-cvd` no `<html>` da janela pai
  // (quando o globo está embutido em `/funcaosocialterra/mapa`).
  const raizPai = obterRaizPai(w, parentDoc);
  let observerPai = null;
  if (raizPai && typeof MutationObserver !== 'undefined') {
    observerPai = new MutationObserver(() => {
      const temaPai = raizPai.getAttribute('data-theme');
      const cvdPai = raizPai.getAttribute('data-cvd');
      notificarSeMudou({
        theme: temaPai ?? estadoAtual.theme,
        cvd: cvdPai ?? estadoAtual.cvd,
      });
    });
    observerPai.observe(raizPai, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-cvd'],
    });
  }

  // 2. Escuta eventos de `storage` (sincroniza entre abas, ex.: detalhe.html)
  function aoMudarStorage(ev) {
    if (!ev || (ev.key !== 'theme' && ev.key !== 'cp_cvd' && ev.key !== null)) return;
    notificarSeMudou(lerEstadoTema({ doc: d, win: w, parentDoc, storage: st }));
  }

  // 3. Escuta mensagens `postMessage` (`{ tipo: 'tema', theme, cvd }` ou `{ type: 'cp-theme-change', theme, cvd }`)
  function aoReceberMensagem(ev) {
    const dados = ev?.data;
    if (!dados || (dados.tipo !== 'tema' && dados.type !== 'cp-theme-change')) return;
    notificarSeMudou({
      theme: dados.theme ?? estadoAtual.theme,
      cvd: dados.cvd ?? estadoAtual.cvd,
    });
  }

  w?.addEventListener?.('storage', aoMudarStorage);
  w?.addEventListener?.('message', aoReceberMensagem);

  function encerrar() {
    observerPai?.disconnect?.();
    w?.removeEventListener?.('storage', aoMudarStorage);
    w?.removeEventListener?.('message', aoReceberMensagem);
  }

  return {
    get estado() {
      return { ...estadoAtual };
    },
    obterEstado() {
      return { ...estadoAtual };
    },
    definirTema(novoTema) {
      const temaLimpo = normalizarTema(novoTema);
      try { st?.setItem?.('theme', temaLimpo); } catch {}
      if (raizPai?.setAttribute && raizPai.getAttribute?.('data-theme') !== temaLimpo) {
        raizPai.setAttribute('data-theme', temaLimpo);
        try {
          w.parent.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: temaLimpo }));
        } catch {}
      }
      return notificarSeMudou({ theme: temaLimpo, cvd: estadoAtual.cvd });
    },
    definirCvd(novoCvd) {
      const cvdLimpo = normalizarCvd(novoCvd);
      try { st?.setItem?.('cp_cvd', cvdLimpo); } catch {}
      if (raizPai?.setAttribute && raizPai.getAttribute?.('data-cvd') !== cvdLimpo) {
        raizPai.setAttribute('data-cvd', cvdLimpo);
      }
      return notificarSeMudou({ theme: estadoAtual.theme, cvd: cvdLimpo });
    },
    parar: encerrar,
    stop: encerrar,
  };
}
