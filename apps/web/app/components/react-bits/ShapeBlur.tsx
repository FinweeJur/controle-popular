"use client";

/**
 * ShapeBlur — forma desfocada que segue o cursor (camada sobre a capa).
 *
 * Origem: React Bits, componente "Shape Blur"
 * (https://reactbits.dev/backgrounds/shape-blur), licença MIT + Commons
 * Clause, copiado em 06/10/2026.
 *
 * Papel no portal: pedido do dono (06/10/2026) — "protótipo da home, add
 * animação ShapeBlur + Cubes". É um canvas WebGL transparente que pinta uma
 * forma branca (retângulo/círculo/triângulo) suavizando a posição do
 * ponteiro; no protótipo da home ele cobre a capa da onça e o brilho
 * acompanha o mouse como um refletor.
 *
 * Adaptações (por quê entre parênteses):
 * 1. props tipadas e em português (`variacao`, `tamanhoForma`...) — o
 *    original vinha sem tipos e o `strict` do portal recusaria;
 * 2. `prefers-reduced-motion` desliga na raiz: sem WebGL o elemento fica
 *    vazio (regra do portal: efeito decorativo não é informação — quem
 *    pediu movimento reduzido recebe a capa estática);
 * 3. cores fixas em branco com alfa (decisão do original): a forma é
 *    luz sobre a foto, não um painel de cor — escurecer o fundo continuaria
 *    vindo dos tokens do tema, não daqui.
 *
 * Compatibilidade: o portal usa `three@0.156.1` (versão do repo, medida em
 * 06/10/2026) e o componente só toca em `PlaneGeometry`,
 * `OrthographicCamera`, `MathUtils.damp` e `forceContextLoss` — todos
 * existem desde antes do r156.
 *
 * Limpeza: ao desmontar, geometria/material/renderer são liberados e
 * `forceContextLoss()` solta o contexto WebGL — sem isto, navegar entre
 * páginas com efeito vazaria contexto até o navegador matar o canvas.
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";

/** Shader de vértice: só repassa UV — a forma inteira nasce no fragmento. */
const vertexShader = /* glsl */ `
varying vec2 v_texcoord;
void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_texcoord = uv;
}
`;

/**
 * Shader de fragmento: SDFs (distância assinada) da forma + máscara
 * circular do cursor. Mantido idêntico ao original — mexer em GLSL sem
 * renderer para conferir é receita de tela branca.
 */
const fragmentShader = /* glsl */ `
varying vec2 v_texcoord;

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_pixelRatio;

uniform float u_shapeSize;
uniform float u_roundness;
uniform float u_borderSize;
uniform float u_circleSize;
uniform float u_circleEdge;

#ifndef PI
#define PI 3.1415926535897932384626433832795
#endif
#ifndef TWO_PI
#define TWO_PI 6.2831853071795864769252867665590
#endif

#ifndef VAR
#define VAR 0
#endif

#ifndef FNC_COORD
#define FNC_COORD
vec2 coord(in vec2 p) {
    p = p / u_resolution.xy;
    if (u_resolution.x > u_resolution.y) {
        p.x *= u_resolution.x / u_resolution.y;
        p.x += (u_resolution.y - u_resolution.x) / u_resolution.y / 2.0;
    } else {
        p.y *= u_resolution.y / u_resolution.x;
        p.y += (u_resolution.x - u_resolution.y) / u_resolution.x / 2.0;
    }
    p -= 0.5;
    p *= vec2(-1.0, 1.0);
    return p;
}
#endif

#define st0 coord(gl_FragCoord.xy)
#define mx coord(u_mouse * u_pixelRatio)

float sdRoundRect(vec2 p, vec2 b, float r) {
    vec2 d = abs(p - 0.5) * 4.2 - b + vec2(r);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
}
float sdCircle(in vec2 st, in vec2 center) {
    return length(st - center) * 2.0;
}
float sdPoly(in vec2 p, in float w, in int sides) {
    float a = atan(p.x, p.y) + PI;
    float r = TWO_PI / float(sides);
    float d = cos(floor(0.5 + a / r) * r - a) * length(max(abs(p) * 1.0, 0.0));
    return d * 2.0 - w;
}

float aastep(float threshold, float value) {
    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
    return smoothstep(threshold - afwidth, threshold + afwidth, value);
}
float fill(in float x) { return 1.0 - aastep(0.0, x); }
float fill(float x, float size, float edge) {
    return 1.0 - smoothstep(size - edge, size + edge, x);
}
float stroke(in float d, in float t) { return (1.0 - aastep(t, abs(d))); }
float stroke(float x, float size, float w, float edge) {
    float d = smoothstep(size - edge, size + edge, x + w * 0.5) - smoothstep(size - edge, size + edge, x - w * 0.5);
    return clamp(d, 0.0, 1.0);
}

float strokeAA(float x, float size, float w, float edge) {
    float afwidth = length(vec2(dFdx(x), dFdy(x))) * 0.70710678;
    float d = smoothstep(size - edge - afwidth, size + edge + afwidth, x + w * 0.5)
            - smoothstep(size - edge - afwidth, size + edge + afwidth, x - w * 0.5);
    return clamp(d, 0.0, 1.0);
}

void main() {
    vec2 st = st0 + 0.5;
    vec2 posMouse = mx * vec2(1., -1.) + 0.5;

    float size = u_shapeSize;
    float roundness = u_roundness;
    float borderSize = u_borderSize;
    float circleSize = u_circleSize;
    float circleEdge = u_circleEdge;

    float sdfCircle = fill(
        sdCircle(st, posMouse),
        circleSize,
        circleEdge
    );

    float sdf;
    if (VAR == 0) {
        sdf = sdRoundRect(st, vec2(size), roundness);
        sdf = strokeAA(sdf, 0.0, borderSize, sdfCircle) * 4.0;
    } else if (VAR == 1) {
        sdf = sdCircle(st, vec2(0.5));
        sdf = fill(sdf, 0.6, sdfCircle) * 1.2;
    } else if (VAR == 2) {
        sdf = sdCircle(st, vec2(0.5));
        sdf = strokeAA(sdf, 0.58, 0.02, sdfCircle) * 4.0;
    } else if (VAR == 3) {
        sdf = sdPoly(st - vec2(0.5, 0.45), 0.3, 3);
        sdf = fill(sdf, 0.05, sdfCircle) * 1.4;
    }

    vec3 color = vec3(1.0);
    float alpha = sdf;
    gl_FragColor = vec4(color.rgb, alpha);
}
`;

/** Props públicas (nomes em português, padrão dos vendoriados). */
export interface FormaDesfocadaProps {
  /** Classe extra do contêiner (posicionamento/camada vem de quem usa). */
  className?: string;
  /** Variante da forma: 0 retângulo, 1 círculo cheio, 2 círculo vazado, 3 triângulo. */
  variacao?: number;
  /** Proporção de pixel do shader. Padrão 2. */
  proporcaoPixel?: number;
  /** Tamanho da forma (unidade do shader). Padrão 1.2. */
  tamanhoForma?: number;
  /** Arredondamento das quinas (0..1). Padrão 0.4. */
  arredondamento?: number;
  /** Espessura da borda quando a variante usa contorno. Padrão 0.05. */
  larguraBorda?: number;
  /** Raio da máscara circular que segue o cursor. Padrão 0.3. */
  tamanhoCirculo?: number;
  /** Suavidade da borda dessa máscara. Padrão 0.5. */
  bordaCirculo?: number;
}

/**
 * Monta o canvas da forma desfocada no contêiner passado.
 * Retorna `null` (nada renderizado) sob `prefers-reduced-motion`.
 */
const ShapeBlur: React.FC<FormaDesfocadaProps> = ({
  className = "",
  variacao = 0,
  proporcaoPixel = 2,
  tamanhoForma = 1.2,
  arredondamento = 0.4,
  larguraBorda = 0.05,
  tamanhoCirculo = 0.3,
  bordaCirculo = 0.5,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    // Movimento reduzido: não monta WebGL nenhum (capa estática, ver cabeçalho).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let active = true;
    let animationFrameId = 0;
    let time = 0;
    let lastTime = 0;

    const vMouse = new THREE.Vector2();
    const vMouseDamp = new THREE.Vector2();
    const vResolution = new THREE.Vector2();

    let w = 1;
    let h = 1;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera();
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const geo = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_mouse: { value: vMouseDamp },
        u_resolution: { value: vResolution },
        u_pixelRatio: { value: proporcaoPixel },
        u_shapeSize: { value: tamanhoForma },
        u_roundness: { value: arredondamento },
        u_borderSize: { value: larguraBorda },
        u_circleSize: { value: tamanhoCirculo },
        u_circleEdge: { value: bordaCirculo },
      },
      defines: { VAR: variacao },
      transparent: true,
    });
    materialRef.current = material;

    const quad = new THREE.Mesh(geo, material);
    scene.add(quad);

    const onPointerMove = (e: PointerEvent | MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      vMouse.set(e.clientX - rect.left, e.clientY - rect.top);
    };

    document.addEventListener("mousemove", onPointerMove);
    document.addEventListener("pointermove", onPointerMove);

    const resize = () => {
      if (!active) return;
      w = mount.clientWidth;
      h = mount.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);

      renderer.setSize(w, h);
      renderer.setPixelRatio(dpr);

      camera.left = -w / 2;
      camera.right = w / 2;
      camera.top = h / 2;
      camera.bottom = -h / 2;
      camera.updateProjectionMatrix();

      quad.scale.set(w, h, 1);
      vResolution.set(w, h).multiplyScalar(dpr);
      material.uniforms.u_pixelRatio.value = dpr;
    };

    resize();
    window.addEventListener("resize", resize);

    const ro = new ResizeObserver(() => {
      if (!active) return;
      resize();
    });
    ro.observe(mount);

    const update = () => {
      if (!active) return;
      time = performance.now() * 0.001;
      const dt = time - lastTime;
      lastTime = time;
      // Amortecimento: a posição VISA a do ponteiro e chega atrasada — é o
      // "arrasto" que dá a sensação de peso à forma.
      vMouseDamp.x = THREE.MathUtils.damp(vMouseDamp.x, vMouse.x, 8, dt);
      vMouseDamp.y = THREE.MathUtils.damp(vMouseDamp.y, vMouse.y, 8, dt);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(update);
    };
    update();

    return () => {
      active = false;

      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      ro.disconnect();
      document.removeEventListener("mousemove", onPointerMove);
      document.removeEventListener("pointermove", onPointerMove);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      geo.dispose();
      material.dispose();
      materialRef.current = null;
      renderer.dispose();
      renderer.forceContextLoss();
    };
    // `variacao` troca o `define` do shader: exige remontar o material.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variacao]);

  // Segundo efeito: as demais props só atualizam uniforms — sem remontar.
  useEffect(() => {
    const mat = materialRef.current;
    if (!mat) return;
    mat.uniforms.u_pixelRatio.value = proporcaoPixel;
    mat.uniforms.u_shapeSize.value = tamanhoForma;
    mat.uniforms.u_roundness.value = arredondamento;
    mat.uniforms.u_borderSize.value = larguraBorda;
    mat.uniforms.u_circleSize.value = tamanhoCirculo;
    mat.uniforms.u_circleEdge.value = bordaCirculo;
  }, [proporcaoPixel, tamanhoForma, arredondamento, larguraBorda, tamanhoCirculo, bordaCirculo]);

  return <div className={className} ref={mountRef} style={{ width: "100%", height: "100%" }} />;
};

export default ShapeBlur;
