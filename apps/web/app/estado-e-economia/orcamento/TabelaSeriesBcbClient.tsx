"use client";

import React, { useState } from "react";
import { Download, Copy, Check } from "lucide-react";
import type { AcervoSeriesEconomicas, SerieEconomica } from "@/lib/series-economicas";
import { exportarCsvSeries } from "@/lib/series-economicas";

interface Props {
  dados: AcervoSeriesEconomicas;
}

export default function TabelaSeriesBcbClient({ dados }: Props) {
  const chaves = Object.keys(dados.series);
  const [serieAtivaKey, setSerieAtivaKey] = useState<string>(chaves[0] ?? "ipca_mensal");
  const [copiado, setCopiado] = useState(false);

  const serieAtiva: SerieEconomica | undefined = dados.series[serieAtivaKey];

  if (!serieAtiva) return null;

  const handleBaixarCsv = () => {
    const csvContent = exportarCsvSeries(serieAtivaKey, serieAtiva);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `serie-bcb-${serieAtiva.codigoSGS}-${serieAtivaKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopiar = () => {
    const linhas = serieAtiva.historico.slice(0, 10).map((p) => `${p.data}: ${p.valor} ${serieAtiva.unidade}`).join("\n");
    const texto = `${serieAtiva.nome} (SGS ${serieAtiva.codigoSGS})\n${linhas}`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <section aria-labelledby="titulo-series-bcb" className="mb-8 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-accent block">
            Banco Central do Brasil — SGS Oficial
          </span>
          <h2 id="titulo-series-bcb" className="font-display text-lg font-bold text-foreground">
            Séries Macroeconômicas & Poder de Compra
          </h2>
        </div>

        {/* Botoes de Exportação e Cópia */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopiar}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface transition"
            title="Copiar últimos 10 valores para a área de transferência"
          >
            {copiado ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copiado ? "Copiado!" : "Copiar resumo"}</span>
          </button>

          <button
            onClick={handleBaixarCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition shadow-2xs"
            title="Baixar planilha CSV com BOM UTF-8 e separador ponto-e-vírgula"
          >
            <Download size={14} />
            <span>Exportar CSV (Excel)</span>
          </button>
        </div>
      </div>

      {/* Seletor de Série */}
      <div className="flex flex-wrap gap-2 my-4">
        {chaves.map((k) => {
          const s = dados.series[k];
          const selecionado = k === serieAtivaKey;
          return (
            <button
              key={k}
              onClick={() => setSerieAtivaKey(k)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition border ${
                selecionado
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-border bg-surface-2 text-muted hover:text-foreground hover:bg-surface"
              }`}
            >
              {s.nome.split("—")[0].trim()} ({s.ultimoValor.toString().replace(".", ",")} {s.unidade})
            </button>
          );
        })}
      </div>

      {/* Mini Gráfico Visual SVG */}
      <div className="my-4 rounded-xl border border-border/70 bg-surface-2 p-4">
        <div className="flex items-center justify-between text-xs text-muted mb-2">
          <span className="font-semibold text-foreground">{serieAtiva.nome}</span>
          <span>Últimos registros ({serieAtiva.historico.length} períodos)</span>
        </div>

        <div className="h-24 w-full flex items-end gap-1 pt-2">
          {serieAtiva.historico.slice(0, 24).reverse().map((p, idx) => {
            const valNum = Math.abs(p.valor);
            const maxVal = Math.max(...serieAtiva.historico.map((h) => Math.abs(h.valor)), 1);
            const pct = Math.min(Math.max((valNum / maxVal) * 100, 8), 100);
            const isPositivo = p.valor >= 0;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center group relative"
              >
                <div
                  style={{ height: `${pct}%` }}
                  className={`w-full rounded-t-xs transition ${
                    isPositivo ? "bg-accent/80 hover:bg-accent" : "bg-alert/80 hover:bg-alert"
                  }`}
                />
                <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 bg-black/90 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap">
                  {p.data}: {p.valor} {serieAtiva.unidade}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabela de Dados Históricos */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-2 text-muted border-b border-border">
            <tr>
              <th className="p-2.5 font-semibold">Data de Referência</th>
              <th className="p-2.5 font-semibold text-right">Valor Oficial</th>
              <th className="p-2.5 font-semibold">Unidade de Medida</th>
              <th className="p-2.5 font-semibold">Fonte Oficial</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 font-mono">
            {serieAtiva.historico.slice(0, 6).map((p, idx) => (
              <tr key={idx} className="hover:bg-surface-2/60 transition">
                <td className="p-2.5 text-foreground font-sans font-medium">{p.data}</td>
                <td className="p-2.5 text-right font-bold text-foreground">
                  {p.valor.toString().replace(".", ",")}
                </td>
                <td className="p-2.5 text-muted">{serieAtiva.unidade}</td>
                <td className="p-2.5 text-muted font-sans">Banco Central / SGS {serieAtiva.codigoSGS}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="mt-3 flex items-center justify-between text-[11px] text-muted">
        <span>
          Fonte: <a href={dados.urlFonte} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Banco Central do Brasil</a> · Série {serieAtiva.codigoSGS}
        </span>
        <span>Atualizado em tempo real pelo repositório estático</span>
      </footer>
    </section>
  );
}
