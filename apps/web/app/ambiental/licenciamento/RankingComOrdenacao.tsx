"use client";

import { useMemo, useState } from "react";
import BarrasValor from "@/app/[municipio]/components/charts/BarrasValor";
import { formatNumberBR } from "@/lib/betim/format";

/**
 * Gráfico de barras (reaproveita `BarrasValor`, CSS puro — sem lib nova)
 * com um alternador de ordenação: ordem "natural" do campo (setor
 * oficial A–H, classe crescente) versus maior quantidade primeiro.
 *
 * Satisfaz duas das cinco coisas ao mesmo tempo — gráfico com alternativa
 * em texto (`BarrasValor` já renderiza rótulo + valor por extenso, nunca só
 * a barra) e ordenação por coluna "inclusive por tipo/classe, não só por
 * data" (regra do dono em `AGENTS.md`).
 */
export interface ItemRanking {
  chave: string;
  rotulo: string;
  total: number;
}

export default function RankingComOrdenacao({
  itens,
  rotuloOrdemNatural,
  rotuloUnidade,
}: {
  itens: ItemRanking[];
  /** Ex.: "Ordem oficial (A–H)" ou "Classe (crescente)". */
  rotuloOrdemNatural: string;
  /** Substantivo no plural, para o rótulo de cada barra. Ex.: "licenças". */
  rotuloUnidade: string;
}) {
  const [ordem, setOrdem] = useState<"natural" | "quantidade">("natural");

  const ordenados = useMemo(() => {
    if (ordem === "natural") return itens;
    return [...itens].sort((a, b) => b.total - a.total);
  }, [itens, ordem]);

  const max = Math.max(...itens.map((i) => i.total), 1);

  return (
    <div>
      <div role="group" aria-label="Ordenar gráfico" className="mb-3 flex flex-wrap items-center gap-2 text-[.82em]">
        <span className="text-text-soft">Ordenar por</span>
        <button
          type="button"
          onClick={() => setOrdem("natural")}
          aria-pressed={ordem === "natural"}
          className={`rounded-md border px-2.5 py-1 font-medium ${
            ordem === "natural" ? "border-primary text-primary" : "border-border text-text-soft"
          }`}
        >
          {rotuloOrdemNatural}
        </button>
        <button
          type="button"
          onClick={() => setOrdem("quantidade")}
          aria-pressed={ordem === "quantidade"}
          className={`rounded-md border px-2.5 py-1 font-medium ${
            ordem === "quantidade" ? "border-primary text-primary" : "border-border text-text-soft"
          }`}
        >
          Maior quantidade primeiro
        </button>
      </div>
      <BarrasValor
        max={max}
        formatValor={(v) => formatNumberBR(v)}
        itens={ordenados.map((i) => ({
          label: i.rotulo,
          valor: i.total,
          titulo: `${i.rotulo}: ${formatNumberBR(i.total)} ${rotuloUnidade}`,
        }))}
      />
    </div>
  );
}
