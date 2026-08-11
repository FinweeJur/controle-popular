// core/flyto.js — voo animado da câmera entre presets de foco (o coração dos botões de foco)
// Contrato congelado: flyTo(camera, controls, preset)
//   preset = { id, label, lat, lon, distance } — ver FOCUS_PRESETS em config.js
// Interpola posição da câmera e target com easing easeInOutCubic (~1800ms), cancelável.
//
// DOIS REFERENCIAIS, e confundi-los foi um bug real:
//   • `preset.distance` é distância ao CENTRO da Terra (raio 1 = superfície);
//   • `controls.minDistance/maxDistance` são distância ao TARGET, que este voo
//     deixa na superfície — ou seja, altitude.
// O voo pousava a câmera fora da faixa permitida e o OrbitControls a
// reposicionava no frame seguinte, sem avisar ninguém: três presets diferentes
// terminavam na mesma altura. Agora o destino é limitado aqui, com aviso no
// console quando precisa ser corrigido.

import * as THREE from 'three';
import { latLonToVec3 } from './earth.js';

/**
 * Ajusta a distância pedida à faixa que os controles aceitam, convertendo
 * entre os dois referenciais. Devolve a distância ao centro da Terra.
 */
function distanciaPermitida(controls, distanciaAoCentro, idPreset) {
  const altMin = controls?.minDistance ?? 0.0004;
  const altMax = controls?.maxDistance ?? 8;
  const limitada = THREE.MathUtils.clamp(distanciaAoCentro, 1 + altMin, 1 + altMax);
  if (Math.abs(limitada - distanciaAoCentro) > 1e-6) {
    console.warn(
      `[flyTo] distância ${distanciaAoCentro.toFixed(4)} do preset "${idPreset}" está fora dos ` +
      `limites dos controles (altitude entre ${altMin} e ${altMax}); usando ${limitada.toFixed(4)}.`,
    );
  }
  return limitada;
}

// Easing cúbico de entrada/saída — suave no início e no fim do voo
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Handle do voo em andamento; um novo flyTo cancela o anterior
let vooAtual = null;

/**
 * Voa a câmera suavemente até um preset de foco.
 * @param {THREE.PerspectiveCamera} camera
 * @param {OrbitControls} controls
 * @param {{ lat: number, lon: number, distance: number, durMs?: number }} preset
 * @returns {{ cancel: () => void }} handle para cancelar manualmente
 */
export function flyTo(camera, controls, preset) {
  // Cancela voo anterior, se houver (cliques rápidos em presets diferentes)
  if (vooAtual) vooAtual.cancel();

  const dur = preset.durMs ?? 1800;

  // Alvo: ponto na superfície; destino da câmera: mesma direção, na distância do preset
  const alvoFinal = latLonToVec3(preset.lat, preset.lon, 1);
  const distancia = distanciaPermitida(controls, preset.distance, preset.id ?? '?');
  const destino = alvoFinal.clone().normalize().multiplyScalar(distancia);

  const posInicial = camera.position.clone();
  const alvoInicial = controls.target.clone();

  let frameId = null;
  let cancelado = false;
  const t0 = performance.now();

  function passo(agora) {
    if (cancelado) return;
    const t = Math.min((agora - t0) / dur, 1); // progresso 0..1
    const e = easeInOutCubic(t);

    // Interpola posição e target em conjunto (voo "arqueado" natural)
    camera.position.lerpVectors(posInicial, destino, e);
    controls.target.lerpVectors(alvoInicial, alvoFinal, e);

    if (t < 1) {
      frameId = requestAnimationFrame(passo);
    } else {
      vooAtual = null; // voo concluído
    }
  }

  frameId = requestAnimationFrame(passo);

  vooAtual = {
    cancel() {
      cancelado = true;
      if (frameId !== null) cancelAnimationFrame(frameId);
      if (vooAtual === this) vooAtual = null;
    },
  };

  return vooAtual;
}
