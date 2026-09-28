"use client";

/**
 * Componente cliente para exibição da transmissão ao vivo e calendário de sessões.
 *
 * Papel no portal:
 * Reproduz o card consagrado de transmissão da Câmara de Betim (AGENTS.md § 8),
 * informando os dias e horários das reuniões ordinárias de plenário e link
 * direto para o canal oficial no YouTube e TV Assembleia.
 *
 * Fontes oficiais:
 * - Canais e agendas de plenário de cada Assembleia Legislativa Estadual.
 */

import { Video, Tv, CalendarCheck } from "lucide-react";
import type { TransmissaoAssembleia } from "@/lib/assembleias/types";

interface TransmissaoSessaoCardProps {
  transmissao: TransmissaoAssembleia;
  siglaAssembleia: string;
}

export default function TransmissaoSessaoCard({
  transmissao,
  siglaAssembleia,
}: TransmissaoSessaoCardProps) {
  return (
    <section
      aria-label="Transmissão das sessões plenárias"
      className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-alert" aria-hidden="true" />
            <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
              Transmissão das Sessões de Plenário — {siglaAssembleia}
            </h3>
          </div>

          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            As reuniões ordinárias plenárias acontecem <strong>{transmissao.sessoesOrdinarias}</strong>.
            Todas as sessões são transmitidas ao vivo e ficam gravadas na íntegra para consulta pública
            e controle social.
          </p>

          <div className="flex items-center gap-1.5 text-xs text-muted">
            <CalendarCheck size={14} className="text-primary" aria-hidden="true" />
            <span>Frequência oficial: {transmissao.sessoesOrdinarias}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <a
            href={transmissao.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors"
          >
            <Video size={16} aria-hidden="true" />
            <span>Canal no YouTube</span>
            <span aria-hidden="true">↗</span>
          </a>

          <a
            href={transmissao.tvAssembleia}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-2 hover:bg-surface px-4 py-2.5 text-xs font-semibold text-foreground transition-colors"
          >
            <Tv size={15} aria-hidden="true" />
            <span>TV Assembleia</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
