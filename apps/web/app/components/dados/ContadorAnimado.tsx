"use client";

import { useEffect, useRef, useState } from "react";
import { useEntrouNaTela } from "./useEntrouNaTela";

/**
 * @file Contador animado acessível com SSR inicial.
 *
 * REGRAS ATENDIDAS:
 * - SSR entrega o valor real final no HTML para robôs e leitores de tela;
 * - Dispara uma única vez na entrada da viewport (useEntrouNaTela);
 * - prefers-reduced-motion preserva o número final instantaneamente;
 * - Enquanto anima: aria-hidden no visual e span.sr-only com o valor final;
 * - Ao concluir: remove aria-hidden e o span.sr-only;
 * - requestAnimationFrame nativo sem dependências.
 */

export interface ContadorAnimadoProps {
  valor: number;
  formatar?: (n: number) => string;
  duracaoMs?: number;
  className?: string;
}

function formatarPadrao(n: number): string {
  return Math.round(n).toLocaleString("pt-BR");
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function ContadorAnimado({
  valor,
  formatar = formatarPadrao,
  duracaoMs = 2000,
  className = "",
}: ContadorAnimadoProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const entrou = useEntrouNaTela(containerRef);
  const [animando, setAnimando] = useState(false);
  const [progresso, setProgresso] = useState(1);
  const inicioRef = useRef<number | null>(null);
  const finalFormatado = formatar(valor);

  useEffect(() => {
    if (!entrou) return;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzido) return;

    inicioRef.current = null;
    let animId: number;

    const passo = (agora: number) => {
      inicioRef.current ??= agora;
      const decorrido = agora - inicioRef.current;
      const t = Math.min(1, decorrido / duracaoMs);
      const fator = easeOutCubic(t);
      setProgresso(fator);

      if (t < 1) {
        animId = requestAnimationFrame(passo);
      } else {
        setAnimando(false);
        setProgresso(1);
      }
    };

    animId = requestAnimationFrame((agora) => {
      setAnimando(true);
      setProgresso(0);
      passo(agora);
    });

    return () => cancelAnimationFrame(animId);
  }, [entrou, duracaoMs]);

  const valorAtual = animando ? progresso * valor : valor;
  const textoVisual = animando ? formatar(valorAtual) : finalFormatado;

  return (
    <span ref={containerRef} className={className}>
      {animando ? (
        <>
          <span className="sr-only">{finalFormatado}</span>
          <span aria-hidden="true">{textoVisual}</span>
        </>
      ) : (
        textoVisual
      )}
    </span>
  );
}
