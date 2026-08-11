/**
 * folha.js — no celular, uma superfície por vez.
 *
 * O problema é aritmético, não de empilhamento: o painel de camadas tem 200 px,
 * a ficha tem 320 px, e a tela tem 375. Somam 520. Elevar a ficha por `z-index`
 * só escolhe quem perde — foi o remendo de 29/07/2026, e ele resolvia a leitura
 * sem resolver a disputa.
 *
 * Abaixo de 768 px as duas deixam de ser painéis flutuantes e passam a ser uma
 * FOLHA INFERIOR ÚNICA com duas abas, `Camadas` e `Área`, em `--z-sheet` — que é
 * deliberadamente igual a `--z-hud`. Duas superfícies não podem se sobrepor
 * quando existe apenas uma.
 *
 * ## O DOM não muda, e isso é decisão
 *
 * `#layers-panel` e `#inspector` continuam exatamente onde estavam, com os
 * mesmos ids e as mesmas classes. Quem alterna é `data-aba` no `<body>`, lido
 * pelo CSS. Reestruturar a árvore quebraria seletor de teste, deep-link e o
 * `mostrarPorId` do inspetor sem necessidade nenhuma — a mudança é de
 * apresentação, então mora na apresentação.
 *
 * ## Por que MutationObserver e não um evento
 *
 * O inspetor abre por três caminhos: clique no globo, clique na lista e
 * deep-link `#area=`. Ele sinaliza os três do mesmo jeito — a classe `.visible`
 * no painel. Observar a classe pega os três de graça; um evento novo exigiria
 * lembrar de emiti-lo nos três, e o quarto caminho que alguém adicionasse
 * chegaria sem aviso.
 */

const LARGURA_FOLHA = 767;   // igual ao @media (max-width: 767px) de hud.css

/** Verdadeiro quando as duas superfícies dividem a mesma tela. */
export function ehFolha() {
  return window.matchMedia(`(max-width: ${LARGURA_FOLHA}px)`).matches;
}

/**
 * @param {HTMLElement} painelCamadas #layers-panel
 * @param {HTMLElement} ficha         #inspector
 * @returns {{destruir: () => void, abaAtiva: () => string}}
 */
export function criarFolha(painelCamadas, ficha) {
  const barra = document.createElement('nav');
  barra.id = 'sheet-tabs';
  barra.className = 'hud-panel';
  barra.setAttribute('aria-label', 'Alternar entre camadas e a área selecionada');

  const abas = [
    { id: 'camadas', rotulo: 'Camadas' },
    { id: 'area', rotulo: 'Área' },
  ].map(({ id, rotulo }) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sheet-tab';
    b.dataset.aba = id;
    b.textContent = rotulo;
    // Cada aba controla o painel correspondente, e o leitor de tela precisa
    // saber disso — são duas regiões, não dois links.
    b.setAttribute('aria-controls', id === 'camadas' ? 'layers-panel' : 'inspector');
    b.addEventListener('click', () => trocar(id));
    barra.appendChild(b);
    return b;
  });
  document.body.appendChild(barra);

  function trocar(id) {
    // A aba "Área" só existe quando há área: sem ficha aberta, clicar nela
    // levaria a uma folha vazia. Ela nasce desabilitada.
    if (id === 'area' && !temFicha()) return;
    document.body.dataset.aba = id;
    for (const b of abas) {
      const ativa = b.dataset.aba === id;
      b.classList.toggle('ativa', ativa);
      b.setAttribute('aria-selected', String(ativa));
    }
  }

  const temFicha = () => ficha.classList.contains('visible');

  function sincronizar() {
    const abaArea = abas.find((b) => b.dataset.aba === 'area');
    abaArea.disabled = !temFicha();
    if (temFicha()) {
      // Abrir uma área é sempre um pedido para VER aquela área, venha do clique,
      // da lista ou do endereço. Então a folha vai para "Área" sozinha.
      trocar('area');
    } else if (document.body.dataset.aba === 'area') {
      // Fechou a ficha no × — a folha volta para o que sempre existe.
      trocar('camadas');
    }
  }

  const observador = new MutationObserver(sincronizar);
  observador.observe(ficha, { attributes: true, attributeFilter: ['class'] });

  trocar('camadas');
  sincronizar();

  return {
    destruir() {
      observador.disconnect();
      barra.remove();
      delete document.body.dataset.aba;
    },
    abaAtiva: () => document.body.dataset.aba,
  };
}
