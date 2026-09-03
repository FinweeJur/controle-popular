"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Download, Search, Filter } from "lucide-react";
import type { CidadeEstrategica, RegiaoBrasil, TipoCidade } from "@/lib/cidades/estrategicas";

interface Props {
  cidades: CidadeEstrategica[];
}

export default function TabelaCidadesClient({ cidades }: Props) {
  const [busca, setBusca] = useState("");
  const [regiaoFiltro, setRegiaoFiltro] = useState<string>("todas");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [ordenacao, setOrdenacao] = useState<"nome" | "uf" | "tipo" | "regiao">("nome");
  const [ordemAsc, setOrdemAsc] = useState(true);

  const cidadesFiltradas = useMemo(() => {
    const termo = busca
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    return cidades
      .filter((c) => {
        if (regiaoFiltro !== "todas" && c.regiao !== regiaoFiltro) return false;
        if (tipoFiltro !== "todos" && c.tipo !== tipoFiltro) return false;
        if (!termo) return true;

        const nomeNorm = c.nome
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        return (
          nomeNorm.includes(termo) ||
          c.uf.toLowerCase().includes(termo) ||
          c.id_municipio.includes(termo) ||
          c.datasus_6dig.includes(termo)
        );
      })
      .sort((a, b) => {
        let valA = a[ordenacao] ?? "";
        let valB = b[ordenacao] ?? "";
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return ordemAsc ? -1 : 1;
        if (valA > valB) return ordemAsc ? 1 : -1;
        return 0;
      });
  }, [cidades, busca, regiaoFiltro, tipoFiltro, ordenacao, ordemAsc]);

  const baixarCsv = () => {
    const cabecalho = "Nome;UF;Região;Tipo;Código IBGE;Código DATASUS;Portal\n";
    const linhas = cidadesFiltradas
      .map(
        (c) =>
          `"${c.nome}";"${c.uf}";"${c.regiao}";"${c.tipo === "capital" ? "Capital" : "Polo do Interior"}";"${c.id_municipio}";"${c.datasus_6dig}";"controlepopular.com.br/${c.slug ?? c.id_municipio}"`
      )
      .join("\n");

    const conteudo = "\uFEFF" + cabecalho + linhas;
    const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `controle-popular-cidades-estrategicas-${regiaoFiltro}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mudarOrdenacao = (coluna: "nome" | "uf" | "tipo" | "regiao") => {
    if (ordenacao === coluna) {
      setOrdemAsc(!ordemAsc);
    } else {
      setOrdenacao(coluna);
      setOrdemAsc(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* BARRA DE FILTROS E PESQUISA */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Filtrar por cidade, UF ou código IBGE..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted" />
            <select
              value={regiaoFiltro}
              onChange={(e) => setRegiaoFiltro(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              aria-label="Filtrar por região"
            >
              <option value="todas">Todas as Regiões (5)</option>
              <option value="Nordeste">Nordeste (54)</option>
              <option value="Sudeste">Sudeste (54)</option>
              <option value="Sul">Sul (38)</option>
              <option value="Norte">Norte (29)</option>
              <option value="Centro-Oeste">Centro-Oeste (24)</option>
            </select>

            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              aria-label="Filtrar por tipo"
            >
              <option value="todos">Todos os Tipos (199)</option>
              <option value="capital">Apenas Capitais (27)</option>
              <option value="polo-interior">Polos do Interior (172)</option>
            </select>
          </div>
        </div>

        <button
          onClick={baixarCsv}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          <span>Baixar Planilha ({cidadesFiltradas.length})</span>
        </button>
      </div>

      {/* TABELA COM ROLAGEM */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-2 text-xs font-semibold text-muted uppercase tracking-wider">
            <tr>
              <th
                onClick={() => mudarOrdenacao("nome")}
                className="cursor-pointer px-4 py-3 hover:text-foreground"
              >
                Município {ordenacao === "nome" ? (ordemAsc ? "↑" : "↓") : ""}
              </th>
              <th
                onClick={() => mudarOrdenacao("uf")}
                className="cursor-pointer px-4 py-3 hover:text-foreground"
              >
                UF {ordenacao === "uf" ? (ordemAsc ? "↑" : "↓") : ""}
              </th>
              <th
                onClick={() => mudarOrdenacao("regiao")}
                className="cursor-pointer px-4 py-3 hover:text-foreground"
              >
                Região {ordenacao === "regiao" ? (ordemAsc ? "↑" : "↓") : ""}
              </th>
              <th
                onClick={() => mudarOrdenacao("tipo")}
                className="cursor-pointer px-4 py-3 hover:text-foreground"
              >
                Tipo {ordenacao === "tipo" ? (ordemAsc ? "↑" : "↓") : ""}
              </th>
              <th className="px-4 py-3">Cód. IBGE</th>
              <th className="px-4 py-3">DATASUS</th>
              <th className="px-4 py-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cidadesFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  Nenhum município encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              cidadesFiltradas.map((c) => (
                <tr key={c.id_municipio} className="hover:bg-surface-2/60">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {c.nome}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {c.uf}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {c.regiao}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {c.tipo === "capital" ? (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                        Capital
                      </span>
                    ) : (
                      <span className="rounded-full bg-surface-2 border border-border px-2 py-0.5 text-[10px] text-muted">
                        Polo Interior
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {c.id_municipio}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {c.datasus_6dig}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/${c.slug ?? c.id_municipio}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Acessar →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-right text-xs text-muted">
        Exibindo {cidadesFiltradas.length} de {cidades.length} cidades estratégicas auditadas.
      </p>
    </div>
  );
}
