"use client";

import React, { useMemo, useState } from "react";
import { ExternalLink, BarChart3, PieChart, Grid3X3, TrendingUp, Layers, Activity } from "lucide-react";
import LabDither, { type DitherItem } from "./lab-dither";
import { DitherBarChart } from "@/lib/laboratorio/dither-charts/DitherBarChart";
import { DitherDonutChart } from "@/lib/laboratorio/dither-charts/DitherDonutChart";
import { DitherHeatmapGrid } from "@/lib/laboratorio/dither-charts/DitherHeatmapGrid";
import { DitherStackedChart } from "@/lib/laboratorio/dither-charts/DitherStackedChart";
import { ServerGauge } from "@/lib/laboratorio/dither-charts/ServerGauge";
import { DitherGrowthChart } from "@/lib/laboratorio/dither-charts/DitherGrowthChart";
import type { TipoGrafico } from "./tipos";

export interface JanelaDados {
  titulo: string;
  itens: DitherItem[];
  fonteLabel: string;
  fonteUrl: string;
  filtros?: { label: string; valores: string[] };
}

const GRAFICOS: { id: TipoGrafico; label: string; icon: typeof BarChart3 }[] = [
  { id: "barras", label: "Colunas", icon: BarChart3 },
  { id: "donut", label: "Pizza", icon: PieChart },
  { id: "heatmap", label: "Heatmap", icon: Grid3X3 },
  { id: "linha", label: "Linha", icon: TrendingUp },
  { id: "stacked", label: "Empilhado", icon: Layers },
  { id: "gauge", label: "Gauge", icon: Activity },
  { id: "crescimento", label: "Cresc.", icon: TrendingUp },
];

interface LabJanelaProps {
  dados: JanelaDados | null;
  posicao: "esquerda" | "direita";
  tipoGrafico?: TipoGrafico;
  onGraficoChange?: (g: TipoGrafico) => void;
}

function adaptBar(itens: DitherItem[]) {
  return {
    labels: itens.map((i) => i.rotulo),
    values: itens.map((i) => i.valor),
    title: "",
  };
}

function adaptDonut(itens: DitherItem[]) {
  return {
    slices: itens.map((i, idx) => ({
      name: i.rotulo,
      value: i.valor,
      color: i.cor ?? `hsl(${idx * 60}, 60%, 50%)`,
    })),
    title: "",
  };
}

function adaptGauge(itens: DitherItem[]) {
  return {
    metrics: itens.map((i) => ({
      name: i.rotulo,
      value: i.valor,
      color: i.cor,
    })),
    title: "",
  };
}

function adaptGrowth(itens: DitherItem[]) {
  return {
    data: itens.map((i, idx) => ({
      date: `202${idx % 10}`,
      value: i.valor,
      label: i.rotulo,
    })),
    title: "",
  };
}

function adaptStacked(itens: DitherItem[]) {
  const total = itens.reduce((s, i) => s + i.valor, 0);
  return {
    branches: itens.map((i) => ({ name: i.rotulo })),
    bands: itens.map((i, idx) => ({
      name: i.rotulo,
      color: i.cor ?? `hsl(${idx * 60}, 60%, 50%)`,
      share: total > 0 ? i.valor / total : 0,
    })),
    baseTotal: total,
  };
}

function renderChart(tipo: TipoGrafico, itens: DitherItem[]) {
  if (itens.length === 0) return <p className="text-sm text-text-soft">Sem dados</p>;

  switch (tipo) {
    case "donut":
      return <DitherDonutChart {...adaptDonut(itens)} compact />;
    case "gauge":
      return <ServerGauge {...adaptGauge(itens)} compact />;
    case "crescimento":
      return <DitherGrowthChart {...adaptGrowth(itens)} compact />;
    case "heatmap":
      return (
        <DitherHeatmapGrid
          rows={itens.map((i) => i.rotulo)}
          cols={["Valor"]}
          data={itens.map((i) => [i.valor])}
          compact
        />
      );
    case "stacked":
      return <DitherStackedChart {...adaptStacked(itens)} compact />;
    case "linha":
      return <DitherGrowthChart {...adaptGrowth(itens)} compact />;
    case "barras":
    default:
      return <DitherBarChart {...adaptBar(itens)} compact />;
  }
}

export default function LabJanela({
  dados,
  posicao,
  tipoGrafico = "barras",
  onGraficoChange,
}: LabJanelaProps) {
  const [filtro, setFiltro] = useState<string>("__todos__");

  const itensFiltrados = useMemo(() => {
    if (!dados) return [];
    if (filtro === "__todos__" || !dados.filtros) return dados.itens;
    return dados.itens.filter((i) => i.rotulo.includes(filtro));
  }, [dados, filtro]);

  if (!dados) {
    return (
      <div
        className={`flex flex-1 items-center justify-center rounded-xl border border-dashed border-border p-6 ${
          posicao === "esquerda" ? "mr-1 sm:mr-2" : "ml-1 sm:ml-2"
        }`}
      >
        <p className="text-sm text-text-soft">
          Clique num botão do dock para carregar um dado
        </p>
      </div>
    );
  }

  return (
    <section
      className={`flex flex-1 flex-col rounded-xl border border-border bg-surface p-4 ${
        posicao === "esquerda" ? "mr-1 sm:mr-2" : "ml-1 sm:ml-2"
      }`}
      aria-label={dados.titulo}
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-text">{dados.titulo}</h3>
        <a
          href={dados.fonteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-[10px] text-primary hover:underline"
        >
          Fonte <ExternalLink size={10} />
        </a>
      </header>

      {onGraficoChange && (
        <div
          className="mb-3 flex flex-wrap gap-1"
          role="group"
          aria-label={`Tipo de gráfico — janela ${posicao}`}
        >
          {GRAFICOS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onGraficoChange(id)}
              aria-pressed={tipoGrafico === id}
              className={`flex cursor-pointer items-center gap-1 rounded border px-1.5 py-1 text-[10px] font-medium transition-colors ${
                tipoGrafico === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-text-soft hover:bg-surface-2"
              }`}
            >
              <Icon size={12} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      )}

      {dados.filtros && (
        <div className="mb-3">
          <label className="sr-only" htmlFor={`filtro-${posicao}`}>
            Filtrar por {dados.filtros.label}
          </label>
          <select
            id={`filtro-${posicao}`}
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text"
          >
            <option value="__todos__">Todos</option>
            {dados.filtros.valores.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {renderChart(tipoGrafico, itensFiltrados)}
        {itensFiltrados.length > 0 && (
          <div className="mt-2 max-h-40 overflow-auto rounded border border-border/50">
            <table className="w-full text-[10px] text-text-soft">
              <caption className="sr-only">Tabela da camada {dados.titulo}</caption>
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="px-2 py-1">Categoria</th>
                  <th scope="col" className="px-2 py-1 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {itensFiltrados.slice(0, 50).map((i) => (
                  <tr key={i.rotulo} className="border-b border-border/30">
                    <td className="px-2 py-0.5">{i.rotulo}</td>
                    <td className="px-2 py-0.5 text-right tabular-nums">
                      {i.valor.toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-2 text-[10px] text-text-soft">{dados.fonteLabel}</p>
    </section>
  );
}
