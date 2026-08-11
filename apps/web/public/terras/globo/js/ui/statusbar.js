/**
 * statusbar.js — barra de status superior do HUD do globo 3D.
 *
 * Monta o <header id="statusbar">: nome do app, uma linha dizendo o que ele é,
 * quantos itens estão desenhados, a data dos dados, o relógio UTC (que serve à
 * camada de satélites, calculada para "agora") e o botão de ajuda.
 *
 * Duas decisões de linguagem, ambas para não enganar quem abre pela primeira
 * vez:
 *   1. Saiu o badge "LIVE". Nada aqui é ao vivo — o CAR e as camadas do INCRA
 *      são uma foto da data do download. "LIVE" piscando em verde ao lado de um
 *      relógio dizia o contrário.
 *   2. Saiu "feições". É palavra de quem trabalha com geoprocessamento; no
 *      lugar entra "itens no mapa", que qualquer pessoa lê.
 *
 * Classes CSS esperadas (definidas em ../css/hud.css — NÃO estilizar aqui):
 *   .app-title / .title-accent  — nome do app (caixa-alta, acento ciano)
 *   .app-subtitle               — linha de resumo do que o app é
 *   .status-spacer              — empurra o grupo da direita
 *   .feature-count              — contador de itens desenhados (mono)
 *   .data-chip                  — data dos dados ("dados de 28/07/2026")
 *   .hud-clock                  — relógio UTC em mono
 *   .help-btn                   — botão "?" que reabre a explicação inicial
 *
 * API pública:
 *   const status = createStatusBar(el, { onHelp });
 *   status.setFeatureCount(n);  // atualiza o contador de itens
 *   status.stop();              // para o relógio (limpa o intervalo)
 */

import { APP_NOME, APP_RESUMO, DADOS_DE } from '../config.js';
import { buscarProveniencia } from './proveniencia.js';

// Formata um Date como relógio UTC "HH:MM:SS UTC"
function formatUTC(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} UTC`;
}

// Formata inteiro com separador de milhar no padrão brasileiro (ex.: 18.813)
function formatCount(n) {
  return Number(n).toLocaleString('pt-BR');
}

export function createStatusBar(el, { onHelp, onLista } = {}) {
  // --- Estrutura DOM ---
  el.innerHTML = '';

  // Nome do app + o que ele é, lado a lado: quem chega pelo link direto não
  // tem nenhuma outra pista do que está olhando.
  const marca = document.createElement('div');
  marca.className = 'status-brand';

  const [primeira, ...resto] = APP_NOME.split(' ');
  const title = document.createElement('span');
  title.className = 'app-title';
  title.innerHTML = `${primeira} <span class="title-accent">${resto.join(' ')}</span>`;

  const subtitle = document.createElement('span');
  subtitle.className = 'app-subtitle';
  subtitle.textContent = APP_RESUMO;

  marca.append(title, subtitle);

  const spacer = document.createElement('span');
  spacer.className = 'status-spacer';

  const count = document.createElement('span');
  count.className = 'feature-count';

  // A data dos dados fica ao lado do relógio de propósito: o relógio anda, a
  // data não. Ver o contraste é o que impede a leitura de "painel ao vivo".
  const dataChip = document.createElement('span');
  dataChip.className = 'data-chip';
  dataChip.textContent = `dados de ${DADOS_DE}`;
  dataChip.title = 'Data em que as bases foram baixadas. Os dados não mudam sozinhos.';

  // A data vem do MANIFESTO, não da constante — a constante é só o valor de
  // partida enquanto a rede não responde.
  //
  // Escrita à mão, ela desatualiza a cada rodada do pipeline e ninguém percebe:
  // em 29/07/2026 o app anunciava "dados de 28/07" sobre camadas reexportadas
  // no dia seguinte. E este selo existe justamente para a pessoa não ler o globo
  // como painel ao vivo — um selo com data errada é pior que selo nenhum, porque
  // afirma com confiança.
  buscarProveniencia().then((r) => {
    const iso = r?.ok ? r.dados?.gerado_em_utc : null;
    const d = iso ? new Date(iso) : null;
    if (d && !Number.isNaN(d.getTime())) {
      dataChip.textContent = `dados de ${d.toLocaleDateString('pt-BR')}`;
    }
  });

  const clock = document.createElement('span');
  clock.className = 'hud-clock';
  clock.title = 'Hora usada para calcular a posição dos satélites.';

  // Alterna a visão em lista. Fica ao lado do contador de itens porque
  // responde à mesma pergunta por outro caminho: o mapa diz ONDE, a lista diz
  // QUAIS — e achar a maior área girando um globo é trabalhoso.
  const lista = document.createElement('button');
  lista.type = 'button';
  lista.className = 'lista-btn';
  lista.textContent = 'Ver em lista';
  lista.title = 'Mostrar as áreas encontradas em lista';
  lista.setAttribute('aria-pressed', 'false');
  lista.addEventListener('click', () => onLista?.());

  const help = document.createElement('button');
  help.type = 'button';
  help.className = 'help-btn';
  help.textContent = '?';
  help.title = 'O que é este mapa e como usar';
  help.setAttribute('aria-label', 'O que é este mapa e como usar');
  help.addEventListener('click', () => onHelp?.());

  el.append(marca, spacer, count, lista, dataChip, clock, help);

  // --- Estado interno ---
  let featureCount = 0;

  function renderCount() {
    count.textContent = `${formatCount(featureCount)} itens no mapa`;
  }

  function tickClock() {
    clock.textContent = formatUTC(new Date());
  }

  // Relógio UTC atualizando a cada 1 s
  tickClock();
  renderCount();
  const clockTimer = setInterval(tickClock, 1000);

  // --- API pública ---
  return {
    /** Atualiza o contador de itens desenhados no globo. */
    setFeatureCount(n) {
      featureCount = Math.max(0, Number(n) || 0);
      renderCount();
    },
    /** Reflete no botão se a lista está aberta. */
    setListaAberta(aberta) {
      lista.setAttribute('aria-pressed', String(Boolean(aberta)));
      lista.classList.toggle('ativo', Boolean(aberta));
      lista.textContent = aberta ? 'Ver no mapa' : 'Ver em lista';
    },
    /** Para o relógio e limpa o intervalo (ex.: ao desmontar o HUD). */
    stop() {
      clearInterval(clockTimer);
    },
  };
}
