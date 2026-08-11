/**
 * layers/satelites.js — satélites dos sensores do projeto orbitando de verdade
 * (Fase G3, plano §4.6): Sentinel-2A/B, Landsat-9 e CBERS-4A propagados com
 * SGP4 (satellite.js, vendor UMD em window.satellite) a partir de TLEs do
 * CelesTrak (data/tle.json — atualizar com pipeline/atualizar_tle.py).
 *
 * Cada satélite = esfera pequena na cor do sensor + trilha orbital de 1 período.
 * Integra ao LayerManager como camada custom (render: 'custom' no registry):
 * enable() devolve um THREE.Group pronto para a cena.
 */

import * as THREE from 'three';
import { latLonToVec3 } from '../core/earth.js';

const TLE_URL = '/terras/globo/data/tle.json';
const RAIO_TERRA_KM = 6371;
const TRACK_PONTOS = 90;          // amostras da trilha orbital (1 por minuto)

/** Converte posição ECI (km) para vetor da cena (raio da Terra = 1). */
function eciParaVec3(posEci, gmst) {
  const geo = window.satellite.eciToGeodetic(posEci, gmst);
  const lat = window.satellite.degreesLat(geo.latitude);
  const lon = window.satellite.degreesLong(geo.longitude);
  const raio = 1 + geo.height / RAIO_TERRA_KM;   // altitude real em escala da cena
  return latLonToVec3(lat, lon, raio);
}

/** Monta a camada de satélites. @returns {Promise<THREE.Group>} */
export async function createSatellitesGroup() {
  if (!window.satellite) throw new Error('satellite.js (vendor) não carregado');
  const resp = await fetch(TLE_URL);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} em ${TLE_URL}`);
  const { satelites } = await resp.json();

  const group = new THREE.Group();
  group.name = 'layer:satelites-orbita';
  const registros = [];

  for (const s of satelites) {
    const rec = window.satellite.twoline2satrec(s.tle1, s.tle2);
    const cor = new THREE.Color(`#${s.cor ?? 'e5e7eb'}`);

    const corpo = new THREE.Mesh(
      new THREE.SphereGeometry(0.006, 12, 12),
      new THREE.MeshBasicMaterial({ color: cor }),
    );
    corpo.name = `sat:${s.nome}`;
    group.add(corpo);

    const trackGeom = new THREE.BufferGeometry();
    trackGeom.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(TRACK_PONTOS * 3), 3));
    const track = new THREE.Line(trackGeom, new THREE.LineBasicMaterial({
      color: cor, transparent: true, opacity: 0.35,
    }));
    track.name = `track:${s.nome}`;
    group.add(track);

    registros.push({ nome: s.nome, rec, corpo, track });
  }

  /** Atualiza posições (chamado a cada frame) e trilhas (a cada ~60s). */
  let ultimoTrack = 0;
  function update(agora) {
    const gmst = window.satellite.gstime(agora);
    const refazerTrack = agora - ultimoTrack > 60_000;
    for (const r of registros) {
      const saida = window.satellite.propagate(r.rec, agora);
      if (!saida?.position) continue;             // satélite decaiu/erro → some
      r.corpo.position.copy(eciParaVec3(saida.position, gmst));
      if (refazerTrack) {
        const attr = r.track.geometry.getAttribute('position');
        // Trilha: 1 período orbital para trás a partir de agora (1 amostra/min)
        const periodoMin = (2 * Math.PI) / r.rec.no;
        for (let i = 0; i < TRACK_PONTOS; i++) {
          const t = new Date(agora.getTime() - (periodoMin * 60_000 * i) / (TRACK_PONTOS - 1));
          const p = window.satellite.propagate(r.rec, t);
          if (p?.position) {
            const v = eciParaVec3(p.position, window.satellite.gstime(t));
            attr.setXYZ(TRACK_PONTOS - 1 - i, v.x, v.y, v.z);
          }
        }
        attr.needsUpdate = true;
      }
    }
    if (refazerTrack) ultimoTrack = agora;
  }

  return { group, update, featureCount: registros.length };
}
