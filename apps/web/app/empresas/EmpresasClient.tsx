"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  TrendingUp,
  ShieldAlert,
  Search,
  Download,
  ExternalLink,
  ArrowUpDown,
  Filter,
  BarChart3,
  Globe2,
  FileSpreadsheet,
  Layers,
  HelpCircle,
} from "lucide-react";
import type { EntidadeDetalhada } from "@/lib/empresas/entidades-dados";

interface Props {
  entidades: EntidadeDetalhada[];
}

export default function EmpresasClient({ entidades }: Props) {
  const [busca, setBusca] = useState("");
  const [setorAtivo, setSetorAtivo] = useState<string>("todos");
  const [tipoAtivo, setTipoAtivo] = useState<string>("todos");
  const [riscoAtivo, setRiscoAtivo] = useState<string>("todos");
  const [ordem, setOrdem] = useState<"nome" | "setor" | "ticker" | "risco">("nome");
  const [direcaoAsc, setDirecaoAsc] = useState(true);

  // Setores únicos
  const setores = useMemo(() => {
    const s = new Set<string>();
    for (const e of entidades) {
      if (e.setor) s.add(e.setor);
    }
    return Array.from(s);
  }, [entidades]);

  // Contagens por setor para o gráfico
  const distribuicaoSetores = useMemo(() => {
    const cont: Record<string, number> = {};
    for (const e of entidades) {
      const s = e.setorRotulo || e.setor;
      cont[s] = (cont[s] || 0) + 1;
    }
    return Object.entries(cont).sort((a, b) => b[1] - a[1]);
  }, [entidades]);

  // Filtragem
  const filtradas = useMemo(() => {
    return entidades.filter((e) => {
      if (setorAtivo !== "todos" && e.setor !== setorAtivo) return false;
      if (tipoAtivo !== "todos" && e.tipo !== tipoAtivo) return false;
      if (riscoAtivo !== "todos" && e.esg.riscoAmbiental !== riscoAtivo) return false;

      if (busca.trim()) {
        const q = busca.toLowerCase();
        const bateNome = e.nome.toLowerCase().includes(q);
        const bateTicker = e.ticker?.toLowerCase().includes(q);
        const bateCnpj = e.cnpj?.includes(q);
        const bateSetor = e.setorRotulo.toLowerCase().includes(q);
        if (!bateNome && !bateTicker && !bateCnpj && !bateSetor) return false;
      }
      return true;
    });
  }, [entidades, setorAtivo, tipoAtivo, riscoAtivo, busca]);

  // Ordenação
  const ordenadas = useMemo(() => {
    return [...filtradas].sort((a, b) => {
      let vA = "";
      let vB = "";
      if (ordem === "nome") {
        vA = a.nome;
        vB = b.nome;
      } else if (ordem === "setor") {
        vA = a.setorRotulo;
        vB = b.setorRotulo;
      } else if (ordem === "ticker") {
        vA = a.ticker || "ZZZ";
        vB = b.ticker || "ZZZ";
      } else if (ordem === "risco") {
        vA = a.esg.riscoAmbiental;
        vB = b.esg.riscoAmbiental;
      }
      return direcaoAsc ? vA.localeCompare(vB) : vB.localeCompare(vA);
    });
  }, [filtradas, ordem, direcaoAsc]);

  function alternarOrdem(campo: "nome" | "setor" | "ticker" | "risco") {
    if (ordem === campo) {
      setDirecaoAsc(!direcaoAsc);
    } else {
      setOrdem(campo);
      setDirecaoAsc(true);
    }
  }

  // Exportação CSV com BOM UTF-8 e separador ';'
  function exportarCsv() {
    const cabecalho = ["Nome", "Ticker", "Tipo", "Setor", "CNPJ_ou_CIK", "Bolsa", "Risco_Ambiental_ESG", "Link_Perfil"];
    const linhas = ordenadas.map((e) => [
      `"${e.nome.replace(/"/g, '""')}"`,
      `"${e.ticker || ""}"`,
      `"${e.tipo}"`,
      `"${e.setorRotulo.replace(/"/g, '""')}"`,
      `"${e.cnpj || e.cik || ""}"`,
      `"${e.bolsa || ""}"`,
      `"${e.esg.riscoAmbiental}"`,
      `"https://controlepopular.com.br/empresas/${e.slug}"`,
    ]);

    const conteudo = [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");
    const blob = new Blob(["\uFEFF" + conteudo], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `empresas-setores-estrategicos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const maxFreq = Math.max(...distribuicaoSetores.map(([, v]) => v), 1);

  return (
    <div className="space-y-8">
      {/* ═══ 1. CARTÕES DE TOPO (STATUS GERAL) ═══ */}
      <section aria-labelledby="status-empresas" className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <h2 id="status-empresas" className="sr-only">Estatísticas do Observatório</h2>
        
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-muted">
            <Building2 size={16} className="text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider">Entidades Mapeadas</span>
          </div>
          <div className="mt-2 font-display text-2xl sm:text-3xl font-bold text-foreground">
            {entidades.length}
          </div>
          <p className="mt-1 text-xs text-muted">60 nacionais · 60 EUA · 10 fundos globais</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-muted">
            <Layers size={16} className="text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Setores Cobertos</span>
          </div>
          <div className="mt-2 font-display text-2xl sm:text-3xl font-bold text-foreground">
            {setores.length}
          </div>
          <p className="mt-1 text-xs text-muted">Mineração, Energia, Água, Defesa, etc.</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-muted">
            <TrendingUp size={16} className="text-blue-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Cotações & Ações</span>
          </div>
          <div className="mt-2 font-display text-2xl sm:text-3xl font-bold text-foreground">
            B3 / NYSE
          </div>
          <p className="mt-1 text-xs text-muted">Tickers e relatórios CVM / SEC</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-muted">
            <ShieldAlert size={16} className="text-alert" />
            <span className="text-xs font-semibold uppercase tracking-wider">Risco ESG Crítico</span>
          </div>
          <div className="mt-2 font-display text-2xl sm:text-3xl font-bold text-foreground">
            {entidades.filter((e) => e.esg.riscoAmbiental === "Crítico").length}
          </div>
          <p className="mt-1 text-xs text-muted">Mineração e grandes bacias monitoradas</p>
        </div>
      </section>

      {/* ═══ 2. GRÁFICO SVG INLINE DE DISTRIBUIÇÃO SETORIAL ═══ */}
      <section aria-labelledby="grafico-setores" className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" />
            <h3 id="grafico-setores" className="font-display text-base font-bold text-foreground">
              Distribuição das Entidades por Setor Estratégico
            </h3>
          </div>
          <span className="text-xs text-muted">Total: {entidades.length} organizações</span>
        </div>

        <div className="mt-4 space-y-2.5">
          {distribuicaoSetores.map(([setor, qtd]) => {
            const perc = Math.round((qtd / maxFreq) * 100);
            return (
              <div key={setor} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground truncate pr-2">{setor}</span>
                  <span className="font-mono text-muted">{qtd} ({Math.round((qtd / entidades.length) * 100)}%)</span>
                </div>
                <div className="h-3 w-full rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/80 transition-all duration-300"
                    style={{ width: `${perc}%` }}
                    title={`${setor}: ${qtd} entidades`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ 3. PAINEL DE FILTROS & BUSCA RÁPIDA ═══ */}
      <section aria-label="Filtros da tabela" className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              type="search"
              placeholder="Buscar por nome, ticker (VALE3), CNPJ..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 py-2 pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportarCsv}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition shadow-2xs"
            >
              <Download size={14} />
              <span>Baixar Planilha CSV ({ordenadas.length})</span>
            </button>
          </div>
        </div>

        {/* Linha de Filtros por Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
          <span className="text-xs font-semibold text-muted flex items-center gap-1">
            <Filter size={12} /> Setor:
          </span>
          <button
            type="button"
            onClick={() => setSetorAtivo("todos")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              setorAtivo === "todos"
                ? "bg-primary text-white"
                : "bg-surface-2 text-muted hover:text-foreground"
            }`}
          >
            Todos ({entidades.length})
          </button>
          {setores.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSetorAtivo(s)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                setorAtivo === s
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-muted hover:text-foreground"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted">Tipo:</span>
          {[
            { id: "todos", rotulo: "Todos" },
            { id: "empresa_nacional", rotulo: "Nacionais (B3)" },
            { id: "empresa_eua", rotulo: "EUA (NYSE/NASDAQ)" },
            { id: "fundo_eua", rotulo: "Fundos de Investimento" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTipoAtivo(t.id)}
              className={`rounded-lg px-2 py-0.5 text-xs font-medium transition ${
                tipoAtivo === t.id
                  ? "bg-foreground text-background"
                  : "bg-surface-2 text-muted hover:text-foreground"
              }`}
            >
              {t.rotulo}
            </button>
          ))}

          <span className="text-xs font-semibold text-muted ml-3">Risco ESG:</span>
          {["todos", "Crítico", "Alto", "Médio"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRiscoAtivo(r)}
              className={`rounded-lg px-2 py-0.5 text-xs font-medium transition ${
                riscoAtivo === r
                  ? "bg-alert text-white"
                  : "bg-surface-2 text-muted hover:text-foreground"
              }`}
            >
              {r === "todos" ? "Todos" : r}
            </button>
          ))}
        </div>
      </section>

      {/* ═══ 4. TABELA COMPACTA COM ORDENAÇÃO E PERFIS ═══ */}
      <section aria-label="Tabela de empresas monitoradas" className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-xs">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-border bg-surface-2 text-xs font-semibold text-muted uppercase tracking-wider">
            <tr>
              <th scope="col" className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => alternarOrdem("nome")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Empresa / Organização
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th scope="col" className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => alternarOrdem("ticker")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Ticker / Ação
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th scope="col" className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => alternarOrdem("setor")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Setor
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th scope="col" className="py-3 px-3">CNPJ / CIK</th>
              <th scope="col" className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => alternarOrdem("risco")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Risco ESG
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th scope="col" className="py-3 px-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {ordenadas.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted">
                  Nenhuma empresa encontrada com os filtros selecionados.
                </td>
              </tr>
            ) : (
              ordenadas.map((e) => (
                <tr key={e.slug} className="hover:bg-surface-2/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground">
                    <Link
                      href={`/empresas/${e.slug}`}
                      className="hover:text-primary transition font-bold"
                    >
                      {e.nome}
                    </Link>
                    <div className="text-xs text-muted">{e.investimentoBrasil}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs">
                    {e.ticker ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold">
                        <TrendingUp size={10} />
                        {e.ticker}
                      </span>
                    ) : (
                      <span className="text-muted text-xs">Capital fechado</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-xs text-muted">
                    <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-foreground">
                      {e.setorRotulo}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-muted">
                    {e.cnpj || e.cik || "—"}
                  </td>
                  <td className="py-3 px-3 text-xs">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                        e.esg.riscoAmbiental === "Crítico"
                          ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                          : e.esg.riscoAmbiental === "Alto"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      }`}
                    >
                      {e.esg.riscoAmbiental}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/empresas/${e.slug}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-primary hover:border-primary hover:bg-primary/5 transition shadow-2xs"
                    >
                      <span>Ver Ficha</span>
                      <ExternalLink size={12} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
