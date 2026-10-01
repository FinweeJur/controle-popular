"use client";

/**
 * CampfireColonyAnim — animação decorativa da Mística do Dia.
 *
 * O que é: reprodução FIEL da cena "Campfire Colony" — a ilustração de Dave
 * Chenell (dribbble.com/shots/2012985) recriada em CodePen por jackiezen
 * (codepen.io/jackiezen/pen/gOOgvOO). O dono pediu similaridade de ~90% com
 * o original, então a GEOMETRIA abaixo é a tradução direta das coordenadas
 * do CSS do CodePen para este SVG (mesmas posições, mesmos tamanhos):
 *
 *   - PINHEIROS: 10 árvores de base 12px (6+6) e altura 32/56px, nas
 *     posições exatas do original. As bases NÃO ficam numa linha só: sobem
 *     de y=332 (esquerda) até y=270 (direita) — é essa encosta que dá a
 *     profundidade da cena;
 *   - SOMBRAS: cada árvore tem a sombra do `:before` do original (triângulo
 *     de 12px de base e 13/23px, inclinado com skewX(-70deg)), que vira uma
 *     lasca comprida varrendo para baixo-esquerda (~64px nas altas);
 *   - PEDRA: domo de 74×38 no mesmo lugar (x 360-434, base y=288), com o
 *     reflexo claro na base direita (luz de baixo-direita) e a sombra em
 *     faixa inclinada para a esquerda (rock-light do original);
 *     4 pedrinhas em cascata descendo à esquerda, cada uma com sua sombra;
 *   - FOGUEIRA: 42×42 em (300,272), com as TRÊS chamas em losango do
 *     original (20×50, 8×20 e 2×8, aninhadas, opacidades .4/.8/.9) e o
 *     halo de 30px — separada da pedra por ~40px, como na referência;
 *   - FUMAÇA: o MESMO caminho do original (`M 150 0 Q 200 100 100 250
 *     C 0 450 120 400 50 600`, deslocado para as coordenadas da cena),
 *     com o tracejado correndo (dasharray 500/100) e o degradê que some
 *     no topo (o mask-image do original);
 *   - GRÃO: o ruído do `:before` do original vira um feTurbulence sutil.
 *
 * ÚNICA DIFERENÇA DE COR em relação ao original (pedido do dono,
 * 30/09/2026): brilho, chamas e FUMAÇA usam `--cp-primary`, a cor da marca
 * do tema ativo (laranja no pequi, verde em Mata Atlântica, azul no
 * Pantanal…), no lugar do amarelo/laranja fixos. O resto usa tokens de
 * tema com as cores do original como reserva.
 *
 * Acessibilidade: decorativa (`aria-hidden`), `pointer-events: none`,
 * respeita `prefers-reduced-motion`.
 */

import React from "react";

/**
 * As 10 árvores do original: [x do ápice, y do ápice, y da base].
 * A base é a LARGURA/2 do triângulo (6px de cada lado).
 * Tradução do CSS: x = left + 6 (front) ou 390 + left + 6 (back);
 * y do ápice = 400 - bottom - altura; y da base = 400 - bottom.
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

/** Comprimento da sombra no chão (do skewX(-70deg) do original). */
function sombraArvore(x: number, base: number, altura: number) {
  const pontaX = x - altura * 1.14;
  const pontaY = base + altura * 0.41;
  return `${x - 6},${base} ${x + 6},${base} ${pontaX.toFixed(1)},${pontaY.toFixed(1)}`;
}

/** As 4 pedrinhas em cascata do original: [x, y da base]. */
const PEDRINHAS: [number, number][] = [
  [350, 290],
  [328, 298],
  [310, 306],
  [304, 318],
];

export function CampfireColonyAnim() {
  return (
    <span
      aria-hidden="true"
      className="cp-campfire"
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        width: "100%",
        maxWidth: 150,
        aspectRatio: "5 / 4",
        height: "auto",
        flexShrink: 0,
      }}
    >
      <style>{`
        .cp-campfire svg { width: 100%; height: 100%; display: block; overflow: hidden; }
        .cp-campfire .cp-fogo {
          animation: cp-flicker 3s ease alternate infinite;
          transform-origin: 321px 288px;
        }
        .cp-campfire .cp-fumaca path {
          animation: cp-dash 3s linear infinite;
        }
        @keyframes cp-flicker {
          0%   { transform: rotate(-6deg); }
          20%  { transform: rotate(-4deg); }
          40%  { transform: rotate(-6deg); }
          60%  { transform: rotate(-4deg) scale(1.1); }
          80%  { transform: rotate(-7deg) scale(1); }
          100% { transform: rotate(-4deg); }
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
          {/* A fumaça some no topo (o mask-image linear-gradient do original:
              opaco nos 30% de baixo, transparente lá em cima). */}
          <linearGradient id="cp-fumaca-degrade" gradientUnits="userSpaceOnUse" x1="0" y1="-316" x2="0" y2="130">
            <stop offset="0%" stopColor="var(--cp-primary, #f2701d)" stopOpacity="0" />
            <stop offset="55%" stopColor="var(--cp-primary, #f2701d)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--cp-primary, #f2701d)" stopOpacity="0.42" />
          </linearGradient>
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
            <ellipse cx={x - 7} cy={y + 1.5} rx={7} ry={1.6} fill="var(--cp-text-soft, #917472)" opacity="0.5" />
            <path d={`M ${x - 6} ${y} A 6 3.4 0 0 1 ${x + 6} ${y} Z`} fill="var(--cp-muted, #2f484f)" />
          </g>
        ))}

        {/* ── Fumaça: o caminho exato do original, some no topo ── */}
        <g className="cp-fumaca">
          <path
            d="M 420 -316 Q 470 -216 370 -66 C 270 134 390 84 320 284"
            fill="none"
            stroke="url(#cp-fumaca-degrade)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="560 60"
          />
        </g>

        {/* ── Fogueira: halo + as três chamas em losango do original ── */}
        <circle cx={321} cy={280} r={36} fill="url(#cp-halo)" />
        <g className="cp-fogo">
          {/* flame-1: a maior, mais translúcida (0.4 no original) */}
          <g fill="var(--cp-primary, #f2701d)" opacity="0.22">
            <polygon points="310,242 300,276 320,276" />
            <polygon points="300,276 320,276 310,292" />
          </g>
          {/* flame-2: média */}
          <g fill="var(--cp-primary, #f2701d)" opacity="0.45">
            <polygon points="316,278 312,290 320,290" />
            <polygon points="312,290 320,290 316,298" />
          </g>
          {/* flame-3: o núcleo claro */}
          <g fill="color-mix(in srgb, var(--cp-primary, #f2701d) 30%, #ffffff)" opacity="0.95">
            <polygon points="319,292 318,296 320,296" />
            <polygon points="318,296 320,296 319,300" />
          </g>
        </g>
      </svg>
    </span>
  );
}
