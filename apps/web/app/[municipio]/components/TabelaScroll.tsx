"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";

/**
 * Wrapper de tabela larga com AFFORDANCE de rolagem horizontal. O
 * `overflow-x-auto` sozinho rola, mas não sinaliza que rola — a última
 * coluna só corta na borda e parece bug (relato do usuário 2026-07-24:
 * "página de contratos cortando a parte de status", idem Vigência em
 * /emendas). Aqui uma faixa-gradiente + seta aparece na(s) borda(s) que
 * ainda têm conteúdo escondido, e some quando chega ao fim daquele lado.
 */
export default function TabelaScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [maisEsq, setMaisEsq] = useState(false);
  const [maisDir, setMaisDir] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const atualizar = () => {
      setMaisEsq(el.scrollLeft > 4);
      setMaisDir(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    atualizar();
    el.addEventListener("scroll", atualizar, { passive: true });
    window.addEventListener("resize", atualizar);
    return () => {
      el.removeEventListener("scroll", atualizar);
      window.removeEventListener("resize", atualizar);
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={ref}
        className="overflow-x-auto rounded-2xl border border-border shadow-sm"
      >
        {children}
      </div>
      {maisEsq && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center rounded-l-2xl bg-gradient-to-r from-surface to-transparent pl-1 text-text-soft"
        >
          <span className="text-lg leading-none">‹</span>
        </div>
      )}
      {maisDir && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-end rounded-r-2xl bg-gradient-to-l from-surface to-transparent pr-1 text-text-soft"
        >
          <span className="text-lg leading-none">›</span>
        </div>
      )}
    </div>
  );
}
