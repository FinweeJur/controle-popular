"use client";

/**
 * CampfireColonyAnim — animação decorativa da Mística do Dia.
 *
 * O que é: reprodução da cena "Campfire Colony" — a ilustração de Dave
 * Chenell (dribbble.com/shots/2012985) recriada em CodePen por jackiezen
 * (codepen.io/jackiezen/pen/gOOgvOO). A composição da origem:
 *
 *   - céu em degradê quente (pêssego → salmão), sem nuvens;
 *   - um grupo de pinheiros FINOS e altos à esquerda, cada um com a
 *     sombra comprida deitada no chão, sempre para o MESMO canto
 *     (baixo-esquerda), o que dá a profundidade da cena;
 *   - um domo de pedra escuro à direita, com pinheiros pequenos atrás
 *     espiando por cima dele e a própria sombra no chão;
 *   - pedrinhas em cascata ao pé da pedra;
 *   - uma fogueira pequena e AFASTADA da pedra (entre os pinheiros e o
 *     domo), com a fumaça subindo como uma linha fina e quase reta.
 *
 * FIDELIDADE À ORIGEM (dono, 30/09/2026): as versões anteriores eram
 * esboços sem perspectiva (fogueira colada na pedra, sem sombra). Esta
 * segue a referência: luz vinda da direita, sombras compridas para a
 * esquerda, pinheiro com duas faces (relevo) e a fogueira separada.
 *
 * COR (dono, 30/09/2026): o brilho, as chamas e a FUMAÇA usam
 * `--cp-primary` — a cor da marca do tema ativo (laranja no pequi, verde
 * em Mata Atlântica, azul no Pantanal, terracota no Cerrado…). O miolo da
 * chama é a mesma cor clareada com `color-mix`.
 *
 * Cores do resto: cada parte usa um token de tema (`--cp-*`) com uma cor
 * de reserva da origem, então a peça acompanha o tema. Cor nunca é o
 * único canal e a animação é decorativa (`aria-hidden`); desligar o
 * movimento não perde informação.
 *
 * Acessibilidade: respeita `prefers-reduced-motion` (sem animação para
 * quem pediu menos movimento no sistema). O porte técnico traduz os
 * triângulos de borda e o SVG de fumaça do CodePen para um SVG único,
 * escalável, na proporção da cena (500×400).
 */

import React from "react";

/** Linha do chão: pinheiros e pedras assentam aqui. */
const PISO = 322;

/** Sombra deitada no chão, sempre para o mesmo canto (baixo-esquerda). */
function sombraChao(x: number, largura: number, comprimento: number) {
  const meia = largura / 2;
  return `M ${x - meia} ${PISO} L ${x + meia} ${PISO} L ${x - meia - comprimento} ${
    PISO + comprimento * 0.12
  } Z`;
}

/**
 * Pinheiro fino com a sombra deitada no chão para a esquerda.
 *
 * O triângulo tem base estreita (a origem usa ~12px de base para 32-56px
 * de altura) e duas faces: a metade esquerda mais escura dá o relevo
 * (a luz vem da direita). A sombra é longa, no mesmo canto da cena.
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
      <path
        d={sombraChao(x, base, altura * 0.95)}
        fill="var(--cp-text-soft, #7a4a44)"
        opacity="0.16"
      />
      <polygon
        points={`${x},${PISO - altura} ${x - meia},${PISO} ${x + meia},${PISO}`}
        fill="var(--cp-accent, #365e57)"
      />
      <polygon
        points={`${x},${PISO - altura} ${x - meia},${PISO} ${x},${PISO}`}
        fill="var(--cp-accent, #365e57)"
        opacity="0.42"
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
        maxWidth: 150,
        aspectRatio: "5 / 4",
        height: "auto",
        flexShrink: 0,
      }}
    >
      <style>{`
        .cp-campfire svg { width: 100%; height: 100%; display: block; overflow: hidden; }
        .cp-campfire .cp-chamas {
          animation: cp-flicker 3s ease-in-out infinite alternate;
          transform-origin: 238px 306px;
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
            <stop offset="0%" stopColor="var(--cp-surface-2, #ffd2bc)" />
            <stop offset="100%" stopColor="var(--cp-surface, #f8b9ae)" />
          </linearGradient>
          <radialGradient id="cp-domo" cx="70%" cy="26%" r="100%">
            <stop offset="0%" stopColor="var(--cp-text-soft, #4f5f5e)" />
            <stop offset="60%" stopColor="var(--cp-muted, #35474a)" />
            <stop offset="100%" stopColor="var(--cp-muted, #263538)" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="500" height="400" fill="url(#cp-ceu)" />

        {/* Pinheiros pequenos atrás do domo (espiando por cima da pedra). */}
        <Pinheiro x={368} altura={48} base={10} />
        <Pinheiro x={388} altura={40} base={10} />
        <Pinheiro x={408} altura={32} base={9} />

        {/* Sombra comprida da pedra, no mesmo canto das árvores. */}
        <path
          d={`M 320 ${PISO} L 412 ${PISO} L 286 ${PISO + 12} Z`}
          fill="var(--cp-text-soft, #7a4a44)"
          opacity="0.16"
        />

        {/* Domo de pedra à direita. */}
        <path d="M 300 322 A 51 50 0 0 1 402 322 Z" fill="url(#cp-domo)" />
        {/* Reflexo claro na base direita (luz vinda da direita). */}
        <path
          d="M 360 322 A 51 50 0 0 1 402 322 L 360 322 Z"
          fill="var(--cp-text-soft, #917472)"
          opacity="0.35"
        />

        {/* Pedrinhas em cascata ao pé da pedra. */}
        <ellipse cx={318} cy={326} rx={8} ry={4.6} fill="var(--cp-text-soft, #5b6a68)" opacity="0.9" />
        <ellipse cx={303} cy={332} rx={6} ry={3.6} fill="var(--cp-text-soft, #5b6a68)" opacity="0.82" />
        <ellipse cx={289} cy={338} rx={4.8} ry={3} fill="var(--cp-text-soft, #5b6a68)" opacity="0.74" />

        {/* Pinheiros finos à esquerda, com sombra no chão. */}
        <Pinheiro x={58} altura={42} />
        <Pinheiro x={80} altura={62} />
        <Pinheiro x={102} altura={86} />
        <Pinheiro x={126} altura={64} />
        <Pinheiro x={150} altura={76} />
        <Pinheiro x={176} altura={52} />

        {/* Fumaça: o traço mais alto da cena, na cor da marca do tema. */}
        <g className="cp-fumaca">
          <path
            d="M 238 300 C 233 240 253 214 245 150 C 239 104 252 64 247 16"
            fill="none"
            stroke="var(--cp-primary, #f2701d)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="360 80"
            opacity="0.45"
          />
        </g>

        {/* Fogueira AFASTADA da pedra (entre os pinheiros e o domo). O
            brilho, as chamas e a fumaça usam `--cp-primary` (cor do tema);
            o miolo é a mesma cor clareada. */}
        <g className="cp-chamas">
          <circle cx={238} cy={302} r={22} fill="var(--cp-primary, #f2701d)" opacity="0.3" />
          <Chama x={238} y={306} largura={16} altura={30} espelho={13} cor="var(--cp-primary, #f2701d)" opacidade={0.9} />
          <Chama x={238} y={308} largura={8} altura={16} espelho={8} cor="color-mix(in srgb, var(--cp-primary, #f2701d) 40%, #ffffff)" opacidade={1} />
        </g>
      </svg>
    </span>
  );
}
