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
      className="cp-btn-anim fixed right-5 bottom-20 z-40 flex items-center gap-1.5 rounded-full border border-border bg-surface/95 px-3 py-2 text-xs font-semibold text-text shadow-lg backdrop-blur hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      <span aria-hidden="true" className="text-sm font-bold leading-none">
        ↑
      </span>
      <span>Topo</span>
    </button>
  );
}
