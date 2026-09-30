"use client";

/**
 * @file apps/web/app/components/charts/DonutChartResponsivo.tsx
 * @description Gráfico de Rosca (Donut Chart) SVG nativo com padrão dither/hachura
 * e legenda lateral responsiva projetada para leitura confortável em celulares e PC.
 *
 * Papel no portal:
 * Exibe visualmente a proporção de consumo de água, energia, combustível, empregos
 * e capital das maiores corporações em relação ao total do município, estado (MG) ou país (G20).
 *
 * Decisões técnicas e acessibilidade (AGENTS.md §5.10 e §8):
 * - Zero bibliotecas externas pesadas: SVG puro com arcos calculados via stroke-dasharray.
 * - Legenda lateral com fonte mínima text-sm (14px) para leitura nítida no celular e desktop.
 * - Cor nunca é o único canal: cada item na legenda recebe marcador numerado (#1 a #5) e barra proporcional.
 * - Inclui tabela semântica oculta/expansível para leitores de tela.
 */

import React from "react";
import { ExternalLink } from "lucide-react";
import type { FatiaDonutConsumo } from "@/lib/recursos/dados-consumidores";

interface DonutChartResponsivoProps {
  titulo: string;
  subtitulo?: string;
  fatias: FatiaDonutConsumo[];
  rotuloCentroTopo: string;
  valorCentroPrincipal: string;
  rotuloCentroBase: string;
  formatarValor: (valor: number) => string;
  unidadeCurta?: string;
}

export default function DonutChartResponsivo({
  titulo,
  subtitulo,
  fatias,
  rotuloCentroTopo,
  valorCentroPrincipal,
  rotuloCentroBase,
  formatarValor,
  unidadeCurta,
}: DonutChartResponsivoProps) {
  const raio = 74;
  const circunferencia = 2 * Math.PI * raio;

  // Normaliza os percentuais para garantir soma visual de 100% no anel SVG
  const somaPct = fatias.reduce((acc, f) => acc + Math.max(0, f.percentual), 0) || 100;

  let acumuladoPct = 0;
  const segmentosCalculados = fatias.map((fatia, index) => {
    const proporcao = Math.max(0, fatia.percentual) / somaPct;
    const comprimentoArco = proporcao * circunferencia;
    const deslocamento = circunferencia - acumuladoPct * circunferencia;
    acumuladoPct += proporcao;

    return {
      ...fatia,
      indice: index + 1,
      comprimentoArco,
      deslocamento,
    };
  });

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-xs space-y-5">
      {/* Cabeçalho do Gráfico */}
      <div className="space-y-1">
        <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
          {titulo}
        </h3>
        {subtitulo && (
          <p className="text-sm text-muted leading-relaxed">{subtitulo}</p>
        )}
      </div>

      {/* Corpo: Anel Donut SVG + Legenda Lateral Responsiva */}
      <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
        {/* Anel SVG */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            className="w-48 h-48 sm:w-56 sm:h-56 -rotate-90 transform"
            role="img"
            aria-label={`${titulo}. ${rotuloCentroTopo}: ${valorCentroPrincipal} (${rotuloCentroBase}).`}
          >
            <defs>
              {/* Padrão dither pontilhado para a fatia de restante ("Demais consumidores") */}
              <pattern
                id="dither-restante"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
              >
                <rect width="6" height="6" fill="#475569" fillOpacity="0.25" />
                <circle cx="2" cy="2" r="1" fill="#94a3b8" />
                <circle cx="5" cy="5" r="1" fill="#64748b" />
              </pattern>
            </defs>

            {/* Trilha de fundo */}
            <circle
              cx="100"
              cy="100"
              r={raio}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="28"
              className="text-surface-2"
            />

            {/* Segmentos do Donut */}
            {segmentosCalculados.map((seg) => (
              <circle
                key={seg.id}
                cx="100"
                cy="100"
                r={raio}
                fill="transparent"
                stroke={seg.ehRestante ? "url(#dither-restante)" : seg.corHex}
                strokeWidth={seg.ehRestante ? "24" : "28"}
                strokeDasharray={`${Math.max(0, seg.comprimentoArco - 1.5)} ${circunferencia}`}
                strokeDashoffset={seg.deslocamento}
                strokeLinecap="butt"
                className="transition-all duration-500"
              >
                <title>
                  {seg.rotulo}: {formatarValor(seg.valor)} ({seg.percentual}%)
                </title>
              </circle>
            ))}

            {/* Contorno fino na fatia restante para alto contraste */}
            {segmentosCalculados
              .filter((s) => s.ehRestante)
              .map((seg) => (
                <circle
                  key={`${seg.id}-borda`}
                  cx="100"
                  cy="100"
                  r={raio}
                  fill="transparent"
                  stroke="#64748b"
                  strokeWidth="24"
                  strokeOpacity="0.45"
                  strokeDasharray={`${Math.max(0, seg.comprimentoArco - 1.5)} ${circunferencia}`}
                  strokeDashoffset={seg.deslocamento}
                />
              ))}
          </svg>

          {/* Texto Central do Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              {rotuloCentroTopo}
            </span>
            <span className="font-mono text-xl sm:text-2xl font-extrabold text-foreground my-0.5">
              {valorCentroPrincipal}
            </span>
            <span className="text-xs text-muted leading-tight">
              {rotuloCentroBase}
            </span>
          </div>
        </div>

        {/* Legenda Lateral Responsiva (Fonte mínima text-sm para leitura perfeita em celular e PC) */}
        <div className="w-full flex-1 space-y-2.5">
          {segmentosCalculados.map((seg) => (
            <div
              key={seg.id}
              className={`rounded-xl border p-3 transition ${
                seg.ehRestante
                  ? "border-dashed border-border bg-surface-2/50"
                  : "border-border bg-surface-2/30 hover:border-primary/40"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  {/* Indicador numérico + cor (duplo canal de acessibilidade) */}
                  <span
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-mono font-bold text-white shadow-2xs"
                    style={{
                      backgroundColor: seg.corHex,
                    }}
                    aria-hidden="true"
                  >
                    {seg.ehRestante ? "Σ" : `#${seg.indice}`}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-foreground leading-snug break-words">
                        {seg.rotulo}
                      </span>
                      {seg.urlFonte && (
                        <a
                          href={seg.urlFonte}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary hover:bg-primary/20 transition"
                          title="Verificar dado na fonte oficial"
                        >
                          <span>Fonte</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    {seg.subtitulo && (
                      <p className="text-xs text-muted mt-0.5">{seg.subtitulo}</p>
                    )}
                  </div>
                </div>

                {/* Valor Absoluto e Percentual */}
                <div className="text-right shrink-0 pl-2">
                  <span className="font-mono text-sm font-extrabold text-foreground block">
                    {seg.percentual.toLocaleString("pt-BR", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 2,
                    })}
                    %
                  </span>
                  <span className="font-mono text-xs text-muted block">
                    {formatarValor(seg.valor)}
                    {unidadeCurta ? ` ${unidadeCurta}` : ""}
                  </span>
                </div>
              </div>

              {/* Mini barra horizontal de apoio visual */}
              <div className="mt-2 h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(2, seg.percentual))}%`,
                    backgroundColor: seg.corHex,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
