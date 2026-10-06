"use client";

/**
 * OndaCursor — malha quadriculada que acende no cursor e ondula no clique.
 *
 * Equivalente próprio, sem licença, do "Cursor Wave" (React Bits Pro). Mas a
 * implementação mudou de ideia em 06/10/2026, a pedido do dono: ele quis
 * "bem mais quadrados, 2× menores e só o contorno (oco)". Um `<div>` por
 * célula não escala para milhares — e `will-change` em milhares de nós derruba
 * o compositor.
 *
 * A solução é MALHA DE CSS: as linhas do quadriculado saem de dois
 * `repeating-linear-gradient` num único elemento, e o brilho do cursor é um
 * gradiente radial por cima, RECORTADO pela mesma malha (`mask-image`) — então
 * a luz só aparece nas linhas, e os quadrados ficam ocos de verdade. São TRÊS
 * elementos no total, qualquer que seja a densidade.
 *
 * Guardas de sempre: ouve o `document` (é fundo, `pointer-events: none`), não
 * chama `preventDefault`, e desliga em movimento reduzido, alto contraste e
 * tela de toque (ver `FundoOnda.tsx` e `useEfeitoPermitido`).
 */
import { useEffect, useRef, type CSSProperties } from "react";
import { useEfeitoPermitido } from "./useEfeitoPermitido";
import "./OndaCursor.css";

export interface OndaCursorProps {
  /** Passo da malha (distância entre linhas), em px. Padrão 12. */
  passo?: number;
  /** Espessura da linha, em px. Padrão 1. */
  espessura?: number;
  /** Raio do brilho que segue o cursor, em px. Padrão 24. */
  raio?: number;
  /** Largura do anel da onda do clique, em px. Padrão 18. */
  anel?: number;
  /** Duração da onda do clique, em ms. Padrão 900. */
  duracaoOnda?: number;
  /** Cor da luz (token do tema). */
  cor?: string;
  /** Cor das linhas da malha em repouso (token do tema). */
  corBorda?: string;
  /** Largura do bloco (vence o `width: 50%` do CSS). */
  largura?: number | string;
  className?: string;
}

const OndaCursor: React.FC<OndaCursorProps> = ({
  passo = 12,
  espessura = 1,
  raio = 24,
  anel = 18,
  duracaoOnda = 900,
  cor = "var(--cp-primary)",
  corBorda = "var(--cp-border)",
  largura,
  className = "",
}) => {
  const raiz = useRef<HTMLDivElement | null>(null);
  const permitido = useEfeitoPermitido();

  useEffect(() => {
    const el = raiz.current;
    if (!el || !permitido) return;

    let quadro = 0;
    let vivo = true;
    let inicioOnda = 0;

    /** Guarda o ponto do ponteiro em coordenadas do bloco. */
    const ponto = (e: { clientX: number; clientY: number }) => {
      const caixa = el.getBoundingClientRect();
      return { x: e.clientX - caixa.left, y: e.clientY - caixa.top, w: caixa.width, h: caixa.height };
    };

    const aoMover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const p = ponto(e);
      el.style.setProperty("--cp-onda-x", `${p.x.toFixed(1)}px`);
      el.style.setProperty("--cp-onda-y", `${p.y.toFixed(1)}px`);
      el.style.setProperty("--cp-onda-on", "1");
    };
    const aoSair = () => el.style.setProperty("--cp-onda-on", "0");

    const passo_onda = (agora: number) => {
      quadro = 0;
      if (!vivo) return;
      const t = Math.min((agora - inicioOnda) / duracaoOnda, 1);
      const max = Math.hypot(el.clientWidth, el.clientHeight);
      el.style.setProperty("--cp-onda-onda-r", `${(t * max).toFixed(1)}px`);
      el.style.setProperty("--cp-onda-onda-a", `${(1 - t).toFixed(3)}`);
      if (t < 1) quadro = requestAnimationFrame(passo_onda);
    };
    const aoClicar = (e: MouseEvent) => {
      const p = ponto(e);
      el.style.setProperty("--cp-onda-ox", `${p.x.toFixed(1)}px`);
      el.style.setProperty("--cp-onda-oy", `${p.y.toFixed(1)}px`);
      inicioOnda = performance.now();
      if (!quadro) quadro = requestAnimationFrame(passo_onda);
    };

    document.addEventListener("pointermove", aoMover, { passive: true });
    document.addEventListener("pointerleave", aoSair);
    document.addEventListener("click", aoClicar);
    window.addEventListener("blur", aoSair);

    return () => {
      vivo = false;
      if (quadro) cancelAnimationFrame(quadro);
      document.removeEventListener("pointermove", aoMover);
      document.removeEventListener("pointerleave", aoSair);
      document.removeEventListener("click", aoClicar);
      window.removeEventListener("blur", aoSair);
    };
  }, [permitido, duracaoOnda]);

  return (
    <div
      ref={raiz}
      className={`cp-onda ${className}`}
      aria-hidden="true"
      style={
        {
          ...(largura !== undefined
            ? { width: typeof largura === "number" ? `${largura}px` : largura }
            : {}),
          "--cp-onda-passo": `${passo}px`,
          "--cp-onda-esp": `${espessura}px`,
          "--cp-onda-raio": `${raio}px`,
          "--cp-onda-anel": `${anel}px`,
          "--cp-onda-cor": cor,
          "--cp-onda-borda": corBorda,
        } as CSSProperties
      }
    >
      <div className="cp-onda__malha" />
      <div className="cp-onda__brilho" />
      <div className="cp-onda__onda" />
    </div>
  );
};

export default OndaCursor;
