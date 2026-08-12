/**
 * listapanel.js — a mesma pesquisa, em lista.
 *
 * O globo mostra onde as áreas estão; a lista mostra quais são. São perguntas
 * diferentes: "o que tem perto de Pompéu" o mapa responde, "quais são as dez
 * maiores" só a lista responde. E achar um polígono de 500 ha girando um globo
 * é trabalhoso — na lista ele é uma linha.
 *
 * Cada linha leva à mesma área no mapa: clicar foca a câmera e abre a ficha,
 * exatamente como clicar no polígono.
 *
 * Ordena por área, da maior para a menor. Mostra só camadas marcadas
 * `listavel` no LAYER_REGISTRY e que estejam ligadas — o que está na lista é o
 * que está no mapa, sempre.
 *
 * Daqui também sai a EXPORTAÇÃO das áreas (ui/exportar.js), e é aqui de
 * propósito: o conjunto exportado é o que está na lista, e botão num painel que
 * mostra outro conjunto criaria uma terceira versão da verdade.
 *
 * ## Por que a lista é virtualizada (conserto de 12/08)
 *
 * `lotes-vagos-bh` sozinha tem 8.525 áreas (contagem exata do .geojson
 * publicado), e `atualizar()` roda a cada toggle de QUALQUER camada listável
 * em `js/main.js` — ligar uma camada pequena com a grande já ligada refazia a
 * lista inteira. Números reproduzíveis com `scripts/medir-lista.mjs` (rode
 * você mesmo — não dá para cronometrar dentro de um navegador de verdade
 * nesta ferramenta, mesma limitação que já levava `realce.test.mjs` a montar
 * um LayerManager falso em vez de abrir um): as 8.525 linhas do render antigo
 * (`entradas.map(linhaHtml).join('')` de uma vez) viram 51.150 nós
 * (`<button>` + cinco `<span>` cada), e a CONSTRUÇÃO DA STRING sozinha — antes
 * de qualquer parse de HTML, layout ou paint do navegador de verdade — já
 * leva ~0,9 s. A mesma reconstrução para a janela de abertura (30 linhas,
 * viewport de 640 px) leva ~4–9 ms: 284× menos nós, na casa de 100–200× menos
 * tempo de JS síncrono — e o navegador ainda soma por cima o parse/layout/
 * paint de verdade, que só piora a proporção a favor da janela (confirmado à
 * mão num navegador real: abrir a lista com `lotes-vagos-bh` ligada, hoje,
 * roda o clique síncrono de `abrir()` em ~11 ms, coerente com a medição fria
 * do script). `entradas`
 * continua com o array INTEIRO, ordenado, sempre (é dele que saem a
 * exportação e a contagem do título) — só o que vira DOM muda: agora é uma
 * JANELA deslizante de ~poucas dezenas de linhas em torno do que está visível
 * em `.lista-itens`. Não há teto de itens: é o MESMO conjunto completo, só
 * que a maior parte dele nunca vira `<button>` porque nunca precisou ficar
 * visível.
 *
 * ## Por que a janela é um GRUPO posicionado por estimativa, não uma linha
 * por linha com `top` calculado
 *
 * A tentação óbvia é dar `position: absolute; top: i × altura` a cada linha,
 * com `altura` medida uma vez. Não dá: `.lista-item-sub` (o resumo — formato,
 * largura, % de mata, titularidade) tem comprimento VARIÁVEL, e medido contra
 * as 11.758 áreas listáveis reais (todas as camadas `listavel`, script à
 * parte, não estimativa): 93,1% quebra em 1 linha, 1,4% em 2, 5,5% em 3 — a
 * família `vazio-cadastral*` é quem carrega quase toda a variação, porque
 * junta cinco campos (formato + largura + % mata + % uso + titularidade) e o
 * texto do formato ("corredor fino e comprido, não uma mancha") já é
 * comprido sozinho. Uma altura ÚNICA para todas as linhas ou trunca esse
 * resumo com reticências (perde justamente o campo — titularidade — que o
 * comentário de `resumoDaArea` faz questão de nunca omitir), ou reserva a
 * altura do PIOR caso pra toda linha, e 93% da lista passa a mostrar um vão
 * em branco embaixo de uma frase só.
 *
 * A saída: `.lista-itens-janela` é UM wrapper, posicionado por uma ESTIMATIVA
 * de passo médio (`PASSO_ESTIMADO`, a média ponderada da medição acima:
 * ~48 px) só para decidir ONDE na rolagem ele fica e QUANTO a barra de
 * rolagem mede (`.lista-itens-espaco`). As linhas DENTRO dele ficam em fluxo
 * normal (flex-column, `gap`), cada uma com a altura real do seu próprio
 * conteúdo — sem truncar nada e sem vão nenhum. O preço é a barra de rolagem
 * ser uma aproximação (a posição de "50% rolado" pode não bater exatamente
 * com o meio verdadeiro do array, se muita área de `vazio-cadastral` se
 * amontoar de um lado) — troca aceita: é o mesmo tipo de aproximação que
 * qualquer lista virtualizada de altura variável faz, e o BUFFER_LINHAS de
 * cada lado (linhas a mais renderizadas além do que a estimativa acha
 * necessário) absorve a folga normal de uma tela de rolagem.
 *
 * Ver `calcularJanela()`, pura e testada à parte de DOM em
 * `listapanel.test.mjs`.
 *
 * Duas coisas que o conserto não podia perder, e não perdeu:
 *   - delegação de evento: um clique só, no container, em vez de um
 *     `addEventListener` por linha (era o outro custo do `render()` antigo);
 *   - a ordenação por área, da maior para a menor — é o motivo da lista
 *     existir, e continua rodando sobre o array inteiro em `atualizar()`.
 *
 * Contrapartida assumida: com janela, `Tab` não alcança mais uma linha fora
 * da janela renderizada (ela simplesmente não existe no DOM ainda). Antes,
 * tabular por 8.525 botões também não era navegação viável — a lista nunca
 * teve um padrão de teclado tipo ARIA listbox com rolagem programada. Isto
 * não piora um caminho que funcionava; documentado aqui para quem for
 * resolver o padrão de teclado não achar que é acidente.
 *
 * Classes CSS esperadas (definidas em ../css/hud.css — NÃO estilizar aqui):
 *   #lista, .lista-header, .lista-titulo, .lista-fechar, .lista-vazia,
 *   .lista-itens, .lista-itens-espaco, .lista-itens-janela, .lista-item,
 *   .lista-item-topo, .lista-item-nome, .lista-item-area, .lista-item-sub,
 *   .lista-dot, .lista-fake, .lista-exportar, .lista-menu, .lista-menu-item,
 *   .lista-aviso
 *
 * API pública:
 *   const lista = createListaPanel(el, { onEscolher });
 *   lista.atualizar(entradas);   // [{layerId, cfg, idx, feature}]
 *   lista.abrir() / .fechar() / .alternar()
 */

import { descreverAreaCurta, formatarValor } from './rotulos.js';
import { FORMATOS, exportar, separarExportaveis } from './exportar.js';

function escapar(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Forma curta da titularidade, para caber numa linha de lista.
 *
 * A ficha traz a frase inteira (rotulos.js); aqui cabe um selo. Mas o caso
 * comum aparece igual, e não como ausência: 99,7% das áreas não têm registro
 * conhecido, e omitir isso faria a lista parecer que só as raras têm dado. É o
 * contrário — a raridade é o registro.
 *
 * "Ninguém consta como dono" e não "sem dono": o que falta é o registro aberto,
 * não o proprietário.
 */
const TITULARIDADE_CURTA = {
  sem_registro_conhecido: 'ninguém consta como dono',
  publica_certificada: '★ consta terra pública',
  assentamento: 'encosta em assentamento',
  territorio_tradicional: 'encosta em território quilombola',
};

/** Uma linha em texto curto: o que a pessoa precisa para decidir se vale olhar. */
function resumoDaArea(props) {
  const partes = [];
  if (props.compacidade != null) {
    // Reaproveita a mesma frase da ficha, sem o número entre parênteses
    partes.push(String(formatarValor('compacidade', props.compacidade)).split(' (')[0]);
  }
  if (props.largura_media_m != null) partes.push(`${Math.round(props.largura_media_m)} m de largura`);
  if (props.veg_nativa_pct != null) partes.push(`${Number(props.veg_nativa_pct).toLocaleString('pt-BR')}% de mata`);
  if (props.uso_antropico_pct != null) partes.push(`${Math.round(props.uso_antropico_pct)}% em uso`);
  if (props.titularidade) partes.push(TITULARIDADE_CURTA[props.titularidade] ?? props.titularidade);
  return partes.join(' · ');
}

/**
 * Passo médio estimado (px) — usado só pra decidir ONDE a janela fica na
 * rolagem e QUANTO a barra de rolagem mede, nunca pra desenhar uma linha.
 * Média ponderada da medição real contra as 11.758 áreas listáveis de hoje
 * (todas as camadas `listavel`, todos os campos que `resumoDaArea` produz):
 * 93,1% das linhas com 1 linha de resumo (~46 px de altura total), 1,4% com
 * 2 (~60 px), 5,5% com 3 (~74 px) → 0,931×46 + 0,014×60 + 0,055×74 ≈ 48.
 * Errar aqui só desloca ONDE a janela cai (corrigido a cada quadro de
 * rolagem, ver `renderJanela`) — nunca corta conteúdo, porque as linhas
 * dentro da janela ficam em fluxo normal, cada uma com sua altura real.
 */
const PASSO_ESTIMADO = 48;
/** Linhas extras renderizadas acima e abaixo do que a estimativa acha
 *  necessário — absorve tanto a folga normal de rolagem rápida quanto o
 *  desvio entre PASSO_ESTIMADO e a altura real de um trecho concentrado de
 *  linhas de 2–3 linhas de resumo (a família `vazio-cadastral*`). */
const BUFFER_LINHAS = 8;

/**
 * Calcula QUAIS índices de `entradas` devem virar DOM, dado o quanto já se
 * rolou. Pura — sem tocar em `document` — para poder testar a matemática da
 * virtualização sem montar navegador nenhum (ver listapanel.test.mjs).
 *
 * @param {number} total          entradas.length
 * @param {number} scrollTop      itens.scrollTop
 * @param {number} alturaViewport itens.clientHeight
 * @param {number} passo          altura de uma linha + o espaço até a próxima
 * @param {number} buffer         linhas extras de cada lado (BUFFER_LINHAS)
 * @returns {{inicio: number, fim: number}} intervalo [inicio, fim) a desenhar
 */
export function calcularJanela(total, scrollTop, alturaViewport, passo, buffer = BUFFER_LINHAS) {
  if (total <= 0 || !(passo > 0)) return { inicio: 0, fim: 0 };
  const inicio = Math.max(0, Math.floor(scrollTop / passo) - buffer);
  const linhasNaTela = Math.ceil(Math.max(0, alturaViewport) / passo) + buffer * 2;
  const fim = Math.min(total, inicio + linhasNaTela);
  return { inicio, fim };
}

export function createListaPanel(el, { onEscolher } = {}) {
  el.innerHTML = `
    <div class="lista-header">
      <span class="lista-titulo">Áreas encontradas</span>
      <div class="lista-exportar">
        <button class="lista-exportar-botao" type="button"
                aria-haspopup="menu" aria-expanded="false"
                title="Baixar estas áreas" aria-label="Baixar estas áreas">Baixar</button>
        <div class="lista-menu" role="menu" hidden>
          ${Object.entries(FORMATOS).map(([id, f]) => `
            <button class="lista-menu-item" type="button" role="menuitem"
                    data-formato="${id}">${escapar(f.rotulo)}</button>`).join('')}
        </div>
      </div>
      <button class="lista-fechar" type="button" title="Fechar a lista" aria-label="Fechar a lista">×</button>
    </div>
    <p class="lista-aviso" hidden></p>
    <div class="lista-itens">
      <p class="lista-vazia" hidden>Nenhuma área para listar. Ligue uma camada de
        <em>terra sem cadastro</em> no painel da direita.</p>
      <div class="lista-itens-espaco">
        <div class="lista-itens-janela"></div>
      </div>
    </div>`;

  const itens = el.querySelector('.lista-itens');
  const espaco = el.querySelector('.lista-itens-espaco');
  const janela = el.querySelector('.lista-itens-janela');
  const vazia = el.querySelector('.lista-vazia');
  const titulo = el.querySelector('.lista-titulo');
  const aviso = el.querySelector('.lista-aviso');
  const caixaExportar = el.querySelector('.lista-exportar');
  const botaoExportar = el.querySelector('.lista-exportar-botao');
  const menu = el.querySelector('.lista-menu');
  el.querySelector('.lista-fechar').addEventListener('click', () => fechar());

  let entradas = [];

  function fechar() { el.classList.remove('visible'); fecharMenu(); }
  function abrir() {
    el.classList.add('visible');
    // O painel pode ter recebido `atualizar()` enquanto escondido — hidden
    // (`display:none`) faz `clientHeight` medir 0, e a janela calculada
    // nesse meio tempo pode não bater com o espaço real assim que abre.
    renderJanela();
  }

  // --- exportação ---------------------------------------------------------

  function fecharMenu() {
    menu.hidden = true;
    botaoExportar.setAttribute('aria-expanded', 'false');
  }

  botaoExportar.addEventListener('click', (ev) => {
    ev.stopPropagation();
    menu.hidden = !menu.hidden;
    botaoExportar.setAttribute('aria-expanded', String(!menu.hidden));
  });
  // Clique fora e Esc fecham. Sem isto o menu fica aberto por cima da lista, que
  // é justamente o que a pessoa quer ver depois de decidir não exportar.
  document.addEventListener('click', (ev) => {
    if (!caixaExportar.contains(ev.target)) fecharMenu();
  });
  el.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') fecharMenu(); });

  for (const botao of menu.querySelectorAll('[data-formato]')) {
    botao.addEventListener('click', () => {
      fecharMenu();
      // Exporta `entradas` — o array INTEIRO, nunca a janela renderizada.
      // Virtualização muda o que vira DOM, não o que existe: quem baixa leva
      // o conjunto completo, do mesmo jeito que antes do conserto de 12/08.
      const r = exportar(botao.dataset.formato, entradas);
      if (!r.ok) return mostrarAviso(`Nada a baixar: ${r.motivo}.`);
      // O que ficou de fora é dito na tela, e não só dentro do arquivo: quem
      // baixou precisa saber que a contagem da tela e a do arquivo diferem —
      // esse silêncio é o mesmo defeito que a linha sintética explorou.
      mostrarAviso(
        `${r.nome} · ${r.areas.toLocaleString('pt-BR')} área(s)`
        + (r.ficticias
          ? ` · ${r.ficticias} de demonstração ficaram de fora (dado inventado)`
          : ''),
      );
    });
  }

  function mostrarAviso(texto) {
    aviso.textContent = texto;
    aviso.hidden = false;
    clearTimeout(mostrarAviso._t);
    mostrarAviso._t = setTimeout(() => { aviso.hidden = true; }, 8000);
  }

  function atualizarBotaoExportar() {
    const { exportaveis } = separarExportaveis(entradas);
    botaoExportar.disabled = exportaveis.length === 0;
  }

  /** Uma linha, como HTML. `i` é o índice em `entradas` (não o da fatia
   *  renderizada), porque é ele que o clique delegado usa para achar a
   *  entrada de novo — a linha não sabe (nem precisa saber) sua posição em
   *  pixels: quem posiciona é `.lista-itens-janela`, o grupo inteiro. */
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

  /**
   * Desenha só a fatia de `entradas` que cabe (mais o buffer) no espaço
   * visível de `.lista-itens` — nunca a lista inteira. Chamada em toda
   * rolagem (via rAF, mais abaixo) e sempre que `entradas` muda.
   *
   * `.lista-itens-janela` é posicionada em `inicio × PASSO_ESTIMADO` (uma
   * ESTIMATIVA — ver o comentário de `PASSO_ESTIMADO` no topo do arquivo); as
   * linhas dentro dela ficam em fluxo normal, cada uma com a altura real do
   * seu próprio texto. Não há `top` por linha aqui: só o grupo se move.
   */
  function renderJanela() {
    if (!entradas.length) return; // render() já deixou tudo zerado
    espaco.style.height = `${entradas.length * PASSO_ESTIMADO}px`;

    const alturaViewport = itens.clientHeight;
    const { inicio, fim } = calcularJanela(entradas.length, itens.scrollTop, alturaViewport, PASSO_ESTIMADO);

    janela.style.top = `${inicio * PASSO_ESTIMADO}px`;
    janela.innerHTML = entradas
      .slice(inicio, fim)
      .map((entrada, k) => linhaHtml(entrada, inicio + k))
      .join('');
  }

  // Delegação: um listener só no container, não um por linha — era o outro
  // custo do `render()` antigo (8.525 `addEventListener`, um por botão).
  // `closest` acha o `.lista-item` mesmo quando o clique cai num filho (nome,
  // dot, sub-linha).
  itens.addEventListener('click', (ev) => {
    const botao = ev.target.closest('.lista-item');
    if (!botao) return;
    const entrada = entradas[Number(botao.dataset.i)];
    if (entrada) onEscolher?.(entrada);
  });

  // Rolagem troca a janela renderizada. Um `requestAnimationFrame` de cada
  // vez: em rolagem rápida (roda do mouse, arrasto no celular) o navegador
  // dispara dezenas de eventos de scroll por segundo, e recalcular +
  // reescrever a fatia a cada um é trabalho jogado fora — o quadro anterior
  // nem chegou a pintar.
  let quadroPendente = null;
  itens.addEventListener('scroll', () => {
    if (quadroPendente != null) return;
    quadroPendente = requestAnimationFrame(() => {
      quadroPendente = null;
      renderJanela();
    });
  });
  // Girar o celular ou redimensionar a janela muda `itens.clientHeight`, e a
  // janela antiga pode sobrar curta demais (buraco embaixo) ou grande demais
  // (nós de sobra escondidos atrás da borda). Só recalcula se há o que
  // desenhar — evitar leitura de layout à toa quando a lista está vazia.
  window.addEventListener('resize', () => { if (entradas.length) renderJanela(); });

  function render() {
    titulo.textContent = entradas.length
      ? `${entradas.length.toLocaleString('pt-BR')} áreas encontradas`
      : 'Áreas encontradas';
    atualizarBotaoExportar();

    vazia.hidden = entradas.length > 0;
    if (!entradas.length) {
      janela.innerHTML = '';
      espaco.style.height = '0px';
      return;
    }
    renderJanela();
  }

  render();

  return {
    abrir,
    fechar,
    alternar() { (el.classList.contains('visible') ? fechar : abrir)(); },
    estaAberta: () => el.classList.contains('visible'),
    /**
     * @param {Array<{layerId: string, cfg: object, idx: number, feature: object}>} novas
     */
    atualizar(novas) {
      entradas = [...novas].sort(
        (a, b) => (b.feature.properties?.area_ha ?? 0) - (a.feature.properties?.area_ha ?? 0),
      );
      render();
    },
  };
}
