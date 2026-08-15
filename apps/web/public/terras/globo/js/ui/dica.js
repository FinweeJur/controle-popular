/**
 * dica.js — a explicação curta que aparece ao pousar o mouse numa área.
 *
 * Pousou o ponteiro sobre uma mancha e ficou parado por 2 segundos: aparece
 * uma frase dizendo o que aquilo é. Saiu de cima: some. Nenhum clique.
 *
 * ## Por que 2 segundos, e não imediato
 *
 * O mapa é feito para ser arrastado e varrido. Dica instantânea acenderia e
 * apagaria a cada pixel percorrido, e o efeito seria de defeito, não de ajuda.
 * Dois segundos é a diferença entre *passar por cima* e *querer saber* — e é o
 * gesto que a pessoa já faz sem pensar quando não entende o que está vendo.
 *
 * O relógio zera a cada movimento do ponteiro, então arrastar o globo nunca
 * dispara a dica: ela só nasce da mão parada.
 *
 * ## Por que uma frase, e não a ficha
 *
 * O clique já abre a ficha completa — tamanho, município, cobertura, botões de
 * foco e exportação. Repetir aquilo no hover seria a ficha aparecendo sozinha
 * na cara de quem só passou o mouse, e tiraria a razão de existir do clique.
 * Aqui cabe o que responde "o que é isto?" numa linha: o nome da camada e o
 * fato mais forte da feição.
 *
 * ## Só no computador
 *
 * `hover: hover` e `pointer: fine`. Em tela de toque não existe pousar sem
 * clicar — o navegador dispara o hover no primeiro toque, e a dica brigaria
 * com o clique que abre a ficha. No celular, quem responde "o que é isto?" é a
 * própria ficha, que é o gesto disponível lá.
 *
 * ## Verificado
 *
 * 15/08/2026, no dev server, com evento de ponteiro real disparado sobre uma
 * feição que o clique reconhece (Unaí, na camada de divisas): escondida a 1 s,
 * visível a 2 s com "Divisas dos municípios — Unaí — clique para a ficha", e
 * some ao sair. O primeiro teste tinha falhado por cache de módulo do
 * navegador, não por defeito — o arquivo servido era o anterior ao `export`
 * que a dica importa.
 *
 * ## Contrato
 *   criarDica(el, { layers, camera, domElement, textoDe })
 *     -> { destruir() }
 */

const ESPERA_MS = 2000;

// Distância que o ponteiro pode variar sem reiniciar a contagem. Mão parada
// não é mão imóvel: sem esta folga, o tremor natural do pulso zeraria o
// relógio para sempre e a dica nunca apareceria.
const TOLERANCIA_PX = 4;

export function criarDica(el, { layers, camera, domElement, textoDe } = {}) {
  const fino = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!fino.matches) return { destruir() {} };

  let relogio = null;
  let ultimo = { x: 0, y: 0 };
  let mostrando = null; // `${layerId}#${idx}` do que está na tela

  el.hidden = true;
  el.setAttribute('role', 'tooltip');

  function esconder() {
    clearTimeout(relogio);
    relogio = null;
    if (!mostrando) return;
    mostrando = null;
    el.hidden = true;
    el.classList.remove('visivel');
  }

  function posicionar(x, y) {
    // Nasce à direita e abaixo do ponteiro; vira para o outro lado quando não
    // couber. Sem isto, apontar uma área na borda direita da tela abriria a
    // dica fora dela — que é onde ficam as manchas dos Vales.
    const r = el.getBoundingClientRect();
    const margem = 14;
    const direita = x + margem + r.width < window.innerWidth;
    const abaixo = y + margem + r.height < window.innerHeight;
    el.style.left = `${direita ? x + margem : x - margem - r.width}px`;
    el.style.top = `${abaixo ? y + margem : y - margem - r.height}px`;
  }

  function tentarMostrar(event) {
    const achado = layers ? procurarComGuarda(event) : null;
    if (!achado) return esconder();

    const chave = `${achado.layerId}#${achado.idx}`;
    if (chave === mostrando) return;

    const texto = textoDe?.(achado);
    if (!texto) return esconder();

    el.innerHTML = '';
    const titulo = document.createElement('strong');
    titulo.className = 'dica-titulo';
    titulo.textContent = texto.titulo;
    const corpo = document.createElement('span');
    corpo.className = 'dica-corpo';
    corpo.textContent = texto.corpo;
    el.append(titulo, corpo);

    if (texto.cor) el.style.setProperty('--cor-camada', texto.cor);
    mostrando = chave;
    el.hidden = false;
    // Posiciona DEPOIS de sair de `hidden`: elemento escondido mede 0×0, e a
    // conta de "cabe à direita?" daria sempre que sim.
    posicionar(event.clientX, event.clientY);
    el.classList.add('visivel');
  }

  /** A busca pode custar caro em camada grande; nunca roda no movimento. */
  function procurarComGuarda(event) {
    try {
      return procurar(event);
    } catch (err) {
      console.warn('[dica] não consegui identificar a área:', err);
      return null;
    }
  }

  let procurar = () => null;

  domElement.addEventListener('pointermove', (event) => {
    // Botão apertado = arrastando o globo. Dica no meio do arrasto é ruído.
    if (event.buttons !== 0) return esconder();

    const mexeu =
      Math.abs(event.clientX - ultimo.x) > TOLERANCIA_PX ||
      Math.abs(event.clientY - ultimo.y) > TOLERANCIA_PX;
    ultimo = { x: event.clientX, y: event.clientY };

    if (!mexeu) return;

    // Mexeu de verdade: a dica que estava na tela deixou de valer, e o relógio
    // recomeça. É isto que faz varrer o mapa não acender nada.
    esconder();
    const copia = { clientX: event.clientX, clientY: event.clientY };
    relogio = setTimeout(() => tentarMostrar(copia), ESPERA_MS);
  });

  domElement.addEventListener('pointerleave', esconder);
  domElement.addEventListener('pointerdown', esconder);
  window.addEventListener('blur', esconder);

  return {
    /** Injeta a busca — deixa este módulo independente do inspetor. */
    usarBusca(fn) { procurar = fn; },
    destruir: esconder,
  };
}
