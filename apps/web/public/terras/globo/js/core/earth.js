// core/earth.js — a Terra "Blue Marble": esfera texturizada + atmosfera fresnel + gráticula
// Contrato congelado:
//   export async createEarth() -> THREE.Group
//   export latLonToVec3(lat, lon, radius = 1.001) -> THREE.Vector3
// Helper interno: buildGraticule(radius)

import * as THREE from 'three';

const R = 1; // raio unitário; todo o globo escala em torno disso

/**
 * Converte coordenada geográfica (graus) em vetor 3D na esfera unitária.
 * Usada por TODAS as camadas (flyto, geojson3d, satélites).
 * @param {number} lat - latitude em graus (-90..90)
 * @param {number} lon - longitude em graus (-180..180)
 * @param {number} [radius=1.001] - raio de destino (levemente acima da superfície por padrão)
 * @returns {THREE.Vector3}
 */
export function latLonToVec3(lat, lon, radius = 1.001) {
  const phi = (90 - lat) * Math.PI / 180;    // ângulo polar a partir do polo norte
  const theta = (lon + 180) * Math.PI / 180; // ângulo azimutal alinhado à textura equiretangular
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * Constrói a gráticula (linhas de latitude/longitude a cada 15°) como LineSegments
 * bem sutis (opacidade ~0.08), só para dar o ar "sala de controle".
 * @param {number} radius - raio das linhas (um fio acima da textura p/ não z-fighar)
 * @returns {THREE.LineSegments}
 */
function buildGraticule(radius) {
  const positions = [];
  const STEP = 15;     // uma linha a cada 15°
  const SEG = 4;       // resolução angular dos segmentos (graus)

  // Paralelos (latitude de -75° a 75°; polos ficam limpos)
  for (let lat = -75; lat <= 75; lat += STEP) {
    for (let lon = -180; lon < 180; lon += SEG) {
      const a = latLonToVec3(lat, lon, radius);
      const b = latLonToVec3(lat, lon + SEG, radius);
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }

  // Meridianos (longitude de -180° a 165°)
  for (let lon = -180; lon < 180; lon += STEP) {
    for (let lat = -90; lat < 90; lat += SEG) {
      const a = latLonToVec3(lat, lon, radius);
      const b = latLonToVec3(lat + SEG, lon, radius);
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: 0x38bdf8,       // ciano do design system
    transparent: true,
    opacity: 0.08,         // quase invisível — só textura de "instrumento"
    depthWrite: false,
  });
  return new THREE.LineSegments(geometry, material);
}

/**
 * Monta a Terra: esfera Blue Marble (96x96) + atmosfera fresnel ciano + gráticula.
 * @returns {Promise<THREE.Group>} grupo pronto para scene.add()
 */
export async function createEarth() {
  const group = new THREE.Group();

  // Textura local NASA Blue Marble (domínio público; arquivo estático do portal)
  const tex = await new THREE.TextureLoader().loadAsync('/terras/globo/textures/bluemarble.jpg');
  tex.colorSpace = THREE.SRGBColorSpace;

  // polygonOffset empurra a superfície para trás no espaço de PROFUNDIDADE,
  // sem mover um pixel na tela — é a margem de segurança que deixa as camadas
  // (geojson3d.js) ficarem a 127 m do chão em vez dos 5 a 9,6 km de antes.
  //
  // Medido com render fora de tela, vendo o país inteiro (z-buffer de 24 bits):
  // sem viés, uma camada 640 m ABAIXO da superfície desaparece; com este viés,
  // ela ainda é desenhada. Ou seja, a folga vale mais de 640 m — bem acima dos
  // 213 m que as facetas da esfera afundam. Aos 127 m as camadas já sobrevivem
  // mesmo sem viés; ele existe para não depender disso.
  // 384×192 segmentos, não 96×96. A esfera é um poliedro: com 96 segmentos
  // cada faceta tem 3,75° de largura e seu centro fica 3,4 km ABAIXO da esfera
  // ideal. No zoom fundo a câmera atravessava esse chão facetado e o mapa
  // sumia — medido, não suposto. Com 384 a flecha cai para ~213 m, bem abaixo
  // do limite de aproximação (2,5 km) definido em core/controls.js.
  // Custo: ~74 mil vértices, uma vez só, na carga.
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(R, 384, 192),
    new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.9,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: 2,   // termo proporcional à inclinação (esfera é curva)
      polygonOffsetUnits: 4,    // em unidades de "menor diferença de profundidade resolvível"
    })
  );
  group.add(globe);

  // Atmosfera: shader fresnel de rim glow ciano, BackSide + blending aditivo.
  // Nomeada porque o main.js precisa escondê-la no zoom profundo: a casca fica
  // a R*1.02 (~127 km de altitude) e, quando a câmera entra nela, as faces
  // internas cobrem a tela inteira em blending aditivo — o mapa some atrás de
  // um véu ciano exatamente na aproximação que interessa.
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.02, 96, 96),
    new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x38bdf8) }, // acento ciano do design system
      },
      vertexShader: /* glsl */ `
        varying vec3 vN;
        void main() {
          vN = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 glowColor;
        varying vec3 vN;
        void main() {
          // fresnel: intensidade cresce na borda do disco visto de trás (BackSide)
          float i = pow(0.62 - dot(vN, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(glowColor, 1.0) * i;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
  );
  atmosphere.name = 'atmosfera';
  atmosphere.userData.raio = R * 1.02;
  group.add(atmosphere);

  // Gráticula sutil logo acima da superfície (mesmo raciocínio das camadas:
  // um fio de folga, não os 6,4 km de antes)
  group.add(buildGraticule(R * 1.00006));

  return group;
}
