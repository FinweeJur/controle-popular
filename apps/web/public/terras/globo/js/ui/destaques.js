/**
 * destaques.js — as camadas principais, numa barra acima dos botões de cidade.
 *
 * ## Por que existe
 *
 * O painel da direita tem 34 linhas em 7 seções, e a seção de território
 * sozinha tem 21. Quem abre o mapa pela primeira vez precisa rolar uma lista
 * para descobrir que existe "Mancha de inundação" — e a mancha é justamente
 * uma das coisas que a pessoa veio ver. A barra tira as decisões mais comuns
 * da lista e as põe onde ela já está olhando: em cima dos botões de cidade,
 * porque "o quê" e "onde" são a mesma escolha feita em dois passos.
 *
 * É atalho, não substituto: cada botão liga exatamente a mesma camada que a
 * chave do painel liga, e os dois se espelham sempre. Dois controles para o
 * mesmo estado só ajudam se nunca divergirem — se divergirem, viram dois bugs.
 *
 * ## O que NÃO entra aqui
 *
 * A barra não repete o que já está a dois centímetros dela no painel: os chips
 * de região (Todas / Paraopeba / Jequitinhonha / Mucuri) e o "Ligar tudo".
 * Aqueles são operações sobre o conjunto; esta barra é sobre itens.
 *
 * ## Contrato
 *   criarDestaques(el, DESTAQUES, { estaLigado, aoAlternar })
 *     -> { sincronizar() }
 */

export function criarDestaques(el, destaques, { estaLigado, aoAlternar } = {}) {
  el.innerHTML = '';

  const rotulo = document.createElement('span');
  rotulo.className = 'destaques-rotulo';
  rotulo.textContent = 'Ver';
  el.appendChild(rotulo);

  const botoes = new Map();

  for (const destaque of destaques) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'destaque-btn';
    b.dataset.destaqueId = destaque.id;
    b.style.setProperty('--cor-camada', destaque.cor);
    b.setAttribute('role', 'switch');
    b.setAttribute('aria-checked', 'false');
    if (destaque.hint) b.title = destaque.hint;

    const ponto = document.createElement('span');
    ponto.className = 'destaque-dot';

    const texto = document.createElement('span');
    texto.textContent = destaque.label;

    b.append(ponto, texto);

    b.addEventListener('click', async () => {
      const ligar = b.getAttribute('aria-checked') !== 'true';
      // Marca ANTES de esperar a camada carregar. Camada grande demora, e um
      // clique sem resposta imediata é lido como clique que não funcionou — a
      // pessoa clica de novo e desliga o que acabou de pedir. `sincronizar()`
      // corrige depois, se a camada não tiver entrado de verdade.
      b.setAttribute('aria-checked', String(ligar));
      b.classList.toggle('carregando', ligar);
      await aoAlternar?.(destaque, ligar);
      b.classList.remove('carregando');
      sincronizar();
    });

    botoes.set(destaque.id, { botao: b, destaque });
    el.appendChild(b);
  }

  /**
   * Espelha no botão o que está de fato na cena.
   *
   * Um destaque com mais de uma camada acende quando ALGUMA delas está ligada,
   * mas o clique só desliga quando TODAS estão (ver `main.js`): enquanto
   * faltar alguma, clicar completa o grupo. É o comportamento de "selecionar
   * tudo", e existe porque a leitura contrária já deu problema — o botão
   * aparecia aceso por causa de uma camada e o primeiro clique desligava ela,
   * em vez de trazer as outras.
   */
  function sincronizar() {
    for (const { botao, destaque } of botoes.values()) {
      botao.setAttribute('aria-checked', String(destaque.camadas.some((id) => estaLigado?.(id))));
    }
  }

  sincronizar();
  return { sincronizar };
}
