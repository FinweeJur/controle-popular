"use client";

/**
 * RastroCursor — trilha de palavras que acompanha o mouse.
 *
 * O que é: ao mover o mouse pela página, vão nascendo palavras na posição
 * do ponteiro; cada uma sobe um pouco, cresce e some. As palavras saem de
 * uma lista fixa e se alternam a cada aparição — paz, harmonia, saúde,
 * natureza, ayllu, pachamama, demarcaçãojá… — no vocabulário do portal
 * (cuidado, terra, luta, comunidade). A cada poucas aparições entra uma
 * saudação pelo RELÓGIO de quem lê: "bom dia", "boa tarde" ou "boa noite".
 *
 * Pedido do dono (30/09/2026): copiar o efeito "TrailCursor" do Framer,
 * trocando o rastro por palavras pré-definidas alternadas. O módulo do
 * Framer é um asset pago que vem vazio fora do editor, então o efeito foi
 * RECRIADO aqui (não copiado).
 *
 * Decisões técnicas:
 * - tudo por `Pointer Events` e DOM criado direto (`document.createElement`),
 *   sem re-render do React a cada movimento — o mouse dispara dezenas de
 *   eventos por segundo e um `setState` por evento pesaria;
 * - a criação é limitada por DISTÂNCIA (52 px) e por TEMPO (45 ms), e o
 *   número de palavras vivas tem teto (16): o rastro não vira uma nuvem
 *   ilegível nem trava o celular;
 * - cada palavra é removida no `animationend` (não fica lixo no DOM);
 * - é decorativo: `aria-hidden`, `pointer-events: none` e sem captura de
 *   clique — não atrapalha botão, link nem leitor de tela;
 * - respeita `prefers-reduced-motion` e não liga em tela de toque
 *   (sem mouse, sem rastro): quem pediu menos movimento não vê nada.
 *
 * Cores: a palavra alterna entre `--cp-primary` e `--cp-accent`, então
 * acompanha o tema ativo. A sombra usa `color-mix` sobre o fundo.
 */

import { useEffect, useRef } from "react";

/**
 * Vocabulário da trilha, na ordem em que se alterna. Fica aqui (não no
 * render) para o componente ser puramente de apresentação; acrescentar
 * palavra é editar esta lista.
 */
const PALAVRAS = [
  "paz",
  "harmonia",
  "saúde",
  "vida",
  "natureza",
  "bem viver",
  "ayllu",
  "pachamama",
  "pindorama",
  "abya yala",
  "cultura",
  "lazer",
  "esporte",
  "orçamento",
  "direitos",
  "revolução",
  "povo",
  "latinoamérica",
  "brasilcoms",
  "étempodeavançar",
  "soberania",
  "mística",
  "umdiadecadavez",
  "respire",
  "obrigado",
  "cooperação",
  "solidariedade",
  "tatarana",
  "urutubranco",
  "diadorim",
  "grandesertão",
  "chapada",
  "riosvivos",
  "florestadepé",
  "mulheresvivaselivres",
  "demarcaçãojá",
  "lutarsempre",
] as const;

/** Saudação pelo relógio local de quem lê. */
function saudacao(agora: Date = new Date()): string {
  const h = agora.getHours();
  if (h >= 5 && h < 12) return "bom dia";
  if (h >= 12 && h < 18) return "boa tarde";
  return "boa noite";
}

/** Distância mínima (px) entre duas palavras para não amontoar. */
const PASSO = 52;
/** Intervalo mínimo (ms) entre palavras mesmo com o mouse rápido. */
const INTERVALO = 45;
/** Teto de palavras vivas ao mesmo tempo. */
const MAX_VIVAS = 16;
/** De quantas em quantas palavras entra a saudação do horário. */
const A_CADA_SAUDACAO = 9;

export default function RastroCursor() {
  const camadaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const camada = camadaRef.current;
    if (!camada) return;

    const semMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const semMouse = window.matchMedia(
      "(hover: none), (pointer: coarse)",
    ).matches;
    if (semMovimento || semMouse) return;

    let indicePalavra = 0;
    let contadorSaudacao = 0;
    let ultimoX = Number.NEGATIVE_INFINITY;
    let ultimoY = Number.NEGATIVE_INFINITY;
    let ultimoTempo = 0;

    const nascer = (x: number, y: number) => {
      contadorSaudacao += 1;
      const usaSaudacao = contadorSaudacao % A_CADA_SAUDACAO === 0;
      const texto = usaSaudacao
        ? saudacao()
        : PALAVRAS[indicePalavra++ % PALAVRAS.length];

      const palavra = document.createElement("span");
      palavra.className = "cp-rastro";
      palavra.textContent = texto;
      palavra.style.left = `${x}px`;
      palavra.style.top = `${y}px`;
      // Desvio lateral e cor alternada dão vida sem sortear a palavra.
      palavra.style.setProperty(
        "--cp-rastro-dx",
        `${(Math.random() * 2 - 1) * 24}px`,
      );
      palavra.style.setProperty(
        "--cp-rastro-cor",
        indicePalavra % 2 === 0 ? "var(--cp-primary)" : "var(--cp-accent)",
      );

      camada.appendChild(palavra);
      palavra.addEventListener("animationend", () => palavra.remove(), {
        once: true,
      });
      while (camada.childElementCount > MAX_VIVAS) {
        camada.firstElementChild?.remove();
      }
    };

    const aoMover = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const dx = e.clientX - ultimoX;
      const dy = e.clientY - ultimoY;
      if (dx * dx + dy * dy < PASSO * PASSO) return;
      const agora = performance.now();
      if (agora - ultimoTempo < INTERVALO) return;
      ultimoX = e.clientX;
      ultimoY = e.clientY;
      ultimoTempo = agora;
      nascer(e.clientX, e.clientY);
    };

    window.addEventListener("pointermove", aoMover, { passive: true });
    return () => window.removeEventListener("pointermove", aoMover);
  }, []);

  return (
    <>
      <style>{`
        .cp-rastro-camada {
          position: fixed;
          inset: 0;
          z-index: 30;
          pointer-events: none;
          overflow: hidden;
          contain: strict;
        }
        .cp-rastro {
          position: fixed;
          left: 0;
          top: 0;
          transform: translate(-50%, -50%);
          font-family: var(--font-clash-display, var(--font-general-sans, system-ui));
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          white-space: nowrap;
          color: var(--cp-rastro-cor, var(--cp-primary));
          text-shadow: 0 1px 3px color-mix(in srgb, var(--cp-bg) 65%, transparent);
          will-change: transform, opacity;
          user-select: none;
          opacity: 0;
          animation: cp-rastro-vida 1.15s ease-out forwards;
        }
        @keyframes cp-rastro-vida {
          0%   { opacity: 0;    transform: translate(-50%, -50%) scale(0.72); }
          18%  { opacity: 0.95; }
          100% { opacity: 0;
                 transform: translate(-50%, calc(-50% - 30px))
                            translateX(var(--cp-rastro-dx, 0px)) scale(1.06); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cp-rastro-camada { display: none; }
        }
      `}</style>
      <div ref={camadaRef} aria-hidden="true" className="cp-rastro-camada" />
    </>
  );
}
