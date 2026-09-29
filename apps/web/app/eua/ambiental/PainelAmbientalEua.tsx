"use client";

/**
 * @file apps/web/app/eua/ambiental/PainelAmbientalEua.tsx
 * @description Painel interativo com as 6 Qualidades para o acervo ambiental dos EUA.
 *
 * Papel no portal:
 * Permite ao cidadão pesquisar, filtrar, ordenar e auditar o inventário de barragens (NID),
 * autos de infração da EPA ECHO, áreas contaminadas Superfund (CERCLA), hidrologia USGS
 * e emissões mapeadas por satélite no Climate TRACE.
 *
 * Fontes oficiais:
 * - National Inventory of Dams (USACE / FEMA) com 91.500 barragens e 15.600 High Hazard.
 * - U.S. EPA ECHO (Enforcement and Compliance History Online).
 * - U.S. EPA Superfund (CERCLA National Priorities List).
 * - USGS National Water Information System (NWIS).
 * - Climate TRACE Coalizão Global de Monitoramento de Emissões.
 *
 * Decisões técnicas e restrições:
 * - Cumpre a Regra das 6 Qualidades (AGENTS.md §8).
 * - Frases curtas de até 13 palavras nos textos de interface.
 * - Exportação CSV com BOM UTF-8 (\uFEFF) e separador ponto e vírgula (;).
 * - Impressão vetorial limpa para relatórios de fiscalização.
 */

import { useState, useMemo } from "react";
import {
  ShieldAlert,
  Waves,
  Factory,
  Flame,
  Search,
  Download,
  Printer,
  ExternalLink,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
} from "lucide-react";
import BarraIdiomaTrilingue from "@/app/components/BarraIdiomaTrilingue";
import type { IdiomaExibicao } from "@/lib/internacional/idiomas-internacional";
import type { RegistroAmbientalEua } from "../../../../../scripts/coletar-eua-acervo.mts";

interface PainelAmbientalEuaProps {
  /** Lista de registros ambientais e barragens dos EUA. */
  ambiental: RegistroAmbientalEua[];
}

type ColunaOrdenacao = "titulo" | "valor" | "orgao";

function normalizarTexto(txt: string): string {
  return txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Retorna cor do selo visual de acordo com o grau de risco do registro.
 */
function obterEstiloRisco(risco: string): { bg: string; text: string; border: string } {
  if (risco.includes("High Hazard") || risco.includes("Prioridade Nacional")) {
    return {
      bg: "bg-red-500/10 dark:bg-red-950/40",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-500/30",
    };
  }
  if (risco.includes("Multa Grave") || risco.includes("Significant Hazard")) {
    return {
      bg: "bg-amber-500/10 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-500/30",
    };
  }
  return {
    bg: "bg-sky-500/10 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-500/30",
  };
}

export default function PainelAmbientalEua({ ambiental }: PainelAmbientalEuaProps) {
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todos");
  const [riscoFiltro, setRiscoFiltro] = useState<string>("todos");
  const [colunaOrdenacao, setColunaOrdenacao] = useState<ColunaOrdenacao>("valor");
  const [ordemAsc, setOrdemAsc] = useState(false); // Maior impacto primeiro
  const [idioma, setIdioma] = useState<IdiomaExibicao>("pt");

  const categoriasDisponiveis = useMemo(() => {
    const cats = new Set(ambiental.map((a) => a.categoria));
    return ["todos", ...Array.from(cats)];
  }, [ambiental]);

  const riscosDisponiveis = useMemo(() => {
    const riscos = new Set(ambiental.map((a) => a.riscoOuGravidade));
    return ["todos", ...Array.from(riscos)];
  }, [ambiental]);

  // Filtragem e ordenação em tempo real (Qualidades 2 e 3)
  const ambientalProcessado = useMemo(() => {
    const termo = normalizarTexto(busca);

    return ambiental
      .filter((item) => {
        if (categoriaFiltro !== "todos" && item.categoria !== categoriaFiltro) {
          return false;
        }
        if (riscoFiltro !== "todos" && item.riscoOuGravidade !== riscoFiltro) {
          return false;
        }
        if (!termo) return true;

        const titulo = normalizarTexto(item.titulo);
        const orgao = normalizarTexto(item.orgaoFonte);
        const identificador = normalizarTexto(item.identificadorOficial);
        const resumo = normalizarTexto(item.resumoImpacto);
        const paralelo = normalizarTexto(item.paraleloBrasil);

        return (
          titulo.includes(termo) ||
          orgao.includes(termo) ||
          identificador.includes(termo) ||
          resumo.includes(termo) ||
          paralelo.includes(termo)
        );
      })
      .sort((a, b) => {
        let diff = 0;
        if (colunaOrdenacao === "titulo") {
          diff = a.titulo.localeCompare(b.titulo);
        } else if (colunaOrdenacao === "valor") {
          diff = a.metricaPrincipalValor - b.metricaPrincipalValor;
        } else if (colunaOrdenacao === "orgao") {
          diff = a.orgaoFonte.localeCompare(b.orgaoFonte);
        }
        return ordemAsc ? diff : -diff;
      });
  }, [ambiental, busca, categoriaFiltro, riscoFiltro, colunaOrdenacao, ordemAsc]);

  /**
   * Exporta a lista filtrada em formato CSV compatível com Excel (BOM UTF-8).
   */
  function exportarCsv() {
    const cabecalho = [
      "Título",
      "Categoria",
      "Órgão Regulador",
      "Identificador Oficial",
      "Risco / Gravidade",
      "Métrica Principal",
      "Valor",
      "Unidade",
      "Resumo de Impacto",
      "Paralelo com o Brasil",
      "Fonte Oficial",
      "Link Oficial",
    ];

    const linhas = ambientalProcessado.map((a) => [
      `"${a.titulo.replace(/"/g, '""')}"`,
      `"${a.categoria}"`,
      `"${a.orgaoFonte.replace(/"/g, '""')}"`,
      `"${a.identificadorOficial}"`,
      `"${a.riscoOuGravidade}"`,
      `"${a.metricaPrincipalRotulo.replace(/"/g, '""')}"`,
      `${a.metricaPrincipalValor}`,
      `"${a.unidadeMetrica}"`,
      `"${a.resumoImpacto.replace(/"/g, '""')}"`,
      `"${a.paraleloBrasil.replace(/"/g, '""')}"`,
      `"${a.fonteOficial.replace(/"/g, '""')}"`,
      `"${a.urlOficial}"`,
    ]);

    const csvContent = "\uFEFF" + [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ambiental-barragens-eua-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function acionarImpressao() {
    window.print();
  }

  function alternarOrdenacao(coluna: ColunaOrdenacao) {
    if (colunaOrdenacao === coluna) {
      setOrdemAsc(!ordemAsc);
    } else {
      setColunaOrdenacao(coluna);
      setOrdemAsc(coluna === "titulo" || coluna === "orgao");
    }
  }

  return (
    <div className="space-y-6">
      {/* BARRA TRILÍNGUE (PT / EN / ES + TTS + SEU NONÔ) */}
      <div className="print:hidden">
        <BarraIdiomaTrilingue
          idioma={idioma}
          aoTrocarIdioma={setIdioma}
          resumoTrilingue={{
            pt: "Inventário de barragens NID, multas da EPA, áreas Superfund e monitoramento de rios nos EUA.",
            en: "US NID dam inventory, EPA enforcement penalties, Superfund sites, and river monitoring.",
            es: "Inventario de presas NID, multas de EPA, sitios Superfund y monitoreo de ríos en EE. UU.",
          }}
          perguntaSeuNono={{
            pt: "Como o inventário de barragens dos EUA compara com o SIGBM no Brasil?",
            en: "How does the US dam inventory compare to Brazil's SIGBM regulation?",
            es: "¿Cómo se compara el inventario de presas de EE. UU. con el SIGBM de Brasil?",
          }}
          paisDestaque="EUA"
        />
      </div>

      {/* CONTROLES DE BUSCA, FILTROS E EXPORTAÇÃO */}
      <section
        aria-label="Filtros e exportação ambiental"
        className="rounded-xl border border-border bg-surface p-4 shadow-sm print:hidden"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* BUSCA EM TEMPO REAL */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar barragem, EPA, Superfund, rio USGS ou paralelo com o Brasil..."
              className="w-full rounded-lg border border-border bg-surface-elevated py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* BOTÕES DE EXPORTAÇÃO */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportarCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface hover:text-sky-600 transition"
              title="Baixar planilha CSV com BOM UTF-8"
            >
              <Download className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
              <span>Exportar CSV ({ambientalProcessado.length})</span>
            </button>
            <button
              type="button"
              onClick={acionarImpressao}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface hover:text-sky-600 transition"
              title="Imprimir visualização formatada"
            >
              <Printer className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* FILTROS FACETADOS E ORDENAÇÃO */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/60 pt-3 text-xs">
          {/* CATEGORIA */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
            <span className="font-medium text-muted">Categoria:</span>
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value="todos">Todas as categorias ({ambiental.length})</option>
              {categoriasDisponiveis
                .filter((c) => c !== "todos")
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </div>

          {/* RISCO OU GRAVIDADE */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-muted">Risco:</span>
            <select
              value={riscoFiltro}
              onChange={(e) => setRiscoFiltro(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value="todos">Todos os graus de risco</option>
              {riscosDisponiveis
                .filter((r) => r !== "todos")
                .map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
            </select>
          </div>

          {/* ORDENAÇÃO */}
          <div className="ml-auto flex items-center gap-2">
            <span className="font-medium text-muted">Ordenar:</span>
            <button
              type="button"
              onClick={() => alternarOrdenacao("valor")}
              className={`rounded px-2 py-1 font-semibold transition ${
                colunaOrdenacao === "valor"
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                  : "bg-surface-elevated text-muted hover:text-foreground"
              }`}
            >
              Métrica {colunaOrdenacao === "valor" && (ordemAsc ? "↑" : "↓")}
            </button>
            <button
              type="button"
              onClick={() => alternarOrdenacao("titulo")}
              className={`rounded px-2 py-1 font-semibold transition ${
                colunaOrdenacao === "titulo"
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                  : "bg-surface-elevated text-muted hover:text-foreground"
              }`}
            >
              Título {colunaOrdenacao === "titulo" && (ordemAsc ? "↑" : "↓")}
            </button>
            <button
              type="button"
              onClick={() => alternarOrdenacao("orgao")}
              className={`rounded px-2 py-1 font-semibold transition ${
                colunaOrdenacao === "orgao"
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                  : "bg-surface-elevated text-muted hover:text-foreground"
              }`}
            >
              Órgão {colunaOrdenacao === "orgao" && (ordemAsc ? "↑" : "↓")}
            </button>
          </div>
        </div>
      </section>

      {/* CONTADOR DE RESULTADOS */}
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          Exibindo <strong>{ambientalProcessado.length}</strong> de{" "}
          <strong>{ambiental.length}</strong> bases e relatórios ambientais.
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

      {/* CARDS AMBIENTAIS DETALHADOS (6 QUALIDADES) */}
      <div className="space-y-4">
        {ambientalProcessado.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
            Nenhum registro ambiental encontrado para os filtros selecionados.
          </div>
        ) : (
          ambientalProcessado.map((item) => {
            const estiloRisco = obterEstiloRisco(item.riscoOuGravidade);

            return (
              <article
                key={item.id}
                className="rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:border-sky-500/50 print:border-gray-300 print:shadow-none"
              >
                {/* CABEÇALHO DO ITEM */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-surface-elevated px-2.5 py-0.5 text-xs font-semibold text-foreground border border-border/60">
                        {item.categoria}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${estiloRisco.bg} ${estiloRisco.text} ${estiloRisco.border}`}
                      >
                        {item.riscoOuGravidade}
                      </span>
                      <span className="font-mono text-xs text-muted">
                        ID: {item.identificadorOficial}
                      </span>
                    </div>

                    <h2 className="mt-2 font-display text-lg font-bold text-foreground">
                      {item.titulo}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted">
                      Órgão responsável: <strong>{item.orgaoFonte}</strong> • Âmbito:{" "}
                      <strong>{item.estado}</strong>
                    </p>
                  </div>

                  {/* DESTAQUE DA MÉTRICA PRINCIPAL */}
                  <div className="mt-2 rounded-xl bg-surface-elevated p-3 text-right border border-border/60 sm:mt-0 sm:min-w-[180px]">
                    <span className="block text-[11px] text-muted">
                      {item.metricaPrincipalRotulo}
                    </span>
                    <span className="font-mono text-2xl font-bold text-foreground">
                      {item.metricaPrincipalValor.toLocaleString("pt-BR")}
                    </span>
                    <span className="block text-xs font-medium text-sky-600 dark:text-sky-400">
                      {item.unidadeMetrica}
                    </span>
                  </div>
                </div>

                {/* RESUMO DE IMPACTO E PARALELO COM O BRASIL */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-surface-elevated p-3 border border-border/50">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <FileCheck className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
                      <span>Impacto e Mecanismo de Fiscalização</span>
                    </div>
                    <p className="mt-1 text-xs text-muted leading-relaxed">
                      {item.resumoImpacto}
                    </p>
                  </div>

                  <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Paralelo Direto com a Regulação no Brasil</span>
                    </div>
                    <p className="mt-1 text-xs text-foreground leading-relaxed">
                      {item.paraleloBrasil}
                    </p>
                  </div>
                </div>

                {/* RODAPÉ DO ITEM: LINK OFICIAL VERIFICADO (QUALIDADE 1) */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3 text-xs">
                  <span className="text-muted">
                    Fonte oficial: <strong>{item.fonteOficial}</strong>
                  </span>

                  <a
                    href={item.urlOficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 px-3 py-1.5 font-semibold text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900 transition"
                    title={`Acessar portal oficial de ${item.orgaoFonte}`}
                  >
                    <span>Abrir na Fonte Oficial ({item.identificadorOficial})</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
