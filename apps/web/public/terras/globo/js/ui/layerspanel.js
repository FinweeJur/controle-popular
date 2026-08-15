/**
 * layerspanel.js — painel lateral de camadas do globo 3D.
 *
 * Renderiza o <aside id="layers-panel"> a partir de `CAMADAS` (config.js): uma
 * linha por CONCEITO, agrupada por ASSUNTO, mais um filtro de REGIÃO que é um
 * eixo à parte. Mudanças disparam `onToggle(camadaId, ligada)` e
 * `onRegiao(regiaoId|null)` — o main.js repassa para o LayerManager.
 *
 * ## O que mudou em 13/08/2026, e por quê
 *
 * O painel agrupava por REGIÃO DE ESTUDO desde 12/08. Aquilo resolveu a
 * legibilidade e NÃO resolveu o problema, que o dono do projeto voltou a
 * relatar com todas as letras: "a questão das camadas tá muito confuso. Não
 * vamos ficar ligando apenas do Paraopeba ou dos Vales."
 *
 * Cinco conceitos existiam duas ou três vezes no registro, um por região. Com o
 * agrupamento por região, as irmãs ficavam em SEÇÕES DIFERENTES — o que explica
 * que sejam lugares distintos, mas piora a tarefa real: para ver todos os
 * assentamentos de Minas era preciso descobrir que há dois interruptores de nome
 * quase igual, rolar até a outra seção e ligar os dois.
 *
 * Agora o eixo da lista é o ASSUNTO e a região é um FILTRO independente, que
 * não muda o que está ligado — só o recorte do que aparece. Uma chave por
 * conceito; ligar "Assentamentos da reforma agrária" liga o dado de todas as
 * regiões que existem. As 19 fontes viram 14 linhas.
 *
 * ## Linha compacta, explicação sob demanda
 *
 * Cada linha carregava um `hint` de várias linhas sempre visível. Dezenove
 * desses era uma parede de texto — e o argumento de 12/08 para deixá-los
 * visíveis ("tooltip não existe no celular") continua correto, mas prova
 * demais: a saída não é tooltip, é DIVULGAÇÃO PROGRESSIVA. A linha mostra nome
 * e contador; um botão "explicar" abre o texto ali mesmo, com `aria-expanded`,
 * e ele funciona por clique, toque e teclado — nada depende de `hover`.
 *
 * Classes CSS esperadas (definidas em ../css/hud.css — NÃO estilizar aqui):
 *   .panel-header / .panel-title / .panel-collapse-btn
 *   .regiao-filtro / .regiao-chip        — o filtro de região (radiogroup)
 *   .layer-bulk / .layer-bulk-btn / .layer-bulk-nota — ligar/desligar tudo
 *   .layer-groups / .layer-group / .layer-group-titulo / .layer-list
 *   .layer-row (+ .on, .em-realce, .layer-vazia, .layer-empty, .layer-error,
 *               .carregando, .acabou-de-ligar)
 *   .layer-marca                          — o marcador de forma+cor da camada
 *   .layer-icone                          — ícone Lucide por conceito (ver icones.js)
 *   .layer-name / .layer-count / .layer-toggle
 *   .layer-explicar / .layer-detalhe / .layer-aviso / .layer-nota-regiao
 *
 * API pública:
 *   const painel = createLayersPanel(el, { camadas, assuntos, regioes,
 *                                          onToggle, onRegiao });
 *   painel.setEnabled(camadaId, on);   // sincroniza a chave sem disparar onToggle
 *   painel.isEnabled(camadaId);
 *   painel.setCarregando(camadaId, bool);
 *   painel.setStatus(camadaId, { on, count, total, error, indistinta });
 *   painel.regiaoAtual();              // id de REGIOES, ou null = todas
 *
 *   agruparPorAssunto(camadas, assuntos);  // exportada à parte, testada em
 *                                          // layerspanel.test.mjs sem montar DOM
 *
 * ## "Ligar tudo" / "Desligar tudo" (13/08/2026)
 *
 * Pedido do dono olhando o mapa no celular: não existia jeito de ligar tudo de
 * uma vez. A pergunta que decidiu o desenho não foi "dá para ligar tudo" — dá,
 * é só chamar `onToggle` de cada linha — mas "o que acontece no celular dele
 * quando alguém aperta esse botão".
 *
 * A resposta está em `sigmine-interesse` (config.js): 47.830 polígonos, cada
 * um triangulado por `geojsonToFilled` na THREAD PRINCIPAL, um de cada vez —
 * 6,7× a segunda maior camada de preenchimento do globo (`sigmine-operacao`,
 * 7.090, e essa já liga sozinha na abertura sem travar nada). Ligar essa
 * camada junto com as outras ~21 somaria, numa pancada só, muito mais
 * trabalho síncrono do que o navegador de um celular tolera sem congelar —
 * exatamente onde o dono estava quando pediu o botão.
 *
 * Por isso "Ligar tudo" LIGA TODAS AS LINHAS QUE NÃO SÃO `pesada` (hoje só
 * "Interesse minerário na ANM"), e o texto abaixo dos botões diz isso em
 * palavras, com o nome da camada que ficou de fora. `pesada` é decidida em
 * `resolverCamada` (config.js) por MEDIÇÃO — não é um jeito de esconder a
 * camada, que continua na lista, com hint e chave normais: só não entra no
 * "tudo". "Desligar tudo" não tem esse problema (desligar é síncrono e barato
 * — `LayerManager.disable` só remove da cena e libera GPU) e desliga
 * literalmente todas, pesadas inclusive.
 *
 * ## Ícones por conceito (13/08/2026)
 *
 * Pedido do dono, na mesma entrega: reconhecimento visual imediato nas 22
 * linhas — "algo mais leve no design tipo Lucide", não emoji. `criarIconeCamada`
 * (./icones.js) devolve o `<svg>` já pronto (ou `null` se a camada não tiver
 * ícone mapeado — a linha não quebra, só fica sem ele). O ícone é SEMPRE
 * decorativo (`aria-hidden`): o nome da camada continua sendo o que a
 * identifica para quem usa leitor de tela.
 */

import { fonteNaRegiao } from '../config.js';
import { criarIconeCamada } from './icones.js';

// Converte cor numérica (0x38bdf8) para string CSS "#38bdf8"
function colorToCss(color) {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/**
 * Agrupa as camadas pelo `assunto` de cada uma, na ORDEM de `assuntos`.
 *
 * Camada sem `assunto`, ou com um `assunto` que não existe na lista, NÃO é
 * descartada: cai num grupo "Outras" criado na hora, com aviso no console.
 * Herda a lição de `agruparPorRegiao`, que esta função substitui — lá, um
 * `grupo?.camadas.push()` virava no-op silencioso e a camada sumia do painel
 * enquanto o aviso da linha de cima afirmava que ela tinha sido acomodada.
 * Camada que some do painel só é notada quando alguém a procura, e ninguém
 * procura tanto assim.
 *
 * Grupo declarado em `assuntos` que fica sem nenhuma camada não aparece no
 * resultado — seção vazia lê como painel quebrado.
 */
export function agruparPorAssunto(camadas, assuntos) {
  const porId = new Map(assuntos.map((a) => [a.id, { ...a, camadas: [] }]));

  for (const camada of camadas) {
    const idAssunto = camada.assunto;
    let grupo = porId.get(idAssunto);
    if (!grupo) {
      console.warn(`[layerspanel] camada "${camada.id}" tem assunto "${idAssunto}", que não existe em ASSUNTOS — caiu em "outras".`);
      grupo = porId.get('outras');
      if (!grupo) {
        grupo = { id: 'outras', titulo: 'Outras', camadas: [] };
        porId.set('outras', grupo);
      }
    }
    grupo.camadas.push(camada);
  }

  return [...porId.values()].filter((g) => g.camadas.length > 0);
}

/**
 * Forma do marcador a partir do tipo de desenho da camada.
 *
 * ⚠️ ISTO NÃO É ENFEITE: é o começo da saída da dependência de cor. O globo é a
 * única tela do projeto inteiramente dependente de distinguir cor, e o painel
 * tinha catorze pontinhos redondos idênticos em catorze matizes. A forma
 * carrega uma informação REAL e verificável na tela — se aquilo no globo é área
 * preenchida, ponto solto ou só contorno — então quem não separa os matizes
 * ainda tem nome + forma + contador para se orientar.
 *
 * Não tento dar uma forma por CAMADA: catorze formas distinguíveis num quadrado
 * de 10 px não existem, e inventá-las trocaria uma legenda ilegível por outra.
 */
function formaDe(render) {
  if (render === 'point') return 'ponto';
  if (render === 'line') return 'linha';
  if (render === 'custom') return 'satelite';
  return 'area';
}

const NOME_DA_FORMA = {
  area: 'área desenhada no mapa',
  ponto: 'ponto no mapa, sem contorno',
  linha: 'só o contorno',
  satelite: 'marcador que se move',
};

export function createLayersPanel(el, { camadas, assuntos, regioes, onToggle, onRegiao } = {}) {
  el.innerHTML = '';

  /** id da região escolhida, ou null = todas. */
  let regiaoAtual = null;

  /** camadaId -> camada resolvida, para não varrer a lista a cada atualização. */
  const porId = new Map(camadas.map((c) => [c.id, c]));

  const state = new Map();     // camadaId -> boolean
  const linhas = new Map();    // camadaId -> <div class="layer-row">
  const chaves = new Map();    // camadaId -> <button role="switch">
  const contadores = new Map();// camadaId -> <span class="layer-count">
  const notasRegiao = new Map(); // camadaId -> <p class="layer-nota-regiao">
  const pulsos = new Map();      // camadaId -> id do setTimeout do pulso
  /**
   * Camadas cujo dado JÁ apareceu na tela — o pulso de "acendeu" é dado uma vez
   * por vez que isso acontece, e não a cada `setStatus`.
   */
  const confirmadas = new Set();

  // --- Cabeçalho: título + botão de colapso (usado no responsivo) ---
  const header = document.createElement('div');
  header.className = 'panel-header';

  const title = document.createElement('h2');
  title.className = 'panel-title';
  title.textContent = 'Camadas';

  const collapse = document.createElement('button');
  collapse.type = 'button';
  collapse.className = 'panel-collapse-btn';
  collapse.dataset.target = '';       // alvo de toque de 44 px — ver tokens/targets.css
  collapse.textContent = '−';
  collapse.title = 'Recolher o painel';
  collapse.setAttribute('aria-label', 'Recolher o painel de camadas');
  collapse.setAttribute('aria-expanded', 'true');
  collapse.addEventListener('click', () => {
    const fechado = el.classList.toggle('collapsed');
    collapse.textContent = fechado ? '+' : '−';
    collapse.title = fechado ? 'Mostrar as camadas' : 'Recolher o painel';
    collapse.setAttribute('aria-expanded', String(!fechado));
  });

  header.append(title, collapse);
  el.appendChild(header);

  // -------------------------------------------------------------------------
  // Filtro de região — o SEGUNDO eixo, e por isso fica fora da lista
  //
  // Mora acima dos grupos e separado deles porque não é uma camada nem um
  // assunto: é um recorte que vale para todas as linhas ao mesmo tempo. Posto
  // dentro da lista, viraria "mais uma coisa para ligar", que é exatamente a
  // confusão que esta entrega desfaz.
  //
  // `radiogroup` e não um punhado de botões `aria-pressed`: a escolha é UMA
  // entre quatro, mutuamente exclusiva, e é isso que o papel de rádio anuncia.
  // Vem com o que ele obriga — tabindex móvel (só o escolhido é tabulável) e
  // navegação por setas —, que é como um leitor de tela espera atravessar um
  // grupo desses.
  // -------------------------------------------------------------------------
  const filtro = document.createElement('div');
  filtro.className = 'regiao-filtro';

  const rotuloFiltro = document.createElement('h3');
  rotuloFiltro.className = 'regiao-filtro-titulo';
  rotuloFiltro.id = 'regiao-filtro-titulo';
  rotuloFiltro.textContent = 'Região';
  filtro.appendChild(rotuloFiltro);

  const grupoRadio = document.createElement('div');
  grupoRadio.className = 'regiao-chips';
  grupoRadio.setAttribute('role', 'radiogroup');
  grupoRadio.setAttribute('aria-labelledby', 'regiao-filtro-titulo');
  filtro.appendChild(grupoRadio);

  // "Todas" primeiro e escolhida de saída: o pedido era parar de ter de ligar
  // região por região. O estado de partida tem de ser o que mostra tudo.
  const opcoes = [{ id: null, titulo: 'Todas as regiões', curto: 'Todas' }, ...regioes];
  const chips = opcoes.map((opcao) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'regiao-chip';
    chip.dataset.regiao = opcao.id ?? '';
    chip.setAttribute('role', 'radio');
    chip.setAttribute('aria-checked', String(opcao.id === regiaoAtual));
    chip.tabIndex = opcao.id === regiaoAtual ? 0 : -1;
    chip.textContent = opcao.curto;
    // O nome curto cabe no chip; o nome inteiro é o que a leitura em voz alta
    // anuncia. "Mucuri" sozinho não diz que é o Vale do Mucuri.
    chip.setAttribute('aria-label', opcao.titulo);
    chip.title = opcao.titulo;
    chip.addEventListener('click', () => escolherRegiao(opcao.id, { focar: true }));
    grupoRadio.appendChild(chip);
    return chip;
  });

  // Setas andam pelo grupo e JÁ ESCOLHEM, que é o comportamento de rádio nativo
  // (não é lista de links). Home/End vão às pontas.
  grupoRadio.addEventListener('keydown', (ev) => {
    const atual = chips.findIndex((c) => c === document.activeElement);
    if (atual < 0) return;
    let alvo = null;
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') alvo = (atual + 1) % chips.length;
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') alvo = (atual - 1 + chips.length) % chips.length;
    else if (ev.key === 'Home') alvo = 0;
    else if (ev.key === 'End') alvo = chips.length - 1;
    if (alvo == null) return;
    ev.preventDefault();
    escolherRegiao(opcoes[alvo].id, { focar: true });
  });

  el.appendChild(filtro);

  function escolherRegiao(id, { focar = false } = {}) {
    regiaoAtual = id ?? null;
    chips.forEach((chip, i) => {
      const escolhido = (opcoes[i].id ?? null) === regiaoAtual;
      chip.setAttribute('aria-checked', String(escolhido));
      chip.tabIndex = escolhido ? 0 : -1;
      if (escolhido && focar) chip.focus();
    });
    atualizarNotasDeRegiao();
    if (typeof onRegiao === 'function') onRegiao(regiaoAtual);
  }

  // -------------------------------------------------------------------------
  // "Ligar tudo" / "Desligar tudo" — ver o comentário grande no topo do
  // arquivo para o porquê de "tudo" não incluir as camadas `pesada`.
  //
  // Os dois botões reaproveitam o MESMO caminho de uma chave individual
  // (`aplicarEstado` + `onToggle`), só que em laço — nada de estado ou
  // contagem é decidido aqui: quem confirma o que de fato ficou ligado é
  // `setStatus`, chamado pelo main.js depois que cada fonte carrega.
  // -------------------------------------------------------------------------
  const bulk = document.createElement('div');
  bulk.className = 'layer-bulk';

  const bulkBtns = document.createElement('div');
  bulkBtns.className = 'layer-bulk-btns';

  const btnLigarTudo = document.createElement('button');
  btnLigarTudo.type = 'button';
  btnLigarTudo.className = 'layer-bulk-btn';
  btnLigarTudo.textContent = 'Ligar tudo';
  btnLigarTudo.addEventListener('click', () => {
    for (const camada of camadas) {
      // Camada vazia tem a chave desabilitada (ver montarLinha) — respeitar
      // o mesmo estado aqui, em vez de chamar onToggle numa linha que a
      // própria UI nunca deixaria a pessoa ligar pelo clique.
      if (camada.vazia) continue;
      // A trava do dia: ver o comentário grande no topo do arquivo.
      if (camada.pesada) continue;
      if (state.get(camada.id)) continue;
      aplicarEstado(camada.id, true);
      if (typeof onToggle === 'function') onToggle(camada.id, true);
    }
  });

  const btnDesligarTudo = document.createElement('button');
  btnDesligarTudo.type = 'button';
  btnDesligarTudo.className = 'layer-bulk-btn';
  btnDesligarTudo.textContent = 'Desligar tudo';
  btnDesligarTudo.addEventListener('click', () => {
    // Desligar não tem o custo de ligar (LayerManager.disable só remove da
    // cena e libera GPU) — por isso desliga TUDO, pesadas inclusive, sem
    // exceção: é a saída de emergência de quem ligou demais.
    for (const camada of camadas) {
      if (!state.get(camada.id)) continue;
      aplicarEstado(camada.id, false);
      if (typeof onToggle === 'function') onToggle(camada.id, false);
    }
  });

  bulkBtns.append(btnLigarTudo, btnDesligarTudo);
  bulk.appendChild(bulkBtns);

  // Diz, em palavras, o que "tudo" não cobre — sem isto o botão mentiria por
  // omissão toda vez que alguém conferisse a lista depois e achasse uma
  // camada pesada desligada sem explicação.
  const pesadas = camadas.filter((c) => c.pesada);
  if (pesadas.length) {
    const notaPesadas = document.createElement('p');
    notaPesadas.className = 'layer-bulk-nota';
    const nomes = pesadas.map((c) => c.label).join(', ');
    notaPesadas.textContent = pesadas.length === 1
      ? `"Ligar tudo" pula "${nomes}" — é grande demais para ligar de uma vez sem travar o navegador no celular. Liga na chave dela, à parte.`
      : `"Ligar tudo" pula estas camadas, grandes demais para ligar de uma vez sem travar o navegador no celular: ${nomes}. Ligue-as na chave de cada uma, à parte.`;
    bulk.appendChild(notaPesadas);
  }

  el.appendChild(bulk);

  // Envelope de todos os grupos — é isto que `.collapsed` esconde (ver
  // hud.css). Precisa envolver os TÍTULOS de assunto também: escondendo só as
  // `.layer-list` internas, o painel colapsado mostraria títulos de seção sem
  // nenhuma linha embaixo, o que parece quebrado, não recolhido.
  const groups = document.createElement('div');
  groups.className = 'layer-groups';
  el.appendChild(groups);

  let seq = 0;
  for (const grupo of agruparPorAssunto(camadas, assuntos)) {
    const secao = document.createElement('section');
    secao.className = 'layer-group';
    const idTitulo = `layer-group-titulo-${grupo.id}-${seq++}`;
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

    for (const camada of grupo.camadas) list.appendChild(montarLinha(camada));
  }

  /** Monta a linha de UMA camada (conceito já resolvido — ver config.js). */
  function montarLinha(camada) {
    const cor = colorToCss(camada.color);
    const forma = formaDe(camada.render);

    state.set(camada.id, Boolean(camada.on));

    const row = document.createElement('div');
    row.className = 'layer-row';
    row.dataset.camadaId = camada.id;
    row.dataset.forma = forma;
    if (camada.on) row.classList.add('on');

    // --- marcador: cor E forma ---------------------------------------------
    const marca = document.createElement('span');
    marca.className = 'layer-marca';
    marca.dataset.forma = forma;
    marca.style.setProperty('--cor-camada', cor);
    // A forma também vira texto para quem não a vê: sem isto, o marcador é
    // decoração muda e a leitura em voz alta perde a única pista não-cromática
    // que a linha tem.
    marca.setAttribute('role', 'img');
    marca.setAttribute('aria-label', NOME_DA_FORMA[forma] ?? '');

    // --- ícone do conceito (ver icones.js) -----------------------------------
    // Junto do marcador, não no lugar dele: o marcador diz FORMA DE DESENHO
    // (área/ponto/linha — real e verificável no globo); o ícone diz ASSUNTO
    // (barragem, mineração, dinheiro...) — são duas perguntas diferentes, e a
    // pessoa que já usa o marcador para se orientar sem cor não pode perder
    // essa pista por causa de um ícone novo.
    //
    // O `span.layer-icone` é criado SEMPRE, mesmo quando `criarIconeCamada`
    // devolve `null` (camada nova sem ícone mapeado ainda): cada `.layer-row`
    // é o próprio grid (`display: grid` por linha — ver hud.css), então uma
    // coluna a menos numa linha só desalinharia nome/contador dela contra
    // todas as outras. Melhor uma célula vazia do que a lista tremendo.
    const iconeWrap = document.createElement('span');
    iconeWrap.className = 'layer-icone';
    iconeWrap.style.setProperty('--cor-camada', cor);
    const icone = criarIconeCamada(camada.id);
    if (icone) iconeWrap.appendChild(icone);

    // --- nome + contador ----------------------------------------------------
    const texto = document.createElement('div');
    texto.className = 'layer-text';

    const idNome = `layer-nome-${camada.id}`;
    const nome = document.createElement('span');
    nome.className = 'layer-name';
    nome.id = idNome;
    nome.textContent = camada.label;
    texto.appendChild(nome);

    if (camada.fixture) {
      row.classList.add('layer-fixture');
      const selo = document.createElement('span');
      selo.className = 'layer-fake';
      selo.textContent = 'FICTÍCIO';
      selo.title = 'Dado inventado para demonstração — não é fonte oficial.';
      nome.appendChild(selo);
    }

    const count = document.createElement('span');
    count.className = 'layer-count';
    contadores.set(camada.id, count);

    // --- botão de explicar (divulgação progressiva) -------------------------
    const idDetalhe = `layer-detalhe-${camada.id}`;
    const explicar = document.createElement('button');
    explicar.type = 'button';
    explicar.className = 'layer-explicar';
    explicar.setAttribute('aria-expanded', 'false');
    explicar.setAttribute('aria-controls', idDetalhe);
    explicar.setAttribute('aria-label', `O que é: ${camada.label}`);
    explicar.title = `O que é: ${camada.label}`;
    explicar.textContent = '?';

    const detalhe = document.createElement('div');
    detalhe.className = 'layer-detalhe';
    detalhe.id = idDetalhe;
    detalhe.hidden = true;

    if (camada.hint) {
      const p = document.createElement('p');
      p.className = 'layer-hint';
      p.textContent = camada.hint;
      detalhe.appendChild(p);
    }
    if (camada.aviso) {
      const p = document.createElement('p');
      p.className = 'layer-aviso';
      p.textContent = camada.aviso;
      detalhe.appendChild(p);
    }
    // Nota de região: preenchida por `atualizarNotasDeRegiao`, porque o texto
    // depende do filtro escolhido no momento.
    const nota = document.createElement('p');
    nota.className = 'layer-nota-regiao';
    nota.hidden = true;
    detalhe.appendChild(nota);
    notasRegiao.set(camada.id, nota);

    // `hidden` é ligado e desligado NA HORA, sem esperar transição.
    //
    // A alternativa bonita — animar a altura e só então marcar `hidden` no
    // `transitionend` — tem um buraco real: sob `prefers-reduced-motion` as
    // durações do sistema são 0ms (tokens/motion.css) e `transitionend` pode
    // simplesmente não disparar, deixando o texto fora da tela mas ainda
    // alcançável pelo leitor de tela. Estado de acessibilidade não pode
    // depender de um evento de animação. A animação de entrada fica no CSS,
    // roda uma vez quando o bloco aparece, e some sozinha sob movimento
    // reduzido.
    explicar.addEventListener('click', () => {
      const aberto = explicar.getAttribute('aria-expanded') === 'true';
      explicar.setAttribute('aria-expanded', String(!aberto));
      detalhe.hidden = aberto;
      row.classList.toggle('explicando', !aberto);
    });

    // --- a chave -------------------------------------------------------------
    const chave = document.createElement('button');
    chave.type = 'button';
    chave.className = 'layer-toggle';
    // ⚠️ SEM `data-target` aqui, de propósito. `tokens/targets.css` monta a
    // área de toque de 44 px num `::after`, e o `::after` desta chave já é a
    // bolinha do interruptor — os dois na mesma pseudo-elemento brigariam e um
    // dos dois sumiria. A área de toque da chave sai de um `::before` próprio,
    // com os mesmos tokens, em hud.css.
    chave.setAttribute('role', 'switch');
    chave.setAttribute('aria-checked', String(Boolean(camada.on)));
    // `aria-labelledby` apontando para o nome da camada, em vez de um
    // `aria-label` que repete o texto: um rótulo só, num lugar só — se o nome
    // da camada mudar, o da chave muda junto e não há como divergirem.
    chave.setAttribute('aria-labelledby', idNome);
    chave.title = `Mostrar ou esconder: ${camada.label}`;
    chaves.set(camada.id, chave);

    if (camada.vazia) {
      row.classList.add('layer-vazia');
      chave.disabled = true;
      chave.setAttribute('aria-checked', 'false');
      chave.title = 'Sem áreas para mostrar hoje — o porquê está na explicação.';
      count.textContent = 'vazia';
      count.title = 'A fonte desta camada não tem nenhuma área publicada hoje.';
    } else {
      chave.addEventListener('click', () => {
        const ligada = chave.getAttribute('aria-checked') !== 'true';
        aplicarEstado(camada.id, ligada);
        if (typeof onToggle === 'function') onToggle(camada.id, ligada);
      });
    }

    // O detalhe é filho DIRETO da linha, e não do bloco de texto: só assim ele
    // é um item do grid e pode ocupar a linha inteira (`grid-column: 1 / -1`).
    // Dentro de `.layer-text` ele herdaria a coluna estreita do nome — medido:
    // ~120 px para um parágrafo de 10 px, que sai pior que o texto sempre
    // visível que esta entrega veio substituir.
    row.append(marca, iconeWrap, texto, count, explicar, chave, detalhe);
    linhas.set(camada.id, row);
    return row;
  }

  /** Reflete o estado (ligada/desligada) na chave e na linha. */
  function aplicarEstado(id, ligada) {
    const agora = Boolean(ligada);
    state.set(id, agora);
    chaves.get(id)?.setAttribute('aria-checked', String(agora));
    linhas.get(id)?.classList.toggle('on', agora);
    // Desligou: a próxima vez que aparecer áreas na tela volta a valer um
    // pulso de confirmação. Ver `confirmadas` em `setStatus`.
    if (!agora) confirmadas.delete(id);
  }

  /** Duração do pulso de "acendeu", em ms. Igual a `--dur-slow` do sistema. */
  const MS_PULSO = 320;

  /**
   * O pulso de "acabou de ligar", uma vez só.
   *
   * A classe é retirada por TEMPO, e não no `animationend`. Sob
   * `prefers-reduced-motion` a animação é desligada por media query (hud.css) e
   * o evento nunca chega — a classe ficaria grudada na linha para sempre e o
   * próximo religamento não pulsaria. Um timer sempre dispara.
   */
  function pulsarUmaVez(id) {
    const linha = linhas.get(id);
    if (!linha) return;
    clearTimeout(pulsos.get(id));
    linha.classList.remove('acabou-de-ligar');
    // Força o navegador a assentar a remoção antes de repor a classe; sem
    // isto, religar a mesma camada duas vezes seguidas não reinicia a animação.
    void linha.offsetWidth;
    linha.classList.add('acabou-de-ligar');
    pulsos.set(id, setTimeout(() => linha.classList.remove('acabou-de-ligar'), MS_PULSO));
  }

  /**
   * Escreve, em cada linha, o que o filtro de região atual faz com ela.
   *
   * É aqui que a honestidade sobre o dado aparece na tela. Três casos:
   *
   *  · a camada não é de região nenhuma (a moldura, os satélites, o cadastro de
   *    BH, as normas das cidades do estudo) — o filtro não a toca, e a linha diz
   *    isso em vez de deixar a pessoa achar que está vendo um recorte;
   *  · a camada tem fonte na região escolhida — nada a declarar;
   *  · a camada tem fonte que MISTURA Jequitinhonha e Mucuri sem permitir
   *    separar (`mesoIndistinta`) — a linha avisa que traz também o outro vale.
   *    Ver o comentário dessas fontes em config.js: elas trazem só `area_ha`,
   *    sem município, e separá-las exigiria cruzamento espacial.
   */
  function atualizarNotasDeRegiao() {
    for (const [id, nota] of notasRegiao) {
      const camada = porId.get(id);
      const linha = linhas.get(id);
      if (!camada || !linha) continue;

      const texto = notaDeRegiao(camada, regiaoAtual);
      nota.textContent = texto ?? '';
      nota.hidden = !texto;

      // Camada que o filtro deixou sem nenhuma fonte: continua na lista, e
      // apagada. Sumir com a linha faria a lista mudar de tamanho a cada troca
      // de região e esconderia que a camada EXISTE — o que ela não mostra na
      // região escolhida é informação, não motivo para desaparecer.
      const sobrou = camada.fontesResolvidas.some((f) => fonteNaRegiao(f, regiaoAtual));
      linha.classList.toggle('fora-do-filtro', !sobrou);
    }
  }

  // Esc fecha a explicação aberta e devolve o foco ao botão que a abriu.
  //
  // O ouvinte fica NO PAINEL, não em `document`: o cartão de abertura
  // (ui/intro.js) já escuta Esc no documento para se fechar, e dois ouvintes
  // globais disputando a mesma tecla fariam o Esc fazer duas coisas de uma vez.
  // Aqui ele só age quando o foco está dentro do painel, que é quando a pessoa
  // pode ter uma explicação aberta à vista.
  el.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape') return;
    const linha = ev.target.closest?.('.layer-row');
    const botao = linha?.querySelector('.layer-explicar[aria-expanded="true"]');
    if (!botao) return;
    ev.stopPropagation();
    botao.setAttribute('aria-expanded', 'false');
    linha.querySelector('.layer-detalhe').hidden = true;
    linha.classList.remove('explicando');
    botao.focus();
  });

  atualizarNotasDeRegiao();

  return {
    /** Sincroniza o estado visual da chave sem disparar onToggle. */
    setEnabled(id, enabled) {
      if (!chaves.has(id)) return;
      aplicarEstado(id, enabled);
    },
    /** Retorna se a camada está ligada (false para id desconhecido). */
    isEnabled(id) {
      return Boolean(state.get(id));
    },
    /** id da região escolhida, ou null = todas. */
    regiaoAtual: () => regiaoAtual,
    /**
     * Escolhe a região SEM disparar `onRegiao` — para quem já vai aplicar o
     * recorte por conta própria e só precisa que os chips reflitam a escolha.
     * É o caso do deep-link: ele desfaz o filtro para poder abrir a área
     * pedida, e disparar o callback aqui faria o recorte ser aplicado duas
     * vezes, com a maior camada do mapa redesenhada à toa.
     */
    escolherRegiao(id) {
      regiaoAtual = id ?? null;
      chips.forEach((chip, i) => {
        const escolhido = (opcoes[i].id ?? null) === regiaoAtual;
        chip.setAttribute('aria-checked', String(escolhido));
        chip.tabIndex = escolhido ? 0 : -1;
      });
      atualizarNotasDeRegiao();
    },
    /**
     * Pulso de "estou buscando isto agora". Só isso — a confirmação de que
     * chegou é `setStatus`, que traz o número.
     */
    setCarregando(id, carregando) {
      linhas.get(id)?.classList.toggle('carregando', Boolean(carregando));
    },
    /**
     * Estado completo depois de tentar carregar: mantém a chave coerente com o
     * que de fato entrou na cena e diz em palavras o que aconteceu. Camada
     * ligada com zero área não pode ficar muda.
     *
     * @param {object} p
     * @param {boolean} [p.on]        a camada ficou mesmo ligada
     * @param {number}  [p.count]     áreas DESENHADAS agora (já filtradas)
     * @param {number}  [p.total]     áreas no arquivo, antes do filtro
     * @param {string}  [p.error]
     * @param {boolean} [p.indistinta] alguma fonte mistura os dois vales sem separar
     */
    setStatus(id, { on, count, total, error, indistinta, texto } = {}) {
      if (on != null) aplicarEstado(id, on);
      // `texto` existe para a camada que não se mede em feições. A imagem de
      // satélite ligada e sem retalho na tela não está "sem dados": está longe
      // demais para precisar de um. Contar feições nela e concluir "sem dados
      // ainda" era relatar defeito onde havia funcionamento normal.
      if (texto != null && !error) {
        const alvo = contadores.get(id);
        if (alvo) { alvo.textContent = texto; alvo.title = ''; }
        linhas.get(id)?.classList.remove('layer-empty', 'layer-error');
        return;
      }
      const el2 = contadores.get(id);
      const row = linhas.get(id);
      if (!el2) return;
      row?.classList.remove('layer-empty', 'layer-error');
      row?.classList.toggle('carregando', false);
      if (indistinta != null) row?.classList.toggle('meso-indistinta', Boolean(indistinta));

      // Camada de fonte estruturalmente vazia: o contador já diz "vazia" desde a
      // primeira pintura, e isso não é um número que a carga possa desmentir.
      // Sem esta saída, a primeira troca de filtro apagaria a palavra — o
      // `setStatus` passa por TODAS as camadas ao mudar de região, não só pelas
      // ligadas.
      if (row?.classList.contains('layer-vazia')) return;

      if (error) {
        el2.textContent = 'indisponível';
        row?.classList.add('layer-error');
        el2.title = `Não foi possível carregar: ${error}`;
        return;
      }
      // Desligada e sem nada carregado: contador em branco, não "0". Um zero ao
      // lado de catorze chaves desligadas lê como "esta camada não tem áreas",
      // que é falso — ela tem, só não foi ligada. Antes de 13/08 isto não
      // aparecia porque `setStatus` só era chamado para a camada que a pessoa
      // mexia; agora a troca de região passa por todas.
      if (!on && !count) {
        el2.textContent = '';
        el2.title = '';
        row?.classList.remove('layer-recortada');
        return;
      }
      if (on && !count) {
        // Ligada e sem nada na tela. Distingue os dois motivos, porque a ação
        // que cada um pede é diferente: se o filtro escondeu tudo, mudar de
        // região resolve; se a fonte não trouxe nada, não há o que fazer.
        // Ligada mas sem nada na tela: o dado "desapareceu". Se voltar (a
        // pessoa alarga o filtro de região), merece o pulso de novo.
        confirmadas.delete(id);
        const escondeuTudo = total > 0;
        el2.textContent = escondeuTudo ? 'nada aqui' : 'sem dados ainda';
        row?.classList.add('layer-empty');
        el2.title = escondeuTudo
          ? `Esta camada tem ${total.toLocaleString('pt-BR')} áreas, nenhuma na região escolhida.`
          : 'A camada existe no app, mas a fonte ainda não forneceu nenhuma área.';
        return;
      }
      if (count == null) {
        el2.textContent = '';
        el2.title = '';
        return;
      }
      // O PULSO DE "ACENDEU" mora aqui, e não no clique da chave.
      //
      // Ele confirma que o dado CHEGOU e está desenhado — é o fecho do ciclo
      // "pedi / está vindo / apareceu". Disparado no clique, ele mentiria nas
      // camadas grandes: a maior fonte do mapa leva 398 ms só para chegar e
      // virar geometria, e o pulso teria acabado antes de a primeira área
      // aparecer na tela. `confirmadas` garante uma vez por aparição, não uma
      // por `setStatus` — este método é chamado para todas as camadas a cada
      // troca de região.
      if (!confirmadas.has(id)) {
        confirmadas.add(id);
        pulsarUmaVez(id);
      }

      const n = Number(count).toLocaleString('pt-BR');
      if (total != null && total > count) {
        el2.textContent = n;
        el2.title = `${n} de ${Number(total).toLocaleString('pt-BR')} áreas — o resto está fora da região escolhida.`;
        row?.classList.add('layer-recortada');
      } else {
        el2.textContent = n;
        el2.title = '';
        row?.classList.remove('layer-recortada');
      }
    },
    /** Reavalia as notas de região (o main.js chama ao trocar o filtro). */
    atualizarNotas: atualizarNotasDeRegiao,
  };
}

/**
 * A frase que a linha mostra sobre o filtro de região atual — ou null quando
 * não há nada a declarar.
 *
 * Exportada porque é decisão de conteúdo, não de layout, e é testável sem DOM.
 */
export function notaDeRegiao(camada, regiao) {
  const fontes = camada.fontesResolvidas ?? [];

  // Sem região escolhida não há recorte a explicar. A ressalva de mesorregião
  // indistinta é declarada mesmo assim: quem lê "Assentamentos da reforma
  // agrária" com tudo ligado merece saber que, dentro dos Vales, esta camada
  // não sabe separar um do outro — a limitação é do dado e não aparece nem
  // some conforme o filtro.
  if (!regiao) {
    return fontes.some((f) => f.mesoIndistinta)
      ? 'Nos Vales, a fonte não diz de qual área é o Jequitinhonha e qual é o Mucuri — só que é de um dos dois.'
      : null;
  }

  if (camada.semRegiao) {
    return 'Esta camada não é de uma região do estudo — o filtro de região não muda o que ela mostra.';
  }

  const visiveis = fontes.filter((f) => fonteNaRegiao(f, regiao));
  if (!visiveis.length) {
    return 'Esta camada não tem área na região escolhida.';
  }
  // Só faz sentido avisar sobre "o outro vale" quando o filtro está NUM vale:
  // com "Bacia do Paraopeba" escolhida, as fontes indistintas nem entram.
  if (regiao !== 'bacia' && visiveis.some((f) => f.mesoIndistinta)) {
    const outro = regiao === 'mucuri' ? 'Vale do Jequitinhonha' : 'Vale do Mucuri';
    return `A fonte não diz de qual vale é cada área, então esta camada traz também áreas do ${outro}.`;
  }
  return null;
}
