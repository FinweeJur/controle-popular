"use client";

import { useState, useEffect } from "react";
import type { PonteEntreFrentes } from "@/lib/lugares";
import { obterDialogosPorRota, obterTopicoDialogo } from "@/lib/dialogos";
import CartaoPonteSanfona from "./CartaoPonteSanfona";

interface PainelDialogoProps {
  origemRota: string;
  origemTitulo?: string;
  codigoIbge?: string;
  pontes?: PonteEntreFrentes[];
  abertoInicialmente?: boolean;
}

export default function PainelDialogo({
  origemRota,
  origemTitulo,
  codigoIbge,
  pontes: pontesProps,
  abertoInicialmente = false,
}: PainelDialogoProps) {
  const [expandido, setExpandido] = useState(abertoInicialmente);

  const pontes = pontesProps ?? obterDialogosPorRota(origemRota, codigoIbge, origemTitulo);
  const topico = obterTopicoDialogo(origemRota, origemTitulo);

  // Fechar com ESC para acessibilidade
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && expandido) {
        setExpandido(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expandido]);

  if (pontes.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Diálogo entre frentes"
      className="my-8 rounded-2xl border border-primary/30 bg-surface-2 p-5 shadow-sm transition-all"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            💡
          </span>
          <div>
            <span className="text-[0.75rem] font-bold uppercase tracking-wider text-primary">
              Também acontece por aqui
            </span>
            <h2 className="font-display text-[1.15rem] font-semibold text-text">
              {origemTitulo ? `${origemTitulo} · ${topico}` : topico}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpandido((prev) => !prev)}
          aria-expanded={expandido}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text transition-colors hover:border-primary hover:text-primary"
        >
          <span>{expandido ? "Recolher conexões" : `Ver o que outras frentes dizem (${pontes.length})`}</span>
          <span className="text-xs transition-transform duration-200" style={{ transform: expandido ? "rotate(180deg)" : "rotate(0deg)" }}>
            ▼
          </span>
        </button>
      </div>

      <p className="mt-2 text-[0.88rem] text-text-soft">
        O dado não vive isolado. Veja como este mesmo lugar é acompanhado pelo Meio Ambiente, pelo Executivo, pelo Judiciário e pelo Congresso Nacional.
      </p>

      {expandido && (
        <div className="mt-5 grid gap-4 pt-4 border-t border-border sm:grid-cols-2 lg:grid-cols-3">
          {pontes.slice(0, 3).map((ponte) => (
            <CartaoPonteSanfona key={ponte.id} ponte={ponte} />
          ))}
        </div>
      )}
    </section>
  );
}
