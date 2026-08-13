/**
 * inspector.js — inspetor de áreas do globo (Fase G3, plano §5.1).
 *
 * Clique no globo → interseção raio×esfera (matemática pura, sem raycast de
 * meshes) → lat/lon → teste ponto-em-polígono nas camadas ativas → painel
 * com o que se sabe da área + botão para ver de perto no satélite (Fase G4).
 *
 * Prioridade: a camada mais específica vence — ordem de cima para baixo do
 * LAYER_REGISTRY invertido (candidatos/devolutas antes de municípios).
 *
 * O painel mostrava as chaves cruas do GeoJSON — `area_ha`, `veg_nativa_pct`,
 * `proveniencia: limite_municipal − cadastro − exclusoes`. Isso é legível para
 * quem escreveu o pipeline e para mais ninguém. A tradução mora em
 * ./rotulos.js, compartilhada com a vista de perto (/app/detalhe), que mostra a
 * mesma ficha.
 *
 * Baixar e copiar-para-ofício só aparecem em camada `listavel` — a mesma porta
 * de ./exportar.js e ./listapanel.js. Uma divisa do IBGE (`municipios-mg`, sem
 * `listavel`) não é "área a apurar" e não deve ganhar nem arquivo baixável nem
 * texto de ofício dizendo que o INCRA confirma a situação da terra ali.
 *
 * Classes CSS esperadas (definidas em ../css/hud.css — NÃO estilizar aqui):
 *   #inspector, .inspector-title, .inspector-sub, .inspector-table,
 *   .inspector-actions, .inspector-close, .inspector-aviso, .btn-2d,
 *   .inspector-exportar, .inspector-exportar-botoes, .inspector-exportar-aviso
 */

import * as THREE from 'three';
import { LAYER_REGISTRY } from '../config.js';
import { centroDe } from '../core/enquadrar.js';
import { distanciaAoChao, radianosPorPixel } from '../core/arrastar.js';
import { blocoDeCoordenadas, escapar, ligarCopiar, linhasDaFicha, notaDeUso } from './rotulos.js';
import { injetarProveniencia } from './proveniencia.js';
import { FORMATOS, exportar, podeExportarCamada } from './exportar.js';

/**
 * Título humano da área clicada: nome próprio, ou camada + município.
 *
 * ⚠️ `props.estrutura` (o nome da barragem, ZAS/mancha de inundação — FEAM,
 * ver rotulos.js) entra ANTES do nome genérico. Conferido na tela em
 * 13/08/2026: sem isto, clicar numa mancha abria "Mancha de inundação
 * (barragens) · Brumadinho" — e a barragem de verdade ("Barragem VI – Mina
 * Córrego do Feijão") só aparecia na TERCEIRA linha da tabela, depois de
 * "Identificador" e "Código SIGBM", dois números que não dizem nada sozinhos.
 * O dono pediu para conferir que a mancha já diz de qual barragem é — dizia,
 * mas enterrado; a pergunta que a pessoa faz ao clicar ("de qual barragem é
 * isso?") merece a resposta no título, não na terceira linha da ficha.
 */
export function tituloDaArea(cfg, props, idx) {
  if (props.nome || props.name) return props.nome || props.name;
  if (props.estrutura) return props.estrutura;
  const base = cfg?.label?.split('—')[0].trim() || 'Área';
  if (props.municipio) return `${base} · ${props.municipio}`;
  return `${base} · área ${idx + 1}`;
}

/** Converte ponto da cena (na esfera unitária) de volta para [lat, lon]. */
export function vec3ToLatLon(v) {
  const r = v.length();
  const phi = Math.acos(THREE.MathUtils.clamp(v.y / r, -1, 1));
  const lat = 90 - (phi * 180) / Math.PI;
  const theta = (Math.atan2(v.z, -v.x) * 180) / Math.PI;
  const lon = theta - 180;
  return [lat, lon];
}

/** Raio da câmera por um pixel da tela → ponto na esfera R=1 (ou null). */
function pickNaEsfera(event, camera, domElement) {
  const rect = domElement.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, camera);
  const { origin: o, direction: d } = raycaster.ray;
  // |o + t·d|² = 1 → equação quadrática em t
  const b = 2 * o.dot(d);
  const c = o.lengthSq() - 1;
  const disc = b * b - 4 * c;
  if (disc < 0) return null;
  const t = (-b - Math.sqrt(disc)) / 2;
  return t > 0 ? o.clone().addScaledVector(d, t) : null;
}

/** Ponto-em-polígono (ray casting) em espaço lon/lat, com furos. */
function pontoEmPoligono(lon, lat, rings) {
  const dentro = (ring) => {
    let ok = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) ok = !ok;
    }
    return ok;
  };
  if (!rings?.length || !dentro(rings[0])) return false;
  return !rings.slice(1).some(dentro); // furos excluem
}

function featureContem(f, lon, lat) {
  const g = f.geometry;
  if (!g) return false;
  if (g.type === 'Polygon') return pontoEmPoligono(lon, lat, g.coordinates);
  if (g.type === 'MultiPolygon') return g.coordinates.some((p) => pontoEmPoligono(lon, lat, p));
  return false;
}

/**
 * Índice da feição de PONTO mais próxima do clique, dentro da tolerância.
 *
 * Ponto não contém ninguém: "clicou dentro" não existe. O critério passa a ser
 * proximidade, e a tolerância tem de acompanhar a escala — a mesma distância
 * angular que é um acerto sobre o estado inteiro é um erro de dezenas de
 * quilômetros na vista de perto. Aqui ela sai de quantos pixels o dedo erra
 * (`TOLERANCIA_PX`) convertidos em chão pela geometria da câmera, que é a mesma
 * conta do arrasto (`core/arrastar.js`).
 *
 * @returns {number} índice, ou -1
 */
export function pontoMaisProximo(fc, lon, lat, tolRad, visivel) {
  let melhor = -1;
  let menor = tolRad;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  fc.features.forEach((f, i) => {
    const g = f.geometry;
    if (g?.type !== 'Point') return;
    // `visivel` é opcional: sem ele, todo ponto do arquivo concorre — que é o
    // comportamento de sempre, e o que os testes deste módulo exercitam. Com
    // ele, o filtro de região tira do páreo os pontos que não estão na tela.
    if (visivel && !visivel(i)) return;
    const [gl, ga] = g.coordinates;
    // Distância plana em radianos, com a longitude encolhida pelo cosseno da
    // latitude. Em escala de município a diferença para a ortodrômica é
    // irrelevante, e isto roda a cada clique sobre centenas de pontos.
    const dx = ((gl - lon) * Math.PI / 180) * cosLat;
    const dy = ((ga - lat) * Math.PI) / 180;
    const d = Math.hypot(dx, dy);
    if (d < menor) { menor = d; melhor = i; }
  });
  return melhor;
}

/** Quantos pixels o clique pode errar e ainda pegar o ponto. */
const TOLERANCIA_PX = 14;

/**
 * Liga o inspetor de clique.
 * @param {HTMLElement} panel      container #inspector
 * @param {LayerManager} layers    para acessar os GeoJSONs ativos
 * @param {THREE.PerspectiveCamera} camera
 * @param {HTMLElement} domElement canvas do renderer
 * @param {object} [opts]
 * @param {(feature: object, layerId: string) => void} [opts.onFocar]
 *        chamado pelo botão "Focar aqui" — quem move a câmera é o main.js.
 *        O clique NÃO move a câmera de propósito: quem clica quer ler, e ver o
 *        mundo se mexer sozinho assusta (ainda mais num globo, onde o clique
 *        erra com frequência). Mover é decisão explícita, num botão.
 */
export function createInspector(panel, layers, camera, domElement, { onFocar } = {}) {
  let emFoco = null; // { layerId, feature } da ficha aberta

  domElement.addEventListener('click', (event) => {
    const ponto = pickNaEsfera(event, camera, domElement);
    if (!ponto) return esconder();
    const [lat, lon] = vec3ToLatLon(ponto);

    // Procura a feição clicada, da camada mais específica para a mais geral.
    //
    // ⚠️ `estaVisivel` não é zelo excessivo: `layers.geojson` guarda o arquivo
    // INTEIRO de cada fonte (é dele que sai o índice estável dos deep-links),
    // então o filtro de região esconde áreas do globo sem tirá-las daqui. Sem
    // esta checagem, clicar no vazio abriria a ficha de uma área que não está
    // desenhada — o mapa diria uma coisa e a ficha, outra.
    for (const [id, fc] of [...layers.geojson.entries()].reverse()) {
      const idx = fc.features.findIndex((f, i) => layers.estaVisivel(id, i) && featureContem(f, lon, lat));
      if (idx >= 0) return mostrar(id, fc.features[idx], idx, lat, lon);
    }
    // Nenhum polígono pegou. Camada de ponto responde por proximidade — e vem
    // depois de propósito: onde um ponto cai dentro de uma área, a área é a
    // resposta mais informativa, e o ponto continua alcançável ao lado dela.
    const tolRad = radianosPorPixel({
      altitude: distanciaAoChao(camera),
      fovDeg: camera.fov,
      alturaPx: domElement.clientHeight || window.innerHeight,
    }) * TOLERANCIA_PX;
    if (tolRad > 0) {
      for (const [id, fc] of [...layers.geojson.entries()].reverse()) {
        const idx = pontoMaisProximo(fc, lon, lat, tolRad, (i) => layers.estaVisivel(id, i));
        if (idx >= 0) return mostrar(id, fc.features[idx], idx, lat, lon);
      }
    }
    esconder();
  });

  function mostrar(layerId, feature, idx, lat, lon) {
    const props = feature.properties ?? {};
    const cfg = LAYER_REGISTRY.find((l) => l.id === layerId);
    const titulo = tituloDaArea(cfg, props, idx);
    // Ponto e polígono contam histórias diferentes sobre "onde fica": um marca,
    // o outro delimita. A ficha precisa saber qual é.
    const ehPonto = feature.geometry?.type === 'Point' || feature.geometry?.type === 'MultiPoint';
    const linhas = linhasDaFicha(props);
    // A MESMA porta que a lista (ui/listapanel.js, main.js → atualizarLista):
    // só camada `listavel` exporta e só camada `listavel` ganha o texto de
    // ofício. Sem isto, `#area=municipios-mg:100` — uma divisa do IBGE, sem
    // `listavel` no registro — gerava um CSV com a ressalva genérica de terra
    // devoluta, e um texto de ofício dizendo "quem confirma é o INCRA, a SPU
    // ou a Justiça" sobre um limite municipal. "Copiar coordenada" continua:
    // saber onde fica é legítimo mesmo aí.
    //
    // A decisão vem de `podeExportarCamada()` (ui/exportar.js) e não de um
    // `cfg?.listavel` escrito aqui: este módulo importa three.js e não roda
    // sob `node --test`, então uma regra inline aqui seria uma regra sem
    // teste — e foi exatamente assim que a porta ficou de fora na primeira
    // versão deste botão.
    const podeExportar = podeExportarCamada(cfg);
    emFoco = { layerId, feature, idx };
    panel.innerHTML = `
      <button class="inspector-close" title="Fechar">×</button>
      <div class="inspector-title">${titulo}</div>
      ${cfg?.hint ? `<p class="inspector-sub">${cfg.hint}</p>` : ''}
      <table class="inspector-table">${linhas}</table>
      ${blocoDeCoordenadas(props, ehPonto, feature.geometry, podeExportar)}
      ${notaDeUso(props)}
      <div class="inspector-actions">
        <button class="btn-focar" type="button">Focar nesta área</button>
        <a class="btn-2d" href="/terras/globo/detalhe.html?camada=${encodeURIComponent(layerId)}&fid=${idx}&lat=${lat.toFixed(5)}&lon=${lon.toFixed(5)}" target="_blank" rel="noopener">
          Ver de perto na imagem de satélite
        </a>
      </div>
      ${podeExportar ? `
      <div class="inspector-exportar">
        <strong>Baixar esta área</strong>
        <div class="inspector-exportar-botoes">
          ${Object.entries(FORMATOS).map(([id, f]) => `
            <button type="button" data-formato="${escapar(id)}">${escapar(f.rotulo)}</button>`).join('')}
        </div>
        <p class="inspector-exportar-aviso" hidden></p>
      </div>` : ''}
      <div class="inspector-prov"></div>
      ${cfg?.aviso ? `<p class="inspector-aviso">${cfg.aviso}</p>` : ''}`;
    panel.classList.add('visible');
    panel.querySelector('.inspector-close').addEventListener('click', esconder);
    panel.querySelector('.btn-focar').addEventListener('click', () => onFocar?.(feature, layerId, idx));
    ligarCopiar(panel, props, cfg?.label, ehPonto, feature.geometry);
    injetarProveniencia(panel.querySelector('.inspector-prov'));
    if (podeExportar) ligarExportar(panel, { layerId, cfg, idx, feature });
  }

  /**
   * Liga "Baixar esta área": reaproveita `exportar()` (ui/exportar.js) com
   * uma lista de UMA entrada — a área da ficha aberta. Antes deste botão, só
   * o painel de lista exportava, e sempre o conjunto INTEIRO: quem clicou
   * num polígono e queria só aquela área para um ofício tinha que fechar a
   * ficha, abrir a lista com milhares de linhas e procurar a área de novo.
   *
   * Não reimplementa nenhuma garantia do módulo de exportação — herda todas
   * ao chamar a mesma função: ressalva por camada, exclusão de camada
   * FICTÍCIA, lista branca de colunas. O que muda aqui é só o tamanho da
   * lista de entrada.
   *
   * Três botões lado a lado, e não um botão com menu suspenso (como o da
   * lista): `#inspector` rola como um bloco só (`overflow-y: auto` no
   * container inteiro — ver hud.css), e um menu `position: absolute` dentro
   * dele nasce cortado pela própria rolagem, não pela borda da tela. A lista
   * escapa disso porque o cabeçalho dela fica FORA da área que rola
   * (`.lista-itens` é que tem overflow, não `#lista`); a ficha não tem essa
   * separação, e não vale reestruturar o layout inteiro por um menu de três
   * itens que cabem numa linha.
   *
   * Só é chamada quando `cfg.listavel` é verdadeiro — a mesma porta que filtra
   * o painel de lista (ver `podeExportar` em `mostrar()`, acima). Camada
   * de demonstração (`fixture`) é um segundo filtro, ortogonal a esse: uma
   * camada pode ser `listavel` E `fixture` ao mesmo tempo, e é o `fixture`
   * abaixo que desabilita os botões nesse caso — não os esconde.
   */
  function ligarExportar(raiz, entrada) {
    const aviso = raiz.querySelector('.inspector-exportar-aviso');

    // Área de demonstração: desabilita em vez de esconder — sumir com o
    // controle apaga também a explicação de por que ele não está ali. Hoje
    // nenhuma camada publicada é `fixture` (ver config.js), mas a defesa
    // continua de pé para a próxima que precisar de dado de demonstração.
    const fixture = Boolean(entrada.cfg?.fixture);

    for (const botao of raiz.querySelectorAll('.inspector-exportar-botoes [data-formato]')) {
      if (fixture) {
        botao.disabled = true;
        botao.title = 'Área de demonstração — não é exportável';
        continue;
      }
      botao.addEventListener('click', () => {
        const r = exportar(botao.dataset.formato, [entrada]);
        aviso.hidden = false;
        aviso.textContent = r.ok ? `${r.nome} baixado.` : `Nada a baixar: ${r.motivo}.`;
        clearTimeout(aviso._t);
        aviso._t = setTimeout(() => { aviso.hidden = true; }, 8000);
      });
    }
  }

  function esconder() {
    emFoco = null;
    panel.classList.remove('visible');
    panel.innerHTML = '';
  }

  /**
   * Abre a ficha de uma feição sem clique — usado pelo deep-link `#area=`.
   * O ponto de referência do botão "ver de perto" passa a ser o centro da
   * própria feição, e não o pixel em que alguém acertou o dedo.
   * @returns {boolean} false se a camada não estiver carregada ou o índice não existir
   */
  function mostrarPorId(layerId, idx) {
    const fc = layers.geojson.get(layerId);
    const feature = fc?.features?.[idx];
    if (!feature) return false;
    const centro = centroDe({ type: 'FeatureCollection', features: [feature] });
    if (!centro) return false;
    mostrar(layerId, feature, idx, centro.lat, centro.lon);
    return true;
  }

  return { esconder, mostrarPorId, emFoco: () => emFoco };
}
