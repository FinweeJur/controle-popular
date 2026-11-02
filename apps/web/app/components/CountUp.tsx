"use client";

/**
 * CountUp — Componente de contagem numérica animada (Lightswind pattern).
 * Utiliza Framer Motion para animar fluidamente de zero até o valor de destino
 * quando o elemento entra na área visível da tela (viewport).
 *
 * Suporta formatação brasileira (milhar com ponto, decimal com vírgula),
 * prefixos (R$, etc.), sufixos (%, etc.) e respeita prefers-reduced-motion.
 */

import React, { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";

export interface CountUpProps {
  /** Valor final numérico */
  value: number;
  /** Valor inicial (padrão: 0) */
  from?: number;
  /** Duração em segundos (padrão: 1.6) */
  duration?: number;
  /** Casas decimais (padrão: 0) */
  decimals?: number;
  /** Prefixo (ex: "R$ ", "+") */
  prefix?: string;
  /** Sufixo (ex: "%", " hab.", " mi") */
  suffix?: string;
  /** Separador de milhar (padrão: "." estilo pt-BR) */
  separator?: string;
  /** Separador decimal (padrão: "," estilo pt-BR) */
  decimalSeparator?: string;
  /** Se dispara quando entra no viewport (padrão: true) */
  triggerOnView?: boolean;
  /** Classes CSS adicionais */
  className?: string;
}

export function CountUp({
  value,
  from = 0,
  duration = 1.6,
  decimals = 0,
  prefix = "",
  suffix = "",
  separator = ".",
  decimalSeparator = ",",
  triggerOnView = true,
  className = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const [hasReducedMotion, setHasReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setHasReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setHasReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const count = useMotionValue(from);

  // Formata o número respeitando os separadores configurados
  const formatNumber = (num: number): string => {
    const fixed = num.toFixed(decimals);
    const [intPart, decPart] = fixed.split(".");
    const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    if (decimals > 0 && decPart !== undefined) {
      return `${withThousands}${decimalSeparator}${decPart}`;
    }
    return withThousands;
  };

  const display = useTransform(count, (latest) => {
    return `${prefix}${formatNumber(latest)}${suffix}`;
  });

  useEffect(() => {
    if (hasReducedMotion) {
      count.set(value);
      return;
    }

    if (!triggerOnView || isInView) {
      const controls = animate(count, value, {
        duration,
        ease: [0.16, 1, 0.3, 1],
      });
      return () => controls.stop();
    }
  }, [isInView, value, duration, triggerOnView, hasReducedMotion, count]);

  if (hasReducedMotion) {
    return (
      <span ref={ref} className={className}>
        {prefix}{formatNumber(value)}{suffix}
      </span>
    );
  }

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}

export default CountUp;
