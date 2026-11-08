"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrencyCompactaBR } from "@/lib/betim/format";
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

export type FormatoContador = "numero" | "percentual" | "moeda-compacta";

export interface ContadorAnimadoProps {
  valor: number;
  /**
   * Função de formatação. Só vale em componente CLIENTE: Server Component
   * não pode passar função para cá ("Functions cannot be passed directly to
   * Client Components" — build de 08/11/2026 em `/paraopeba/execucao`).
   * Em página de servidor, use `formato`.
   */
  formatar?: (n: number) => string;
  /** Formatação pronta e serializável, para quem vem do servidor. */
  formato?: FormatoContador;
  duracaoMs?: number;
  className?: string;
}

function formatarPadrao(n: number): string {
  return Math.round(n).toLocaleString("pt-BR");
}

function formatarPercentual(n: number): string {
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`;
}

/** Formatações seguras na fronteira servidor → cliente. */
const FORMATADORES: Record<FormatoContador, (n: number) => string> = {
  numero: formatarPadrao,
  percentual: formatarPercentual,
  "moeda-compacta": formatCurrencyCompactaBR,
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function ContadorAnimado({
  valor,
  formatar,
  formato = "numero",
  duracaoMs = 2000,
  className = "",
}: ContadorAnimadoProps) {
  const formatador = formatar ?? FORMATADORES[formato];
  const containerRef = useRef<HTMLSpanElement>(null);
  const entrou = useEntrouNaTela(containerRef);
  const [animando, setAnimando] = useState(false);
  const [progresso, setProgresso] = useState(1);
  const inicioRef = useRef<number | null>(null);
  const finalFormatado = formatador(valor);

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
  const textoVisual = animando ? formatador(valorAtual) : finalFormatado;

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
