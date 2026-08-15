/**
 * layers/imagens.js — imagem de satélite que fica mais nítida conforme o zoom.
 *
 * O globo nasceu com UMA textura para o planeta inteiro (NASA Blue Marble,
 * `core/earth.js`): 5.400 px para 40.000 km de equador, ou seja **~7,4 km por
 * pixel**. Isso desenha o mundo, e não desenha um município: no piso de zoom
 * (2,5 km de altitude, `core/controls.js`) um polígono de 10 ha cobre a tela
 * inteira sobre um borrão de dois ou três pixels esticados. O contorno da área
 * aparecia sobre nada — e "nada" é a informação que mais falta na hora de
 * conferir se aquele vazio é gleba, estrada ou represa.
 *
 * Esta camada resolve isso por escada: enquanto a câmera está longe, o Blue
 * Marble basta e nada é baixado; ao descer, entra um retalho de ladrilhos do
 * mosaico do INPE sobre a região olhada, e o nível dos ladrilhos sobe junto com
 * o zoom. Cada degrau é uma imagem mais nítida que a anterior.
 *
 * ## O que é a imagem, e onde ela para
 *
 * Mosaico temporal do PRODES (INPE/TerraBrasilis), base Landsat, **~30 m por
 * pixel, em falsa cor** — mata puxa para o verde e o vermelho, cidade para o
 * azul. É 250 vezes mais fino que o Blue Marble e continua sendo 30 m: dá para
 * ler talhão, estrada, mancha urbana e lâmina d'água; **não** dá para ler cerca
 * nem telhado. O julgamento visual do gate G0 continua sendo feito na vista 2D
 * (`/app/detalhe`, Esri World Imagery), e o teto de zoom desta camada (nível 14,
 * decidido no servidor) existe para que a tela nunca ofereça um detalhe que o
 * dado não tem.
 *
 * ## Por que os ladrilhos passam pelo backend
 *
 * O servidor da INPE não manda `Access-Control-Allow-Origin`, e sem isso o
 * WebGL recusa a imagem como textura. O proxy (`/api/v1/imagens/...`) resolve
 * o CORS, guarda em disco e segura a rajada de requisições que o próprio
 * servidor da INPE derruba. Ver `backend/app/api/imagens.py`.
 *
 * ## Contrato
 *   criarImagensPorZoom({ camera, controls, renderer, onEstado })
 *     -> { group, update(agora), featureCount }
 *
 * A forma é a de uma camada 'custom' do LayerManager (igual à dos satélites):
 * ganha a chave no painel, o ciclo de vida e a liberação de memória de graça.
 */

import * as THREE from 'three';
import { latLonToVec3 } from '../core/earth.js';

// Raio do retalho de imagem. A esfera do globo é um poliedro cujas facetas
// afundam ~213 m abaixo da esfera ideal, e ela é desenhada com `polygonOffset`
// (2/4) que a empurra para trás na profundidade com folga medida de mais de
// 640 m — ver `core/earth.js`. Então um retalho a 32 m acima da esfera ideal
// vence a superfície sem disputa, e continua **abaixo** do preenchimento das
// camadas vetoriais (1.00002, ~127 m) e do contorno (1.00004, ~255 m): a área
// desenhada nunca some atrás da foto.
const R_IMAGEM = 1.000005;

const RAIO_TERRA_M = 6371000;        // o mesmo raio que o resto do globo assume
const MPP_EQUADOR_Z0 = 156543.03392; // metros por pixel no equador, nível 0, ladrilho de 256 px
const LADRILHO_PX = 256;

// Teto de ladrilhos por retalho. Cada nível a menos divide a conta por 4, então
// quando o retalho não cabe no orçamento a saída é descer UM nível de nitidez —
// nunca cortar a área coberta, que deixaria a borda da tela sem imagem.
// 25 (5×5) foi escolhido contra o relógio, não contra a beleza: o servidor da
// INPE atende 3 pedidos por vez (limite dele, ver o proxy), e 25 ladrilhos já
// levam alguns segundos na primeira visita. A partir da segunda, o cache de
// disco responde na hora.
const ORCAMENTO_LADRILHOS = 25;

// Abaixo deste nível o mosaico não acrescenta nada ao Blue Marble (a esta
// altura ainda se vê o país inteiro) e a conta de ladrilhos explodiria.
const ZOOM_MINIMO = 8;

// Só refaz o retalho quando a câmera para. Arrastar o globo dispara centenas de
// frames; pedir mosaico em cada um seria inundar a INPE para jogar fora tudo,
// menos o último.
const PAUSA_ANTES_DE_BUSCAR_MS = 260;
const DURACAO_APARICAO_MS = 400;

// Ladrilhos já decodificados, por chave "fonte/z/x/y". O cache HTTP do
// navegador evita a rede; este evita decodificar o PNG de novo ao voltar para
// uma área. Teto baixo de propósito: é memória de GPU/heap, não de disco.
const MAX_LADRILHOS_EM_MEMORIA = 300;
const ladrilhosEmMemoria = new Map();

// --- Conversões da grade de mapa deslizante (Web Mercator, padrão XYZ) ------

const grausParaRad = (g) => (g * Math.PI) / 180;
const radParaGraus = (r) => (r * 180) / Math.PI;

function lonParaX(lon, z) {
  return ((lon + 180) / 360) * 2 ** z;
}

function latParaY(lat, z) {
  const f = grausParaRad(Math.max(-85.05112878, Math.min(85.05112878, lat)));
  return ((1 - Math.log(Math.tan(f) + 1 / Math.cos(f)) / Math.PI) / 2) * 2 ** z;
}

function xParaLon(x, z) {
  return (x / 2 ** z) * 360 - 180;
}

function yParaLat(y, z) {
  return radParaGraus(Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 2 ** z))));
}

/** Metros por pixel de um ladrilho, na latitude dada. */
function metrosPorPixel(lat, z) {
  return (MPP_EQUADOR_Z0 * Math.cos(grausParaRad(lat))) / 2 ** z;
}

// --- Busca de um ladrilho ---------------------------------------------------

/**
 * Baixa um ladrilho pelo proxy. Devolve `null` quando não há imagem — que é
 * caso normal, não falha: fora do bioma o mosaico é transparente, e o proxy
 * responde 502 quando a INPE não entrega. Nos dois casos o Blue Marble
 * aparece por baixo, e quem conta o estrago é `estado.falhas`.
 */
function buscarLadrilho(fonte, z, x, y) {
  const chave = `${fonte.id}/${z}/${x}/${y}`;
  const guardado = ladrilhosEmMemoria.get(chave);
  if (guardado) return guardado;

  // Fonte `direto` vem do servidor dela (Esri), que manda CORS; fonte da INPE
  // vem pelo nosso proxy, porque o servidor dela não manda. Ver imagens.py.
  const endereco = fonte.direto
    ? fonte.url.replace('{z}', z).replace('{x}', x).replace('{y}', y)
    : `/api/v1/imagens/${fonte.id}/${z}/${x}/${y}.png`;

  const promessa = new Promise((resolve) => {
    const img = new Image();
    // Sem isto, textura de outro domínio "suja" a tela e o WebGL recusa —
    // e `cobertura()` deixaria de poder ler os pixels.
    if (fonte.direto) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = endereco;
  });

  ladrilhosEmMemoria.set(chave, promessa);
  if (ladrilhosEmMemoria.size > MAX_LADRILHOS_EM_MEMORIA) {
    // Map preserva ordem de inserção: o mais antigo é o primeiro.
    ladrilhosEmMemoria.delete(ladrilhosEmMemoria.keys().next().value);
  }
  return promessa;
}

// Tela minúscula reaproveitada para medir cobertura. Reduzir 256×256 para
// 32×32 e ler o alfa custa ~1.000 pixels; ler os 65.536 originais, a cada
// ladrilho, apareceria no contador de FPS.
const provaCanvas = document.createElement('canvas');
provaCanvas.width = provaCanvas.height = 32;
const provaCtx = provaCanvas.getContext('2d', { willReadFrequently: true });

/**
 * Fração do ladrilho que tem pixel (0 a 1).
 *
 * Serve para uma decisão de rede, não de estética: os biomas se sobrepõem no
 * bbox mas não no pixel, e Minas Gerais cai no Cerrado e na Mata Atlântica ao
 * mesmo tempo. Pedir as duas fontes para todo ladrilho dobraria o número de
 * requisições contra um servidor que já limita a três por vez. Com esta
 * medida, a segunda fonte só é pedida onde a primeira deixou buraco.
 */
function cobertura(img) {
  provaCtx.clearRect(0, 0, 32, 32);
  provaCtx.drawImage(img, 0, 0, 32, 32);
  const dados = provaCtx.getImageData(0, 0, 32, 32).data;
  let comPixel = 0;
  for (let i = 3; i < dados.length; i += 4) if (dados[i] > 16) comPixel++;
  return comPixel / 1024;
}

// --- Montagem do retalho ----------------------------------------------------

/**
 * Baixa os ladrilhos e vai desenhando cada um no contexto 2D assim que chega.
 *
 * O desenho é progressivo de propósito, e o motivo foi medido: com o cache
 * frio, um ladrilho leva de 2 a 5 segundos (o servidor da INPE atende três por
 * vez) e um retalho tem 25 — esperar o último para mostrar o primeiro deixava
 * a tela no Blue Marble por quase meio minuto, sem nada indicando que havia
 * imagem a caminho. Aparecendo aos pedaços, a primeira imagem entra em ~2 s e
 * o resto preenche à vista.
 *
 * @param {(estado: {desenhados: number, falhas: number, total: number}) => void} aoDesenhar
 * @returns {Promise<{desenhados: number, falhas: number}>}
 */
async function baixarLadrilhos(fontes, plano, ctx, cancelado, aoDesenhar) {
  const { z, x0, y0, nx, ny } = plano;
  const total = nx * ny;
  let desenhados = 0;
  let falhas = 0;

  const celulas = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) celulas.push([i, j]);

  await Promise.all(
    celulas.map(async ([i, j]) => {
      const x = x0 + i;
      const y = y0 + j;
      // Só as fontes cujo bbox toca este ladrilho — a moldura do bioma poupa
      // requisição, mesmo não sendo o bioma.
      const oeste = xParaLon(x, z);
      const leste = xParaLon(x + 1, z);
      const norte = yParaLat(y, z);
      const sul = yParaLat(y + 1, z);
      const candidatas = fontes.filter(
        (f) => f.bbox[0] <= leste && f.bbox[2] >= oeste && f.bbox[1] <= norte && f.bbox[3] >= sul,
      );

      let cobertoAte = 0;
      for (const fonte of candidatas) {
        if (cancelado()) return;
        const img = await buscarLadrilho(fonte, z, x, y);
        if (cancelado()) return;
        if (!img) {
          falhas++;
          continue;
        }
        const c = cobertura(img);
        if (c > 0) ctx.drawImage(img, i * LADRILHO_PX, j * LADRILHO_PX);
        cobertoAte = Math.max(cobertoAte, c);
        // Ladrilho cheio: a próxima fonte não teria onde aparecer.
        if (cobertoAte > 0.99) break;
      }
      if (cobertoAte > 0) {
        desenhados++;
        aoDesenhar({ desenhados, falhas, total });
      }
    }),
  );

  return { desenhados, falhas };
}

/** Textura de tela 2D com os ajustes que esta camada precisa. */
function criarTextura(canvas) {
  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  // A imagem é reamostrada de 30 m: filtrar linear evita o serrilhado de
  // ampliação, e sem mipmap porque o retalho é sempre visto por cima, na
  // escala para a qual foi pedido — e porque regerar mipmap a cada ladrilho
  // que chega custaria mais que o desenho.
  textura.minFilter = THREE.LinearFilter;
  textura.generateMipmaps = false;
  textura.anisotropy = 4;
  return textura;
}

/**
 * Malha curva que assenta o retalho na esfera.
 *
 * A grade é construída no espaço dos LADRILHOS e convertida para latitude e
 * longitude vértice a vértice — é isso que faz a projeção de Mercator casar
 * com a esfera sem esticar a imagem: no espaço de ladrilho a textura é linear,
 * e toda a deformação fica na posição dos vértices.
 */
function montarMalha(plano, textura) {
  const { z, x0, y0, nx, ny } = plano;

  // Um quadrado grande "corta" a curvatura da Terra por dentro. O passo é
  // escolhido para que nenhum quadrado passe de ~20 km de lado, o que deixa a
  // flecha em ~8 m — desprezível ao lado dos 127 m que separam esta camada do
  // preenchimento das áreas.
  const ladoLadrilhoM = metrosPorPixel(yParaLat(y0 + ny / 2, z), z) * LADRILHO_PX;
  const passos = Math.max(1, Math.min(8, Math.ceil(ladoLadrilhoM / 20000)));
  const colunas = nx * passos;
  const linhas = ny * passos;

  const posicoes = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= linhas; j++) {
    for (let i = 0; i <= colunas; i++) {
      const lon = xParaLon(x0 + (i / colunas) * nx, z);
      const lat = yParaLat(y0 + (j / linhas) * ny, z);
      const v = latLonToVec3(lat, lon, R_IMAGEM);
      posicoes.push(v.x, v.y, v.z);
      uvs.push(i / colunas, 1 - j / linhas);
    }
  }
  for (let j = 0; j < linhas; j++) {
    for (let i = 0; i < colunas; i++) {
      const a = j * (colunas + 1) + i;
      const b = a + 1;
      const c = a + (colunas + 1);
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(posicoes, 3));
  geometria.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometria.setIndex(indices);
  geometria.computeVertexNormals();

  // MeshBasicMaterial, e não Standard como a esfera: foto de satélite tem a
  // iluminação dentro dela. Reiluminar escureceria o lado da sombra do globo e
  // faria a mesma área parecer outra dependendo da hora do dia da cena.
  const material = new THREE.MeshBasicMaterial({
    map: textura,
    transparent: true,
    opacity: 0,          // aparece por transição, ver `update`
    depthWrite: false,
  });
  // `disposeDeep` do LayerManager libera geometria e material, mas não sabe da
  // textura pendurada. O evento de descarte do material é onde ela cabe.
  material.addEventListener('dispose', () => textura.dispose());

  const malha = new THREE.Mesh(geometria, material);
  malha.renderOrder = -1; // sempre antes das camadas vetoriais
  return malha;
}

// --- Camada -----------------------------------------------------------------

/**
 * @param {object} deps
 * @param {THREE.PerspectiveCamera} deps.camera
 * @param {object} deps.controls        OrbitControls (o alvo é o ponto olhado)
 * @param {THREE.WebGLRenderer} deps.renderer
 * @param {(estado: object) => void} [deps.onEstado]  avisa o HUD a cada mudança
 */
export async function criarImagensPorZoom({ camera, controls, renderer, onEstado }) {
  // ⚠️ REGISTRO LOCAL, e não vindo de servidor — é a diferença entre este
  // globo e a versão de onde este arquivo veio.
  //
  // O original nasceu servido por um FastAPI e buscava a lista de fontes em
  // `GET /api/v1/imagens/fontes`. Aqui não há backend: este globo é arquivo
  // estático dentro de `public/`, servido pela borda do Cloudflare.
  //
  // A consequência prática é que **só o modo de cor natural veio**. Ele não
  // precisa de servidor: o World Imagery da Esri manda
  // `Access-Control-Allow-Origin: *` (medido em 14/08/2026), então o navegador
  // busca o ladrilho direto e o WebGL aceita a textura.
  //
  // O modo de FALSA COR do INPE (mosaico PRODES) ficou de fora porque o
  // servidor deles **não** manda CORS, e sem isso o WebGL recusa a imagem —
  // não é política nossa, é o navegador. Trazê-lo exige uma rota de servidor
  // que reencaminhe o ladrilho (a convenção `.din.ts` deste repo). Fica
  // registrado como próximo passo, não como esquecimento: o pedido era imagem
  // mais nítida no zoom, e a cor natural entrega isso e ainda chega ao nível
  // 19 — contra o teto de 14 de um mosaico de 30 m.
  const registro = {
    modo_padrao: 'natural',
    ordem: ['natural'],
    modos: {
      natural: {
        label: 'Natural',
        atribuicao: 'Imagem: Esri World Imagery (Maxar, Earthstar Geographics)',
        zoom_max: 19,
        resolucao_m: null,
        fontes: [{
          id: 'esri-mundo',
          label: 'Mundo',
          direto: true,
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          bbox: [-180.0, -85.0, 180.0, 85.0],
        }],
      },
    },
  };

  let modoId = registro.modo_padrao;
  let modo = registro.modos[modoId];
  let fontes = modo.fontes;
  let zoomMax = modo.zoom_max;

  const group = new THREE.Group();
  let malhaAtual = null;
  let planoAtual = null;
  let geracao = 0;
  let paradaDesde = null;
  let ultimaAssinatura = '';
  let aparicaoInicio = null;

  const estado = {
    ligado: true,
    z: null,
    mpp: null,
    ladrilhos: 0,
    falhas: 0,
    carregando: false,
    modo: modoId,
    modos: registro.ordem.map((id) => ({ id, label: registro.modos[id].label })),
    atribuicao: modo.atribuicao,
    resolucaoM: modo.resolucao_m,
  };
  const avisar = () => onEstado?.({ ...estado });

  /** Onde a câmera está olhando e de que altura, em unidades humanas. */
  /**
   * Onde a câmera está olhando, e de que altura — pelo RAIO DA MIRA, não pelo
   * alvo dos controles.
   *
   * ⚠️ A primeira versão usava `controls.target`: latitude e longitude vinham
   * dele normalizado, e a altitude de `camera.position.distanceTo(target)`.
   * As duas coisas estão erradas, e `core/arrastar.js` já documentava por quê:
   * **o alvo só está na superfície depois de um `flyTo`**. Na abertura ele é o
   * padrão do OrbitControls — o CENTRO da Terra. Ali `normalize()` de (0,0,0)
   * devolve (0,0,0), então a latitude saía 0 e a longitude −180 (no meio do
   * Pacífico), e a "altitude" era a distância ao centro do planeta: 20.387 km
   * onde a real era 14.016. Com isso o nível calculado nunca passava do mínimo
   * e a camada não baixava um ladrilho sequer — foi exatamente o que aconteceu
   * ao portar este arquivo para cá.
   *
   * A conta certa é a mesma de `distanciaAoChao`: onde o raio que sai da
   * câmera pela mira encontra a esfera de raio 1. Esse ponto dá as duas
   * respostas de uma vez — o lugar olhado e a distância até ele.
   *
   * Mira apontada para fora do planeta (a borda do globo contra o espaço) não
   * tem chão: aí não há o que texturizar, e a camada se cala.
   */
  function vista() {
    const o = camera.position;
    const d = new THREE.Vector3();
    camera.getWorldDirection(d);
    // |o + t·d|² = 1  →  t² + 2(o·d)t + (|o|²−1) = 0
    const b = 2 * o.dot(d);
    const c = o.lengthSq() - 1;
    const disc = b * b - 4 * c;
    if (disc < 0) return null;
    const t = (-b - Math.sqrt(disc)) / 2;
    if (t <= 0) return null;

    const ponto = o.clone().addScaledVector(d, t).normalize();
    const lat = radParaGraus(Math.asin(ponto.y));
    // Inversa exata de `latLonToVec3`: x = −sin φ cos θ, z = +sin φ sin θ.
    const lon = radParaGraus(Math.atan2(ponto.z, -ponto.x)) - 180;
    return { lat, lon: ((lon + 540) % 360) - 180, altitudeM: t * RAIO_TERRA_M };
  }

  /**
   * Decide o nível e o recorte de ladrilhos para a vista atual.
   * @returns {null|{z:number,x0:number,y0:number,nx:number,ny:number,lat:number,lon:number}}
   */
  function planejar() {
    const { lat, lon, altitudeM } = vista();
    const alturaPx = renderer.domElement.clientHeight || 1;
    const meiaAlturaM = altitudeM * Math.tan(grausParaRad(camera.fov) / 2);

    // Nível em que o pixel do ladrilho fica na escala do pixel da tela. Pedir
    // mais que isso é baixar detalhe que a tela não mostra; pedir menos é
    // esticar imagem.
    const mppTela = (2 * meiaAlturaM) / alturaPx;
    const zIdeal = Math.round(Math.log2((MPP_EQUADOR_Z0 * Math.cos(grausParaRad(lat))) / mppTela));
    let z = Math.min(zoomMax, zIdeal);
    if (z < ZOOM_MINIMO) return null;

    // Aproximar além do que a fonte tem não revela nada: só amplia o mesmo
    // pixel. Quem olha um borrão precisa saber se é o borrão do dado ou se o
    // app está com defeito — são diagnósticos opostos e a tela é a mesma.
    const ampliado = zIdeal > zoomMax;

    // Margem de 1,25: arrastar um pouco não pode abrir borda vazia na tela.
    const meiaLarguraM = meiaAlturaM * camera.aspect;
    const grausLat = ((meiaAlturaM * 1.25) / 111320);
    const grausLon = (meiaLarguraM * 1.25) / (111320 * Math.max(0.05, Math.cos(grausParaRad(lat))));

    for (; z >= ZOOM_MINIMO; z--) {
      const limite = 2 ** z;
      const x0 = Math.max(0, Math.floor(lonParaX(lon - grausLon, z)));
      const x1 = Math.min(limite, Math.ceil(lonParaX(lon + grausLon, z)));
      const y0 = Math.max(0, Math.floor(latParaY(lat + grausLat, z)));
      const y1 = Math.min(limite, Math.ceil(latParaY(lat - grausLat, z)));
      const nx = Math.max(1, x1 - x0);
      const ny = Math.max(1, y1 - y0);
      if (nx * ny <= ORCAMENTO_LADRILHOS) return { z, x0, y0, nx, ny, lat, lon, ampliado };
    }
    return null;
  }

  /**
   * Monta o retalho do nível pedido e o põe no lugar do anterior.
   *
   * A troca acontece no PRIMEIRO ladrilho desenhado, não no último: o retalho
   * anterior (menos nítido, mas inteiro) fica na tela até haver o que mostrar,
   * e a partir daí o novo preenche à vista. Trocar no começo faria o Blue
   * Marble piscar entre um nível e o seguinte; trocar só no fim deixaria a
   * pessoa esperando meio minuto olhando o borrão.
   */
  async function reconstruir(plano) {
    const minhaGeracao = ++geracao;
    const cancelado = () => minhaGeracao !== geracao;

    const canvas = document.createElement('canvas');
    canvas.width = plano.nx * LADRILHO_PX;
    canvas.height = plano.ny * LADRILHO_PX;
    const ctx = canvas.getContext('2d');
    const textura = criarTextura(canvas);
    const malha = montarMalha(plano, textura);
    let apresentada = false;

    const apresentar = () => {
      if (apresentada || cancelado()) return;
      apresentada = true;
      group.add(malha);
      if (malhaAtual) descartar(malhaAtual);
      malhaAtual = malha;
      aparicaoInicio = performance.now();
    };

    // Vale desde já: um plano em que a INPE não tem pixel nenhum não pode ser
    // tentado de novo a cada frame. `planoAtual` é o plano que a camada já
    // resolveu — com imagem ou com a conclusão de que ali não há imagem.
    planoAtual = plano;
    estado.z = plano.z;
    estado.mpp = metrosPorPixel(plano.lat, plano.z);
    estado.ampliado = plano.ampliado;
    estado.ladrilhos = 0;
    estado.falhas = 0;
    estado.carregando = true;
    avisar();

    const { desenhados, falhas } = await baixarLadrilhos(
      fontes, plano, ctx, cancelado,
      ({ desenhados: n, falhas: f }) => {
        textura.needsUpdate = true;   // manda o novo pedaço para a GPU
        apresentar();
        estado.ladrilhos = n;
        estado.falhas = f;
        avisar();
      },
    );

    if (cancelado()) {
      // Se chegou a entrar na cena, quem descarta é a geração seguinte.
      if (!apresentada) descartarSolta(malha);
      return;
    }

    if (!apresentada) {
      // Nenhum ladrilho tinha pixel: fora do Brasil, ou a INPE fora do ar.
      // Folha transparente sobre o globo não é imagem — é peso.
      descartarSolta(malha);
      limpar();
      estado.z = null;
      estado.mpp = null;
      estado.ladrilhos = 0;
      estado.falhas = falhas;
      estado.carregando = false;
      avisar();
      return;
    }

    estado.ladrilhos = desenhados;
    estado.falhas = falhas;
    estado.carregando = false;
    avisar();
  }

  /** Libera uma malha que nunca entrou na cena. */
  function descartarSolta(malha) {
    malha.geometry.dispose();
    malha.material.dispose(); // dispara o descarte da textura (ver montarMalha)
  }

  function descartar(malha) {
    group.remove(malha);
    descartarSolta(malha);
  }

  function limpar() {
    if (!malhaAtual) return;
    descartar(malhaAtual);
    malhaAtual = null;
  }

  /**
   * Chamada a cada frame pelo LayerManager.
   *
   * Duas responsabilidades: fazer a transição de aparição avançar (que é por
   * frame) e decidir se o retalho precisa ser refeito (que é por pausa da
   * câmera, nunca por frame).
   */
  function update() {
    const agora = performance.now();

    if (malhaAtual && aparicaoInicio != null) {
      const t = Math.min(1, (agora - aparicaoInicio) / DURACAO_APARICAO_MS);
      malhaAtual.material.opacity = t;
      if (t === 1) aparicaoInicio = null;
    }

    const plano = planejar();
    const assinatura = plano ? `${plano.z}/${plano.x0}/${plano.y0}/${plano.nx}/${plano.ny}` : '';

    if (assinatura !== ultimaAssinatura) {
      ultimaAssinatura = assinatura;
      paradaDesde = agora;
      return;
    }
    if (paradaDesde == null || agora - paradaDesde < PAUSA_ANTES_DE_BUSCAR_MS) return;
    paradaDesde = null;

    if (!plano) {
      // Subiu para longe demais: o Blue Marble volta a ser a imagem certa.
      // `planoAtual` zera junto, senão descer de novo na mesma área encontraria
      // o plano "já resolvido" e não redesenharia nada.
      if (malhaAtual || planoAtual) {
        limpar();
        planoAtual = null;
        estado.z = null;
        estado.mpp = null;
        estado.ladrilhos = 0;
        estado.carregando = false;
        avisar();
      }
      return;
    }

    const jaDesenhado =
      planoAtual &&
      planoAtual.z === plano.z &&
      planoAtual.x0 === plano.x0 &&
      planoAtual.y0 === plano.y0 &&
      planoAtual.nx === plano.nx &&
      planoAtual.ny === plano.ny;
    if (jaDesenhado) return;

    reconstruir(plano).catch((err) => console.warn('[imagens] retalho não montado:', err));
  }

  /**
   * Troca entre cor natural e falsa cor do INPE.
   *
   * Não é filtro sobre a mesma imagem: são fontes diferentes, com escalas
   * máximas diferentes (19 contra 14). Por isso o retalho atual é jogado fora
   * inteiro — reaproveitar pedaço de uma na outra mostraria dois lugares com a
   * mesma cara e cores incompatíveis.
   */
  function trocarModo(novoId) {
    if (!registro.modos[novoId] || novoId === modoId) return;
    modoId = novoId;
    modo = registro.modos[novoId];
    fontes = modo.fontes;
    zoomMax = modo.zoom_max;

    limpar();
    planoAtual = null;
    ultimaAssinatura = '';
    geracao++; // invalida qualquer busca ainda em voo do modo anterior

    estado.modo = modoId;
    estado.atribuicao = modo.atribuicao;
    estado.resolucaoM = modo.resolucao_m;
    estado.z = null;
    estado.mpp = null;
    estado.ladrilhos = 0;
    estado.falhas = 0;
    estado.carregando = false;
    avisar();
  }

  // O LayerManager só repassa `group` e `update`; o resto do app chega aqui
  // pelo `userData` do grupo, que é o que ele guarda na cena.
  group.userData.trocarModo = trocarModo;
  group.userData.modos = estado.modos;

  avisar();
  return { group, update, featureCount: 0 };
}
