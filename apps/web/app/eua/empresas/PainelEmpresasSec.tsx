"use client";

/**
 * @file apps/web/app/eua/empresas/PainelEmpresasSec.tsx
 * @description Painel interativo com as 6 Qualidades para as empresas e fundos dos EUA na SEC EDGAR.
 *
 * Papel no portal:
 * Permite ao cidadão pesquisar, filtrar, ordenar e exportar as corporações industriais
 * e gestoras de fundos globais com participação em mineradoras e estatais brasileiras.
 *
 * Fontes oficiais:
 * - U.S. Securities and Exchange Commission (SEC EDGAR Submissions e Company Facts).
 * - CIK (Central Index Key) oficial de 10 dígitos com zeros à esquerda.
 * - Formulários 10-K (anual de empresas dos EUA) e 20-F (empresas estrangeiras como Vale).
 *
 * Decisões técnicas e restrições:
 * - Cumpre rigorosamente a Regra das 6 Qualidades (AGENTS.md §8).
 * - Frases curtas de até 13 palavras na interface.
 * - Exportação de CSV com BOM UTF-8 (\uFEFF) e separador ponto e vírgula (;).
 * - Suporte a impressão nativa via CSS e botão dedicado.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  ExternalLink,
  Download,
  Printer,
  Search,
  ArrowUpDown,
  Filter,
  ShieldAlert,
  FileText,
  DollarSign,
  Globe,
} from "lucide-react";
import BarraIdiomaTrilingue from "@/app/components/BarraIdiomaTrilingue";
import type { IdiomaExibicao } from "@/lib/internacional/idiomas-internacional";
import type { RegistroEmpresaSecEua } from "../../../../../scripts/coletar-eua-acervo.mts";

interface PainelEmpresasSecProps {
  /** Lista de empresas e fundos descompactados da SEC EDGAR. */
  empresas: RegistroEmpresaSecEua[];
}

type ColunaOrdenacao = "nome" | "ativos" | "ticker" | "cik";

/**
 * Formata valores monetários em bilhões de dólares para exibição direta.
 * Explica se o valor atinge a escala de trilhões de dólares.
 */
function formatarAtivosUsd(valorBilhoes: number): string {
  if (valorBilhoes >= 1000) {
    const trilhoes = (valorBilhoes / 1000).toFixed(1);
    return `$${trilhoes} Tri (${valorBilhoes.toLocaleString("pt-BR")} Bi)`;
  }
  return `$${valorBilhoes.toLocaleString("pt-BR", { minimumFractionDigits: 1 })} Bi`;
}

/**
 * Remove acentos e converte para minúsculas para busca resiliente.
 */
function normalizarTexto(txt: string): string {
  return txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function PainelEmpresasSec({ empresas }: PainelEmpresasSecProps) {
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [setorFiltro, setSetorFiltro] = useState<string>("todos");
  const [colunaOrdenacao, setColunaOrdenacao] = useState<ColunaOrdenacao>("ativos");
  const [ordemAsc, setOrdemAsc] = useState(false); // Maior ativo primeiro por padrão
  const [idioma, setIdioma] = useState<IdiomaExibicao>("pt");

  // Lista única de tipos e setores para os filtros facetados
  const tiposDisponiveis = useMemo(() => {
    const tipos = new Set(empresas.map((e) => e.tipoEntidade));
    return ["todos", ...Array.from(tipos)];
  }, [empresas]);

  const setoresDisponiveis = useMemo(() => {
    const setores = new Set(empresas.map((e) => e.setor));
    return ["todos", ...Array.from(setores)];
  }, [empresas]);

  // Filtragem e ordenação em tempo real (Qualidades 2 e 3)
  const empresasProcessadas = useMemo(() => {
    const termo = normalizarTexto(busca);

    return empresas
      .filter((item) => {
        // Filtro de tipo de entidade
        if (tipoFiltro !== "todos" && item.tipoEntidade !== tipoFiltro) {
          return false;
        }
        // Filtro de setor
        if (setorFiltro !== "todos" && item.setor !== setorFiltro) {
          return false;
        }
        // Busca textual tolerante
        if (!termo) return true;

        const nome = normalizarTexto(item.nome);
        const ticker = normalizarTexto(item.ticker);
        const cik = normalizarTexto(item.cik);
        const setor = normalizarTexto(item.setor);
        const sede = normalizarTexto(item.sedeEstado);
        const relacao = normalizarTexto(item.relacaoBrasil);
        const fatores = normalizarTexto(item.fatoresRiscoBrasil);

        return (
          nome.includes(termo) ||
          ticker.includes(termo) ||
          cik.includes(termo) ||
          setor.includes(termo) ||
          sede.includes(termo) ||
          relacao.includes(termo) ||
          fatores.includes(termo)
        );
      })
      .sort((a, b) => {
        let diff = 0;
        if (colunaOrdenacao === "nome") {
          diff = a.nome.localeCompare(b.nome);
        } else if (colunaOrdenacao === "ativos") {
          diff = a.ativosSobGestaoUsdBilhoes - b.ativosSobGestaoUsdBilhoes;
        } else if (colunaOrdenacao === "ticker") {
          diff = a.ticker.localeCompare(b.ticker);
        } else if (colunaOrdenacao === "cik") {
          diff = a.cik.localeCompare(b.cik);
        }
        return ordemAsc ? diff : -diff;
      });
  }, [empresas, busca, tipoFiltro, setorFiltro, colunaOrdenacao, ordemAsc]);

  /**
   * Exporta a lista filtrada no padrão CSV brasileiro (BOM UTF-8 e ponto e vírgula).
   */
  function exportarCsv() {
    const cabecalho = [
      "Nome",
      "CIK",
      "Ticker",
      "Tipo de Entidade",
      "Setor",
      "Sede (EUA)",
      "Ativos Sob Gestão (USD Bilhões)",
      "Relação com o Brasil",
      "Formulários SEC",
      "Fatores de Risco Citados",
      "Link Oficial SEC EDGAR",
    ];

    const linhas = empresasProcessadas.map((e) => [
      `"${e.nome.replace(/"/g, '""')}"`,
      `"${e.cik}"`,
      `"${e.ticker}"`,
      `"${e.tipoEntidade}"`,
      `"${e.setor}"`,
      `"${e.sedeEstado}"`,
      `${e.ativosSobGestaoUsdBilhoes}`,
      `"${e.relacaoBrasil.replace(/"/g, '""')}"`,
      `"${e.formulariosSec.replace(/"/g, '""')}"`,
      `"${e.fatoresRiscoBrasil.replace(/"/g, '""')}"`,
      `"${e.urlOficial}"`,
    ]);

    const csvContent = "\uFEFF" + [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `empresas-sec-eua-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Aciona impressão nativa do navegador formatada via print CSS.
   */
  function acionarImpressao() {
    window.print();
  }

  function alternarOrdenacao(coluna: ColunaOrdenacao) {
    if (colunaOrdenacao === coluna) {
      setOrdemAsc(!ordemAsc);
    } else {
      setColunaOrdenacao(coluna);
      setOrdemAsc(coluna === "nome" || coluna === "ticker");
    }
  }

  return (
    <div className="space-y-6">
      {/* BARRA DE IDIOMA TRILÍNGUE (PT / EN / ES + TTS + SEU NONÔ) */}
      <div className="print:hidden">
        <BarraIdiomaTrilingue
          idioma={idioma}
          aoTrocarIdioma={setIdioma}
          resumoTrilingue={{
            pt: "Balanços na SEC EDGAR das corporações e fundos dos EUA com investimentos no Brasil.",
            en: "SEC EDGAR filings of US corporations and asset managers investing in Brazil.",
            es: "Balances en SEC EDGAR de corporaciones y fondos de EE. UU. que invierten en Brasil.",
          }}
          perguntaSeuNono={{
            pt: "Quais fundos na SEC investem em empresas do Brasil e que riscos citam?",
            en: "Which US funds in the SEC invest in Brazil and what risks do they report?",
            es: "¿Cuáles fondos en la SEC invierten en Brasil y qué riesgos reportan?",
          }}
          paisDestaque="EUA"
        />
      </div>

      {/* CONTROLES DE BUSCA, FILTRO, ORDENAÇÃO E EXPORTAÇÃO */}
      <section
        aria-label="Filtros e exportação de empresas"
        className="rounded-xl border border-border bg-surface p-4 shadow-sm print:hidden"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* CAMPO DE BUSCA TEXTUAL */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar corporação, fundo, ticker, CIK ou relação com o Brasil..."
              className="w-full rounded-lg border border-border bg-surface-elevated py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* BOTÕES DE EXPORTAÇÃO E IMPRESSÃO */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportarCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface hover:text-sky-600 transition"
              title="Baixar planilha CSV com BOM UTF-8 para Excel"
            >
              <Download className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
              <span>Exportar CSV ({empresasProcessadas.length})</span>
            </button>
            <button
              type="button"
              onClick={acionarImpressao}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface hover:text-sky-600 transition"
              title="Imprimir relatório da página"
            >
              <Printer className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* FILTROS FACETADOS E ORDENAÇÃO */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/60 pt-3 text-xs">
          {/* TIPO DE ENTIDADE */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
            <span className="font-medium text-muted">Tipo:</span>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value="todos">Todos os tipos ({empresas.length})</option>
              {tiposDisponiveis
                .filter((t) => t !== "todos")
                .map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
            </select>
          </div>

          {/* SETOR */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-muted">Setor:</span>
            <select
              value={setorFiltro}
              onChange={(e) => setSetorFiltro(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value="todos">Todos os setores</option>
              {setoresDisponiveis
                .filter((s) => s !== "todos")
                .map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
            </select>
          </div>

          {/* BARRAS DE ORDENAÇÃO RÁPIDA */}
          <div className="ml-auto flex items-center gap-2">
            <span className="font-medium text-muted">Ordenar:</span>
            <button
              type="button"
              onClick={() => alternarOrdenacao("ativos")}
              className={`rounded px-2 py-1 font-semibold transition ${
                colunaOrdenacao === "ativos"
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                  : "bg-surface-elevated text-muted hover:text-foreground"
              }`}
            >
              Ativos {colunaOrdenacao === "ativos" && (ordemAsc ? "↑" : "↓")}
            </button>
            <button
              type="button"
              onClick={() => alternarOrdenacao("nome")}
              className={`rounded px-2 py-1 font-semibold transition ${
                colunaOrdenacao === "nome"
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                  : "bg-surface-elevated text-muted hover:text-foreground"
              }`}
            >
              Nome {colunaOrdenacao === "nome" && (ordemAsc ? "↑" : "↓")}
            </button>
            <button
              type="button"
              onClick={() => alternarOrdenacao("ticker")}
              className={`rounded px-2 py-1 font-semibold transition ${
                colunaOrdenacao === "ticker"
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                  : "bg-surface-elevated text-muted hover:text-foreground"
              }`}
            >
              Ticker {colunaOrdenacao === "ticker" && (ordemAsc ? "↑" : "↓")}
            </button>
          </div>
        </div>
      </section>

      {/* CONTADOR DE RESULTADOS */}
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          Mostrando <strong>{empresasProcessadas.length}</strong> de{" "}
          <strong>{empresas.length}</strong> corporações e fundos catalogados.
        </span>
        {busca && (
          <button
            type="button"
            onClick={() => setBusca("")}
            className="text-sky-600 hover:underline dark:text-sky-400"
          >
            Limpar busca
          </button>
        )}
      </div>

      {/* LISTA DE REGISTROS FORMATADA EM CARDS RICOS COM TODAS AS 6 QUALIDADES */}
      <div className="space-y-4">
        {empresasProcessadas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
            Nenhuma corporação ou fundo encontrado com os filtros atuais.
          </div>
        ) : (
          empresasProcessadas.map((empresa) => (
            <article
              key={empresa.id}
              className="rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:border-sky-500/50 print:border-gray-300 print:shadow-none"
            >
              {/* CABEÇALHO DO CARD */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-sky-100 px-2 py-0.5 font-mono text-xs font-bold text-sky-800 dark:bg-sky-950/80 dark:text-sky-300">
                      {empresa.ticker}
                    </span>
                    <h2 className="font-display text-lg font-bold text-foreground">
                      {empresa.nome}
                    </h2>
                    <span className="rounded-full bg-surface-elevated px-2.5 py-0.5 text-[11px] font-medium text-muted border border-border/60">
                      {empresa.tipoEntidade}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Sede: <strong>{empresa.sedeEstado}</strong> • Setor:{" "}
                    <strong>{empresa.setor}</strong>
                  </p>
                </div>

                {/* ATIVOS SOB GESTÃO E CIK */}
                <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                  <div className="text-right">
                    <span className="block text-[11px] text-muted">Ativos / Porte</span>
                    <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {formatarAtivosUsd(empresa.ativosSobGestaoUsdBilhoes)}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-muted">
                    CIK: <span className="font-bold text-foreground">{empresa.cik}</span>
                  </div>
                </div>
              </div>

              {/* CONTEÚDO PRINCIPAL: RELAÇÃO COM O BRASIL E FATORES DE RISCO */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-surface-elevated p-3 border border-border/50">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
                    <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Relação com o Brasil</span>
                  </div>
                  <p className="mt-1 text-xs text-foreground leading-relaxed">
                    {empresa.relacaoBrasil}
                  </p>
                </div>

                <div className="rounded-lg bg-amber-500/10 p-3 border border-amber-500/20">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                    <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Fatores de Risco reportados à SEC</span>
                  </div>
                  <p className="mt-1 text-xs text-foreground leading-relaxed">
                    {empresa.fatoresRiscoBrasil}
                  </p>
                </div>
              </div>

              {/* RODAPÉ DO CARD: FORMULÁRIOS E LINK OFICIAL DIRETO NA SEC (QUALIDADE 1) */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3 text-xs">
                <div className="flex items-center gap-2 text-muted">
                  <FileText className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                  <span>Filings oficiais:</span>
                  <span className="font-mono font-medium text-foreground">
                    {empresa.formulariosSec}
                  </span>
                </div>

                <a
                  href={empresa.urlOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 px-3 py-1.5 font-semibold text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900 transition"
                  title={`Abrir página de registros de ${empresa.nome} na SEC EDGAR`}
                >
                  <span>Abrir na SEC EDGAR (CIK {empresa.cik})</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
