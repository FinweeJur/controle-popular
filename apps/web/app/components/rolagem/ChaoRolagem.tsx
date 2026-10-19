"use client";

/**
 * ChaoRolagem — mede o "teto" da página e publica em `--cp-chao`.
 *
 * O topo do portal tem barras fixadas (`sticky top-0`): o header (~56–97 px)
 * e, nos hubs, uma subnav de chips que no celular empacota e chega a medir
 * 173 px (medido 15/10/2026 em `/central`, `/estado-e-economia`,
 * `/terra-e-territorios`). Toda âncora de seção (`#id` do Sumário e dos
 * Capítulos) precisa parar ABAIXO dessas barras — `scroll-margin-top` é a
 * propriedade que o navegador E o Lenis (1.3+) descontam do alvo.
 *
 * Por que medir e não fixar: um valor constante ou erra o hub (6rem < 173 px
 * → título fica sob a subnav) ou deixa buraco na página simples (11rem >
 * 97 px → título flutua longe demais do topo). Medido é a única fonte que
 * vale para as duas casas — e para as duas barras quando empacotam.
 *
 * A regra consome a variável em `globals.css` (`h2[id], h3[id], main [id]`).
 * Roda no layout raiz junto com o resto da rolagem; é invisível (devolve
 * null) e não depende do Lenis — funciona também com rolagem suave desligada
 * e em `prefers-reduced-motion`.
 *
 * Recalcula na montagem, em cada navegação (a subnav do hub só existe em
 * algumas rotas), no resize (empacotamento muda a altura) e uma vez com
 * atraso (subnav e conteúdo chegam tarde do cliente).
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Folga entre a barra e o título aterrissado — respiro, não medição. */
const GAPO_PX = 12;

/** Uma barra colada no topo? Sticky/fixed em `top: 0`, com texto e altura
 *  de barra. O corte 20–360 px recorta os spans vazios do rastro de cursor
 *  (sem texto) e caixas do tamanho da página. */
function ehBarraDeTopo(el: HTMLElement): boolean {
  const cs = getComputedStyle(el);
  if (cs.position !== "sticky" && cs.position !== "fixed") return false;
  if (cs.top !== "0px") return false;
  const h = el.offsetHeight;
  if (h < 20 || h > 360) return false;
  return !!el.textContent?.trim();
}

/** Teto: a maior barra sticky/fixed colada no topo (`top: 0`). */
function medirChao(): number {
  let chao = 0;
  for (const el of document.querySelectorAll<HTMLElement>("body *")) {
    if (ehBarraDeTopo(el) && el.offsetHeight > chao) chao = el.offsetHeight;
  }
  return chao;
}

export function ChaoRolagem() {
  const pathname = usePathname();

  useEffect(() => {
    const gravar = () => {
      const chao = medirChao();
      if (chao > 0) {
        document.documentElement.style.setProperty("--cp-chao", `${chao + GAPO_PX}px`);
      }
    };
    let raf = 0;
    const reagendar = () => {
      cancelAnimationFrame(raf);
      // 2 frames: o primeiro pinta o layout novo; o segundo pega a altura final.
      raf = requestAnimationFrame(() => requestAnimationFrame(gravar));
    };
    reagendar();
    const tarde = setTimeout(gravar, 400);
    window.addEventListener("resize", reagendar);
    return () => {
      clearTimeout(tarde);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", reagendar);
    };
  }, [pathname]);

  return null;
}
