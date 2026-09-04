"use client";

import type { CidRegistro } from "@/lib/saude/cid";
import { formatNumberBR } from "@/lib/betim/format";

interface Props {
  cids: CidRegistro[];
  municipioNome: string;
}

export default function RankingCidTabela({ cids, municipioNome }: Props) {
  function baixarCsv() {
    const cabecalho = "Código CID;Capítulo;Diagnóstico;Nome popular;Nome técnico;Internações;Óbitos;Taxa Mortalidade (%);Permanência Média (dias);Custo Total (R$);Fator de Correlação Ambiental\n";
    const linhas = cids
      .map(
        (c) =>
          `"${c.codigo}";"${c.capitulo}";"${c.descricao}";"${c.nomePopular ?? ""}";"${c.nomeTecnico ?? ""}";${c.internacoes};${c.obitos};${c.taxaMortalidade.toFixed(2)};${c.diasPermanenciaMedia.toFixed(1)};${c.custoTotalReais.toFixed(2)};"${c.correlacaoAmbiental?.rotulo ?? "Geral"}"`
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + cabecalho + linhas], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `cids_internacoes_${municipioNome.toLowerCase().replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="rounded-xl border border-border/70 bg-surface p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-display text-lg font-bold text-text">
            Ranking de Diagnósticos Hospitalares (CID-10) — {municipioNome}
          </h3>
          <p className="text-xs text-text-soft">
            Causas mais frequentes de internação hospitalar SUS e vigilância de correlações ambientais.
          </p>
        </div>
        <button
          onClick={baixarCsv}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-xs font-semibold text-text hover:bg-border/30"
        >
          📥 Baixar Planilha CSV (BOM UTF-8)
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border text-text-soft">
              <th className="pb-2 font-medium">CID-10</th>
              <th className="pb-2 font-medium">Diagnóstico</th>
              <th className="pb-2 text-right font-medium">Internações</th>
              <th className="pb-2 text-right font-medium">Óbitos</th>
              <th className="pb-2 text-right font-medium">Mortalidade</th>
              <th className="pb-2 font-medium pl-4">Vigilância Ambiental</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-tabular">
            {cids.map((cid) => (
              <tr key={cid.codigo} className="hover:bg-surface-raised/50">
                <td className="py-2.5 font-bold text-primary">{cid.codigo}</td>
                <td className="py-2.5 font-sans text-text max-w-[260px] truncate" title={cid.descricao}>
                  {cid.descricao}
                </td>
                <td className="py-2.5 text-right font-semibold text-text">
                  {formatNumberBR(cid.internacoes)}
                </td>
                <td className="py-2.5 text-right text-text-soft">
                  {formatNumberBR(cid.obitos)}
                </td>
                <td className="py-2.5 text-right">
                  <span
                    className={
                      cid.taxaMortalidade > 10
                        ? "text-red-500 font-bold"
                        : "text-text"
                    }
                  >
                    {cid.taxaMortalidade.toFixed(1)}%
                  </span>
                </td>
                <td className="py-2.5 pl-4 font-sans">
                  {cid.correlacaoAmbiental ? (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500 border border-amber-500/20" title={cid.correlacaoAmbiental.explicacao}>
                      ⚠️ {cid.correlacaoAmbiental.rotulo}
                    </span>
                  ) : (
                    <span className="text-[11px] text-text-soft">Padrão SUS</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
