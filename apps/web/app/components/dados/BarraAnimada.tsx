"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useEntrouNaTela } from "./useEntrouNaTela";

/**
 * @file Barra animada para gráficos HTML e SVG.
 *
 * REGRAS ATENDIDAS:
 * - Crescimento de 0 até o valor final em ~2 segundos;
 * - Anima uma única vez na entrada da tela (useEntrouNaTela);
 * - prefers-reduced-motion exibe a barra final instantaneamente;
 * - SSR e não-JS preservam o tamanho final no HTML;
 * - Sem bibliotecas externas; transição GPU (transform: scaleX/scaleY).
 */

export interface BarraAnimadaProps {
  fracao?: number;
  valor?: number;
  maximo?: number;
  orientacao?: "horizontal" | "vertical";
  duracaoMs?: number;
  cor?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function calcularFracao(fracao?: number, valor?: number, maximo?: number): number {
  if (fracao !== undefined) {
    return Math.max(0, Math.min(1, fracao));
  }
  if (!maximo) {
    return 0;
  }
  const proporcao = (valor ?? 0) / maximo;
  return Math.max(0, Math.min(1, proporcao));
}

export default function BarraAnimada({
  fracao,
  valor,
  maximo,
  orientacao = "horizontal",
  duracaoMs = 2000,
  cor,
  className = "",
  style,
  children,
}: BarraAnimadaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const entrou = useEntrouNaTela(ref);
  const f = calcularFracao(fracao, valor, maximo);

  const vertical = orientacao === "vertical";
  const escala = entrou ? 1 : 0;
  const transform = vertical ? `scaleY(${escala})` : `scaleX(${escala})`;
  const transformOrigin = vertical ? "bottom" : "left";

  const estiloBase: CSSProperties = {
    ...style,
    backgroundColor: cor ?? style?.backgroundColor,
    transform,
    transformOrigin,
    transition: `transform ${duracaoMs}ms cubic-bezier(0.16, 1, 0.3, 1)`,
    willChange: "transform",
  };

  if (vertical) {
    estiloBase.height = style?.height ?? `${(f * 100).toFixed(2)}%`;
  } else {
    estiloBase.width = style?.width ?? `${(f * 100).toFixed(2)}%`;
  }

  return (
    <div ref={ref} className={className} style={estiloBase}>
      {children}
    </div>
  );
}

export interface BarraAnimadaSvgProps {
  x?: number;
  y?: number;
  width: number;
  height: number;
  fill?: string;
  rx?: number;
  duracaoMs?: number;
  className?: string;
}

export function BarraAnimadaSvg({
  x = 0,
  y = 0,
  width,
  height,
  fill,
  rx = 0,
  duracaoMs = 2000,
  className = "",
}: BarraAnimadaSvgProps) {
  const ref = useRef<SVGRectElement>(null);
  const entrou = useEntrouNaTela(ref);
  const escala = entrou ? 1 : 0;

  return (
    <rect
      ref={ref}
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      rx={rx}
      className={className}
      style={{
        transform: `scaleX(${escala})`,
        transformOrigin: `${x}px ${y}px`,
        transition: `transform ${duracaoMs}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        willChange: "transform",
      }}
    />
  );
}
