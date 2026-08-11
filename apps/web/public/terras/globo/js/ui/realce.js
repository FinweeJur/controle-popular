/**
 * realce.js — passar o mouse numa camada acende as áreas dela no globo.
 *
 * É o efeito principal desta passagem, e foi escolhido porque **responde uma
 * pergunta**: o painel tem 11 camadas e duas delas são violeta irmãs (o vazio
 * da bacia e o de Curvelo). Olhando o globo com as duas ligadas, não dá para
 * saber qual mancha é qual. Passar o dedo no nome resolve isso sem clicar, sem
 * abrir nada e sem mudar estado nenhum.
 *
 * Ou seja: não é enfeite. A camada em foco sobe de opacidade e as outras
 * recuam — o resto do mapa continua ali, só cede o primeiro plano.
 *
 * ## Por que opacidade, e não cor ou espessura
 *
 * Mexer no matiz quebraria a regra do sistema de design ("hover clareia o
 * preenchimento, nunca muda o matiz") e, pior, faria a cor da camada mentir: a
 * cor É o identificador da camada no painel e no globo. Espessura de linha não
 * é confiável entre plataformas em WebGL. Opacidade é a única dimensão livre.
 *
 * ## Duração vem do token, e isso dá `prefers-reduced-motion` de graça
 *
 * A duração é lida de `--dur-base` em tempo de execução. Em
 * `tokens/motion.css`, `@media (prefers-reduced-motion: reduce)` zera esse
 * token — então quem pediu menos movimento recebe a troca instantânea, sem
 * nenhum `matchMedia` aqui. O estado final é o mesmo; só não há trajeto.
 *
 * ## Custo
 *
 * Zero alocação por frame e zero geometria nova: só escreve `material.opacity`,
 * que o loop de `main.js` já leva para a tela a cada frame. Termina sozinho
 * quando chega no alvo — não deixa rAF girando.
 */

const FOCO = 2.2;    /* multiplicador de quem está em foco (limitado a 1) */
const RECUO = 0.35;  /* o quanto as outras camadas cedem */

/** Lê um token de duração como número de ms. `--dur-base: 0ms` sob
 *  prefers-reduced-motion faz esta função devolver 0, que é o atalho. */
function duracaoMs(nome) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  const n = parseFloat(v);
  return Number.isFinite(n) ? (v.endsWith('ms') ? n : n * 1000) : 0;
}

/* Mesma curva do --ease-out do sistema, na forma que o JS precisa. */
const suavizar = (t) => 1 - Math.pow(1 - t, 3);

/**
 * @param {import('../layers/manager.js').LayerManager} layers
 * @param {HTMLElement} painel #layers-panel
 */
export function criarRealce(layers, painel) {
  /** material → opacidade original. Guardada na primeira vez que o material é
   *  tocado, para o retorno ser exato em vez de aproximado. */
  const base = new WeakMap();
  /** id da camada → alvo em [RECUO, FOCO]; 1 = repouso. */
  const alvo = new Map();
  /** id → valor corrente, para a animação partir de onde está e não pular. */
  const atual = new Map();
  let quadro = null;

  function materiaisDe(id) {
    const obj = layers.state?.get(id)?.object;
    if (!obj) return [];
    const saida = [];
    obj.traverse((n) => {
      if (!n.material) return;
      for (const m of Array.isArray(n.material) ? n.material : [n.material]) {
        if (!base.has(m)) base.set(m, m.opacity);
        saida.push(m);
      }
    });
    return saida;
  }

  function aplicar(id, fator) {
    for (const m of materiaisDe(id)) {
      // Limitar em 1: opacidade acima disso não existe, e deixar passar
      // faria o retorno da animação "esperar" antes de aparecer.
      m.opacity = Math.min(1, base.get(m) * fator);
    }
  }

  function animar() {
    const ms = duracaoMs('--dur-base');
    const passo = ms > 0 ? 1 / (ms / 16.7) : 1;
    let vivo = false;
    for (const [id, destino] of alvo) {
      const de = atual.get(id) ?? 1;
      const delta = destino - de;
      if (Math.abs(delta) < 0.004) {
        atual.set(id, destino);
        aplicar(id, destino);
        if (destino === 1) alvo.delete(id);   // voltou ao repouso: para de gastar
        continue;
      }
      const t = suavizar(Math.min(1, passo));
      const v = de + delta * t;
      atual.set(id, v);
      aplicar(id, v);
      vivo = true;
    }
    quadro = vivo ? requestAnimationFrame(animar) : null;
  }

  function pedir(id, fator) {
    alvo.set(id, fator);
    if (!atual.has(id)) atual.set(id, 1);
    if (quadro == null) quadro = requestAnimationFrame(animar);
  }

  function focar(idFoco) {
    for (const id of layers.registry.keys()) {
      if (!layers.isEnabled?.(id) && !layers.state?.get(id)?.object) continue;
      pedir(id, idFoco == null ? 1 : (id === idFoco ? FOCO : RECUO));
    }
  }

  // Delegação: as linhas são criadas por layerspanel.js e podem ser recriadas.
  // Ouvir no painel evita ter de religar ouvinte a cada redesenho.
  painel.addEventListener('pointerover', (ev) => {
    const linha = ev.target.closest?.('.layer-row');
    if (!linha || !painel.contains(linha)) return;
    focar(linha.dataset.layerId);
    linha.classList.add('em-realce');
  });
  painel.addEventListener('pointerout', (ev) => {
    const linha = ev.target.closest?.('.layer-row');
    if (!linha) return;
    // pointerout dispara ao andar entre filhos da própria linha; só solta
    // quando o ponteiro realmente saiu dela.
    if (linha.contains(ev.relatedTarget)) return;
    focar(null);
    linha.classList.remove('em-realce');
  });
  // Sair do painel inteiro (ou perder o foco da janela) tem de soltar também,
  // senão a camada fica acesa para sempre.
  painel.addEventListener('pointerleave', () => {
    focar(null);
    for (const l of painel.querySelectorAll('.em-realce')) l.classList.remove('em-realce');
  });

  return {
    /** Solta tudo. Usado ao trocar de aba na folha do celular, onde o painel
     *  some sem o ponteiro sair dele. */
    soltar: () => focar(null),
    destruir() {
      if (quadro != null) cancelAnimationFrame(quadro);
      focar(null);
    },
  };
}
