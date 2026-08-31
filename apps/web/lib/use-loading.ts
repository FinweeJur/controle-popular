"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook global que detecta navegação entre páginas e dispara estados
 * de carregamento. Retorna { carregando, segundos }.
 *
 * - Ao clicar num link <a> interno, ativa o estado e começa a contar segundos
 * - Quando a página termina de carregar (load event), desativa
 * - Também desativa no timeout de 30s (segurança)
 */
export function useLoading() {
  const [carregando, setCarregando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const inicioRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const parar = useCallback(() => {
    setCarregando(false);
    setSegundos(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

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
    }

    function onLoad() {
      // Pequeno delay para garantir que a página já renderizou
      setTimeout(parar, 300);
    }

    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener("load", onLoad);

    // Timeout de segurança: 30s
    const timeout = setTimeout(parar, 30000);

    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("load", onLoad);
      clearTimeout(timeout);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [parar]);

  return { carregando, segundos };
}
