"use client";

import { useMemo, useState } from "react";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";
import { semAcento } from "@/lib/busca/normalizar";
import type { RenunciaPorFuncao } from "@/lib/estado/renuncia-fiscal";

/**
 * Tabela da renúncia fiscal por função orçamentária e região (Receita/DGT) —
 * busca, ordenação por coluna e CSV do filtrado (regras 2, 3 e 6 do AGENTS § 8).
 *
 * Cada linha é uma função orçamentária (setor) com o que o governo deixou de
 * arrecadar em cada região. Gasto tributário não é irregularidade: é escolha de
 * política fora do orçamento — o número é que abre a conferência.
 */

type Chave = "funcao" | "norte" | "nordeste" | "centro_oeste" | "sudeste" | "sul" | "total";

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function TabelaRenunciaFiscal({ registros }: { registros: RenunciaPorFuncao[] }) {
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<{ chave: Chave; dir: "asc" | "desc" }>({ chave: "total", dir: "desc" });

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim());
    const base = registros.filter((r) => (termo ? semAcento(r.funcao).includes(termo) : true));
    return [...base].sort((a, b) => {
      const va = a[ordem.chave];
      const vb = b[ordem.chave];
      const cmp = typeof va === "number" && typeof vb === "number"
        ? va - vb
        : semAcento(String(va)).localeCompare(semAcento(String(vb)), "pt-BR");
      return ordem.dir === "asc" ? cmp : -cmp;
    });
  }, [registros, busca, ordem]);

  const colunas: ColunaCsv<RenunciaPorFuncao>[] = [
    { chave: "funcao", rotulo: "Função orçamentária" },
    { chave: "norte", rotulo: "Norte", formatar: (v) => String(v).replace(".", ",") },
    { chave: "nordeste", rotulo: "Nordeste", formatar: (v) => String(v).replace(".", ",") },
    { chave: "centro_oeste", rotulo: "Centro-Oeste", formatar: (v) => String(v).replace(".", ",") },
    { chave: "sudeste", rotulo: "Sudeste", formatar: (v) => String(v).replace(".", ",") },
    { chave: "sul", rotulo: "Sul", formatar: (v) => String(v).replace(".", ",") },
    { chave: "total", rotulo: "Total", formatar: (v) => String(v).replace(".", ",") },
  ];

  const seta = (chave: Chave) => (ordem.chave === chave ? (ordem.dir === "asc" ? " ▲" : " ▼") : "");
  const ordenar = (chave: Chave) =>
    setOrdem((o) => (o.chave === chave ? { chave, dir: o.dir === "asc" ? "desc" : "asc" } : { chave, dir: "asc" }));
  const totalFiltrado = filtradas.reduce((s, r) => s + r.total, 0);

  return (
    <section aria-label="Renúncia fiscal por função" className="rounded-2xl border border-border bg-surface-2 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Renúncia por função orçamentária e região</h2>
          <p className="mt-1 text-sm text-text-soft">
            {filtradas.length} de {registros.length} funções · total filtrado {brl(totalFiltrado)}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3 print:hidden">
          <label className="flex items-center gap-2 text-sm">
            <span>Buscar</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="função orçamentária…"
              className="w-52 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => baixarCsv(colunas, filtradas, "renuncia-fiscal-2023-por-funcao")}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-ink"
          >
            Baixar CSV do filtrado
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="mb-2 text-left text-text-soft">
            Estimativa de gasto tributário (renúncia) por função orçamentária e região, valores nominais,
            ano-base 2023. Clique no cabeçalho para ordenar.
          </caption>
          <thead>
            <tr className="border-b border-border text-left">
              {(
                [
                  ["funcao", "Função"],
                  ["norte", "Norte"],
                  ["nordeste", "Nordeste"],
                  ["centro_oeste", "Centro-Oeste"],
                  ["sudeste", "Sudeste"],
                  ["sul", "Sul"],
                  ["total", "Total"],
                ] as const
              ).map(([chave, rotulo]) => (
                <th key={chave} scope="col" className="py-2 pr-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => ordenar(chave)}
                    className="underline-offset-2 hover:underline"
                    aria-label={`Ordenar por ${rotulo}`}
                  >
                    {rotulo}
                    {seta(chave)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.map((r) => (
              <tr key={r.funcao} className="border-b border-border/50">
                <th scope="row" className="py-2 pr-4 text-left font-medium">{r.funcao}</th>
                <td className="py-2 pr-4 text-right tabular-nums">{brl(r.norte)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{brl(r.nordeste)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{brl(r.centro_oeste)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{brl(r.sudeste)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{brl(r.sul)}</td>
                <td className="py-2 text-right font-medium tabular-nums">{brl(r.total)}</td>
              </tr>
            ))}
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-text-soft">
                  Nenhuma linha com estes filtros — lacuna é informação, não erro.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-text-soft print:hidden">
        Ordenação crescente/decrescente em cada coluna; a busca tolera acento. O CSV leva exatamente estas{" "}
        {filtradas.length} linhas, com <code>;</code> e BOM UTF-8.
      </p>
    </section>
  );
}
