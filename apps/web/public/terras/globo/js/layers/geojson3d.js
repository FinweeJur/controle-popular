/**
 * geojson3d.js — conversão de GeoJSON (EPSG:4326) em objetos Three.js
 * posicionados sobre a esfera unitária (ver plano §4.4).
 *
 * Regras de performance (plano §6): UMA geometria fundida por camada
 * (1 draw call), nunca 1 mesh por feição.
 */

import * as THREE from 'three';
import { latLonToVec3 } from '../core/earth.js';
import { tamanhoDePontoEmPx } from './pontos.js';

/**
 * Altura das camadas sobre a superfície.
 *
 * Eram 1.0015 e 1.0008 — ou seja, os contornos flutuavam 9,6 km acima do chão
 * e o preenchimento 5,1 km. Isso passa despercebido vendo o país inteiro e
 * arruína o zoom de município: a mancha aparece deslocada do lugar real por
 * paralaxe (a 100 km de altitude, alguns quilômetros na borda da tela) e,
 * abaixo de 9,6 km, a câmera passa POR BAIXO dos polígonos.
 *
 * A altura existia para não brigar com a textura no z-buffer. A briga agora é
 * resolvida onde deveria: a esfera da Terra recebe polygonOffset (core/earth.js),
 * que empurra a superfície no espaço de profundidade e acompanha sozinho a
 * precisão disponível em cada escala. Aqui basta um fio de folga.
 */
const R_LAYER = 1.00004;  // contorno, ~255 m
const R_FILL = 1.00002;   // preenchimento, ~127 m: abaixo do contorno

/**
 * Extrai todos os anéis/linhas de uma geometria GeoJSON como arrays de
 * pares [lon, lat]. Suporta Polygon, MultiPolygon, LineString e
 * MultiLineString (demais tipos são ignorados nesta fase).
 */
function ringsOf(geometry) {
  if (!geometry) return [];
  switch (geometry.type) {
    case 'Polygon':
      return geometry.coordinates; // [[anel externo, furos...]]
    case 'MultiPolygon':
      return geometry.coordinates.flat(); // funde anéis de todos os polígonos
    case 'LineString':
      return [geometry.coordinates];
    case 'MultiLineString':
      return geometry.coordinates;
    default:
      return [];
  }
}

/**
 * Percorre as feições de uma FeatureCollection respeitando um filtro opcional.
 *
 * Existe para que o filtro de região do painel possa desenhar só PARTE de um
 * arquivo sem que ninguém precise construir uma FeatureCollection nova. Isso
 * não é economia de alocação: é o que mantém o índice de cada área igual ao
 * índice dela NO ARQUIVO. O índice é endereço público — vai no deep-link
 * `#area=<fonte>:<índice>` e no link da vista 2D — então uma cópia filtrada,
 * que renumera de 0, quebraria todo link já compartilhado de uma área que por
 * acaso ficasse depois de uma escondida.
 *
 * @param {object} fc
 * @param {(feature: object, i: number) => boolean} [incluir]
 * @yields {object} feature
 */
function* feicoes(fc, incluir) {
  const lista = fc.features ?? [];
  for (let i = 0; i < lista.length; i++) {
    if (incluir && !incluir(lista[i], i)) continue;
    yield lista[i];
  }
}

/**
 * Converte uma FeatureCollection em THREE.LineSegments (contornos).
 * Cada par de vértices consecutivos de cada anel vira um segmento.
 *
 * @param {object} fc   GeoJSON FeatureCollection
 * @param {object} [opts]
 * @param {number|string} [opts.color=0x38bdf8] cor da linha (hex do registro)
 * @param {number} [opts.opacity=0.9]
 * @param {function} [opts.incluir] filtro por feição — ver `feicoes()`
 * @returns {THREE.LineSegments}
 */
export function geojsonToLines(fc, { color = 0x38bdf8, opacity = 0.9, incluir } = {}) {
  const positions = [];
  for (const f of feicoes(fc, incluir)) {
    for (const ring of ringsOf(f.geometry)) {
      for (let i = 0; i < ring.length - 1; i++) {
        const [lonA, latA] = ring[i];
        const [lonB, latB] = ring[i + 1];
        positions.push(
          ...latLonToVec3(latA, lonA, R_LAYER).toArray(),
          ...latLonToVec3(latB, lonB, R_LAYER).toArray(),
        );
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  return new THREE.LineSegments(geometry, material);
}

/**
 * Converte polígonos de uma FeatureCollection em MESH PREENCHIDA
 * (triangulação 2D em lon/lat via ShapeGeometry, projetada na esfera).
 * Uso: áreas que precisam ser VISÍVEIS/identificáveis em zoom profundo
 * (ex.: candidatos a verificação — ver plano §5 e objetivo central do app).
 * O preenchimento fica ligeiramente abaixo do contorno (R_FILL < R_LAYER).
 *
 * @param {object} fc   GeoJSON FeatureCollection (Polygon/MultiPolygon)
 * @param {object} [opts]
 * @param {number|string} [opts.color=0xfbbf24]
 * @param {number} [opts.opacity=0.28]
 * @param {function} [opts.incluir] filtro por feição — ver `feicoes()`
 * @returns {THREE.Mesh}
 */
export function geojsonToFilled(fc, { color = 0xfbbf24, opacity = 0.28, incluir } = {}) {
  const positions = [];
  const indices = [];
  let offset = 0;
  for (const f of feicoes(fc, incluir)) {
    const polys = f.geometry?.type === 'Polygon' ? [f.geometry.coordinates]
      : f.geometry?.type === 'MultiPolygon' ? f.geometry.coordinates
      : [];
    for (const rings of polys) {
      if (!rings?.length) continue;
      // Anel externo + furos, em espaço lon/lat (x=lon, y=lat)
      const shape2d = new THREE.Shape(rings[0].map(([lon, lat]) => new THREE.Vector2(lon, lat)));
      shape2d.holes = rings.slice(1).map(
        (ring) => new THREE.Path(ring.map(([lon, lat]) => new THREE.Vector2(lon, lat))),
      );
      const g2d = new THREE.ShapeGeometry(shape2d);
      const p = g2d.getAttribute('position');
      for (let i = 0; i < p.count; i++) {
        positions.push(...latLonToVec3(p.getY(i), p.getX(i), R_FILL).toArray());
      }
      const idx = g2d.getIndex();
      if (idx) for (let i = 0; i < idx.count; i++) indices.push(idx.getX(i) + offset);
      else for (let i = 0; i < p.count; i++) indices.push(i + offset);
      offset += p.count;
      g2d.dispose();
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  const material = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity,
    side: THREE.DoubleSide,  // winding varia entre fontes GeoJSON
    depthWrite: false,       // não esconder o contorno nem outras camadas
  });
  return new THREE.Mesh(geometry, material);
}

/**
 * Stub (G2): converte feições de ponto em THREE.Points — 1 draw call para
 * milhares de feições. Hoje usa PointsMaterial simples.
 *
 * ⚠️ `sizeAttenuation: false` + tamanho em PIXELS — não radianos. Os
 * `pointSize` do registro (0,005–0,007) nasceram calibrados para unidades
 * de mundo: 0,006 rad sobre a esfera unitária são ~38 km, e cada ponto
 * virava um quadrado gigante no zoom da bacia (imóveis da União,
 * reportado em 15/08). A conversão mora em `pontos.js`, com teste.
 *
 * TODO(G2): trocar por ShaderMaterial de sprite redondo com rampa de cor
 * por propriedade (score do pipeline: verde → âmbar → vermelho), conforme
 * plano §4.4.
 *
 * @param {object} fc   GeoJSON FeatureCollection (geometrias Point/MultiPoint)
 * @param {object} [opts]
 * @param {number|string} [opts.color=0xfbbf24]
 * @param {number} [opts.size=0.006] pointSize do registro (ver pontos.js)
 * @param {function} [opts.incluir] filtro por feição — ver `feicoes()`
 * @returns {THREE.Points}
 */
export function geojsonToPoints(fc, { color = 0xfbbf24, size = 0.006, incluir } = {}) {
  const positions = [];
  for (const f of feicoes(fc, incluir)) {
    const g = f.geometry;
    if (!g) continue;
    const coords = g.type === 'Point' ? [g.coordinates]
      : g.type === 'MultiPoint' ? g.coordinates
      : [];
    for (const [lon, lat] of coords) {
      positions.push(...latLonToVec3(lat, lon, R_LAYER).toArray());
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color,
    size: tamanhoDePontoEmPx(size),
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.95,
  });
  return new THREE.Points(geometry, material);
}
