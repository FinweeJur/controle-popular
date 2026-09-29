"use client";

/**
 * @file apps/web/app/eua/contratos/PainelContratosEua.tsx
 * @description Painel interativo com as 6 Qualidades para compras federais e comércio bilateral dos EUA.
 *
 * Papel no portal:
 * Permite ao cidadão consultar e auditar contratos federais no USAspending.gov,
 * balança comercial com o Brasil no US Census Bureau (CTY 3510) e subvenções
 * a minerais críticos do Department of Energy (DOE).
 *
 * Fontes oficiais:
 * - USAspending.gov (U.S. Department of the Treasury) com compras e prêmios públicos.
 * - U.S. Census Bureau Foreign Trade Statistics (CTY Code 3510 - Brazil).
 * - U.S. Department of Energy Loan Programs Office (Inflation Reduction Act).
 *
 * Decisões técnicas e restrições:
 * - Cumpre a Regra das 6 Qualidades (AGENTS.md §8).
 * - Frases curtas de até 13 palavras na interface.
 * - Exportação CSV com BOM UTF-8 (\uFEFF) e separador ponto e vírgula (;).
 * - Layout de impressão para relatórios cívicos e parlamentares.
 */

import { useState, useMemo } from "react";
import {
  DollarSign,
  Search,
  Download,
  Printer,
  ExternalLink,
  Filter,
  Briefcase,
  Building,
  TrendingUp,
  FileText,
  Globe,
} from "lucide-react";
import BarraIdiomaTrilingue from "@/app/components/BarraIdiomaTrilingue";
import type { IdiomaExibicao } from "@/lib/internacional/idiomas-internacional";
import type { RegistroContratosEconomiaEua } from "../../../../../scripts/coletar-eua-acervo.mts";

interface PainelContratosEuaProps {
  /** Lista de contratos e dados da balança comercial dos EUA. */
  contratos: RegistroContratosEconomiaEua[];
}

type ColunaOrdenacao = "programa" | "valor" | "ano" | "agencia";

function normalizarTexto(txt: string): string {
  return txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Formata valores monetários em milhões ou bilhões de dólares com clareza.
 */
function formatarValorUsd(valorMilhoes: number): string {
  if (valorMilhoes >= 1000) {
    const bilhoes = (valorMilhoes / 1000).toFixed(1);
    return `$${bilhoes} Bi (${valorMilhoes.toLocaleString("pt-BR")} Milhões)`;
  }
  return `$${valorMilhoes.toLocaleString("pt-BR")} Milhões`;
}

export default function PainelContratosEua({ contratos }: PainelContratosEuaProps) {
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [agenciaFiltro, setAgenciaFiltro] = useState<string>("todos");
  const [colunaOrdenacao, setColunaOrdenacao] = useState<ColunaOrdenacao>("valor");
  const [ordemAsc, setOrdemAsc] = useState(false); // Maior valor primeiro
  const [idioma, setIdioma] = useState<IdiomaExibicao>("pt");

  const tiposDisponiveis = useMemo(() => {
    const tipos = new Set(contratos.map((c) => c.tipoTransacao));
    return ["todos", ...Array.from(tipos)];
  }, [contratos]);

  const agenciasDisponiveis = useMemo(() => {
    const agencias = new Set(contratos.map((c) => c.agenciaFederal));
    return ["todos", ...Array.from(agencias)];
  }, [contratos]);

  // Filtragem e ordenação em tempo real (Qualidades 2 e 3)
  const contratosProcessados = useMemo(() => {
    const termo = normalizarTexto(busca);

    return contratos
      .filter((item) => {
        if (tipoFiltro !== "todos" && item.tipoTransacao !== tipoFiltro) {
          return false;
        }
        if (agenciaFiltro !== "todos" && item.agenciaFederal !== agenciaFiltro) {
          return false;
        }
        if (!termo) return true;

        const programa = normalizarTexto(item.programaOuAward);
        const agencia = normalizarTexto(item.agenciaFederal);
        const recipiente = normalizarTexto(item.recipiente);
        const objeto = normalizarTexto(item.objetoContrato);
        const elo = normalizarTexto(item.eloBrasil);

        return (
          programa.includes(termo) ||
          agencia.includes(termo) ||
          recipiente.includes(termo) ||
          objeto.includes(termo) ||
          elo.includes(termo)
        );
      })
      .sort((a, b) => {
        let diff = 0;
        if (colunaOrdenacao === "programa") {
          diff = a.programaOuAward.localeCompare(b.programaOuAward);
        } else if (colunaOrdenacao === "valor") {
          diff = a.valorUsdMilhoes - b.valorUsdMilhoes;
        } else if (colunaOrdenacao === "ano") {
          diff = a.anoFiscal - b.anoFiscal;
        } else if (colunaOrdenacao === "agencia") {
          diff = a.agenciaFederal.localeCompare(b.agenciaFederal);
        }
        return ordemAsc ? diff : -diff;
      });
  }, [contratos, busca, tipoFiltro, agenciaFiltro, colunaOrdenacao, ordemAsc]);

  /**
   * Exporta a lista filtrada em formato CSV compatível com Excel (BOM UTF-8).
   */
  function exportarCsv() {
    const cabecalho = [
      "Programa ou Award",
      "Agência Federal",
      "Recipiente",
      "Tipo de Transação",
      "Ano Fiscal",
      "Valor (USD Milhões)",
      "Localidade / País",
      "Objeto do Contrato",
      "Elo com o Brasil",
      "Fonte Oficial",
      "Link Oficial",
    ];

    const linhas = contratosProcessados.map((c) => [
      `"${c.programaOuAward.replace(/"/g, '""')}"`,
      `"${c.agenciaFederal.replace(/"/g, '""')}"`,
      `"${c.recipiente.replace(/"/g, '""')}"`,
      `"${c.tipoTransacao}"`,
      `${c.anoFiscal}`,
      `${c.valorUsdMilhoes}`,
      `"${c.estadoOuPais}"`,
      `"${c.objetoContrato.replace(/"/g, '""')}"`,
      `"${c.eloBrasil.replace(/"/g, '""')}"`,
      `"${c.fonteOficial.replace(/"/g, '""')}"`,
      `"${c.urlOficial}"`,
    ]);

    const csvContent = "\uFEFF" + [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `contratos-comercio-eua-${new Date().toISOString().split("T")[0]}.csv`);
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
      setOrdemAsc(coluna === "programa" || coluna === "agencia");
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
            pt: "Compras públicas no USAspending e balança comercial de 85 bilhões de dólares com o Brasil.",
            en: "USAspending federal procurement and $85B bilateral trade balance with Brazil.",
            es: "Compras federales en USAspending y balanza comercial de 85 mil millones con Brasil.",
          }}
          perguntaSeuNono={{
            pt: "Qual é o valor total do comércio exterior entre Estados Unidos e Brasil?",
            en: "What is the total value of foreign trade between the US and Brazil?",
            es: "¿Cuál es el valor total del comercio exterior entre Estados Unidos y Brasil?",
          }}
          paisDestaque="EUA"
        />
      </div>

      {/* CONTROLES DE BUSCA, FILTROS E EXPORTAÇÃO */}
      <section
        aria-label="Filtros e exportação de compras"
        className="rounded-xl border border-border bg-surface p-4 shadow-sm print:hidden"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* CAMPO DE BUSCA */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar programa, agência, fornecedor, censo ou impacto no Brasil..."
              className="w-full rounded-lg border border-border bg-surface-elevated py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportarCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface hover:text-sky-600 transition"
              title="Baixar planilha CSV com BOM UTF-8"
            >
              <Download className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
              <span>Exportar CSV ({contratosProcessados.length})</span>
            </button>
            <button
              type="button"
              onClick={acionarImpressao}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface hover:text-sky-600 transition"
              title="Imprimir relatório"
            >
              <Printer className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* FILTROS FACETADOS E ORDENAÇÃO */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/60 pt-3 text-xs">
          {/* TIPO DE TRANSAÇÃO */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
            <span className="font-medium text-muted">Tipo:</span>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value="todos">Todos os tipos ({contratos.length})</option>
              {tiposDisponiveis
                .filter((t) => t !== "todos")
                .map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
            </select>
          </div>

          {/* AGÊNCIA */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-muted">Agência:</span>
            <select
              value={agenciaFiltro}
              onChange={(e) => setAgenciaFiltro(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value="todos">Todas as agências</option>
              {agenciasDisponiveis
                .filter((a) => a !== "todos")
                .map((a) => (
                  <option key={a} value={a}>
                    {a}
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
              Valor {colunaOrdenacao === "valor" && (ordemAsc ? "↑" : "↓")}
            </button>
            <button
              type="button"
              onClick={() => alternarOrdenacao("programa")}
              className={`rounded px-2 py-1 font-semibold transition ${
                colunaOrdenacao === "programa"
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                  : "bg-surface-elevated text-muted hover:text-foreground"
              }`}
            >
              Programa {colunaOrdenacao === "programa" && (ordemAsc ? "↑" : "↓")}
            </button>
            <button
              type="button"
              onClick={() => alternarOrdenacao("ano")}
              className={`rounded px-2 py-1 font-semibold transition ${
                colunaOrdenacao === "ano"
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                  : "bg-surface-elevated text-muted hover:text-foreground"
              }`}
            >
              Ano Fiscal {colunaOrdenacao === "ano" && (ordemAsc ? "↑" : "↓")}
            </button>
          </div>
        </div>
      </section>

      {/* CONTADOR */}
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          Mostrando <strong>{contratosProcessados.length}</strong> de{" "}
          <strong>{contratos.length}</strong> fluxos e contratos oficiais.
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

      {/* CARDS RICOS DE CONTRATOS (6 QUALIDADES) */}
      <div className="space-y-4">
        {contratosProcessados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
            Nenhum contrato ou fluxo comercial localizado para o filtro selecionado.
          </div>
        ) : (
          contratosProcessados.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:border-sky-500/50 print:border-gray-300 print:shadow-none"
            >
              {/* CABEÇALHO */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      {item.tipoTransacao}
                    </span>
                    <span className="rounded bg-surface-elevated px-2 py-0.5 font-mono text-xs text-muted border border-border/60">
                      Ano Fiscal {item.anoFiscal}
                    </span>
                  </div>

                  <h2 className="mt-2 font-display text-lg font-bold text-foreground">
                    {item.programaOuAward}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    Agência Federal: <strong>{item.agenciaFederal}</strong> • Beneficiário:{" "}
                    <strong>{item.recipiente}</strong>
                  </p>
                </div>

                {/* VALOR FINANCEIRO */}
                <div className="mt-2 rounded-xl bg-surface-elevated p-3 text-right border border-border/60 sm:mt-0 sm:min-w-[190px]">
                  <span className="block text-[11px] text-muted">Volume Financeiro Oficial</span>
                  <span className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatarValorUsd(item.valorUsdMilhoes)}
                  </span>
                  <span className="block text-xs font-medium text-muted">
                    {item.estadoOuPais}
                  </span>
                </div>
              </div>

              {/* OBJETO E ELO COM O BRASIL */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-surface-elevated p-3 border border-border/50">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Briefcase className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
                    <span>Objeto da Contratação ou Fluxo</span>
                  </div>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    {item.objetoContrato}
                  </p>
                </div>

                <div className="rounded-lg bg-sky-500/10 p-3 border border-sky-500/20">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-800 dark:text-sky-300">
                    <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Elo Direto com a Economia Brasileira</span>
                  </div>
                  <p className="mt-1 text-xs text-foreground leading-relaxed">
                    {item.eloBrasil}
                  </p>
                </div>
              </div>

              {/* RODAPÉ: LINK OFICIAL VERIFICADO (QUALIDADE 1) */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3 text-xs">
                <span className="text-muted">
                  Fonte: <strong>{item.fonteOficial}</strong>
                </span>

                <a
                  href={item.urlOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 px-3 py-1.5 font-semibold text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900 transition"
                  title="Abrir página oficial do órgão federal"
                >
                  <span>Consultar na Fonte Federal</span>
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
