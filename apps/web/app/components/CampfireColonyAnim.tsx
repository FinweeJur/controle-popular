/**
 * CampfireColonyAnim — animação decorativa da fogueira (mística do dia).
 *
 * O que é: um SVG compacto de acampamento (fogueira, árvores, pedras e
 * fumaça) que ilustra a "Mística do Dia" logo abaixo da navbar. Portado da
 * ilustração "Colony" de Dave Chenell (dribbble.com/shots/2012985) e da
 * recriação em CodePen de jackiezen (codepen.io/jackiezen/pen/gOOgvOO).
 *
 * Por que compacto: o dev pediu a peça "espremida" na altura — pouco
 * espaço abaixo das copas e pouco acima do topo da fumaça — para ficar na
 * mesma linha do texto da mística, sem empurrar a capa para baixo.
 *
 * Cores: NÃO são fixas. Cada parte usa um token de tema (`--cp-*`), então
 * a peça acompanha sozinha o tema ativo (claro, escuro, pequi, alto
 * contraste etc.). Cor nunca é o único canal e a animação é decorativa
 * (`aria-hidden`), então desligar o movimento não perde informação.
 *
 * Acessibilidade: respeita `prefers-reduced-motion` (sem animação para quem
 * pediu menos movimento no sistema).
 */
"use client";

import React from "react";

export function CampfireColonyAnim() {
  return (
    <span
      aria-hidden="true"
      className="cp-campfire"
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        width: "100%",
        maxWidth: 96,
        aspectRatio: "7 / 5",
        height: "auto",
        flexShrink: 0,
      }}
    >
      <style>{`
        .cp-campfire svg { width: 100%; height: 100%; display: block; overflow: hidden; }
        .cp-campfire .cp-flames { animation: cp-flicker 2.2s ease-in-out infinite alternate; transform-origin: 52px 46px; }
        .cp-campfire .cp-smoke { animation: cp-smoke 3.6s ease-in-out infinite; transform-origin: 56px 40px; }
        @keyframes cp-flicker {
          0%   { transform: rotate(-1.5deg) scale(1); }
          50%  { transform: rotate(1.5deg) scale(1.05); }
          100% { transform: rotate(-1deg) scale(1); }
        }
        @keyframes cp-smoke {
          0%, 100% { opacity: .35; transform: translateY(0); }
          50%      { opacity: .7;  transform: translateY(-3px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cp-campfire .cp-flames,
          .cp-campfire .cp-smoke { animation: none; }
        }
      `}</style>
      <svg viewBox="0 0 112 80" xmlns="http://www.w3.org/2000/svg" role="presentation">
        {/* Pedras ao pé da fogueira (tom neutro do tema). */}
        <ellipse cx={22} cy={72} rx={9} ry={5} fill="var(--cp-text-soft, #a0887a)" opacity=".85" />
        <ellipse cx={46} cy={70} rx={7} ry={4} fill="var(--cp-text-soft, #a0887a)" opacity=".85" />
        <ellipse cx={90} cy={73} rx={7} ry={4} fill="var(--cp-text-soft, #a0887a)" opacity=".8" />

        {/* Árvores ao fundo: tronco no tom de destaque do tema. */}
        <rect x={11} y={52} width={7} height={20} rx={3} fill="var(--cp-accent, #5a7c5e)" opacity=".9" />
        <circle cx={14.5} cy={50} r={9} fill="var(--cp-accent, #5a7c5e)" opacity=".45" />
        <rect x={59} y={56} width={6} height={15} rx={2} fill="var(--cp-accent, #5a7c5e)" opacity=".85" />
        <circle cx={62} cy={53} r={6} fill="var(--cp-accent, #5a7c5e)" opacity=".4" />

        {/* Lenha sob as chamas. */}
        <rect x={40} y={52} width={26} height={4} rx={2} fill="var(--cp-tertiary, #8a5300)" opacity=".9" />

        {/* Chamas: três camadas nos tons do tema (nunca só amarelo). */}
        <g className="cp-flames">
          <circle cx={50} cy={44} r={7} fill="var(--cp-tertiary, #ffd220)" opacity=".9" style={{ mixBlendMode: "screen" }} />
          <circle cx={55} cy={38} r={5} fill="var(--cp-primary, #ff7a00)" opacity=".92" style={{ mixBlendMode: "screen" }} />
          <circle cx={46} cy={34} r={4} fill="var(--cp-secondary, #f79327)" opacity=".85" style={{ mixBlendMode: "screen" }} />
        </g>

        {/* Fumaça subindo, no tom neutro do tema. */}
        <path
          className="cp-smoke"
          d="M54 34 Q58 24 63 18 Q67 12 72 6"
          fill="none"
          stroke="var(--cp-text-soft, #999)"
          strokeWidth={2}
          strokeLinecap="round"
          opacity=".6"
        />
      </svg>
    </span>
  );
}
