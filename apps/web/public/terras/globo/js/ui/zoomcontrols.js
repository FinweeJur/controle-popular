/**
 * zoomcontrols.js — botões de zoom in/out do globo.
 *
 * Dois botões "+" / "−" empilhados (HUD, canto direito inferior) que
 * aproximam/afastam a câmera do alvo do OrbitControls, respeitando
 * minDistance/maxDistance dos controles.
 *
 * Classes CSS esperadas (definidas em ../css/hud.css — NÃO estilizar aqui):
 *   #zoombar   — container vertical fixo
 *   .zoom-btn  — botão quadrado mono, acento ciano no hover
 *
 * API pública:
 *   createZoomControls(document.getElementById('zoombar'), controls);
 */

import * as THREE from 'three';

/**
 * @param {HTMLElement} el            container (#zoombar)
 * @param {OrbitControls} controls    controles do globo (câmera em .object)
 * @param {object} [opts]
 * @param {number} [opts.stepIn=0.7]   fator de aproximação por clique (<1)
 * @param {number} [opts.stepOut=1.43] fator de afastamento por clique (>1)
 */
export function createZoomControls(el, controls, { stepIn = 0.7, stepOut = 1.43 } = {}) {
  el.innerHTML = '';

  const makeBtn = (label, title, factor) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'zoom-btn';
    btn.textContent = label;
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.addEventListener('click', () => zoomBy(controls, factor));
    el.appendChild(btn);
    return btn;
  };

  makeBtn('+', 'Aproximar (zoom in)', stepIn);
  makeBtn('−', 'Afastar (zoom out)', stepOut);
}

/**
 * Move a câmera ao longo do vetor alvo→câmera, com clamp em min/maxDistance.
 * Os limites são distância ao ALVO (que fica na superfície) — altitude, não
 * distância ao centro da Terra. A reserva antiga aqui era 1.004, herdada da
 * confusão entre os dois referenciais, e travava o zoom a 6.396 km de altura.
 */
function zoomBy(controls, factor) {
  const cam = controls.object;
  const offset = cam.position.clone().sub(controls.target);
  const newLen = THREE.MathUtils.clamp(
    offset.length() * factor,
    controls.minDistance ?? 0.0004,
    controls.maxDistance ?? 8,
  );
  cam.position.copy(controls.target).add(offset.setLength(newLen));
  controls.update();
}
