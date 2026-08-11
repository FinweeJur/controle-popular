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
 * Classes CSS esperadas (definidas em ../css/hud.css — NÃO estilizar aqui):
 *   #lista, .lista-header, .lista-titulo, .lista-fechar, .lista-vazia,
 *   .lista-itens, .lista-item, .lista-item-topo, .lista-item-nome,
 *   .lista-item-area, .lista-item-sub, .lista-dot, .lista-fake,
 *   .lista-exportar, .lista-menu, .lista-menu-item, .lista-aviso
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
    <div class="lista-itens"></div>`;

  const itens = el.querySelector('.lista-itens');
  const titulo = el.querySelector('.lista-titulo');
  const aviso = el.querySelector('.lista-aviso');
  const caixaExportar = el.querySelector('.lista-exportar');
  const botaoExportar = el.querySelector('.lista-exportar-botao');
  const menu = el.querySelector('.lista-menu');
  el.querySelector('.lista-fechar').addEventListener('click', () => fechar());

  let entradas = [];

  function fechar() { el.classList.remove('visible'); fecharMenu(); }
  function abrir() { el.classList.add('visible'); }

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

  function render() {
    titulo.textContent = entradas.length
      ? `${entradas.length.toLocaleString('pt-BR')} áreas encontradas`
      : 'Áreas encontradas';
    atualizarBotaoExportar();

    if (!entradas.length) {
      itens.innerHTML = `<p class="lista-vazia">Nenhuma área para listar. Ligue uma camada de
        <em>terra sem cadastro</em> no painel da direita.</p>`;
      return;
    }

    itens.innerHTML = entradas.map(({ layerId, cfg, idx, feature }, i) => {
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
    }).join('');

    for (const botao of itens.querySelectorAll('.lista-item')) {
      botao.addEventListener('click', () => {
        const entrada = entradas[Number(botao.dataset.i)];
        if (entrada) onEscolher?.(entrada);
      });
    }
  }

  render();

  return {
    abrir,
    fechar,
    alternar() { el.classList.toggle('visible'); },
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
