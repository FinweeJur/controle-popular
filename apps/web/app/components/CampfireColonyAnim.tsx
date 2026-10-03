"use client";

/**
 * CampfireColonyAnim — animação decorativa da Mística do Dia.
 *
 * O que é: reprodução da cena "Campfire Colony" — ilustração de Dave Chenell
 * (dribbble.com/shots/2012985) recriada em CodePen por jackiezen
 * (codepen.io/jackiezen/pen/gOOgvOO). Este arquivo NÃO é invenção: cada
 * coordenada/valor abaixo foi lido do HTML e do CSS do pen original (página
 * salva em `.local/share/opencode/tool-output/tool_0f2ae713f...`), e a
 * tradução para SVG é só de unidades:
 *
 *   - CONTÊINER: o pen é um `.campfire-wrapper` de 500×400, com fundo
 *     `linear-gradient(#FFD2BC, #F8B9AE)`. Daí o viewBox "0 0 500 400".
 *   - PINHEIROS: 10 triângulos CSS de base 12px (6+6), alturas 32/56px.
 *     `bottom` e `left` do CSS viram x = left+6 (ou 390+left+6, no
 *     container de trás) e y da base = 400 - bottom (o ápice fica
 *     `border-bottom-width` acima). As bases NÃO ficam na mesma linha:
 *     sobem de y=332 (esquerda) até y=270 (direita) — é a encosta que dá
 *     profundidade. Em cada árvore, o `:before` (sombra `skewX(-70deg)`)
 *     vira a lasca comprida para baixo-esquerda com a fórmula abaixo.
 *   - PEDRA: `.rock-big` de 74×38 em (360, 288), com o `radial-gradient
 *     (circle at bottom right)` de luz embaixo-direita e o `:before`
 *     `skewX(-70deg)` (opacidade .6) como a faixa de sombra deslocada para
 *     a esquerda. 4 pedrinhas em cascata (12×6) com a sombra do mesmo jeito.
 *   - FOGUEIRA: `.fire-container` 42×42 com halo (`box-shadow 30px`), em
 *     (300, 272). As TRÊS chamas são losangos aninhados — cada uma usa
 *     `border-bottom` (triângulo para cima) + `:after` com `border-top`
 *     (para baixo). Traduzidos, os vértices são:
 *       flame-1 (topo 252, largura 20 em x 310-330, base 286, fundo 302);
 *       flame-2 (topo 282, largura 8 em x 316-324, base 294, fundo 302);
 *       flame-3 (topo 293, largura 2 em x 319-321, base 297, fundo 302).
 *     A rotação inicial é `rotate(-5deg)`; a animação `flicker` (3s, ease,
 *     alternate) é transcrita VERBATIM do original.
 *   - FUMAÇA: o MESMO caminho `M 150 0 Q 200 100 100 250 C 0 450 120 400
 *     50 600`, deslocado (+270, -316) para o `.smoke-container` (left 270,
 *     bottom 86, 200×630). O traço é `stroke-dasharray: 500 100` correndo
 *     com `stroke-dashoffset` de 0 a 600 em 3s linear — é ESSA corrida do
 *     tracejado que faz a fumaça subir no original. O fade do topo é o
 *     `-webkit-mask-image: linear-gradient(to top, ...)` do original,
 *     refeito aqui como `<mask>` SVG.
 *   - GRÃO: o PNG de ruído do `:before` do `.container` vira um
 *     `feTurbulence` sutil.
 *
 * ÚNICA DIFERENÇA DE COR (aprovada pelo dono, 30/09/2026): brilho, chamas e
 * fumaça usam `--cp-primary`, a cor do tema ativo (laranja no pequi, verde
 * em Mata Atlântica, azul no Pantanal…), no lugar do amarelo/laranja fixos
 * do original. Céu, árvores, pedra e sombras usam tokens de tema com as
 * cores do original como reserva.
 *
 * AJUSTES DE VISIBILIDADE (dono, 03/10/2026 — "não dá pra ver a movimentação"):
 *   1. a cena subiu de 150px fixos para 150px no celular e 184px no desktop,
 *      para a fogueira e o rastro da fumaça ficarem legíveis. O desktop era
 *      210px e baixou para 184px em 03/10/2026 (dono): a peça reservava
 *      largura demais e empurrava o texto da Mística do Dia para muitas
 *      linhas, esticando o bloco. 184px ainda é maior que o original de
 *      150px, então a animação continua visível;
 *   2. a opacidade do traço da fumaça subiu de 0.3 para 0.4;
 *   3. como o SVG recorta no topo do viewBox (o original não recortava), o
 *      degradê da máscara foi comprimido para a fumaça sumir ANTES da borda
 *      de cima — sem corte reto.
 *
 * Acessibilidade: decorativa (`aria-hidden`), `pointer-events: none`,
 * respeita `prefers-reduced-motion`.
 */

import React from "react";

/**
 * As 10 árvores do original: [x do ápice, y do ápice, y da base].
 * A base tem 12px (6px de cada lado do ápice).
 * CSS de origem: x = left + 6 (front) ou 390 + left + 6 (back);
 * y do ápice = 400 - bottom - border-bottom-width; y da base = 400 - bottom.
 */
const ARVORES: [number, number, number][] = [
  [86, 300, 332], // tree-1
  [166, 300, 332], // tree-2
  [178, 272, 328], // tree-3
  [244, 280, 336], // tree-4
  [340, 268, 324], // tree-5
  [368, 244, 300], // tree-6
  [374, 234, 290], // tree-7
  [402, 224, 280], // tree-8 (container de trás)
  [408, 229, 285], // tree-9 (container de trás)
  [430, 238, 270], // tree-10 (container de trás)
];

/**
 * Sombra da árvore no chão. O `:before` do original é um triângulo para
 * baixo (border-top) com `skewX(-70deg)`; a inclinação o estica até ~64px
 * nas árvores altas. Estes coeficientes reproduzem o resultado do skew
 * (1.14 e 0.41 saem de tan(70°) sobre as dimensões do triângulo).
 */
function sombraArvore(x: number, base: number, altura: number) {
  const pontaX = x - altura * 1.14;
  const pontaY = base + altura * 0.41;
  return `${x - 6},${base} ${x + 6},${base} ${pontaX.toFixed(1)},${pontaY.toFixed(1)}`;
}

/**
 * As 4 pedrinhas em cascata do original: [x do CENTRO, y da base].
 * Derivadas de `.rock-1..4` (left/bottom dentro do `.rock-container`, que
 * ocupa x 280-460 e tem base em y=334): centro = 280 + left + 6;
 * base = 334 - bottom.
 */
const PEDRINHAS: [number, number][] = [
  [356, 290], // rock-1: left 70, bottom 44
  [334, 298], // rock-2: left 48, bottom 36
  [316, 306], // rock-3: left 30, bottom 28
  [310, 318], // rock-4: left 24, bottom 16
];

/**
 * Sombra de uma pedrinha. O `:before` é um retângulo 12×6 com cantos de
 * baixo arredondados, deslocado -8px e com `skewX(-70deg)` (opacidade .5).
 * O resultado é este paralelogramo de 4 pontos.
 */
function sombraPedrinha(xCentro: number, base: number) {
  const x0 = xCentro - 6 - 8;
  const y0 = base - 6 + 6;
  return (
    `${(x0 + 8.2).toFixed(1)},${y0} ${(x0 + 20.2).toFixed(1)},${y0} ` +
    `${(x0 + 3.8).toFixed(1)},${y0 + 6} ${(x0 - 8.2).toFixed(1)},${y0 + 6}`
  );
}

export function CampfireColonyAnim() {
  return (
    <span
      aria-hidden="true"
      className="cp-campfire block w-[150px] shrink-0 sm:w-[184px]"
      style={{
        aspectRatio: "5 / 4",
        height: "auto",
        maxWidth: "100%",
        pointerEvents: "none",
      }}
    >
      <style>{`
        .cp-campfire svg { width: 100%; height: 100%; display: block; overflow: hidden; }
        /* rotate(-5deg) é o estado-base do original; a animação (abaixo) o
           sobrepõe enquanto roda, exatamente como no CodePen. */
        .cp-campfire .cp-fogo {
          transform: rotate(-5deg);
          transform-origin: 321px 293px;
          animation: cp-flicker 3s ease alternate infinite;
        }
        /* O tracejado correndo é o que faz a fumaça subir no original. */
        .cp-campfire .cp-fumaca path {
          animation: cp-dash 3s linear infinite;
        }
        @keyframes cp-flicker {
          0%   { transform: rotate(-1deg); }
          20%  { transform: rotate(1deg); }
          40%  { transform: rotate(-1deg); }
          60%  { transform: rotate(1deg) scale(1.1); }
          80%  { transform: rotate(-2deg) scale(1); }
          100% { transform: rotate(1deg); }
        }
        @keyframes cp-dash {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: 600; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cp-campfire .cp-fogo,
          .cp-campfire .cp-fumaca path { animation: none; }
        }
      `}</style>
      <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" role="presentation">
        <defs>
          <linearGradient id="cp-ceu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--cp-surface-2, #ffd2bc)" />
            <stop offset="100%" stopColor="var(--cp-surface, #f8b9ae)" />
          </linearGradient>
          {/* Luz da pedra vinda de baixo-direita (o radial-gradient do original). */}
          <radialGradient id="cp-pedra" cx="88%" cy="88%" r="120%">
            <stop offset="0%" stopColor="var(--cp-text-soft, #917472)" />
            <stop offset="45%" stopColor="var(--cp-muted, #43565a)" />
            <stop offset="100%" stopColor="var(--cp-muted, #2f484f)" />
          </radialGradient>
          {/* O halo do fogo (o box-shadow 30px do original), em degradê. */}
          <radialGradient id="cp-halo">
            <stop offset="0%" stopColor="var(--cp-primary, #f2701d)" stopOpacity="0.34" />
            <stop offset="55%" stopColor="var(--cp-primary, #f2701d)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--cp-primary, #f2701d)" stopOpacity="0" />
          </radialGradient>
          {/* O grão do `:before` do original (ruído sobre o céu). */}
          <filter id="cp-grao" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          {/* Fade do topo (o mask-image do original). O gradiente vai da base
              (y=300, opaco) para o topo (y=-20, transparente); o branco é
              opaco na máscara e o preto esconde. Como o SVG recorta no
              viewBox, a fumaça some ANTES da borda de cima. */}
          <linearGradient id="cp-fumaca-fade" gradientUnits="userSpaceOnUse" x1="0" y1="300" x2="0" y2="-20">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
          <mask id="cp-fumaca-mask" maskUnits="userSpaceOnUse" x="0" y="-30" width="500" height="360">
            <rect x="0" y="-30" width="500" height="360" fill="url(#cp-fumaca-fade)" />
          </mask>
        </defs>

        <rect x="0" y="0" width="500" height="400" fill="url(#cp-ceu)" />
        <rect x="0" y="0" width="500" height="400" filter="url(#cp-grao)" opacity="0.07" />

        {/* ── Sombras no chão (antes das árvores, para ficarem por trás) ── */}
        <g fill="var(--cp-accent, #365e57)" opacity="0.34">
          {ARVORES.map(([x, top, base], i) => (
            <polygon key={`s${i}`} points={sombraArvore(x, base, base - top)} />
          ))}
        </g>

        {/* ── Sombra da pedra: faixa inclinada para a esquerda (rock-light) ── */}
        <polygon
          points="359.7,288 433.7,288 384.3,306 310.3,306"
          fill="var(--cp-text-soft, #917472)"
          opacity="0.5"
        />

        {/* ── As 10 árvores (cor chapada, como no original) ── */}
        <g fill="var(--cp-accent, #365e57)">
          {ARVORES.map(([x, top, base], i) => (
            <polygon key={`a${i}`} points={`${x},${top} ${x - 6},${base} ${x + 6},${base}`} />
          ))}
        </g>

        {/* ── Domo de pedra (a luz de baixo-direita já vem do degradê) ── */}
        <path d="M 360 288 A 37 38 0 0 1 434 288 Z" fill="url(#cp-pedra)" />

        {/* ── Pedrinhas em cascata, cada uma com sua sombra ── */}
        {PEDRINHAS.map(([x, y], i) => (
          <g key={`p${i}`}>
            <polygon points={sombraPedrinha(x, y)} fill="var(--cp-text-soft, #917472)" opacity="0.5" />
            <path d={`M ${x - 6} ${y} A 6 6 0 0 1 ${x + 6} ${y} Z`} fill="url(#cp-pedra)" />
          </g>
        ))}

        {/* ── Fumaça: caminho exato do original, com o tracejado correndo
            (dash 500 / gap 100, offset 0→600 em 3s) e o fade no topo. É a
            corrida do tracejado que dá o movimento de "fumaça subindo" do
            CodePen. Para a cor da marca, o traço usa --cp-primary. ── */}
        <g className="cp-fumaca">
          <path
            d="M 420 -316 Q 470 -216 370 -66 C 270 134 390 84 320 284"
            fill="none"
            stroke="var(--cp-primary, #f2701d)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="500 100"
            strokeOpacity="0.4"
            mask="url(#cp-fumaca-mask)"
          />
        </g>

        {/* ── Fogueira: halo + as três chamas em losango do original ── */}
        <circle cx={321} cy={293} r={48} fill="url(#cp-halo)" />
        <g className="cp-fogo">
          {/* flame-1: a maior, mais translúcida (opacidade .4 no original) */}
          <g fill="var(--cp-primary, #f2701d)" opacity="0.4">
            <polygon points="320,252 310,286 330,286" />
            <polygon points="310,286 330,286 320,302" />
          </g>
          {/* flame-2: média (opacidade .8 no original) */}
          <g fill="var(--cp-primary, #f2701d)" opacity="0.8">
            <polygon points="320,282 316,294 324,294" />
            <polygon points="316,294 324,294 320,302" />
          </g>
          {/* flame-3: o núcleo claro (opacidade .9 no original) */}
          <g fill="color-mix(in srgb, var(--cp-primary, #f2701d) 30%, #ffffff)" opacity="0.9">
            <polygon points="320,293 319,297 321,297" />
            <polygon points="319,297 321,297 320,302" />
          </g>
        </g>
      </svg>
    </span>
  );
}
