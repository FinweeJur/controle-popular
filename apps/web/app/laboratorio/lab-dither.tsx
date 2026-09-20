"use client";

import React from "react";

export interface DitherItem {
  rotulo: string;
  valor: number;
  cor?: string;
}

interface LabDitherProps {
  itens: DitherItem[];
  titulo?: string;
  maxDots?: number;
  dotSize?: number;
  gap?: number;
}

function dotsForValue(valor: number, maxValor: number, maxDots: number): number {
  if (maxValor === 0) return 0;
  return Math.max(1, Math.round((valor / maxValor) * maxDots));
}

export default function LabDither({
  itens,
  titulo,
  maxDots = 40,
  dotSize = 6,
  gap = 2,
}: LabDitherProps) {
  if (!itens.length) return null;

  const maxValor = Math.max(...itens.map((i) => i.valor), 1);
  const cols = maxDots;
  const rowH = dotSize + gap + 14;

  return (
    <figure className="w-full">
      {titulo && (
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-soft">
          {titulo}
        </h4>
      )}
      <svg
        viewBox={`0 0 ${cols * (dotSize + gap)} ${itens.length * rowH}`}
        role="img"
        aria-label={titulo || "Gráfico de pontos"}
        className="h-auto w-full"
      >
        {itens.map((item, i) => {
          const n = dotsForValue(item.valor, maxValor, maxDots);
          const y = i * rowH;
          const cor = item.cor || "var(--color-primary, #10b981)";
          return (
            <g key={item.rotulo}>
              <text
                x={0}
                y={y + dotSize}
                fontSize={9}
                fill="currentColor"
                className="text-text-soft"
              >
                {item.rotulo.length > 18 ? `${item.rotulo.slice(0, 16)}…` : item.rotulo}
              </text>
              {Array.from({ length: n }).map((_, j) => (
                <circle
                  key={j}
                  cx={j * (dotSize + gap) + 120 + dotSize / 2}
                  cy={y + dotSize / 2}
                  r={dotSize / 2}
                  fill={cor}
                  opacity={0.75}
                />
              ))}
              <text
                x={120 + n * (dotSize + gap) + 6}
                y={y + dotSize}
                fontSize={9}
                fontWeight="bold"
                fill="currentColor"
                className="font-tabular text-text"
              >
                {item.valor.toLocaleString("pt-BR")}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
