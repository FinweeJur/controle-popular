"use client";

/**
 * Componente cliente para visualização das Comissões Temáticas da Assembleia Legislativa.
 *
 * Papel no portal:
 * Exibe a composição das Comissões Permanentes (CCJ, Finanças, Meio Ambiente, etc.)
 * e Comissões Especiais/CPIs da Casa Legislativa, com lideranças e quantitativo de membros.
 *
 * Fontes oficiais:
 * - Regimento Interno e atos de designação de comissões de cada Assembleia Legislativa.
 */

import { useState } from "react";
import { Users, Shield, Layers } from "lucide-react";
import type { ComissaoEstadual } from "@/lib/assembleias/types";

interface ComissoesAssembleiaProps {
  comissoes: ComissaoEstadual[];
  siglaAssembleia: string;
}

export default function ComissoesAssembleia({
  comissoes,
  siglaAssembleia,
}: ComissoesAssembleiaProps) {
  const [filtro, setFiltro] = useState<"todas" | "permanentes" | "especiais">("todas");

  const filtradas = comissoes.filter((c) => {
    if (filtro === "permanentes") return !c.sigla.includes("CPI") && !c.nome.toLowerCase().includes("especial");
    if (filtro === "especiais") return c.sigla.includes("CPI") || c.nome.toLowerCase().includes("especial");
    return true;
  });

  return (
    <div className="space-y-4">
      {/* ═══ FILTRO DE TIPO DE COMISSÃO ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" aria-hidden="true" />
          <h3 className="font-display text-base font-bold text-foreground">
            Comissões Temáticas ({filtradas.length})
          </h3>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFiltro("todas")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              filtro === "todas"
                ? "bg-primary text-primary-ink shadow-xs"
                : "border border-border bg-surface-2 text-muted hover:text-foreground"
            }`}
          >
            Todas ({comissoes.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltro("permanentes")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              filtro === "permanentes"
                ? "bg-primary text-primary-ink shadow-xs"
                : "border border-border bg-surface-2 text-muted hover:text-foreground"
            }`}
          >
            Permanentes
          </button>
          <button
            type="button"
            onClick={() => setFiltro("especiais")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              filtro === "especiais"
                ? "bg-primary text-primary-ink shadow-xs"
                : "border border-border bg-surface-2 text-muted hover:text-foreground"
            }`}
          >
            Especiais & CPIs
          </button>
        </div>
      </div>

      {/* ═══ GRADE DE COMISSÕES ═══ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtradas.map((c) => (
          <div
            key={c.id}
            className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-xs transition hover:border-primary/50 hover:bg-surface-2/40"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="rounded-lg border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-mono font-bold text-primary">
                  {c.sigla}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Users size={12} aria-hidden="true" />
                  <span>{c.totalMembros} membros</span>
                </span>
              </div>

              <h4 className="font-display text-base font-bold text-foreground leading-snug">
                {c.nome}
              </h4>
            </div>

            <div className="mt-4 pt-3 border-t border-border/40 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Presidente:</span>
                <strong className="text-foreground">{c.presidente}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Vice-Presidente:</span>
                <strong className="text-foreground">{c.vicePresidente}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
