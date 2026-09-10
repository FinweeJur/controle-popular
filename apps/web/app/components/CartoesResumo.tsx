import React from "react";

export interface CartaoResumoItem {
  rotulo: string;
  valor: string | number;
  detalhe?: string;
  destaque?: boolean;
  alerta?: boolean;
}

export interface CartoesResumoProps {
  itens: CartaoResumoItem[];
  colunas?: 2 | 3 | 4 | 5;
}

export default function CartoesResumo({ itens, colunas = 4 }: CartoesResumoProps) {
  if (!itens || itens.length === 0) return null;

  const gridColsClass =
    colunas === 2
      ? "sm:grid-cols-2"
      : colunas === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : colunas === 5
          ? "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
          : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <section aria-label="Resumo e métricas principais" className="w-full">
      <div className={`grid gap-3 ${gridColsClass}`}>
        {itens.map((item, idx) => (
          <div
            key={item.rotulo + idx}
            className={`rounded-2xl border p-4 transition-colors ${
              item.alerta
                ? "border-alert/40 bg-surface-2"
                : item.destaque
                  ? "border-primary/40 bg-surface"
                  : "border-border bg-surface"
            }`}
          >
            <p className="text-xs font-medium text-text-soft">{item.rotulo}</p>
            <p className="mt-1 font-tabular text-xl font-bold text-text">
              {typeof item.valor === "number"
                ? item.valor.toLocaleString("pt-BR")
                : item.valor}
            </p>
            {item.detalhe && (
              <p className="mt-1 text-[0.9em] text-text-soft opacity-85">{item.detalhe}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
