/**
 * core/enquadrar.js — a que distância a câmera precisa ficar para uma região
 * caber na tela.
 *
 * Existe porque as distâncias dos presets eram números escolhidos à mão, e à
 * mão não dá para acertar: a mesma distância que enquadra Minas numa tela
 * 16:9 corta Minas numa tela 4:3, e nenhum número fixo serve para Brasil e
 * para um município ao mesmo tempo. Aqui a distância sai da geometria do
 * recorte e do formato da janela de quem está olhando.
 *
 * Geometria: câmera a distância `d` do centro da Terra (raio 1), olhando para
 * o ponto `u` da superfície. Um ponto a `α` graus de `u` aparece a um ângulo
 * `β` do eixo da câmera, com `tan β = sen α / (d − cos α)`. Para o ponto caber
 * no frustum é preciso `β ≤ θ`, o que dá:
 *
 *     d ≥ cos α + sen α / tan θ
 *
 * θ não é o mesmo em toda direção — a seção do frustum é um retângulo, não um
 * círculo. Por isso θ é calculado no azimute de cada vértice.
 */

import * as THREE from 'three';
import { latLonToVec3 } from './earth.js';

/** Percorre uma FeatureCollection devolvendo cada par [lon, lat]. */
export function* coordenadasDe(fc) {
  for (const f of fc?.features ?? []) {
    const g = f.geometry;
    if (!g) continue;
    const anéis =
      g.type === 'Polygon' ? g.coordinates
      : g.type === 'MultiPolygon' ? g.coordinates.flat()
      : g.type === 'LineString' ? [g.coordinates]
      : g.type === 'MultiLineString' ? g.coordinates
      // Ponto embrulhado em anel de um par só: a camada de imóveis da União é
      // de pontos, e sem isto `centroDe` devolvia null — o deep-link não abria
      // a ficha e o botão "Focar nesta área" não tinha para onde ir, os dois
      // falhando calados.
      : g.type === 'Point' ? [[g.coordinates]]
      : g.type === 'MultiPoint' ? [g.coordinates]
      : [];
    for (const anel of anéis) for (const par of anel) yield par;
  }
}

/** Centro da caixa envolvente do recorte, em [lat, lon]. */
export function centroDe(fc) {
  let lonMin = Infinity, lonMax = -Infinity, latMin = Infinity, latMax = -Infinity;
  for (const [lon, lat] of coordenadasDe(fc)) {
    if (lon < lonMin) lonMin = lon;
    if (lon > lonMax) lonMax = lon;
    if (lat < latMin) latMin = lat;
    if (lat > latMax) latMax = lat;
  }
  if (!Number.isFinite(lonMin)) return null;
  return { lat: (latMin + latMax) / 2, lon: (lonMin + lonMax) / 2 };
}

/**
 * Distância da câmera ao centro da Terra para que todo o recorte caiba na tela.
 *
 * @param {Iterable<[number, number]>} coordenadas pares [lon, lat] do recorte
 * @param {{lat: number, lon: number}} centro   ponto para onde a câmera olha
 * @param {object} opts
 * @param {number} opts.fovDeg    abertura vertical da câmera, em graus
 * @param {number} opts.aspect    largura/altura da janela
 * @param {number} [opts.folga=1.15]  quanto de respiro sobra em volta (1.15 = 15%)
 * @param {number} [opts.altMin=0.0004] altitude mínima, em raios terrestres
 * @param {number} [opts.altMax=8]      altitude máxima, em raios terrestres
 * @returns {number} distância ao centro da Terra (1 = superfície)
 */
export function distanciaParaEnquadrar(coordenadas, centro, { fovDeg, aspect, folga = 1.15, altMin = 0.0004, altMax = 8 }) {
  const u = latLonToVec3(centro.lat, centro.lon, 1).normalize();

  // Base tangente no ponto observado: leste e norte locais.
  const eixoPolar = new THREE.Vector3(0, 1, 0);
  let leste = new THREE.Vector3().crossVectors(eixoPolar, u);
  if (leste.lengthSq() < 1e-12) leste = new THREE.Vector3(1, 0, 0); // exatamente sobre um polo
  leste.normalize();
  const norte = new THREE.Vector3().crossVectors(u, leste).normalize();

  const tanV = Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2);
  const tanH = tanV * aspect;

  const q = new THREE.Vector3();
  let dNecessario = 0;

  for (const [lon, lat] of coordenadas) {
    q.copy(latLonToVec3(lat, lon, 1));
    const cosA = THREE.MathUtils.clamp(q.dot(u), -1, 1);
    const alfa = Math.acos(cosA);
    if (alfa < 1e-9) continue;
    const senA = Math.sin(alfa);

    // Azimute do vértice no plano tangente, e a meia-abertura do frustum ali.
    const phi = Math.atan2(q.dot(norte), q.dot(leste));
    const cosPhi = Math.abs(Math.cos(phi));
    const senPhi = Math.abs(Math.sin(phi));
    const tanTheta = Math.min(
      cosPhi < 1e-9 ? Infinity : tanH / cosPhi,
      senPhi < 1e-9 ? Infinity : tanV / senPhi,
    ) / folga;

    const d = cosA + senA / tanTheta;
    if (d > dNecessario) dNecessario = d;
  }

  if (dNecessario === 0) return 1 + altMin; // recorte vazio ou de um ponto só
  return THREE.MathUtils.clamp(dNecessario, 1 + altMin, 1 + altMax);
}
