// core/controls.js — OrbitControls com damping e limites de zoom do globo
// Contrato congelado: createControls(camera, domElement) -> OrbitControls

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/** Raio da Terra em quilômetros — só para converter os limites em comentário. */
const R_KM = 6371;

/**
 * Cria os controles de órbita do globo.
 *
 * ATENÇÃO AO REFERENCIAL, que já custou um bug: `minDistance` e `maxDistance`
 * do OrbitControls são medidos **da câmera até `controls.target`**, e o
 * `flyTo` põe o target na SUPERFÍCIE (raio 1). Ou seja, aqui os dois números
 * são ALTITUDE acima do ponto observado — não distância ao centro da Terra.
 *
 * Estavam valendo 1.004 e 8, escritos como se fossem distância ao centro
 * ("zoom profundo: chega a nível municipal"). O efeito era o oposto: a cada
 * frame o OrbitControls empurrava a câmera para 1,004 raio ACIMA da
 * superfície, ou seja 6.396 km de altitude, e o zoom não passava disso.
 * Sudeste, Minas e Curvelo terminavam todos na mesma distância.
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {HTMLElement} domElement - normalmente renderer.domElement
 * @returns {OrbitControls}
 */
export function createControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;      // inércia suave ao soltar o mouse
  controls.dampingFactor = 0.08;

  // 0.0004 × 6371 km ≈ 2,5 km de altitude: dá para ver uma parcela de 500 ha
  // (~2 km de lado) ocupando boa parte da tela. Tem de ficar acima do plano
  // near da câmera (scene.js: 0.0002 ≈ 1,3 km), senão o chão some por clipping.
  controls.minDistance = 0.0004;
  // 8 raios de altitude: o globo inteiro cabe com folga (a Terra fecha o disco
  // por volta de 1,6) e ainda dá para afastar, sem sumir na distância.
  controls.maxDistance = 8;

  controls.zoomSpeed = 1.6;           // scroll mais ágil p/ atravessar escalas (país → município)
  controls.enablePan = false;         // o pan do OrbitControls translada o target no espaço e
                                      // descolaria a câmera do globo — ver core/arrastar.js
  controls.rotateSpeed = 0.55;

  // Botão esquerdo NÃO orbita: quem responde por ele é `core/arrastar.js`, que
  // gira o globo sob a câmera. Orbitar com o alvo grudado na superfície faz a
  // câmera dar a volta num ponto fixo — você roda no lugar e nunca chega no
  // vizinho, que era a queixa. A órbita continua existindo, no botão direito,
  // para quem quiser inclinar a vista.
  controls.mouseButtons = {
    LEFT: null,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE,
  };
  // Um dedo arrasta (arrastar.js); dois dedos continuam dando pinça de zoom.
  controls.touches = { ONE: null, TWO: THREE.TOUCH.DOLLY_PAN };

  // Deixa registrado em unidades humanas, para a próxima leitura do arquivo.
  controls.userData = {
    altMinKm: controls.minDistance * R_KM,
    altMaxKm: controls.maxDistance * R_KM,
  };

  return controls;
}
