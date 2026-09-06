"use client";

import { useState, useEffect } from "react";
import type { PonteEntreFrentes } from "@/lib/lugares";
import { obterDialogosPorRota, obterTopicoDialogo } from "@/lib/dialogos";
import CartaoPonteSanfona from "./CartaoPonteSanfona";

export interface PerguntaDialogo {
  id: string;
  pergunta: string;
  resposta: string;
}

export interface PainelDialogoProps {
  origemRota?: string;
  origemTitulo?: string;
  titulo?: string;
  codigoIbge?: string;
  pontes?: PonteEntreFrentes[];
  perguntas?: PerguntaDialogo[];
  abertoInicialmente?: boolean;
}

export default function PainelDialogo({
  origemRota,
  origemTitulo,
  titulo,
  codigoIbge,
  pontes: pontesProps,
  perguntas,
  abertoInicialmente = false,
}: PainelDialogoProps) {
  const [expandido, setExpandido] = useState(abertoInicialmente);

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

  // Modo 1: Perguntas frequentes / Sanfona de diálogo explicativo
  if (perguntas && perguntas.length > 0) {
    const tituloExibido = titulo ?? "Perguntas Frequentes & Como Interpretar";
    return (
      <section
        aria-label={tituloExibido}
        className="my-8 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            💬
          </span>
          <div>
            <span className="text-[0.75rem] font-bold uppercase tracking-wider text-primary">
              Controle Popular Explica
            </span>
            <h2 className="font-display text-[1.15rem] font-semibold text-text">
              {tituloExibido}
            </h2>
          </div>
        </div>

        <div className="space-y-3">
          {perguntas.map((p) => (
            <details
              key={p.id}
              className="group rounded-xl border border-border bg-surface-2 p-4 transition-colors hover:border-primary/50"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-[0.95rem] text-text">
                <span>{p.pergunta}</span>
                <span className="ml-2 text-xs transition-transform duration-200 group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <p className="mt-3 text-[0.88rem] leading-relaxed text-text-soft border-t border-border pt-3">
                {p.resposta}
              </p>
            </details>
          ))}
        </div>
      </section>
    );
  }

  // Modo 2: Diálogo entre frentes (Ponte)
  const pontes =
    pontesProps ?? (origemRota ? obterDialogosPorRota(origemRota, codigoIbge, origemTitulo) : []);
  const topico = origemRota ? obterTopicoDialogo(origemRota, origemTitulo) : "";

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

