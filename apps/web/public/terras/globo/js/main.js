/**
 * main.js — bootstrap do globo 3D "sala de controle" (ver plano §4.8).
 *
 * Wiring: cena + controles + Terra, HUD (statusbar, focusbar, layers panel,
 * footer), LayerManager, loop de animação, resize e fly-to inicial no Brasil.
 * Sem build step: ES modules vanilla servidos como estáticos pelo FastAPI.
 */

import { ABERTURA, FOCUS_PRESETS, LAYER_REGISTRY, REGIOES_CAMADAS } from './config.js';
import { municipioPorCodigo } from './data/municipios.js';
import { createScene } from './core/scene.js';
import { createEarth } from './core/earth.js';
import { createControls } from './core/controls.js';
import { criarArrastoDeSuperficie } from './core/arrastar.js';
import { flyTo } from './core/flyto.js';
import { centroDe, coordenadasDe, distanciaParaEnquadrar } from './core/enquadrar.js';
import { createStatusBar } from './ui/statusbar.js';
import { createFocusBar } from './ui/focusbar.js';
import { createLayersPanel } from './ui/layerspanel.js';
import { createFooterHud } from './ui/footerhud.js';
import { createZoomControls } from './ui/zoomcontrols.js';
import { createInspector } from './ui/inspector.js';
import { createIntro } from './ui/intro.js';
import { createBuscaMunicipio } from './ui/buscamunicipio.js';
import { createListaPanel } from './ui/listapanel.js';
import { criarFolha } from './ui/folha.js';
import { criarRealce } from './ui/realce.js';
import { LayerManager } from './layers/manager.js';
import { createSatellitesGroup } from './layers/satelites.js';
import { FocusBoundaries } from './layers/boundaries.js';

async function bootstrap() {
  const container = document.getElementById('globe-container');

  // --- Palco 3D (renderer, câmera, luzes — ACES, pixelRatio ≤ 2) ----------
  let renderer, scene, camera;
  try {
    ({ renderer, scene, camera } = createScene(container));
  } catch (err) {
    // Fallback gentil se WebGL2 não estiver disponível (plano §8).
    container.innerHTML =
      '<p style="color:#9ca3af;font-family:monospace;padding:2rem">' +
      'Seu navegador não suporta WebGL2 — o globo 3D não pôde iniciar.</p>';
    console.error('[globe] falha ao criar cena:', err);
    return;
  }
  container.appendChild(renderer.domElement);

  const controls = createControls(camera, renderer.domElement);
  // Arrastar leva o globo para o lado, em vez de orbitar um ponto fixo do chão.
  criarArrastoDeSuperficie(camera, controls, renderer.domElement);

  // --- Terra (esfera Blue Marble + atmosfera + gráticula) ------------------
  const terra = await createEarth();
  scene.add(terra);
  // A casca de atmosfera fica a 1.02 raios (~127 km). Entrar nela com blending
  // aditivo tapa a tela de ciano; some quando a câmera passa para dentro.
  const atmosfera = terra.getObjectByName('atmosfera');
  const raioAtmosfera = atmosfera?.userData?.raio ?? 1.02;

  // --- Sistema de camadas (Fase G2: dados reais via /api/v1/camadas/{id}) ---
  // Camadas 'custom' (Fase G3) recebem factories locais — ex.: satélites SGP4.
  const layers = new LayerManager(scene, LAYER_REGISTRY, {
    'satelites-orbita': createSatellitesGroup,
  });

  // --- HUD -----------------------------------------------------------------
  // Cartão de abertura (o que é o mapa + como usar). Nasce antes da statusbar
  // porque o botão "?" dela reabre este cartão.
  const intro = createIntro(document.getElementById('intro'));

  // Visão em lista das mesmas áreas: clicar numa linha faz o que clicar no
  // polígono faz — foca a câmera e abre a ficha.
  const listaPanel = createListaPanel(document.getElementById('lista'), {
    onEscolher: ({ layerId, idx, feature }) => {
      inspector.mostrarPorId(layerId, idx);
      focarFeicao(feature, layerId, idx);
    },
  });

  const statusBar = createStatusBar(document.getElementById('statusbar'), {
    onHelp: () => intro.abrir(),
    onLista: () => {
      listaPanel.alternar();
      statusBar.setListaAberta(listaPanel.estaAberta());
    },
  });

  // Inspetor de área (clique no globo → ficha + botão de foco + vista 2D)
  const inspector = createInspector(
    document.getElementById('inspector'), layers, camera, renderer.domElement,
    { onFocar: (feature, layerId, idx) => focarFeicao(feature, layerId, idx) },
  );

  // No celular, camadas e ficha dividem UMA folha de duas abas: os dois painéis
  // somam 520 px numa tela de 375, então a sobreposição é aritmética. A folha
  // não mexe no DOM — alterna por `data-aba` no body — e observa a classe
  // `.visible` do inspetor, que é como os três caminhos de abertura (clique,
  // lista e deep-link `#area=`) sinalizam. Ver ui/folha.js.
  const folha = criarFolha(document.getElementById('layers-panel'), document.getElementById('inspector'));

  // Passar o mouse numa camada acende as áreas dela no globo e recua as outras.
  // Não é enfeite: com o vazio da bacia e o de Curvelo em violetas irmãs, era
  // impossível saber qual mancha era qual sem desligar uma. Ver ui/realce.js.
  const realce = criarRealce(layers, document.getElementById('layers-panel'));
  // No celular o painel desaparece ao trocar de aba, sem o ponteiro sair dele —
  // então o realce não receberia `pointerleave` e a camada ficaria acesa.
  new MutationObserver(() => { if (document.body.dataset.aba !== 'camadas') realce.soltar(); })
    .observe(document.body, { attributes: true, attributeFilter: ['data-aba'] });

  // Botões de zoom in/out (canto direito inferior)
  createZoomControls(document.getElementById('zoombar'), controls);

  // Recorte territorial do foco ativo (Brasil, Sudeste, MG, Curvelo)
  const boundaries = new FocusBoundaries(scene);

  // Como refazer o enquadramento atual — região ou área. O resize precisa
  // disto: mudar a proporção da janela muda o que cabe na tela, e reenquadrar
  // "o preset" jogaria fora a área que a pessoa acabou de focar.
  let refazerFoco = null;

  /**
   * Vista de abertura: um recorte versionado em `data/{boundary}.geojson`
   * (hoje só Minas Gerais). Os botões de foco não passam mais por aqui — são
   * municípios, e municípios vêm da malha do IBGE como qualquer outro.
   */
  async function focarRecorte(recorte, { durMs } = {}) {
    refazerFoco = () => focarRecorte(recorte, { durMs: 400 });
    limparHash();
    boundaries.show(recorte);

    const fc = await boundaries.carregar(recorte.boundary);
    if (!fc) return;
    const centro = centroDe(fc);
    if (!centro) return;
    const distancia = distanciaParaEnquadrar(coordenadasDe(fc), centro, {
      fovDeg: camera.fov,
      aspect: camera.aspect,
      altMin: controls.minDistance,
      altMax: controls.maxDistance,
    });
    flyTo(camera, controls, { id: recorte.id, lat: centro.lat, lon: centro.lon, distance: distancia, durMs });
  }

  /** Botão de foco: resolve o município na malha e usa o mesmo caminho da busca. */
  async function focar(preset, { durMs } = {}) {
    const feature = await municipioPorCodigo(preset.geocodigo);
    if (!feature) {
      console.warn(`[globe] município ${preset.geocodigo} ("${preset.label}") não está na malha.`);
      return;
    }
    focarMunicipio(feature, { durMs, presetId: preset.id });
  }

  /**
   * Leva a câmera até UMA área, enquadrada com folga.
   *
   * Folga 2,2 e não 1,15 como nas regiões: enquadrar a parcela justa na borda
   * da tela corta a vizinhança, e a vizinhança é metade da informação numa
   * checagem visual — é o que diz se o vizinho é lavoura, estrada ou mata.
   *
   * O piso de zoom (2,5 km de altitude, core/controls.js) satura para feições
   * pequenas: um polígono de 10 ha tem ~350 m de lado e vai aparecer pequeno no
   * centro. Está certo assim — descer mais atravessa o chão facetado da esfera.
   * Para ver de perto de verdade existe a vista 2D, em resolução real.
   */
  function focarFeicao(feature, layerId, idx, { durMs = 1200 } = {}) {
    const uma = { type: 'FeatureCollection', features: [feature] };
    const centro = centroDe(uma);
    if (!centro) return;

    refazerFoco = () => focarFeicao(feature, layerId, idx, { durMs: 400 });
    focusBar.setActive?.(null); // não é mais nenhuma das regiões

    const distancia = distanciaParaEnquadrar(coordenadasDe(uma), centro, {
      fovDeg: camera.fov,
      aspect: camera.aspect,
      folga: 2.2,
      altMin: controls.minDistance,
      altMax: controls.maxDistance,
    });
    flyTo(camera, controls, { id: `area:${layerId}#${idx}`, lat: centro.lat, lon: centro.lon, distance: distancia, durMs });
    if (layerId != null && idx != null) escreverHash(layerId, idx);
  }

  // --- Endereço compartilhável: #area=<camada>:<índice> --------------------
  // Focar uma área grava o endereço; abrir esse endereço reabre a mesma área.
  // É como se manda um achado para alguém — sem isto, "olha o polígono 3 de
  // Curvelo" depende de a outra pessoa achar o polígono 3 de Curvelo.
  const PADRAO_AREA = /^#?area=(.+):(\d+)$/;

  function escreverHash(layerId, idx) {
    const novo = `#area=${encodeURIComponent(layerId)}:${idx}`;
    // replaceState e não location.hash: não empilha uma entrada de histórico a
    // cada área olhada, e o "voltar" do navegador continua saindo do app.
    if (location.hash !== novo) history.replaceState(null, '', novo);
  }

  function limparHash() {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  }

  /**
   * Lê o endereço e abre a área apontada, ligando a camada se preciso.
   * @returns {Promise<boolean>} false se não havia endereço válido
   */
  async function abrirAreaDoEndereco() {
    const achado = PADRAO_AREA.exec(location.hash);
    if (!achado) return false;

    const layerId = decodeURIComponent(achado[1]);
    const idx = Number(achado[2]);
    const cfg = LAYER_REGISTRY.find((l) => l.id === layerId);
    if (!cfg) {
      console.warn(`[globe] endereço aponta para a camada "${layerId}", que não existe.`);
      return false;
    }
    // Camada `vazia` não tem área nenhuma para abrir hoje — mas `layers.enable`
    // ligaria mesmo assim (o grupo 3D fica vazio, e um grupo vazio ainda é um
    // `object` não-nulo, então `isEnabled` volta `true`; ver manager.js), e o
    // `setStatus` logo abaixo reescreveria o rótulo "vazia" do painel para
    // "sem dados ainda" e acenderia uma chave que a UI mantém sempre travada e
    // desligada — sem clique nenhum para desfazer, porque `toggle.disabled`
    // tira a chave do fluxo. Nada seria desenhado no globo; só o painel
    // passaria a mentir sobre por que a camada está vazia. Sai cedo, sem
    // tocar no estado da camada.
    if (cfg.vazia) {
      console.warn(`[globe] endereço aponta para a área ${idx} da camada "${layerId}", que está estruturalmente vazia hoje — nada para abrir.`);
      return false;
    }

    // A camada pode estar desligada (ou ainda carregando) — espere de verdade.
    await layers.enable(layerId);
    layersPanel.setEnabled?.(layerId, layers.isEnabled(layerId));
    syncFeatureCounts(layerId);

    const feature = layers.geojson.get(layerId)?.features?.[idx];
    if (!feature) {
      console.warn(`[globe] a camada "${layerId}" não tem a área ${idx}.`);
      return false;
    }

    inspector.mostrarPorId(layerId, idx);
    focarFeicao(feature, layerId, idx, { durMs: 1600 });
    return true;
  }

  /**
   * Leva a câmera a um município qualquer dos 853, vindo da busca.
   *
   * Só os cinco presets têm arquivo de recorte próprio; para os demais, o
   * contorno é desenhado direto da feição da malha do IBGE.
   */
  function focarMunicipio(feature, { durMs, presetId = null } = {}) {
    const uma = { type: 'FeatureCollection', features: [feature] };
    const centro = centroDe(uma);
    if (!centro) return;

    refazerFoco = () => focarMunicipio(feature, { durMs: 400, presetId });
    focusBar.setActive?.(presetId);   // null quando veio da busca: nenhum botão aceso
    limparHash();
    boundaries.mostrarFeature(feature, `municipio:${feature.properties?.geocodigo ?? '?'}`);

    const distancia = distanciaParaEnquadrar(coordenadasDe(uma), centro, {
      fovDeg: camera.fov,
      aspect: camera.aspect,
      folga: 1.25,
      altMin: controls.minDistance,
      altMax: controls.maxDistance,
    });
    flyTo(camera, controls, {
      id: `municipio:${feature.properties?.nome ?? '?'}`,
      lat: centro.lat, lon: centro.lon, distance: distancia, durMs,
    });
  }

  const focusBar = createFocusBar(
    document.getElementById('focusbar'),
    FOCUS_PRESETS,
    (preset) => { busca.limpar(); focar(preset); },
  );

  // Busca anexa ao mesmo painel dos botões de foco — "escolher onde olhar"
  // fica num lugar só. Tem de vir DEPOIS do createFocusBar, que limpa o painel.
  const busca = createBuscaMunicipio(
    document.getElementById('focusbar'),
    { onSelecionar: (feature) => focarMunicipio(feature) },
  );

  /**
   * Sincroniza o painel com o que o LayerManager realmente conseguiu carregar:
   * quantos itens entraram, se deu erro e se a camada ficou mesmo ligada. Sem
   * isso, uma camada que falha continua com a chave ligada e o mapa vazio — e
   * a pessoa conclui que a chave não funciona.
   */
  function syncFeatureCounts(id) {
    if (id) {
      const st = layers.state.get(id);
      layersPanel.setStatus?.(id, {
        on: layers.isEnabled(id),
        count: st?.featureCount ?? 0,
        error: st?.error ?? null,
      });
    }
    statusBar.setFeatureCount?.(layers.totalFeatures());
    atualizarLista();
  }

  /**
   * Reconstrói a lista a partir do que está de fato desenhado. A lista mostra
   * o que o mapa mostra — se divergir, uma das duas está mentindo.
   */
  function atualizarLista() {
    const entradas = [];
    for (const cfg of LAYER_REGISTRY) {
      if (!cfg.listavel || !layers.isEnabled(cfg.id)) continue;
      const fc = layers.geojson.get(cfg.id);
      (fc?.features ?? []).forEach((feature, idx) => {
        entradas.push({ layerId: cfg.id, cfg, idx, feature });
      });
    }
    listaPanel.atualizar(entradas);
  }

  const layersPanel = createLayersPanel(
    document.getElementById('layers-panel'),
    LAYER_REGISTRY,
    REGIOES_CAMADAS,
    (id) => Promise.resolve(layers.toggle(id)).then(() => syncFeatureCounts(id)),
  );

  // Ativa as camadas marcadas como ligadas por padrão (on: true) e já
  // sincroniza os contadores quando cada fetch terminar.
  for (const cfg of LAYER_REGISTRY) {
    if (cfg.on) layers.enable(cfg.id).then(() => syncFeatureCounts(cfg.id));
  }

  const footerHud = createFooterHud(document.getElementById('footer-hud'));

  // --- Loop de animação -----------------------------------------------------
  renderer.setAnimationLoop(() => {
    controls.update();                 // damping do OrbitControls
    layers.tickUpdaters(new Date());   // satélites SGP4 (Fase G3)
    // A atmosfera é um brilho de borda visto DE FORA. Quando a câmera entra na
    // casca (1.02 raios, ~127 km), as faces internas cobrem a tela inteira em
    // blending aditivo e o mapa some atrás de um véu ciano — some com ela.
    if (atmosfera) atmosfera.visible = camera.position.length() > raioAtmosfera;
    footerHud.tick();                  // contador de FPS (média móvel)
    renderer.render(scene, camera);
  });

  // --- Resize ---------------------------------------------------------------
  // Mudar a proporção da janela muda o que cabe na tela; reenquadra a região
  // ativa em vez de deixar o recorte cortado pela borda nova.
  let reenquadrar = null;
  window.addEventListener('resize', () => {
    const { clientWidth: w, clientHeight: h } = container;
    // Sai se o container estiver com medida zero. `w / h` daria NaN (0/0) ou
    // Infinity, e `updateProjectionMatrix()` GRAVA essa matriz quebrada — ela
    // persiste depois que o container volta a ter tamanho, e o globo fica
    // sumido ou distorcido até alguém recarregar a página.
    //
    // Não é hipótese: o globo roda dentro de um <iframe> (app/
    // funcaosocialterra/mapa/page.tsx) num layout flex, e mede zero em vários
    // momentos reais — iframe ainda não medido no primeiro layout, aba de
    // fundo, e no celular a folha de duas abas (ui/folha.js), que esconde um
    // painel inteiro ao trocar de aba.
    if (!(w > 0 && h > 0)) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);

    clearTimeout(reenquadrar);
    reenquadrar = setTimeout(() => refazerFoco?.(), 250);
  });

  // --- Abertura ------------------------------------------------------------
  // Com `#area=` no endereço, abre direto naquela área; senão, enquadra Minas
  // Gerais — contexto antes de descer ao município. Nenhum botão fica aceso:
  // os botões são municípios, e a abertura não é nenhum deles.
  if (!(await abrirAreaDoEndereco())) {
    focarRecorte(ABERTURA);
  }

  // Endereço trocado à mão (ou colado) sem recarregar a página
  window.addEventListener('hashchange', () => { abrirAreaDoEndereco(); });

  console.info('[globe] bootstrap concluído — Terras Públicas 3D no ar');
}

bootstrap().catch((err) => console.error('[globe] erro no bootstrap:', err));
