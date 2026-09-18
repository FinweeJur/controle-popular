"use client";

import React from "react";

export interface CircularBarsProps {
  className?: string;
  size?: number;
  cor?: string;
}

/**
 * Loader circular de 8 barras em SVG com rotação contínua e opacidade gradual.
 * Renderiza perfeitamente em qualquer tamanho sem depender de transforms frágeis de CSS.
 */
export const CircularBars = ({ className = "", size = 20, cor }: CircularBarsProps) => {
  const bars = Array.from({ length: 8 });

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      role="status"
      aria-label="Carregando..."
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin text-primary"
        style={{ animationDuration: "0.9s" }}
      >
        {bars.map((_, i) => {
          const angle = i * 45;
          const opacity = Math.max(0.18, (i + 1) / 8);
          return (
            <rect
              key={i}
              x="11"
              y="2"
              width="2"
              height="5"
              rx="1"
              transform={`rotate(${angle} 12 12)`}
              fill={cor || "currentColor"}
              opacity={opacity}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default CircularBars;

