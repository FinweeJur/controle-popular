"use client";

import { useEffect } from "react";

/**
 * ScrollbarExpansivel — engrossa a barra de rolagem quando o ponteiro chega
 * perto da borda direita.
 *
 * Papel no portal: a barra de rolagem fina é padrão de TODAS as páginas,
 * junto da navbar superior, do letreiro e do rodapé. Quando o leitor leva o
 * ponteiro para perto da direita (onde a barra mora), ela alarga e ganha a
 * cor da marca, ficando fácil de agarrar; longe da borda, volta a ser fina
 * para não roubar largura do conteúdo.
 *
 * Como funciona: um único listener de `pointermove` (com `requestAnimationFrame`
 * para não disparar trabalho a cada pixel) liga `data-scroll-perto` no
 * `<html>` a ~64 px da direita. Toda a aparência vive no CSS
 * (`globals.css`, seção "BARRA DE ROLAGEM GLOBAL"); aqui só há o estado.
 *
 * Acessibilidade e limites:
 * - é decoração: não usa foco, não depende de cor como único canal e não
 *   muda a rolagem por teclado ou roda do mouse;
 * - o movimento respeita `prefers-reduced-motion` (tratado no CSS);
 * - navegadores com barra sobreposta (macOS) ignoram a largura — degrada
 *   para a barra nativa, sem quebrar nada.
 */

/** Distância (px) da borda direita que dispara a expansão. */
const LIMIAR_PX = 64;

export default function ScrollbarExpansivel() {
  useEffect(() => {
    const raiz = document.documentElement;
    let perto = false;
    let raf = 0;
    let ultimoX = 0;

    const aplicar = () => {
      raf = 0;
      const novo = window.innerWidth - ultimoX <= LIMIAR_PX && ultimoX > 0;
      if (novo === perto) return;
      perto = novo;
      if (novo) raiz.setAttribute("data-scroll-perto", "");
      else raiz.removeAttribute("data-scroll-perto");
    };

    const aoMover = (e: PointerEvent) => {
      ultimoX = e.clientX;
      if (raf) return;
      raf = requestAnimationFrame(aplicar);
    };

    const recolher = () => {
      if (!perto) return;
      perto = false;
      raiz.removeAttribute("data-scroll-perto");
    };

    window.addEventListener("pointermove", aoMover, { passive: true });
    window.addEventListener("pointerleave", recolher);
    window.addEventListener("blur", recolher);
    return () => {
      window.removeEventListener("pointermove", aoMover);
      window.removeEventListener("pointerleave", recolher);
      window.removeEventListener("blur", recolher);
      if (raf) cancelAnimationFrame(raf);
      raiz.removeAttribute("data-scroll-perto");
    };
  }, []);

  return null;
}
