"use client";

/**
 * @file apps/web/app/indicadores/componentes/GraficosBarrasComparativo.tsx
 * @description Gráficos de barras nativas comparativas em SVG/CSS para indicadores cívicos.
 *
 * Regras:
 *   - Regra 5.14: responsividade mobile (390 px) sem quebra lateral.
 *   - Regra 5.16: fonte mínima de 12 px (text-xs).
 */

import React from "react";
import {
  EstadoIndicadoresItem,
  IndicadorDefinicao,
  ESTADOS_INDICADORES,
} from "@/lib/indicadores/dados-nacionais";

interface GraficosBarrasComparativoProps {
  ufsSelecionadas: string[];
  metricas: IndicadorDefinicao[];
}

export default function GraficosBarrasComparativo({
  ufsSelecionadas,
  metricas,
}: GraficosBarrasComparativoProps) {
  const estados = ufsSelecionadas
    .map((uf) => ESTADOS_INDICADORES.find((e) => e.uf === uf))
    .filter((e): e is EstadoIndicadoresItem => Boolean(e));

  if (estados.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center text-xs text-text-soft">
        Nenhum estado selecionado para exibição visual.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {metricas.map((metrica) => {
        // Extrai valores dos estados para esta métrica
        const valores = estados.map((est) => {
          const val = (est as unknown as Record<string, number | string>)[metrica.id];
          return {
            uf: est.uf,
            nome: est.nome,
            valor: typeof val === "number" ? val : 0,
            isBrasil: est.uf === "BR",
          };
        });

        const valorMaximo = Math.max(...valores.map((v) => v.valor), 0.0001);
        const valorMinimo = Math.min(...valores.map((v) => v.valor));

        return (
          <div
            key={metrica.id}
            className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-xs"
          >
            {/* Cabeçalho da Métrica */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 border-b border-border pb-3 mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  {metrica.nome}
                </h3>
                <p className="text-xs text-text-soft mt-0.5">
                  {metrica.descricao}
                </p>
              </div>
              <div className="text-xs text-right shrink-0">
                <span className="inline-block px-2 py-0.5 rounded-md bg-surface-2 border border-border text-text font-medium">
                  {metrica.unidade}
                </span>
                <div className="text-[12px] text-text-soft mt-1">
                  Fonte: {metrica.fonte} ({metrica.orgao})
                </div>
              </div>
            </div>

            {/* Lista de Barras Comparativas */}
            <div className="space-y-3">
              {valores.map((item) => {
                const larguraPct = Math.max(
                  6,
                  Math.min(100, (item.valor / valorMaximo) * 100)
                );
                const isMaior = item.valor === valorMaximo && valores.length > 1;
                const isMenor = item.valor === valorMinimo && valores.length > 1;

                // Define cor da barra
                let corBarra = "bg-primary";
                if (item.isBrasil) {
                  corBarra = "bg-amber-500";
                } else if (metrica.melhor === "maior" && isMaior) {
                  corBarra = "bg-emerald-600";
                } else if (metrica.melhor === "menor" && isMenor) {
                  corBarra = "bg-emerald-600";
                } else if (metrica.melhor === "menor" && isMaior) {
                  corBarra = "bg-rose-500";
                }

                return (
                  <div key={item.uf} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            item.isBrasil ? "text-amber-600" : "text-foreground"
                          }`}
                        >
                          {item.uf}
                        </span>
                        <span className="text-text-soft hidden sm:inline">
                          — {item.nome}
                        </span>
                        {item.isBrasil && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 text-[12px] font-semibold">
                            Referência Nacional
                          </span>
                        )}
                        {!item.isBrasil && metrica.melhor === "maior" && isMaior && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 text-[12px] font-semibold">
                            Maior Valor
                          </span>
                        )}
                        {!item.isBrasil && metrica.melhor === "menor" && isMenor && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 text-[12px] font-semibold">
                            Melhor Taxa (Menor)
                          </span>
                        )}
                      </div>

                      <div className="font-mono font-bold text-foreground">
                        {item.valor.toLocaleString("pt-BR", {
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>

                    {/* Barra visual em CSS com animação suave */}
                    <div className="h-4 w-full rounded-full bg-surface-2 overflow-hidden border border-border/50">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${corBarra}`}
                        style={{ width: `${larguraPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
