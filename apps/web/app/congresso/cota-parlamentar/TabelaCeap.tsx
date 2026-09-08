"use client";

import { useState, useMemo } from "react";
import type { DeputadoCeap } from "@/lib/congresso/ceap-nacional-dados";

interface TabelaCeapProps {
  parlamentares: DeputadoCeap[];
  totaisPorUf: Record<string, number>;
  ressalvaEditorial: string;
}

export default function TabelaCeap({ parlamentares, totaisPorUf, ressalvaEditorial }: TabelaCeapProps) {
  const [busca, setBusca] = useState("");
  const [ufSelecionada, setUfSelecionada] = useState("");
  const [partidoSelecionado, setPartidoSelecionado] = useState("");
  const [ordenarPor, setOrdenarPor] = useState<"totalGasto" | "qtdDespesas">("totalGasto");

  const ufs = useMemo(() => Object.keys(totaisPorUf).sort(), [totaisPorUf]);
  const partidos = useMemo(() => {
    const s = new Set<string>();
    for (const p of parlamentares) {
      if (p.partido) s.add(p.partido);
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [parlamentares]);

  const filtrados = useMemo(() => {
    return parlamentares
      .filter((p) => {
        if (ufSelecionada && p.uf !== ufSelecionada) return false;
        if (partidoSelecionado && p.partido !== partidoSelecionado) return false;
        if (busca) {
          const b = busca.toLowerCase();
          const casouNome = p.nomeParlamentar.toLowerCase().includes(b);
          const casouForn = p.topFornecedores.some((f) => f.nome.toLowerCase().includes(b));
          if (!casouNome && !casouForn) return false;
        }
        return true;
      })
      .sort((a, b) => b[ordenarPor] - a[ordenarPor]);
  }, [parlamentares, ufSelecionada, partidoSelecionado, busca, ordenarPor]);

  const baixarCsv = () => {
    const cabecalho = ["Parlamentar", "Partido", "UF", "Total Gasto (R$)", "Qtd Despesas", "Top 1 Fornecedor", "Top 1 Valor (R$)"];
    const linhas = filtrados.map((p) => [
      `"${p.nomeParlamentar.replace(/"/g, '""')}"`,
      `"${p.partido}"`,
      `"${p.uf}"`,
      p.totalGasto.toFixed(2).replace(".", ","),
      p.qtdDespesas,
      `"${(p.topFornecedores[0]?.nome || "").replace(/"/g, '""')}"`,
      (p.topFornecedores[0]?.total || 0).toFixed(2).replace(".", ","),
    ]);

    const conteudo = "\uFEFF" + [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");
    const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cota-parlamentar-ceap-${ufSelecionada || "nacional"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Controles e Filtros */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-surface p-4 text-sm">
        <label className="flex-1 min-w-[200px]">
          <span className="block text-xs font-semibold text-text-soft">Buscar parlamentar ou fornecedor</span>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Ex.: Damião, Locadora, Passagens..."
            className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
          />
        </label>

        <label className="min-w-[120px]">
          <span className="block text-xs font-semibold text-text-soft">Estado (UF)</span>
          <select
            value={ufSelecionada}
            onChange={(e) => setUfSelecionada(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-text outline-none"
          >
            <option value="">Todas (27 UFs)</option>
            {ufs.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-[120px]">
          <span className="block text-xs font-semibold text-text-soft">Partido</span>
          <select
            value={partidoSelecionado}
            onChange={(e) => setPartidoSelecionado(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-text outline-none"
          >
            <option value="">Todos</option>
            {partidos.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-[140px]">
          <span className="block text-xs font-semibold text-text-soft">Ordenar por</span>
          <select
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value as "totalGasto" | "qtdDespesas")}
            className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-text outline-none"
          >
            <option value="totalGasto">Maior Valor (R$)</option>
            <option value="qtdDespesas">Mais Lançamentos</option>
          </select>
        </label>

        <button
          type="button"
          onClick={baixarCsv}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-text-contrast hover:opacity-90"
        >
          📥 Baixar Planilha CSV ({filtrados.length})
        </button>
      </div>

      {/* Alerta Editorial Obrigatório */}
      <div className="rounded-xl border border-border bg-surface-2/60 p-4 text-xs leading-relaxed text-text-soft">
        <span className="font-semibold text-text">ℹ️ Ressalva Editorial: </span>
        {ressalvaEditorial}
      </div>

      {/* Tabela de Resultados */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
        <table className="w-full text-left text-xs text-text">
          <thead className="border-b border-border bg-surface-2 text-[.75em] uppercase text-text-soft">
            <tr>
              <th className="p-3">Parlamentar</th>
              <th className="p-3">Partido/UF</th>
              <th className="p-3 text-right">Total Reembolsado</th>
              <th className="p-3 text-right">Lançamentos</th>
              <th className="p-3">Principais Fornecedores / Contratados</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtrados.slice(0, 100).map((p) => (
              <tr key={`${p.nomeParlamentar}_${p.uf}`} className="hover:bg-surface-2/50 transition-colors">
                <td className="p-3 font-semibold text-text">{p.nomeParlamentar}</td>
                <td className="p-3 text-text-soft">
                  <span className="inline-block rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[.85em]">
                    {p.partido}-{p.uf}
                  </span>
                </td>
                <td className="p-3 text-right font-mono font-bold text-accent">
                  R$ {p.totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3 text-right font-mono text-text-soft">{p.qtdDespesas.toLocaleString("pt-BR")}</td>
                <td className="p-3 text-text-soft">
                  <div className="space-y-1">
                    {p.topFornecedores.slice(0, 3).map((f, i) => (
                      <div key={i} className="flex items-baseline justify-between gap-2 text-[.9em]">
                        <span className="truncate max-w-[280px]" title={f.nome}>
                          {f.nome}
                        </span>
                        <span className="font-mono text-text">
                          R$ {f.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length > 100 && (
          <div className="border-t border-border p-3 text-center text-xs text-text-soft">
            Exibindo os primeiros 100 resultados de {filtrados.length}. Use o botão de download para a planilha completa.
          </div>
        )}
      </div>
    </div>
  );
}
