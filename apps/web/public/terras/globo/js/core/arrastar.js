/**
 * core/arrastar.js — arrastar o globo para o lado, como num mapa comum.
 *
 * ## O problema que isto resolve
 *
 * O `flyTo` deixa `controls.target` na SUPERFÍCIE (raio 1), e o OrbitControls
 * gira a câmera **em torno do target**. Com o alvo grudado num ponto do chão,
 * arrastar faz a câmera dar a volta naquele ponto: você roda no lugar e nunca
 * chega no vizinho. Somado a `enablePan = false` — desligado de propósito,
 * porque o pan do OrbitControls translada o target no espaço e descolaria a
 * câmera do globo —, sobrava só o zoom. É o que se via: dá para aproximar e
 * afastar, não dá para ir para o lado.
 *
 * ## A solução: girar o globo, não a câmera
 *
 * Arrastar aplica **a mesma rotação em torno do centro da Terra** à posição da
 * câmera e ao target. Os dois se movem juntos, então a altitude, a inclinação e
 * o enquadramento ficam intactos — muda só qual pedaço do planeta está embaixo.
 * É o gesto de rodar um globo com a mão, e na tela é o de arrastar um mapa.
 *
 * Nada aqui mexe no `flyTo` nem nos limites de zoom: os dois referenciais
 * descritos em `flyto.js` continuam valendo exatamente como estavam.
 *
 * ## Por que o ângulo depende da altitude
 *
 * Ângulo fixo por pixel serve para uma escala só. A 2,5 km de altitude um
 * arrasto curto atravessaria o estado; a 50.000 km ele não sairia do lugar.
 * Aqui o passo sai da geometria da câmera, e o chão acompanha o cursor em
 * qualquer escala — que é a única definição útil de "como no Google Maps".
 */

import * as THREE from 'three';

/** Arrasto menor que isto é clique trêmulo, não intenção de mover (px). */
export const LIMIAR_ARRASTO_PX = 4;

/**
 * Distância da câmera até o chão que está no CENTRO da tela.
 *
 * Não usar `camera.position.distanceTo(controls.target)`: o alvo só está na
 * superfície depois de um `flyTo`. Na abertura ele é o padrão do OrbitControls,
 * o CENTRO da Terra — e ali aquela conta devolve 20.387 km onde a altitude real
 * é 14.016, inflando o passo do arrasto em quase 50%. Medido, não suposto.
 *
 * A conta certa é onde o raio que sai da câmera pela mira encontra a esfera de
 * raio 1. Se a mira estiver apontada para fora do planeta — a borda do globo
 * contra o espaço —, não há chão: cai para a altitude no ponto abaixo da
 * câmera, que é o melhor palpite disponível e mantém o gesto contínuo.
 */
export function distanciaAoChao(camera) {
  const o = camera.position;
  const d = new THREE.Vector3();
  camera.getWorldDirection(d);
  // |o + t·d|² = 1  →  t² + 2(o·d)t + (|o|²−1) = 0
  const b = 2 * o.dot(d);
  const c = o.lengthSq() - 1;
  const disc = b * b - 4 * c;
  if (disc >= 0) {
    const t = (-b - Math.sqrt(disc)) / 2;
    if (t > 0) return t;
  }
  return Math.max(o.length() - 1, 0);
}

/**
 * Quanto o globo gira por pixel arrastado, em radianos.
 *
 * A janela mostra, na altura do alvo, uma faixa de chão de
 * `2 · altitude · tan(fov/2)`. Dividida pela altura da tela, dá o chão por
 * pixel; como o raio da Terra é 1 na cena, essa distância JÁ É o ângulo no
 * centro. Daí o chão andar exatamente junto com o cursor.
 *
 * Usa a altura da janela nos dois eixos de propósito: o campo de visão
 * horizontal cresce com o aspecto na mesma proporção que a largura em pixels,
 * então o resultado é o mesmo — e evita que arrastar na diagonal ande mais num
 * eixo que no outro numa tela larga.
 *
 * @param {{altitude: number, fovDeg: number, alturaPx: number}} p
 * @returns {number} radianos por pixel
 */
export function radianosPorPixel({ altitude, fovDeg, alturaPx }) {
  if (!(alturaPx > 0) || !(altitude > 0)) return 0;
  return (2 * altitude * Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2)) / alturaPx;
}

/**
 * Rotação em torno do centro da Terra correspondente a um arrasto.
 *
 * Os eixos saem da própria câmera, não do mundo: arrastar para a direita tem de
 * levar o chão para a direita **da tela**, esteja a câmera sobre o equador ou
 * de cabeça para baixo sobre o polo. Eixo do mundo faria o gesto inverter de
 * sentido conforme a latitude, que é o defeito clássico de globo.
 *
 * @param {THREE.Camera} camera
 * @param {number} dxPx  deslocamento horizontal do cursor (px, direita positivo)
 * @param {number} dyPx  deslocamento vertical do cursor (px, baixo positivo)
 * @param {number} radPorPx  de `radianosPorPixel`
 * @returns {THREE.Quaternion}
 */
export function quaternionDeArrasto(camera, dxPx, dyPx, radPorPx) {
  const direita = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).normalize();
  const cima = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1).normalize();

  // Sinais: arrastar para a direita gira o globo de modo que o chão vá para a
  // direita — logo a câmera anda para a esquerda sobre a superfície, que é a
  // rotação de sinal oposto. Mesma lógica na vertical.
  const giroH = new THREE.Quaternion().setFromAxisAngle(cima, -dxPx * radPorPx);
  const giroV = new THREE.Quaternion().setFromAxisAngle(direita, -dyPx * radPorPx);
  return giroH.multiply(giroV);
}

/**
 * Aplica a rotação à câmera E ao alvo. Os dois juntos: é isso que preserva
 * altitude e inclinação, e o que diferencia "girar o globo" de "girar a câmera".
 */
export function aplicarArrasto(camera, controls, q) {
  camera.position.applyQuaternion(q);
  controls.target.applyQuaternion(q);
  camera.lookAt(controls.target);
}

/**
 * Liga o arrasto de superfície no canvas.
 *
 * Botão esquerdo (e um dedo) passam a arrastar o globo. A órbita livre do
 * OrbitControls continua existindo no **botão direito**, para quem quiser
 * inclinar a vista — quem chamou é responsável por configurar
 * `controls.mouseButtons`.
 *
 * @returns {{dispose: () => void}}
 */
export function criarArrastoDeSuperficie(camera, controls, domElement) {
  let arrastando = false;
  let idPonteiro = null;
  let ultimoX = 0;
  let ultimoY = 0;
  let percorrido = 0;

  function aoDescer(e) {
    if (e.button !== 0 || !e.isPrimary) return;
    arrastando = true;
    idPonteiro = e.pointerId;
    ultimoX = e.clientX;
    ultimoY = e.clientY;
    percorrido = 0;
    domElement.setPointerCapture?.(e.pointerId);
  }

  function aoMover(e) {
    if (!arrastando || e.pointerId !== idPonteiro) return;
    const dx = e.clientX - ultimoX;
    const dy = e.clientY - ultimoY;
    ultimoX = e.clientX;
    ultimoY = e.clientY;
    percorrido += Math.abs(dx) + Math.abs(dy);

    const radPorPx = radianosPorPixel({
      altitude: distanciaAoChao(camera),
      fovDeg: camera.fov,
      alturaPx: domElement.clientHeight || window.innerHeight,
    });
    if (!radPorPx) return;
    aplicarArrasto(camera, controls, quaternionDeArrasto(camera, dx, dy, radPorPx));
  }

  function aoSubir(e) {
    if (!arrastando || e.pointerId !== idPonteiro) return;
    arrastando = false;
    idPonteiro = null;
    domElement.releasePointerCapture?.(e.pointerId);

    // Sem isto, todo arrasto termina abrindo ou fechando a ficha: o navegador
    // dispara `click` no fim de qualquer arrasto que comece e acabe no mesmo
    // elemento, por mais longo que seja, e o inspetor escuta `click` no canvas.
    // Arrastar o mapa e ver um painel abrir sozinho é o tipo de coisa que a
    // pessoa lê como bug do app.
    if (percorrido > LIMIAR_ARRASTO_PX) {
      domElement.addEventListener('click', engolir, { capture: true, once: true });
    }
  }

  function engolir(e) {
    e.stopPropagation();
  }

  domElement.addEventListener('pointerdown', aoDescer);
  domElement.addEventListener('pointermove', aoMover);
  domElement.addEventListener('pointerup', aoSubir);
  domElement.addEventListener('pointercancel', aoSubir);

  return {
    dispose() {
      domElement.removeEventListener('pointerdown', aoDescer);
      domElement.removeEventListener('pointermove', aoMover);
      domElement.removeEventListener('pointerup', aoSubir);
      domElement.removeEventListener('pointercancel', aoSubir);
    },
  };
}
