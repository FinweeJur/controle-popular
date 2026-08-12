/**
 * layerspanel.js — painel lateral de camadas do globo 3D.
 *
 * Renderiza o <aside id="layers-panel"> a partir do LAYER_REGISTRY: uma linha
 * por camada, com dot na cor da camada, nome em linguagem comum, uma linha
 * explicando o que é, contador e chave de ligar/desligar. Mudanças disparam
 * onToggle(id, enabled) — o main.js repassa para o LayerManager.
 *
 * Quatro decisões de linguagem/uso:
 *   1. O título era "LAYERS", única palavra em inglês de uma interface toda em
 *      português. Virou "CAMADAS".
 *   2. Cada camada carrega um `hint` visível, não tooltip: no celular não
 *      existe hover, e ninguém passa o mouse por sete itens para descobrir o
 *      que são.
 *   3. Camada que carrega e vem com zero item agora diz "sem dados ainda" em
 *      vez de ficar em silêncio. Ligar uma chave e não ver nada acontecer
 *      ensina que as chaves não funcionam.
 *   4. A lista é agrupada por REGIÃO DE ESTUDO (config.js: REGIOES_CAMADAS),
 *      não mais uma lista plana. Motivo (relatado direto pelo dono do
 *      projeto): cinco pares de camadas irmãs — mesmo método, mesma cor DE
 *      PROPÓSITO (a cor identifica O QUE a camada é, não onde fica — não se
 *      mexe nisso aqui), duas regiões — liam como duplicata, porque a única
 *      pista de "são lugares diferentes" era um sufixo "— Vales" no fim de um
 *      rótulo comprido. O título da seção carrega essa pista agora, antes de
 *      qualquer nome de camada.
 *
 * Classes CSS esperadas (definidas em ../css/hud.css — NÃO estilizar aqui):
 *   .panel-header / .panel-title / .panel-collapse-btn
 *   .layer-groups        — envelope de todos os grupos (o que o modo
 *                           colapsado esconde — ver 4. acima)
 *   .layer-group         — uma região: título + .layer-list
 *   .layer-group-titulo  — nome da região ("Bacia do Paraopeba" etc.)
 *   .layer-list          — lista de camadas de UM grupo
 *   .layer-row           — linha de uma camada (recebe .on quando ligada)
 *   .layer-dot           — dot colorido da camada (background via style inline)
 *   .layer-name          — nome da camada
 *   .layer-hint          — a linha de explicação sob o nome
 *   .layer-count         — contador de itens da camada (mono)
 *   .layer-toggle        — chave de ligar/desligar (button role=switch)
 *   .layer-fake          — marca FICTÍCIO em camada de demonstração
 *   .layer-vazia         — camada cuja fonte está estruturalmente vazia hoje
 *                           (ver `vazia` no LAYER_REGISTRY) — chave desligada
 *                           e travada, contador mostra "vazia" sem clique.
 *
 * API pública:
 *   const panel = createLayersPanel(el, LAYER_REGISTRY, REGIOES_CAMADAS, (id, on) => ...);
 *   panel.setEnabled(id, on);     // sincroniza a chave sem disparar onToggle
 *   panel.isEnabled(id);          // estado atual da camada
 *   panel.setFeatureCount(id, n); // contador por camada
 *   panel.setStatus(id, { on, count, error });  // estado completo pós-carga
 *
 *   agruparPorRegiao(registry, regioes);  // exportada à parte, testada em
 *                                         // layerspanel.test.mjs sem montar DOM
 */

// Converte cor numérica (0x38bdf8) para string CSS "#38bdf8"
function colorToCss(color) {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/**
 * Agrupa o registro pela `regiao` de cada camada, na ORDEM de `regioes`.
 *
 * Camada sem `regiao` cai em 'geral' — é o grupo para quem não pertence a
 * nenhuma região de estudo nomeada (divisas do estado, satélites, e camadas
 * de dado que não são nem bacia nem Vales, como lotes vagos de BH). Camada
 * com uma `regiao` que não bate com nenhum id de `regioes` (id renomeado,
 * erro de digitação) cai no 'geral' também, e AVISA no console — perder uma
 * camada da tela por um id que não bate é o tipo de bug que só aparece
 * quando alguém procura a camada e não acha, e ninguém procura tanto assim.
 *
 * NENHUMA camada é descartada, mesmo se 'geral' também não existir mais em
 * `regioes` (alguém removeu a entrada de REGIOES_CAMADAS): antes disto, esse
 * caso fazia `geral?.camadas.push(layer)` virar um no-op silencioso ao mesmo
 * tempo em que o `console.warn` acima afirmava "caiu em geral" — aviso
 * mentindo é pior que aviso nenhum. Se não há grupo 'geral' para receber a
 * camada, um é criado na hora.
 */
export function agruparPorRegiao(registry, regioes) {
  const porId = new Map(regioes.map((r) => [r.id, { ...r, camadas: [] }]));
  for (const layer of registry) {
    const idRegiao = layer.regiao ?? 'geral';
    let grupo = porId.get(idRegiao);
    if (!grupo && idRegiao !== 'geral') {
      console.warn(`[layerspanel] camada "${layer.id}" tem regiao "${idRegiao}", que não existe em REGIOES_CAMADAS — caiu em "geral".`);
      grupo = porId.get('geral');
    }
    if (!grupo) {
      console.warn(`[layerspanel] REGIOES_CAMADAS não tem grupo "geral" — criando um só para não descartar a camada "${layer.id}".`);
      grupo = { id: 'geral', titulo: 'Geral', camadas: [] };
      porId.set('geral', grupo);
    }
    grupo.camadas.push(layer);
  }
  return [...porId.values()].filter((g) => g.camadas.length > 0);
}

export function createLayersPanel(el, registry, regioes, onToggle) {
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

  // Envelope de todos os grupos — é isto que `.collapsed` esconde (ver
  // hud.css). Precisa envolver os TÍTULOS de região também: escondendo só as
  // `.layer-list` internas, o painel colapsado mostraria três títulos de
  // seção sem nenhuma linha embaixo, o que parece quebrado, não recolhido.
  const groups = document.createElement('div');
  groups.className = 'layer-groups';
  el.appendChild(groups);

  const state = new Map();   // id -> boolean (ligada/desligada)
  const rows = new Map();    // id -> <div class="layer-row">
  const toggles = new Map(); // id -> <button role="switch">
  const counts = new Map();  // id -> <span> do contador

  let seqGrupo = 0;
  for (const grupo of agruparPorRegiao(registry, regioes)) {
    const secao = document.createElement('section');
    secao.className = 'layer-group';
    const idTitulo = `layer-group-titulo-${grupo.id}-${seqGrupo++}`;
    secao.setAttribute('aria-labelledby', idTitulo);

    const titulo = document.createElement('h3');
    titulo.className = 'layer-group-titulo';
    titulo.id = idTitulo;
    titulo.textContent = grupo.titulo;
    secao.appendChild(titulo);

    const list = document.createElement('div');
    list.className = 'layer-list';
    secao.appendChild(list);
    groups.appendChild(secao);

    for (const layer of grupo.camadas) {
      state.set(layer.id, Boolean(layer.on));

      const row = document.createElement('div');
      row.className = 'layer-row';
      row.dataset.layerId = layer.id;
      if (layer.on) row.classList.add('on');

      const dot = document.createElement('span');
      dot.className = 'layer-dot';
      dot.style.backgroundColor = colorToCss(layer.color);
      // A MESMA cor também como custom property, para o CSS poder usá-la em
      // sombra e anel. `currentColor` não serve aqui: resolve para a cor de
      // TEXTO herdada, que é quase branca — o anel de realce saía branco em
      // vez de sair na cor da camada, e uma legenda que muda de cor no hover
      // mente.
      dot.style.setProperty('--cor-camada', colorToCss(layer.color));

      const texto = document.createElement('div');
      texto.className = 'layer-text';

      const name = document.createElement('span');
      name.className = 'layer-name';
      name.textContent = layer.label;

      // Camada de fixture tem de se anunciar. O painel mostrava "Candidatos
      // (piloto)" para 3 polígonos inventados, do mesmo jeito que mostraria
      // dado oficial — é o erro que fez o relatório da Fase 0 passar por
      // medição.
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

      // Camada com fonte estruturalmente vazia hoje (ver `vazia` no
      // LAYER_REGISTRY): a chave fica DESLIGADA e TRAVADA em vez de convidar
      // um clique que não muda nada no globo. "não fingir que é camada
      // utilizável" é literal — `disabled` tira o botão do fluxo de tab e do
      // clique, e a AT anuncia "desativado" sozinha, sem eu precisar simular
      // isso com `aria-disabled` e um guarda de clique à parte. O contador já
      // mostra "vazia" desde a primeira pintura — não espera um clique para
      // revelar o que já se sabe.
      if (layer.vazia) {
        row.classList.add('layer-vazia');
        toggle.disabled = true;
        toggle.setAttribute('aria-checked', 'false');
        toggle.title = 'Sem áreas para mostrar hoje — o porquê está na explicação acima.';
        count.textContent = 'vazia';
        count.title = 'A fonte desta camada não tem nenhuma área publicada hoje.';
      } else {
        toggle.addEventListener('click', () => {
          const ligada = toggle.getAttribute('aria-checked') !== 'true';
          aplicarEstado(layer.id, ligada);
          if (typeof onToggle === 'function') onToggle(layer.id, ligada);
        });
      }

      row.append(dot, texto, count, toggle);
      list.appendChild(row);
    }
  }

  /** Reflete o estado (ligada/desligada) na chave e na linha. */
  function aplicarEstado(id, ligada) {
    state.set(id, Boolean(ligada));
    toggles.get(id)?.setAttribute('aria-checked', String(Boolean(ligada)));
    rows.get(id)?.classList.toggle('on', Boolean(ligada));
  }

  // rows precisa existir antes de aplicarEstado ser chamado no clique
  for (const row of groups.querySelectorAll('.layer-row')) rows.set(row.dataset.layerId, row);

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
