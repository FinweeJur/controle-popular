"use client";

import { useEffect, useState } from "react";

/**
 * Botão acessível de retorno ao topo da página ("Back to Top").
 * Exibido quando a rolagem vertical ultrapassa 400px.
 * Respeita preferências de redução de movimento e suporta navegação por teclado.
 */
export function BackToTop() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    let ticking = false;

    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setVisivel(window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Checagem inicial caso a página já inicie com scroll
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function rolarAoTopo() {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });

    // Foca o skip-link ou elemento principal para acessibilidade via teclado
    const skipLink = document.getElementById("conteudo-principal");
    if (skipLink) {
      skipLink.focus({ preventScroll: true });
    }
  }

  if (!visivel) return null;

  return (
    <button
      type="button"
      onClick={rolarAoTopo}
      aria-label="Voltar ao início da página"
      title="Voltar ao início da página"
      className="group/topo cp-btn-anim fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex min-h-11 items-center justify-end rounded-full border border-border bg-surface/70 text-text-soft opacity-70 shadow-lg backdrop-blur transition-opacity hover:opacity-100 hover:border-primary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 motion-reduce:transition-none"
    >
      <span
        aria-hidden="true"
        className="max-w-0 overflow-hidden whitespace-nowrap pl-0 text-xs font-semibold opacity-0 transition-all duration-200 group-hover/topo:max-w-[5rem] group-hover/topo:pl-3 group-hover/topo:opacity-100 group-focus-visible/topo:max-w-[5rem] group-focus-visible/topo:pl-3 group-focus-visible/topo:opacity-100 motion-reduce:transition-none"
      >
        Voltar ao topo
      </span>
      <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center text-sm font-bold leading-none">
        ↑
      </span>
    </button>
  );
}
