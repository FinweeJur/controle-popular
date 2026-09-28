"use client";

/**
 * Componente cliente para visualização das Audiências Públicas da Assembleia Legislativa.
 *
 * Papel no portal:
 * Permite ao cidadão acompanhar a pauta e o calendário de audiências públicas,
 * canais de participação popular e links de transmissão ao vivo das sessões.
 *
 * Fontes oficiais:
 * - Agenda e pauta pública oficial da Assembleia Legislativa Estadual.
 */

import { Calendar, Clock, MapPin, Video, ExternalLink } from "lucide-react";
import type { AudienciaPublicaEstadual } from "@/lib/assembleias/types";

interface AudienciasAssembleiaProps {
  audiencias: AudienciaPublicaEstadual[];
  siglaAssembleia: string;
}

export default function AudienciasAssembleia({
  audiencias,
  siglaAssembleia,
}: AudienciasAssembleiaProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
          <h3 className="font-display text-base font-bold text-foreground">
            Audiências Públicas e Debates Cidadãos ({audiencias.length})
          </h3>
        </div>
        <span className="text-xs text-muted">
          Pautas abertas à participação e acompanhamento social
        </span>
      </div>

      <div className="space-y-3">
        {audiencias.map((aud) => (
          <div
            key={aud.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs transition hover:border-border/80 hover:bg-surface-2/40 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                  {aud.comissao}
                </span>
                <span className="flex items-center gap-1 font-mono text-muted">
                  <Clock size={12} aria-hidden="true" />
                  <span>{aud.dataHora}</span>
                </span>
              </div>

              <h4 className="font-display text-base font-bold text-foreground leading-snug">
                {aud.tema}
              </h4>

              <div className="flex items-center gap-1 text-xs text-muted">
                <MapPin size={12} aria-hidden="true" />
                <span>{aud.local}</span>
              </div>
            </div>

            <div className="shrink-0 pt-2 sm:pt-0">
              <a
                href={aud.urlTransmissao}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-ink shadow-xs transition-opacity hover:opacity-90"
              >
                <Video size={14} aria-hidden="true" />
                <span>Acompanhar Transmissão</span>
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
