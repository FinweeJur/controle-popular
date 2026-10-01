/**
 * CampfireColonyAnim — animação decorativa da Mística do Dia.
 *
 * O que é: reprodução da cena "Campfire Colony" — a ilustração de Dave
 * Chenell (dribbble.com/shots/2012985) recriada em CodePen por jackiezen
 * (codepen.io/jackiezen/pen/gOOgvOO). A composição da origem:
 *
 *   - céu em degradê quente (pêssego → salmão), sem nuvens;
 *   - um grupo de pinheiros FINOS e altos à esquerda, cada um com a
 *     sombra comprida no chão, apontando para a esquerda;
 *   - um domo de pedra escuro à direita, com pinheiros pequenos atrás
 *     espiando por cima dele;
 *   - pedrinhas em cascata ao pé da pedra;
 *   - uma fogueira pequena entre os pinheiros e a pedra, com a fumaça
 *     subindo como uma linha fina e quase reta até o topo da cena.
 *
 * FIDELIDADE À ORIGEM (dono, 30/09/2026): as duas versões anteriores eram
 * esboços que não batiam com o CodePen (fogueira/árvores em círculo, sem
 * sombra, fumaça curta e torta). Esta segue os traços da referência — o
 * pinheiro é um triângulo estreito e comprido, com sombra deitada no
 * chão; a pedra é um domo; a fumaça é o traço mais alto da cena.
 *
 * Cores: não são fixas. Cada parte usa um token de tema (`--cp-*`) com
 * uma cor de reserva do código da origem, então a peça acompanha o tema
 * ativo (claro, escuro, pequi, alto contraste). Cor nunca é o único canal
 * e a animação é decorativa (`aria-hidden`); desligar o movimento não
 * perde informação.
 *
 * Acessibilidade: respeita `prefers-reduced-motion` (sem animação para
 * quem pediu menos movimento no sistema). O porte técnico traduz os
 * triângulos de borda e o SVG de fumaça do CodePen para um SVG único,
 * escalável, na proporção da cena (500×400).
 */
"use client";

import React from "react";

/** Linha do chão: pinheiros e pedras assentam aqui. */
const PISO = 320;

/**
 * Pinheiro fino com a sombra deitada no chão.
 *
 * O triângulo tem base estreita (a origem usa ~12px de base para 32-56px
 * de altura) e duas faces: a metade escura dá o relevo. A sombra é um
 * triângulo baixo e comprido saindo da base para a esquerda, como a luz
 * baixa do fim de tarde da ilustração.
 */
function Pinheiro({
  x,
  altura,
  base = 11,
}: {
  x: number;
  altura: number;
  base?: number;
}) {
  const meia = base / 2;
  return (
    <g>
      <polygon
        points={`${x - meia},${PISO} ${x + meia},${PISO} ${x - meia - altura * 0.9},${
          PISO + 7
        } ${x - meia - altura * 0.9 + base},${PISO + 7}`}
        fill="var(--cp-foreground, #7a4a44)"
        opacity="0.1"
      />
      <polygon
        points={`${x},${PISO - altura} ${x - meia},${PISO} ${x + meia},${PISO}`}
        fill="var(--cp-accent, #365e57)"
      />
      <polygon
        points={`${x},${PISO - altura} ${x - meia},${PISO} ${x},${PISO}`}
        fill="var(--cp-accent, #365e57)"
        opacity="0.4"
      />
    </g>
  );
}

/** Chama em losango (triângulo para cima + espelho para baixo). */
function Chama({
  x,
  y,
  largura,
  altura,
  espelho,
  cor,
  opacidade,
}: {
  x: number;
  y: number;
  largura: number;
  altura: number;
  espelho: number;
  cor: string;
  opacidade: number;
}) {
  return (
    <g fill={cor} opacity={opacidade}>
      <polygon points={`${x},${y - altura} ${x - largura},${y} ${x + largura},${y}`} />
      <polygon points={`${x - largura},${y} ${x + largura},${y} ${x},${y + espelho}`} />
    </g>
  );
}

export function CampfireColonyAnim() {
  return (
    <span
      aria-hidden="true"
      className="cp-campfire"
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        width: "100%",
        maxWidth: 132,
        aspectRatio: "5 / 4",
        height: "auto",
        flexShrink: 0,
      }}
    >
      <style>{`
        .cp-campfire svg { width: 100%; height: 100%; display: block; overflow: hidden; }
        .cp-campfire .cp-chamas {
          animation: cp-flicker 3s ease-in-out infinite alternate;
          transform-origin: 286px 305px;
        }
        .cp-campfire .cp-fumaca path {
          animation: cp-dash 3.2s linear infinite;
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
          to   { stroke-dashoffset: -440; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cp-campfire .cp-chamas,
          .cp-campfire .cp-fumaca path { animation: none; }
        }
      `}</style>
      <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" role="presentation">
        <defs>
          <linearGradient id="cp-ceu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--cp-surface-2, #ffd8c4)" />
            <stop offset="100%" stopColor="var(--cp-surface, #f6b6a8)" />
          </linearGradient>
          <radialGradient id="cp-domo" cx="62%" cy="30%" r="95%">
            <stop offset="0%" stopColor="var(--cp-text-soft, #4f5f5e)" />
            <stop offset="65%" stopColor="var(--cp-muted, #35474a)" />
            <stop offset="100%" stopColor="var(--cp-muted, #2b3a3d)" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="500" height="400" fill="url(#cp-ceu)" />

        {/* Pinheiros pequenos atrás do domo (espiando por cima da pedra). */}
        <Pinheiro x={352} altura={46} base={10} />
        <Pinheiro x={370} altura={38} base={10} />
        <Pinheiro x={388} altura={30} base={9} />

        {/* Domo de pedra à direita. */}
        <path
          d="M 282 320 A 48 47 0 0 1 378 320 Z"
          fill="url(#cp-domo)"
        />

        {/* Pedrinhas em cascata ao pé da pedra. */}
        <ellipse cx={300} cy={322} rx={7} ry={4.5} fill="var(--cp-text-soft, #5b6a68)" opacity="0.85" />
        <ellipse cx={287} cy={327} rx={5.5} ry={3.5} fill="var(--cp-text-soft, #5b6a68)" opacity="0.8" />
        <ellipse cx={275} cy={332} rx={4.5} ry={3} fill="var(--cp-text-soft, #5b6a68)" opacity="0.75" />

        {/* Pinheiros finos à esquerda, com sombra no chão. */}
        <Pinheiro x={70} altura={42} />
        <Pinheiro x={98} altura={60} />
        <Pinheiro x={122} altura={78} />
        <Pinheiro x={148} altura={52} />
        <Pinheiro x={176} altura={66} />

        {/* Fumaça: o traço mais alto da cena, fino e quase reto. */}
        <g className="cp-fumaca">
          <path
            d="M 286 296 C 281 236 301 214 293 150 C 287 104 300 66 295 18"
            fill="none"
            stroke="var(--cp-text-soft, #ffffff)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="360 80"
            opacity="0.55"
          />
        </g>

        {/* Fogueira entre os pinheiros e a pedra. */}
        <g className="cp-chamas">
          <Chama x={286} y={308} largura={13} altura={24} espelho={11} cor="var(--cp-tertiary, #fde26c)" opacidade={0.65} />
          <Chama x={286} y={310} largura={6} altura={12} espelho={7} cor="var(--cp-primary, #fda263)" opacidade={0.95} />
        </g>
      </svg>
    </span>
  );
}
