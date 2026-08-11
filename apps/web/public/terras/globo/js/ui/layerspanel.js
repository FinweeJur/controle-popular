/**
 * layerspanel.js — painel lateral de camadas do globo 3D.
 *
 * Renderiza o <aside id="layers-panel"> a partir do LAYER_REGISTRY: uma linha
 * por camada, com dot na cor da camada, nome em linguagem comum, uma linha
 * explicando o que é, contador e chave de ligar/desligar. Mudanças disparam
 * onToggle(id, enabled) — o main.js repassa para o LayerManager.
 *
 * Três decisões de linguagem/uso:
 *   1. O título era "LAYERS", única palavra em inglês de uma interface toda em
 *      português. Virou "CAMADAS".
 *   2. Cada camada carrega um `hint` visível, não tooltip: no celular não
 *      existe hover, e ninguém passa o mouse por sete itens para descobrir o
 *      que são.
 *   3. Camada que carrega e vem com zero item agora diz "sem dados ainda" em
 *      vez de ficar em silêncio. Ligar uma chave e não ver nada acontecer
 *      ensina que as chaves não funcionam.
 *
 * Classes CSS esperadas (definidas em ../css/hud.css — NÃO estilizar aqui):
 *   .panel-header / .panel-title / .panel-collapse-btn
 *   .layer-list     — lista de camadas
 *   .layer-row      — linha de uma camada (recebe .on quando ligada)
 *   .layer-dot      — dot colorido da camada (background via style inline)
 *   .layer-name     — nome da camada
 *   .layer-hint     — a linha de explicação sob o nome
 *   .layer-count    — contador de itens da camada (mono)
 *   .layer-toggle   — chave de ligar/desligar (button role=switch)
 *   .layer-fake     — marca FICTÍCIO em camada de demonstração
 *
 * API pública:
 *   const panel = createLayersPanel(el, LAYER_REGISTRY, (id, on) => ...);
 *   panel.setEnabled(id, on);     // sincroniza a chave sem disparar onToggle
 *   panel.isEnabled(id);          // estado atual da camada
 *   panel.setFeatureCount(id, n); // contador por camada
 *   panel.setStatus(id, { on, count, error });  // estado completo pós-carga
 */

// Converte cor numérica (0x38bdf8) para string CSS "#38bdf8"
function colorToCss(color) {
  return `#${color.toString(16).padStart(6, '0')}`;
}

export function createLayersPanel(el, registry, onToggle) {
  el.innerHTML = '';

  // --- Cabeçalho: título + botão de colapso (usado no responsivo) ---
  const header = document.createElement('div');
  header.className = 'panel-header';

  const title = document.createElement('h2');
  title.className = 'panel-title';
  title.textContent = 'Camadas';

  const collapse = document.createElement('button');
  collapse.type = 'button';
  collapse.className = 'panel-collapse-btn';
  collapse.textContent = '−';
  collapse.title = 'Recolher o painel';
  collapse.setAttribute('aria-label', 'Recolher o painel de camadas');
  collapse.addEventListener('click', () => {
    const fechado = el.classList.toggle('collapsed');
    collapse.textContent = fechado ? '+' : '−';
    collapse.title = fechado ? 'Mostrar as camadas' : 'Recolher o painel';
  });

  header.append(title, collapse);
  el.appendChild(header);

  const list = document.createElement('div');
  list.className = 'layer-list';
  el.appendChild(list);

  const state = new Map();   // id -> boolean (ligada/desligada)
  const rows = new Map();    // id -> <div class="layer-row">
  const toggles = new Map(); // id -> <button role="switch">
  const counts = new Map();  // id -> <span> do contador

  for (const layer of registry) {
    state.set(layer.id, Boolean(layer.on));

    const row = document.createElement('div');
    row.className = 'layer-row';
    row.dataset.layerId = layer.id;
    if (layer.on) row.classList.add('on');

    const dot = document.createElement('span');
    dot.className = 'layer-dot';
    dot.style.backgroundColor = colorToCss(layer.color);
    // A MESMA cor também como custom property, para o CSS poder usá-la em
    // sombra e anel. `currentColor` não serve aqui: resolve para a cor de TEXTO
    // herdada, que é quase branca — o anel de realce saía branco em vez de sair
    // na cor da camada, e uma legenda que muda de cor no hover mente.
    dot.style.setProperty('--cor-camada', colorToCss(layer.color));

    const texto = document.createElement('div');
    texto.className = 'layer-text';

    const name = document.createElement('span');
    name.className = 'layer-name';
    name.textContent = layer.label;

    // Camada de fixture tem de se anunciar. O painel mostrava "Candidatos
    // (piloto)" para 3 polígonos inventados, do mesmo jeito que mostraria dado
    // oficial — é o erro que fez o relatório da Fase 0 passar por medição.
    if (layer.fixture) {
      row.classList.add('layer-fixture');
      const marca = document.createElement('span');
      marca.className = 'layer-fake';
      marca.textContent = 'FICTÍCIO';
      marca.title = 'Dado inventado para demonstração — não é fonte oficial.';
      name.appendChild(marca);
    }

    texto.appendChild(name);

    if (layer.hint) {
      const hint = document.createElement('span');
      hint.className = 'layer-hint';
      hint.textContent = layer.hint;
      texto.appendChild(hint);
    }

    const count = document.createElement('span');
    count.className = 'layer-count';
    count.textContent = '';
    counts.set(layer.id, count);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'layer-toggle';
    toggle.setAttribute('role', 'switch');
    toggle.setAttribute('aria-checked', String(Boolean(layer.on)));
    toggle.setAttribute('aria-label', `Mostrar ${layer.label} no mapa`);
    toggle.title = `Mostrar ou esconder: ${layer.label}`;
    toggles.set(layer.id, toggle);

    toggle.addEventListener('click', () => {
      const ligada = toggle.getAttribute('aria-checked') !== 'true';
      aplicarEstado(layer.id, ligada);
      if (typeof onToggle === 'function') onToggle(layer.id, ligada);
    });

    row.append(dot, texto, count, toggle);
    list.appendChild(row);
  }

  /** Reflete o estado (ligada/desligada) na chave e na linha. */
  function aplicarEstado(id, ligada) {
    state.set(id, Boolean(ligada));
    toggles.get(id)?.setAttribute('aria-checked', String(Boolean(ligada)));
    rows.get(id)?.classList.toggle('on', Boolean(ligada));
  }

  // rows precisa existir antes de aplicarEstado ser chamado no clique
  for (const row of list.querySelectorAll('.layer-row')) rows.set(row.dataset.layerId, row);

  return {
    /** Sincroniza o estado visual da chave sem disparar onToggle. */
    setEnabled(id, enabled) {
      if (!toggles.has(id)) return;
      aplicarEstado(id, enabled);
    },
    /** Retorna se a camada está ligada (false para id desconhecido). */
    isEnabled(id) {
      return Boolean(state.get(id));
    },
    /** Atualiza o contador de itens exibido ao lado da camada. */
    setFeatureCount(id, n) {
      const el = counts.get(id);
      if (el) el.textContent = n == null ? '' : Number(n).toLocaleString('pt-BR');
    },
    /**
     * Estado completo depois de tentar carregar: mantém a chave coerente com o
     * que de fato entrou na cena e diz em palavras o que aconteceu.
     * Camada ligada com zero item não pode ficar muda.
     */
    setStatus(id, { on, count, error } = {}) {
      if (on != null) aplicarEstado(id, on);
      const el = counts.get(id);
      if (!el) return;
      const row = rows.get(id);
      row?.classList.remove('layer-empty', 'layer-error');
      if (error) {
        el.textContent = 'indisponível';
        row?.classList.add('layer-error');
        el.title = `Não foi possível carregar: ${error}`;
      } else if (on && !count) {
        el.textContent = 'sem dados ainda';
        row?.classList.add('layer-empty');
        el.title = 'A camada existe no app, mas a fonte ainda não forneceu nenhuma área.';
      } else {
        el.textContent = count == null ? '' : Number(count).toLocaleString('pt-BR');
        el.title = '';
      }
    },
  };
}
