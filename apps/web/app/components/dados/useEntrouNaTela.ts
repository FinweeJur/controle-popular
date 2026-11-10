"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * @file Hook que detecta a primeira entrada de um elemento na tela.
 *
 * O QUE É: monitora via IntersectionObserver quando o elemento referenciado
 * atinge o threshold na viewport.
 *
 * POR QUE ASSIM:
 * - Dispara uma única vez por visita (desconecta assim que entra);
 * - Respeita prefers-reduced-motion: se ativo, considera que já entrou imediatamente;
 * - Zero dependência externa, leve e seguro para hidratação.
 */
export function useEntrouNaTela(
  ref: RefObject<Element | null>,
  threshold = 0.25,
): boolean {
  const [entrou, setEntrou] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      const frameId = requestAnimationFrame(() => setEntrou(true));
      return () => cancelAnimationFrame(frameId);
    }

    const elemento = ref.current;
    if (!elemento) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setEntrou(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(elemento);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return entrou;
}
