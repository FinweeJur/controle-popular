"use client";

/**
 * CliqueNegado — feedback visual de "aqui não" no clique fora de botões.
 *
 * O que é: quando a pessoa clica em algo que NÃO é um controle interativo
 * (um card, um texto, uma área vazia), um "X" pequeno pulsa no ponteiro
 * por ~400 ms e some — o recado visual de que aquele pedaço da tela não
 * tem ação. Pedido do dono (19/10/2026).
 *
 * Decisões técnicas:
 * - um listener global de `pointerdown` em captura, no documento; a checagem
 *   de "é interativo?" usa `closest` com um seletor de controles: link,
 *   botão, campo, label, summary, contenteditable e os papéis ARIA de
 *   controle. Nele (ou dentro dele), o X NÃO aparece — clique em botão
 *   continua com o feedback natural do próprio botão;
 * - o X é um elemento único criado na hora, com `pointer-events: none`,
 *   `aria-hidden` e remoção automática no fim da animação (evento
 *   `animationend` + fallback de timeout): zero custo quando parado,
 *   nada de estado React nem re-render;
 * - respeito `prefers-reduced-motion` (nada de animação) e toque
 *   (`pointerType === "touch"`): o gesto é do mouse, como a trilha;
 * - vermelho/âmbar suave, mesma linguagem de brilho da trilha mágica
 *   (`text-shadow`), mas com a semântica de negação;
 * - não interfere com scroll nem foco: nunca chamamos preventDefault,
 *   stopPropagation ou focus — só observamos.
 */

import { useEffect, useRef } from "react";

/** Seletor de controles interativos: clique neles NÃO dispara o X. */
const SELETOR_INTERATIVO = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "summary",
  "[role='button']",
  "[role='link']",
  "[role='checkbox']",
  "[role='switch']",
  "[role='tab']",
  "[role='menuitem']",
  "[role='option']",
  "[contenteditable='true']",
  "[contenteditable='']",
].join(", ");

/** Duração da animação em ms — também é o fallback de limpeza. */
const DURACAO_MS = 400;

export default function CliqueNegado() {
  const camadaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const camada = camadaRef.current;
    if (!camada) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const aoClicar = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const alvo = e.target;
      if (!(alvo instanceof Element)) return;
      // Dentro de um controle (ou nele mesmo): o clique tem dono, sem X.
      if (alvo.closest(SELETOR_INTERATIVO)) return;

      const x = document.createElement("div");
      x.className = "cp-clique-negado";
      x.style.left = `${e.clientX}px`;
      x.style.top = `${e.clientY}px`;
      x.textContent = "✕";
      let embora = false;
      const sumir = () => {
        if (embora) return;
        embora = true;
        x.remove();
      };
      x.addEventListener("animationend", sumir, { once: true });
      window.setTimeout(sumir, DURACAO_MS + 200);
      camada.appendChild(x);
    };

    document.addEventListener("pointerdown", aoClicar, { capture: true });
    return () => {
      document.removeEventListener("pointerdown", aoClicar, {
        capture: true,
      } as EventListenerOptions);
    };
  }, []);

  return (
    <>
      <style>{`
        .cp-clique-negado-camada {
          position: fixed;
          inset: 0;
          z-index: 31;
          pointer-events: none;
          overflow: hidden;
          contain: strict;
        }
        .cp-clique-negado {
          position: fixed;
          left: 0;
          top: 0;
          transform: translate(-50%, -50%);
          font-family: var(--font-tabular-raw, var(--font-general-sans, monospace));
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1;
          color: #e5484d;
          text-shadow: 0 0 9px color-mix(in srgb, #e5484d 55%, transparent);
          user-select: none;
          pointer-events: none;
          animation: cp-clique-negado-pulsa ${DURACAO_MS}ms ease-out forwards;
        }
        @keyframes cp-clique-negado-pulsa {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          35% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
          70% { opacity: 0.9; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        }
      `}</style>
      <div ref={camadaRef} aria-hidden="true" className="cp-clique-negado-camada" />
    </>
  );
}
