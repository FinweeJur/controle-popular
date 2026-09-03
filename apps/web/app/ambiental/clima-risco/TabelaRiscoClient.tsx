"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Download, Search, Filter } from "lucide-react";
import type { MunicipioRisco } from "@/lib/clima/bases-risco";

interface Props {
  municipios: MunicipioRisco[];
}

export default function TabelaRiscoClient({ municipios }: Props) {
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState<"pop" | "pct" | "nome">("pop");
  const [ordemAsc, setOrdemAsc] = useState(false);

  const filtrados = useMemo(() => {
    const termo = busca
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    return municipios
      .filter((m) => {
        if (!termo) return true;
        const nomeNorm = m.nome
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        return (
          nomeNorm.includes(termo) ||
          m.id_municipio.includes(termo) ||
          m.tipo_risco_predominante.toLowerCase().includes(termo)
        );
      })
      .sort((a, b) => {
        if (ordenacao === "pop") {
          return ordemAsc
            ? a.populacao_area_risco - b.populacao_area_risco
            : b.populacao_area_risco - a.populacao_area_risco;
        }
        if (ordenacao === "pct") {
          return ordemAsc
            ? a.percentual_populacao_risco - b.percentual_populacao_risco
            : b.percentual_populacao_risco - a.percentual_populacao_risco;
        }
        return ordemAsc
          ? a.nome.localeCompare(b.nome)
          : b.nome.localeCompare(a.nome);
      });
  }, [municipios, busca, ordenacao, ordemAsc]);

  const baixarCsv = () => {
    const cabecalho = "Município;UF;Código IBGE;População em Risco;% da População;Polígonos BATER;Tipo de Risco Predominante;Estações CEMADEN;Esgoto Tratado (%);Veg. Nativa (%);Alerta INMET;Risco Fogo INPE\n";
    const linhas = filtrados
      .map(
        (m) =>
          `"${m.nome}";"${m.uf}";"${m.id_municipio}";${m.populacao_area_risco};${m.percentual_populacao_risco};${m.poligonos_bater};"${m.tipo_risco_predominante}";${m.estacoes_cemaden};${m.cobertura_esgoto_tratado_pct};${m.cobertura_vegetal_nativa_pct};"${m.alerta_inmet_ativo}";"${m.risco_fogo_inpe}"`
      )
      .join("\n");

    const conteudo = "\uFEFF" + cabecalho + linhas;
    const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "controle-popular-bases-clima-risco.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* BARRA DE PESQUISA E AÇÃO */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Buscar por cidade ou tipo de risco..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </div>

        <button
          onClick={baixarCsv}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          <span>Baixar Dados Filtrados ({filtrados.length})</span>
        </button>
      </div>

      {/* TABELA */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-2 text-xs font-semibold text-muted uppercase tracking-wider">
            <tr>
              <th
                onClick={() => {
                  setOrdenacao("nome");
                  setOrdemAsc(!ordemAsc);
                }}
                className="cursor-pointer px-4 py-3 hover:text-foreground"
              >
                Município {ordenacao === "nome" ? (ordemAsc ? "↑" : "↓") : ""}
              </th>
              <th
                onClick={() => {
                  setOrdenacao("pop");
                  setOrdemAsc(!ordemAsc);
                }}
                className="cursor-pointer px-4 py-3 hover:text-foreground"
              >
                Pop. Exposta (BATER) {ordenacao === "pop" ? (ordemAsc ? "↑" : "↓") : ""}
              </th>
              <th
                onClick={() => {
                  setOrdenacao("pct");
                  setOrdemAsc(!ordemAsc);
                }}
                className="cursor-pointer px-4 py-3 hover:text-foreground"
              >
                % Pop. {ordenacao === "pct" ? (ordemAsc ? "↑" : "↓") : ""}
              </th>
              <th className="px-4 py-3">Risco Predominante</th>
              <th className="px-4 py-3">Pluviômetros</th>
              <th className="px-4 py-3">Esgoto Tratado</th>
              <th className="px-4 py-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  Nenhum município encontrado com os termos de busca.
                </td>
              </tr>
            ) : (
              filtrados.map((m) => (
                <tr key={m.id_municipio} className="hover:bg-surface-2/60">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {m.nome}
                    <span className="ml-1 text-xs text-muted">· {m.uf}</span>
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-foreground">
                    {m.populacao_area_risco.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <span
                      className={`rounded-md px-2 py-0.5 font-semibold ${
                        m.percentual_populacao_risco >= 30
                          ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                          : m.percentual_populacao_risco >= 15
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          : "bg-surface-2 text-muted"
                      }`}
                    >
                      {m.percentual_populacao_risco}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {m.tipo_risco_predominante}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {m.estacoes_cemaden} estações
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {m.cobertura_esgoto_tratado_pct}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/${m.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-")}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Painel →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
