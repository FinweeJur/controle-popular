/**
 * @file apps/web/app/empresas/EmpresasClient.tsx
 * @description Componente interativo de visualização, filtragem e exportação do Observatório de Empresas.
 *
 * Papel no portal:
 * Permite ao leitor auditar e filtrar grandes empresas nacionais e internacionais com atuação
 * ou impacto no Brasil, cruzando dados de mercado com responsabilidade socioambiental (ESG).
 * Conecta o ecossistema brasileiro aos acervos internacionais (/canada/mineracao e /eua/empresas).
 *
 * Fontes oficiais:
 * - CVM (Comissão de Valores Mobiliários) e B3 para empresas brasileiras de capital aberto.
 * - SEC (Securities and Exchange Commission) para empresas e fundos dos EUA (EDGAR 10-K, 20-F).
 * - SEDAR+ e Bolsa de Toronto (TSX/TSXV) para mineradoras canadenses com ativos no Brasil.
 * - PNCP (Portal Nacional de Contratações Públicas), SIGBM (ANM) e FEAM/IBAMA.
 *
 * Decisões técnicas e restrições:
 * - Filtragem e ordenação no cliente com resposta instantânea e busca tolerante a maiúsculas/minúsculas.
 * - Exportação de CSV com BOM UTF-8 (\uFEFF) e separador ponto-e-vírgula (;) para compatibilidade com Excel.
 * - Classificação determinística de país de origem (Brasil, Estados Unidos, Canadá) a partir do tipo e bolsa.
 * - Total compatibilidade com o tipo 'empresa_canada' catalogado em entidades-dados.ts.
 */

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
  Compass,
} from "lucide-react";
import type { EntidadeDetalhada } from "@/lib/empresas/entidades-dados";

interface Props {
  entidades: EntidadeDetalhada[];
}

export type PaisOrigem = "brasil" | "eua" | "canada";

/**
 * Identifica o país de origem da entidade a partir de seu tipo, bolsa de listagem ou atributos.
 *
 * @param e Entidade detalhada a ser analisada.
 * @returns "brasil" | "eua" | "canada"
 */
export function obterPaisOrigem(e: EntidadeDetalhada): PaisOrigem {
  if (e.tipo === "empresa_canada" || e.bolsa === "TSX" || e.bolsa === "TSXV") {
    return "canada";
  }
  if (
    e.tipo === "empresa_eua" ||
    e.tipo === "fundo_eua" ||
    e.bolsa === "NYSE" ||
    e.bolsa === "NASDAQ"
  ) {
    return "eua";
  }
  return "brasil";
}

export default function EmpresasClient({ entidades }: Props) {
  const [busca, setBusca] = useState("");
  const [paisAtivo, setPaisAtivo] = useState<string>("todos");
  const [setorAtivo, setSetorAtivo] = useState<string>("todos");
  const [tipoAtivo, setTipoAtivo] = useState<string>("todos");
  const [riscoAtivo, setRiscoAtivo] = useState<string>("todos");
  const [ordem, setOrdem] = useState<"nome" | "setor" | "ticker" | "risco">("nome");
  const [direcaoAsc, setDirecaoAsc] = useState(true);

  // Contagem por país de origem para os botões de filtro e cartões
  const contagemPaises = useMemo(() => {
    let br = 0;
    let eua = 0;
    let ca = 0;
    for (const e of entidades) {
      const p = obterPaisOrigem(e);
      if (p === "brasil") br++;
      else if (p === "eua") eua++;
      else if (p === "canada") ca++;
    }
    return { br, eua, ca };
  }, [entidades]);

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

  // Filtragem combinada por país, setor, tipo, risco ESG e busca textual
  const filtradas = useMemo(() => {
    return entidades.filter((e) => {
      if (paisAtivo !== "todos" && obterPaisOrigem(e) !== paisAtivo) return false;
      if (setorAtivo !== "todos" && e.setor !== setorAtivo) return false;
      if (tipoAtivo !== "todos" && e.tipo !== tipoAtivo) return false;
      if (riscoAtivo !== "todos" && e.esg.riscoAmbiental !== riscoAtivo) return false;

      if (busca.trim()) {
        const q = busca.toLowerCase();
        const bateNome = e.nome.toLowerCase().includes(q);
        const bateTicker = e.ticker?.toLowerCase().includes(q);
        const bateCnpj = e.cnpj?.includes(q);
        const bateCik = e.cik?.includes(q);
        const bateSetor = e.setorRotulo.toLowerCase().includes(q);
        if (!bateNome && !bateTicker && !bateCnpj && !bateCik && !bateSetor) return false;
      }
      return true;
    });
  }, [entidades, paisAtivo, setorAtivo, tipoAtivo, riscoAtivo, busca]);

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
    const cabecalho = ["Nome", "País", "Ticker", "Tipo", "Setor", "CNPJ_ou_CIK", "Bolsa", "Risco_Ambiental_ESG", "Link_Perfil"];
    const linhas = ordenadas.map((e) => {
      const pais =
        obterPaisOrigem(e) === "canada"
          ? "Canadá"
          : obterPaisOrigem(e) === "eua"
          ? "Estados Unidos"
          : "Brasil";
      return [
        `"${e.nome.replace(/"/g, '""')}"`,
        `"${pais}"`,
        `"${e.ticker || ""}"`,
        `"${e.tipo}"`,
        `"${e.setorRotulo.replace(/"/g, '""')}"`,
        `"${e.cnpj || e.cik || ""}"`,
        `"${e.bolsa || ""}"`,
        `"${e.esg.riscoAmbiental}"`,
        `"https://controlepopular.com.br/empresas/${e.slug}"`,
      ];
    });

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
          <p className="mt-1 text-xs text-muted">
            {contagemPaises.br} Brasil · {contagemPaises.eua} EUA
            {contagemPaises.ca > 0 ? ` · ${contagemPaises.ca} Canadá` : ""}
          </p>
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
            B3 / NYSE / TSX
          </div>
          <p className="mt-1 text-xs text-muted">Tickers e relatórios CVM / SEC / SEDAR+</p>
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

      {/* ═══ BANNERS DE CRUZAMENTO INTERNACIONAL (EUA & CANADÁ) ═══ */}
      <section aria-label="Acervos Internacionais Conectados" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Banner Canadá / TSX */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/25 bg-gradient-to-br from-rose-500/5 via-surface to-surface p-5 shadow-xs transition hover:border-rose-500/45">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                <span>🇨🇦 Bolsa de Toronto (TSX & TSXV)</span>
              </div>
              <h3 className="font-display text-base font-bold text-foreground">
                Mineradoras Canadenses no Brasil
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Fiscalize mineradoras do Canadá operando em lítio no Jequitinhonha e ouro, barragens de rejeitos e canal de denúncias da ouvidoria federal CORE.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted">12 mineradoras · 8 barragens</span>
            <Link
              href="/canada/mineracao"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition shadow-2xs"
            >
              <span>Explorar Acervo TSX</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>

        {/* Banner EUA / SEC */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-500/5 via-surface to-surface p-5 shadow-xs transition hover:border-blue-500/45">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                <span>🇺🇸 SEC (Securities and Exchange Commission)</span>
              </div>
              <h3 className="font-display text-base font-bold text-foreground">
                Corporações & Fundos Globais nos EUA
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Consulte relatórios anuais Form 20-F e 10-K, recibos ADR de gigantes brasileiras na NYSE e fundos soberanos que controlam participações societárias.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted">Form 20-F · Gestoras globais</span>
            <Link
              href="/eua/empresas"
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition shadow-2xs"
            >
              <span>Explorar Acervo SEC</span>
              <ExternalLink size={12} />
            </Link>
          </div>
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

        {/* Linha de Filtros por País de Origem */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
          <span className="text-xs font-semibold text-muted flex items-center gap-1">
            <Globe2 size={12} /> País de Origem:
          </span>
          {[
            { id: "todos", rotulo: "Todos os Países", total: entidades.length },
            { id: "brasil", rotulo: "🇧🇷 Brasil", total: contagemPaises.br },
            { id: "eua", rotulo: "🇺🇸 Estados Unidos", total: contagemPaises.eua },
            { id: "canada", rotulo: "🇨🇦 Canadá", total: contagemPaises.ca },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPaisAtivo(p.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                paisAtivo === p.id
                  ? "bg-foreground text-background font-semibold"
                  : "bg-surface-2 text-muted hover:text-foreground"
              }`}
            >
              {p.rotulo} ({p.total})
            </button>
          ))}
        </div>

        {/* Linha de Filtros por Setor */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
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

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-muted">Tipo:</span>
          {[
            { id: "todos", rotulo: "Todos" },
            { id: "empresa_nacional", rotulo: "Nacionais (B3)" },
            { id: "empresa_eua", rotulo: "EUA (NYSE/NASDAQ)" },
            { id: "fundo_eua", rotulo: "Fundos de Investimento" },
            { id: "empresa_canada", rotulo: "Canadá (TSX/TSXV)" },
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
              ordenadas.map((e) => {
                const pais = obterPaisOrigem(e);
                const bandeira = pais === "canada" ? "🇨🇦" : pais === "eua" ? "🇺🇸" : "🇧🇷";
                const nomePais = pais === "canada" ? "Canadá" : pais === "eua" ? "Estados Unidos" : "Brasil";
                return (
                  <tr key={e.slug} className="hover:bg-surface-2/60 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm select-none" title={`País de origem: ${nomePais}`}>
                          {bandeira}
                        </span>
                        <Link
                          href={`/empresas/${e.slug}`}
                          className="hover:text-primary transition font-bold"
                        >
                          {e.nome}
                        </Link>
                        {e.tipo === "empresa_canada" && (
                          <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            Canadá (TSX)
                          </span>
                        )}
                        {e.tipo === "fundo_eua" && (
                          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                            Fundo Global
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted">{e.investimentoBrasil}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs">
                      {e.ticker ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold">
                          <TrendingUp size={10} />
                          {e.ticker}
                          {e.bolsa && <span className="text-[10px] font-normal text-muted">({e.bolsa})</span>}
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
                      {e.cnpj || e.cik || (e.tipo === "empresa_canada" ? "SEDAR+" : "—")}
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
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
