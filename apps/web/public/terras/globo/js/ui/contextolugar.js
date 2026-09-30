/**
 * contextolugar.js — a ficha de contexto que abre quando o globo chega a um lugar.
 *
 * O que faz: recebe `{ nome, ctx }` do deep link "voe até aqui" (core/voo.js) e
 * mostra um painel com o nome do lugar, um texto histórico/educativo curto e o
 * link da fonte oficial. O texto vive em `dados/contextos-lugares.json`, por slug
 * (`ctx`) — nada de HTML com dado do endereço, tudo por `textContent`.
 *
 * Por que separado do inspector: o inspector descreve a FEIÇÃO clicada (uma
 * camada, um índice). Aqui o que importa é o LUGAR — um ponto qualquer do país
 * pode ter contexto publicado mesmo sem camada nenhuma por baixo.
 *
 * Acessibilidade: é um `aside` rotulado, fechável por botão e por Esc; sem cor
 * como canal único. O fundo é o `.hud-panel` do globo (vidro escuro), o mesmo
 * dos outros painéis, para não introduzir estilo novo.
 */

const FONTE_DADOS = 'dados/contextos-lugares.json';

let cache = null;
let carregando = null;

async function carregarContextos() {
  if (cache) return cache;
  if (carregando) return carregando;
  carregando = fetch(FONTE_DADOS)
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => {
      cache = j || {};
      return cache;
    })
    .catch((err) => {
      console.warn('[contextolugar] falha ao carregar os contextos:', err?.message ?? err);
      cache = {};
      return cache;
    })
    .finally(() => { carregando = null; });
  return carregando;
}

export function criarContextoLugar() {
  const el = document.createElement('aside');
  el.className = 'hud-panel contextolugar';
  el.hidden = true;
  el.setAttribute('role', 'note');
  el.setAttribute('aria-label', 'Contexto do lugar');
  // Posição inline de propósito: não há classe de CSS própria, e o painel mora
  // no canto inferior direito, fora do caminho dos controles.
  Object.assign(el.style, {
    position: 'fixed',
    right: 'var(--space-3, 12px)',
    bottom: 'var(--space-3, 12px)',
    maxWidth: '24rem',
    zIndex: 'var(--z-hud, 30)',
  });

  const fechar = document.createElement('button');
  fechar.type = 'button';
  fechar.textContent = 'Fechar';
  fechar.className = 'focus-btn';
  fechar.style.float = 'right';
  fechar.addEventListener('click', () => esconder());

  const titulo = document.createElement('strong');
  titulo.className = 'panel-title';
  const corpo = document.createElement('p');
  corpo.style.margin = '8px 0';
  const fonte = document.createElement('p');
  fonte.className = 'mono';
  fonte.style.fontSize = '0.8em';

  el.append(fechar, titulo, corpo, fonte);
  document.body.appendChild(el);

  function esconder() {
    el.hidden = true;
  }

  async function mostrar({ nome, ctx } = {}) {
    const dados = await carregarContextos();
    const c = ctx ? dados[ctx] : null;

    titulo.textContent = nome || c?.titulo || 'Lugar no mapa';
    corpo.textContent = c?.contexto
      ?? 'Ainda não há contexto histórico publicado para este ponto. O portal publica o sinal com fonte e data; a lacuna fica declarada em vez de preenchida por suposição.';
    fonte.textContent = '';

    if (c?.fonte) {
      const rotulo = document.createTextNode(`Fonte: ${c.fonte} — `);
      const a = document.createElement('a');
      a.href = c.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'conferir ↗';
      a.style.textDecoration = 'underline';
      fonte.append(rotulo, a);
    }

    el.hidden = false;
  }

  function aoTeclar(e) {
    if (e.key === 'Escape' && !el.hidden) esconder();
  }
  window.addEventListener('keydown', aoTeclar);

  return {
    mostrar,
    esconder,
    destruir() {
      window.removeEventListener('keydown', aoTeclar);
      el.remove();
    },
  };
}
