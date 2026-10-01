/**
 * CampfireColonyAnim — animação decorativa da Mística do Dia.
 *
 * O que é: reprodução da cena "Campfire Colony" — a ilustração de Dave
 * Chenell (dribbble.com/shots/2012985) recriada em CodePen por jackiezen
 * (codepen.io/jackiezen/pen/gOOgvOO). A cena tem três camadas: as
 * árvores (pinheiros de triângulo), a pedra grande com as pedrinhas no
 * pé e a fogueira com a fumaça em curva tracejada subindo.
 *
 * FIDELIDADE À ORIGEM (dono, 30/09/2026): a primeira versão desta peça
 * era um SVG simplificado que NÃO batia com o CodePen — a fogueira e as
 * árvores eram círculos e elipses. Agora a composição segue a origem:
 * mesmas posições relativas das árvores (frente e fundo), a pedra
 * arredondada com quatro pedrinhas em cascata, e as três chamas em
 * losango (triângulo para cima + espelho para baixo) sobre um caminho de
 * fumaça tracejado que corre sozinho.
 *
 * Cores: não são fixas. Cada parte usa um token de tema (`--cp-*`), então
 * a peça acompanha sozinha o tema ativo (claro, escuro, pequi, alto
 * contraste). Cor nunca é o único canal e a animação é decorativa
 * (`aria-hidden`), então desligar o movimento não perde informação.
 *
 * Acessibilidade: respeita `prefers-reduced-motion` (sem animação para
 * quem pediu menos movimento no sistema).
 *
 * Porte técnico: o CodePen desenha as árvores com truques de CSS
 * (bordas em triângulo) e a fumaça com um SVG separado. Aqui tudo virou
 * um SVG único, escalável, para caber na altura do bloco da Mística sem
 * empurrar a capa — a proporção da cena (500×400) é preservada.
 */
"use client";

import React from "react";

/** Piso da cena: as árvores e as pedras assentam nesta linha. */
const PISO = 400;

/** Uma árvore: triângulo principal + metade sombreada (relevo da praia). */
function Arvore({ x, altura, base }: { x: number; altura: number; base: number }) {
  const meia = base / 2;
  const apice = PISO - base - altura;
  return (
    <g>
      <polygon
        points={`${x},${apice} ${x - meia},${PISO - base} ${x + meia},${PISO - base}`}
        fill="var(--cp-accent, #365e57)"
      />
      <polygon
        points={`${x},${apice} ${x - meia},${PISO - base} ${x},${PISO - base}`}
        fill="var(--cp-accent, #365e57)"
        opacity="0.45"
      />
    </g>
  );
}

/** Uma chama: losango (triângulo para cima + espelho para baixo). */
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
      <polygon
        points={`${x},${y - altura} ${x - largura},${y} ${x + largura},${y}`}
      />
      <polygon
        points={`${x - largura},${y} ${x + largura},${y} ${x},${y + espelho}`}
      />
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
        maxWidth: 128,
        aspectRatio: "5 / 4",
        height: "auto",
        flexShrink: 0,
      }}
    >
      <style>{`
        .cp-campfire svg { width: 100%; height: 100%; display: block; overflow: hidden; }
        .cp-campfire .cp-chamas {
          animation: cp-flicker 3s ease-in-out infinite alternate;
          transform-origin: 300px 360px;
        }
        .cp-campfire .cp-fumaca path {
          animation: cp-dash 3s linear infinite;
        }
        @keyframes cp-flicker {
          0%   { transform: rotate(-1deg); }
          20%  { transform: rotate(1deg); }
          40%  { transform: rotate(-1deg); }
          60%  { transform: rotate(1deg) scale(1.08); }
          80%  { transform: rotate(-2deg) scale(1); }
          100% { transform: rotate(1deg); }
        }
        @keyframes cp-dash {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -600; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cp-campfire .cp-chamas,
          .cp-campfire .cp-fumaca path { animation: none; }
        }
      `}</style>
      <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" role="presentation">
        {/* Céu da cena: gradiente claro -> quente (tokens de tema). */}
        <defs>
          <linearGradient id="cp-ceu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--cp-surface-2, #ffd2bc)" />
            <stop offset="100%" stopColor="var(--cp-surface, #f8b9ae)" />
          </linearGradient>
          <radialGradient id="cp-pedra" cx="80%" cy="90%" r="90%">
            <stop offset="0%" stopColor="var(--cp-text-soft, #917472)" />
            <stop offset="70%" stopColor="var(--cp-muted, #2f484f)" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="500" height="400" fill="url(#cp-ceu)" />

        {/* Árvores de fundo (à direita). */}
        <Arvore x={396} altura={56} base={12} />
        <Arvore x={402} altura={56} base={12} />
        <Arvore x={424} altura={32} base={12} />

        {/* Árvores da frente (à esquerda, alturas da origem). */}
        <Arvore x={80} altura={32} base={12} />
        <Arvore x={160} altura={32} base={12} />
        <Arvore x={172} altura={56} base={12} />
        <Arvore x={238} altura={56} base={12} />
        <Arvore x={334} altura={56} base={12} />
        <Arvore x={362} altura={56} base={12} />
        <Arvore x={368} altura={56} base={12} />

        {/* Pedra grande e pedrinhas em cascata ao pé. */}
        <g>
          <path
            d="M 360 288 q 37 -40 74 0 l 0 12 -74 0 z"
            fill="url(#cp-pedra)"
          />
          <path
            d="M 335 300 q 6 -12 12 0 l 0 6 -12 0 z"
            fill="var(--cp-text-soft, #917472)"
            opacity="0.85"
          />
          <path
            d="M 315 308 q 6 -12 12 0 l 0 6 -12 0 z"
            fill="var(--cp-text-soft, #917472)"
            opacity="0.8"
          />
          <path
            d="M 298 316 q 6 -12 12 0 l 0 6 -12 0 z"
            fill="var(--cp-text-soft, #917472)"
            opacity="0.75"
          />
          <path
            d="M 288 326 q 6 -12 12 0 l 0 6 -12 0 z"
            fill="var(--cp-text-soft, #917472)"
            opacity="0.7"
          />
        </g>

        {/* Fumaça: a curva da origem, tracejada e correndo sozinha. */}
        <g className="cp-fumaca">
          <path
            d="M 330 360 Q 370 300 300 220 C 230 140 320 120 270 20"
            fill="none"
            stroke="var(--cp-text-soft, #ffffff)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="500 100"
            opacity="0.3"
          />
        </g>

        {/* Fogueira: três chamas em losango, uma dentro da outra. */}
        <g className="cp-chamas">
          <Chama x={300} y={360} largura={20} altura={34} espelho={16} cor="var(--cp-tertiary, #fde26c)" opacidade={0.5} />
          <Chama x={300} y={362} largura={9} altura={14} espelho={9} cor="var(--cp-primary, #fda263)" opacidade={0.85} />
          <Chama x={300} y={362} largura={3} altura={6} espelho={4} cor="var(--cp-surface-2, #ffd2bc)" opacidade={0.9} />
        </g>
      </svg>
    </span>
  );
}
