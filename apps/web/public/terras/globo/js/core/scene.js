// core/scene.js — palco WebGL do globo "sala de controle"
// Contrato congelado: createScene(container) -> { renderer, scene, camera }
// Look do referência ORBIT VEIL: ACESFilmicToneMapping + hemisphere + sol direcional.

import * as THREE from 'three';

/**
 * Cria renderer, cena e câmera do globo.
 * @param {HTMLElement} container - elemento (ex.: #globe-container) que recebe o <canvas>
 * @returns {{ renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera }}
 */
export function createScene(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;        // look cinematográfico do referência
  renderer.toneMappingExposure = 1.15;                        // leve boost p/ realçar a textura Blue Marble
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // teto de pixelRatio p/ performance
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04060a);              // fundo "quase-preto azulado" do design system

  // near/far em raios terrestres (raio = 1 ≈ 6.371 km).
  // near 0.0002 ≈ 1,3 km: é o piso do zoom profundo — mais perto que isso e o
  // chão começa a ser cortado pelo plano near. Estava 0.001 (6,4 km), o que
  // limitava a aproximação antes mesmo dos controles.
  // far 12 cobre a cena inteira (câmera no limite de afastamento, 9 do centro,
  // vendo o lado oposto do globo a ~10). Estava 2000, jogando fora precisão de
  // profundidade à toa: a razão far/near caiu de 2.000.000 para 60.000, o que
  // deixa o preenchimento das camadas (R=1.0008) e o contorno (R=1.0015) mais
  // estáveis contra z-fighting justamente no zoom fundo.
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.0002,
    12
  );
  camera.position.set(0, 0, 3.2);                            // posição inicial (~Brasil de cara)

  // Luz ambiente (céu/solo) forte o bastante para o lado "noite" continuar legível,
  // + "sol" direcional posicionado sobre a América do Sul (foco do app é o Brasil).
  const hemi = new THREE.HemisphereLight(0x8fb8ff, 0x1a2028, 0.95);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(3, 0.5, 4);                               // ~sobre o Brasil (normal ≈ (0.6, -0.25, 0.76))
  scene.add(sun);

  return { renderer, scene, camera };
}
