"use client";

/**
 * @file apps/web/app/indicadores/componentes/TabelaComparativaMatricial.tsx
 * @description Tabela matricial comparativa entre estados com exportação CSV oficial.
 *
 * Regras:
 *   - Regra 5.14: responsividade mobile (390 px) com overflow seguro.
 *   - Regra 5.16: fonte mínima de 12 px (text-xs).
 *   - QUALIDADES-DA-INFORMACAO item 6: exportação em CSV com BOM UTF-8 e ';'.
 */

import React, { useState } from "react";
import { Download, Check, Table as TableIcon } from "lucide-react";
import {
  EstadoIndicadoresItem,
  IndicadorDefinicao,
  ESTADOS_INDICADORES,
  gerarCsvIndicadores,
} from "@/lib/indicadores/dados-nacionais";

interface TabelaComparativaMatricialProps {
  ufsSelecionadas: string[];
  metricas: IndicadorDefinicao[];
}

export default function TabelaComparativaMatricial({
  ufsSelecionadas,
  metricas,
}: TabelaComparativaMatricialProps) {
  const [baixado, setBaixado] = useState(false);

  const estados = ufsSelecionadas
    .map((uf) => ESTADOS_INDICADORES.find((e) => e.uf === uf))
    .filter((e): e is EstadoIndicadoresItem => Boolean(e));

  const handleDownloadCsv = () => {
    const csvContent = gerarCsvIndicadores(ufsSelecionadas);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `indicadores-comparados-${ufsSelecionadas.join("-").toLowerCase()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setBaixado(true);
    setTimeout(() => setBaixado(false), 3000);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <TableIcon className="h-4 w-4 text-primary" />
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              Matriz Comparativa de Dados Oficiais
            </h3>
          </div>
          <p className="text-xs text-text-soft mt-1">
            Valores tabulares auditáveis com fontes oficiais de cada indicador.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadCsv}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-xs"
        >
          {baixado ? (
            <>
              <Check className="h-4 w-4" />
              <span>CSV Gerado com Sucesso!</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Exportar Dados em CSV</span>
            </>
          )}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-xs text-left min-w-[620px]">
          <thead className="bg-surface-2 text-text-soft uppercase tracking-wider border-b border-border">
            <tr>
              <th className="p-3 font-bold text-foreground">Indicador</th>
              <th className="p-3 font-semibold">Fonte Oficial</th>
              {estados.map((est) => (
                <th
                  key={est.uf}
                  className={`p-3 text-right font-bold ${
                    est.uf === "BR" ? "text-amber-600 bg-amber-500/5" : "text-foreground"
                  }`}
                >
                  {est.uf}
                  <div className="text-[12px] font-normal text-text-soft truncate max-w-[80px] ml-auto">
                    {est.nome}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {metricas.map((met) => {
              const valores = estados.map((est) => {
                const val = (est as unknown as Record<string, number | string>)[met.id];
                return typeof val === "number" ? val : 0;
              });
              const maxVal = Math.max(...valores);
              const minVal = Math.min(...valores);

              return (
                <tr key={met.id} className="hover:bg-surface-2/50 transition-colors">
                  <td className="p-3 font-semibold text-foreground">
                    <div>{met.nome}</div>
                    <div className="text-[12px] text-text-soft">{met.unidade}</div>
                  </td>
                  <td className="p-3 text-text-soft text-[12px]">
                    <div>{met.fonte}</div>
                    <div className="opacity-80">{met.orgao}</div>
                  </td>
                  {estados.map((est) => {
                    const val = (est as unknown as Record<string, number | string>)[met.id];
                    const numVal = typeof val === "number" ? val : 0;
                    const isMax = numVal === maxVal && valores.length > 1;
                    const isMin = numVal === minVal && valores.length > 1;

                    let destaque = "text-foreground";
                    if (est.uf === "BR") {
                      destaque = "text-amber-600 font-bold bg-amber-500/5";
                    } else if (met.melhor === "maior" && isMax) {
                      destaque = "text-emerald-600 font-bold";
                    } else if (met.melhor === "menor" && isMin) {
                      destaque = "text-emerald-600 font-bold";
                    }

                    return (
                      <td
                        key={est.uf}
                        className={`p-3 text-right font-mono ${destaque}`}
                      >
                        {numVal.toLocaleString("pt-BR", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-[12px] text-text-soft">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            Melhor desempenho da série
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Média Nacional (BR)
          </span>
        </div>
        <span>Exportação compatível com Excel e LibreOffice (BOM UTF-8 + ;)</span>
      </div>
    </div>
  );
}
