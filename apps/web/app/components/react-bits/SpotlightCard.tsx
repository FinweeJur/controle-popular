"use client";

/**
 * SpotlightCard — cartão com "luz" radial que segue o cursor.
 *
 * VENDORIADO de React Bits (https://reactbits.dev/components/
 * spotlight-card), biblioteca copy-paste, licença MIT. Copiado em
 * 05/10/2026 e adaptado ao portal.
 *
 * Adaptações ao portal:
 * 1. O brilho referencia o token `--cp-glow` do tema ativo (rgba fraca
 *    da cor primária) — trocou o tema, trocou a luz, sem código por tema;
 * 2. Só reage a `pointerType === "mouse"`: celular/tablet não tem o
 *    custo do handler nem o efeito sem cursor;
 * 3. `prefers-reduced-motion` e tema alto contraste desligam o efeito
 *    (regra do CSS em `react-bits.css`) — o cartão fica normal;
 * 4. É um <div> drop-in: recebe as MESMAS classes do cartão que substitui
 *    (borda, fundo, raio), então os cartões de indicadores dos eixos
 *    trocam sem mudar layout.
 *
 * Por que existe: luz de foco nos cartões de indicadores dos 4 eixos
 * (dono, 05/10/2026 — "gostei do spotlight card").
 */

import { useCallback, useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";

export interface SpotlightCardProps {
  children: ReactNode;
  /** Classes do cartão original (borda, fundo, raio, padding...). */
  className?: string;
  /** Cor do brilho em CSS. Padrão: token `--cp-glow` do tema. */
  corBrilho?: string;
  ariaLabel?: string;
}

export default function SpotlightCard({
  children,
  className = "",
  corBrilho,
  ariaLabel,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  /**
   * Escreve a posição do cursor em variáveis CSS lidas pelo gradiente
   * radial do ::after (ver `react-bits.css`). Sem estado React: escrever
   * direto no estilo evita re-render a cada pixel — o movimento fica a
   * 60fps sem custar hidratação.
   */
  const aoMover = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const caixa = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - caixa.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - caixa.top}px`);
  }, []);

  return (
    <div
      ref={ref}
      onPointerMove={aoMover}
      className={`cp-spotlight ${className}`}
      style={corBrilho ? ({ "--cp-spot-cor": corBrilho } as CSSProperties) : undefined}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
