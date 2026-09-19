"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Hook global que detecta navegação entre páginas e dispara estados
 * de carregamento. Retorna { carregando, segundos }.
 *
 * - Ao clicar num link <a> interno, ativa o estado e começa a contar segundos
 * - Quando o pathname muda (usePathname), desativa — sinal confiável de
 *   que a navegação client-side do Next.js terminou
 * - Timeout de 15s como safety net
 */
export function useLoading() {
  const [carregando, setCarregando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const inicioRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const lastPathnameRef = useRef(pathname);

  const parar = useCallback(() => {
    setCarregando(false);
    setSegundos(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Para o loader quando o pathname muda (navegação completou)
  useEffect(() => {
    if (pathname !== lastPathnameRef.current) {
      lastPathnameRef.current = pathname;
      if (carregando) {
        // Pequeno delay para a nova página renderizar
        const t = setTimeout(parar, 300);
        return () => clearTimeout(t);
      }
    }
  }, [pathname, carregando, parar]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function onClick(e: MouseEvent) {
      const alvo = (e.target as HTMLElement).closest("a");
      if (!alvo) return;

      const href = alvo.getAttribute("href");
      if (!href) return;

      // Ignorar links externos, anchors, downloads, tel:, mailto:
      if (
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("tel:") ||
        href.startsWith("mailto:") ||
        href.endsWith(".pdf") ||
        href.endsWith(".zip") ||
        href.endsWith(".csv")
      )
        return;

      // Ignorar modifier keys (ctrl+click, meta+click, etc.)
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      // Ignorar links com target=_blank
      if (alvo.getAttribute("target") === "_blank") return;

      // Ativar loading
      setCarregando(true);
      inicioRef.current = Date.now();
      setSegundos(0);

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - inicioRef.current) / 1000);
        setSegundos(elapsed);
      }, 1000);

      // Safety net: 15s máximo
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(parar, 15000);
    }

    document.addEventListener("click", onClick, { capture: true });

    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      if (timerRef.current) clearInterval(timerRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [parar]);

  return { carregando, segundos };
}
