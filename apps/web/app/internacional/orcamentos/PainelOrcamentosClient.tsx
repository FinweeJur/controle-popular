"use client";

/**
 * @file apps/web/app/internacional/orcamentos/PainelOrcamentosClient.tsx
 * @description Componente interativo client do Observatório de Orçamentos Comparados (EUA, Canadá e Europa).
 *
 * Padrão das Seis Qualidades (AGENTS.md § 8):
 * 1. Hiperlinks oficiais diretos verificados em cada registro.
 * 2. Busca em tempo real sem acento e filtros facetados (Bloco, Eixo e País).
 * 3. Ordenação por valor monetário (US$ Bi), % do PIB, país e categoria.
 * 4. Microresumo com cartões e gráficos SVG nativos (Militar vs Clima).
 * 5. Tags contextuais para o assistente Seu Nonô / Alceu Dispor.
 * 6. Exportação CSV com separador ';' e BOM UTF-8 + layout de impressão.
 */

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  ExternalLink,
  Shield,
  Eye,
  TrendingUp,
  Cpu,
  Droplets,
  Zap,
  Leaf,
  Globe2,
  Info,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import type {
  RegistroOrcamentoGlobal,
  BlocoGeopolitico,
  EixoOrcamentario,
} from "@/lib/internacional/dados-orcamentos";
import {
  ROTULOS_EIXOS,
  ROTULOS_BLOCOS,
} from "@/lib/internacional/dados-orcamentos";

interface PainelOrcamentosClientProps {
  orcamentos: RegistroOrcamentoGlobal[];
}

type CriterioOrdenacao = "valor-desc" | "valor-asc" | "pib-desc" | "pais-asc" | "eixo-asc";

const ICONES_EIXO: Record<EixoOrcamentario, React.ReactNode> = {
  militar: <Shield className="w-4 h-4 text-red-500" />,
  inteligencia: <Eye className="w-4 h-4 text-purple-500" />,
  economico: <TrendingUp className="w-4 h-4 text-blue-500" />,
  tecnologico: <Cpu className="w-4 h-4 text-cyan-500" />,
  hidrico: <Droplets className="w-4 h-4 text-sky-500" />,
  energetico: <Zap className="w-4 h-4 text-amber-500" />,
  clima: <Leaf className="w-4 h-4 text-emerald-500" />,
};

const CORES_BADGE_EIXO: Record<EixoOrcamentario, string> = {
  militar: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  inteligencia: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  economico: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  tecnologico: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  hidrico: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  energetico: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  clima: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

export default function PainelOrcamentosClient({ orcamentos }: PainelOrcamentosClientProps) {
  const [busca, setBusca] = useState("");
  const [blocoFiltro, setBlocoFiltro] = useState<string>("todos");
  const [eixoFiltro, setEixoFiltro] = useState<string>("todos");
  const [ordenacao, setOrdenacao] = useState<CriterioOrdenacao>("valor-desc");
  const [registroSelecionado, setRegistroSelecionado] = useState<RegistroOrcamentoGlobal | null>(null);
  const [modoVisualizacao, setModoVisualizacao] = useState<"tabela" | "grafico">("tabela");

  const normalizar = (txt: string) =>
    txt
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  // Filtragem e ordenação
  const registrosFiltrados = useMemo(() => {
    const termo = normalizar(busca.trim());

    return orcamentos
      .filter((item) => {
        if (blocoFiltro !== "todos" && item.bloco !== blocoFiltro) return false;
        if (eixoFiltro !== "todos" && item.eixo !== eixoFiltro) return false;

        if (!termo) return true;

        const campos = [
          item.pais,
          item.programaAgencia,
          item.eixoRotulo,
          item.descricao,
          item.orgaoExecutor,
          item.cruzamentoBrasil,
          ...item.destaqueProjetos,
        ]
          .join(" ");

        return normalizar(campos).includes(termo);
      })
      .sort((a, b) => {
        switch (ordenacao) {
          case "valor-desc":
            return b.valorUsdBi - a.valorUsdBi;
          case "valor-asc":
            return a.valorUsdBi - b.valorUsdBi;
          case "pib-desc":
            return b.pctPib - a.pctPib;
          case "pais-asc":
            return a.pais.localeCompare(b.pais);
          case "eixo-asc":
            return a.eixoRotulo.localeCompare(b.eixoRotulo);
          default:
            return 0;
        }
      });
  }, [orcamentos, busca, blocoFiltro, eixoFiltro, ordenacao]);

  // Agregados dinâmicos do resultado filtrado
  const agregadosFiltrados = useMemo(() => {
    const somaUsd = registrosFiltrados.reduce((acc, curr) => acc + curr.valorUsdBi, 0);
    const mediaPib =
      registrosFiltrados.length > 0
        ? registrosFiltrados.reduce((acc, curr) => acc + curr.pctPib, 0) / registrosFiltrados.length
        : 0;

    return {
      total: registrosFiltrados.length,
      somaUsd: somaUsd.toFixed(1),
      mediaPib: mediaPib.toFixed(2),
    };
  }, [registrosFiltrados]);

  // Função para exportação CSV com BOM UTF-8
  const exportarCsv = () => {
    const cabecalhos = [
      "ID",
      "Bloco",
      "País",
      "Eixo",
      "Programa/Agência",
      "Valor (US$ Bi)",
      "Valor Moeda Original",
      "% do PIB",
      "Exercício",
      "Órgão Executor",
      "Fonte Oficial",
      "Link Oficial",
      "Cruzamento com o Brasil",
    ];

    const linhas = registrosFiltrados.map((item) => [
      `"${item.id}"`,
      `"${item.bloco}"`,
      `"${item.pais}"`,
      `"${item.eixoRotulo}"`,
      `"${item.programaAgencia.replace(/"/g, '""')}"`,
      item.valorUsdBi.toString().replace(".", ","),
      `"${item.valorMoedaOriginal}"`,
      item.pctPib.toString().replace(".", ","),
      `"${item.anoExercicio}"`,
      `"${item.orgaoExecutor.replace(/"/g, '""')}"`,
      `"${item.fonteOficialNome.replace(/"/g, '""')}"`,
      `"${item.urlFonteOficial}"`,
      `"${item.cruzamentoBrasil.replace(/"/g, '""')}"`,
    ]);

    const conteudoCsv = "\uFEFF" + [cabecalhos.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");
    const blob = new Blob([conteudoCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `orcamentos_comparados_eua_canada_europa_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* BARRA DE CONTROLES, BUSCA E FILTROS */}
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Campo de Busca em Tempo Real */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por programa, agência, projeto ou impacto no Brasil..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border bg-surface-2 focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-1 text-xs"
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>

          {/* Alternador de Modo: Tabela vs Gráfico */}
          <div className="flex items-center gap-1.5 border border-border rounded-xl p-1 bg-surface-2 self-start md:self-auto">
            <button
              onClick={() => setModoVisualizacao("tabela")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                modoVisualizacao === "tabela"
                  ? "bg-primary text-primary-ink shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <span>📋 Tabela & Fichas</span>
            </button>
            <button
              onClick={() => setModoVisualizacao("grafico")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                modoVisualizacao === "grafico"
                  ? "bg-primary text-primary-ink shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>📊 Comparativo Visual</span>
            </button>
          </div>
        </div>

        {/* Filtros por Facetas e Ordenação */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border/40">
          {/* Faceta de Bloco Geopolítico */}
          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
              Bloco Geopolítico
            </label>
            <select
              value={blocoFiltro}
              onChange={(e) => setBlocoFiltro(e.target.value)}
              className="w-full text-xs rounded-xl border border-border bg-surface-2 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="todos">Todos os Blocos (EUA, CA, UE)</option>
              <option value="EUA">🇺🇸 Estados Unidos</option>
              <option value="Canada">🇨🇦 Canadá</option>
              <option value="Europa">🇪🇺 Europa (UE, UK, DE, FR, IT)</option>
            </select>
          </div>

          {/* Faceta de Eixo Temático */}
          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
              Eixo Orçamentário
            </label>
            <select
              value={eixoFiltro}
              onChange={(e) => setEixoFiltro(e.target.value)}
              className="w-full text-xs rounded-xl border border-border bg-surface-2 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="todos">Todos os 7 Eixos Temáticos</option>
              <option value="militar">🪖 Militar (Defesa & Forças)</option>
              <option value="inteligencia">🕵️‍♂️ Inteligência (Black Budget)</option>
              <option value="economico">📈 Econômico (Tesouro & Subsídios)</option>
              <option value="tecnologico">💻 Tecnológico (P&D & Chips)</option>
              <option value="hidrico">💧 Hídrico (Bacias & Rios)</option>
              <option value="energetico">⚡ Energético (Matriz & Redes)</option>
              <option value="clima">🌱 Clima (Crise Climática & IRA)</option>
            </select>
          </div>

          {/* Critério de Ordenação */}
          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
              Classificar por
            </label>
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as CriterioOrdenacao)}
              className="w-full text-xs rounded-xl border border-border bg-surface-2 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="valor-desc">Maior Valor (US$ Bi)</option>
              <option value="valor-asc">Menor Valor (US$ Bi)</option>
              <option value="pib-desc">Maior % do PIB</option>
              <option value="pais-asc">País (A-Z)</option>
              <option value="eixo-asc">Eixo Temático</option>
            </select>
          </div>

          {/* Botões de Ação: CSV e Impressão */}
          <div className="flex items-end gap-2">
            <button
              onClick={exportarCsv}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition shadow-2xs"
              title="Baixar planilha compatível com Excel brasileiro"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV (BOM)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-muted hover:text-foreground hover:bg-surface transition shadow-2xs"
              title="Imprimir relatório analítico"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Resumo da Filtragem */}
        <div className="text-xs text-muted flex items-center justify-between pt-1">
          <span>
            Exibindo <strong>{agregadosFiltrados.total}</strong> dotações orçamentárias (Total filtrado:{" "}
            <strong>US$ {agregadosFiltrados.somaUsd} bilhões</strong>)
          </span>
          {(busca || blocoFiltro !== "todos" || eixoFiltro !== "todos") && (
            <button
              onClick={() => {
                setBusca("");
                setBlocoFiltro("todos");
                setEixoFiltro("todos");
              }}
              className="text-primary hover:underline font-medium text-[11px]"
            >
              Redefinir filtros
            </button>
          )}
        </div>
      </div>

      {/* MODO GRÁFICO COMPARATIVO SVG NATIVO (ACESSIBILIDADE: DADOS DUPLAMENTE VISÍVEIS) */}
      {modoVisualizacao === "grafico" && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">
              A Desproporção Orçamentária: Orçamento Militar vs Combate à Crise Climática
            </h3>
            <p className="text-xs text-muted mt-1 max-w-3xl">
              Comparativo direto em bilhões de dólares americanos. Em potências como os Estados Unidos, os gastos
              militares anuais superam os investimentos climáticos diretos em mais de 18 vezes.
            </p>
          </div>

          {/* Gráfico de Barras SVG Nativo */}
          <div className="space-y-4 pt-2">
            {[
              { pais: "Estados Unidos", militar: 842.0, clima: 46.5, razao: "18,1x" },
              { pais: "Reino Unido", militar: 68.5, clima: 14.2, razao: "4,8x" },
              { pais: "Alemanha", militar: 76.5, clima: 42.0, razao: "1,8x" },
              { pais: "Canadá", militar: 21.8, clima: 6.7, razao: "3,3x" },
            ].map((item) => {
              const maxRef = 850;
              const pctMilitar = (item.militar / maxRef) * 100;
              const pctClima = (item.clima / maxRef) * 100;

              return (
                <div key={item.pais} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{item.pais}</span>
                    <span className="text-muted font-mono">
                      Militar: <strong>US$ {item.militar} bi</strong> | Clima: <strong>US$ {item.clima} bi</strong>{" "}
                      (Razão: <span className="text-red-500 font-bold">{item.razao}</span>)
                    </span>
                  </div>
                  <div className="space-y-1">
                    {/* Barra Militar */}
                    <div className="h-4 w-full bg-surface-2 rounded-full overflow-hidden flex items-center">
                      <div
                        className="h-full bg-red-500/80 rounded-full transition-all duration-500 flex items-center justify-end pr-2 text-[10px] text-white font-bold"
                        style={{ width: `${Math.max(pctMilitar, 4)}%` }}
                      >
                        🪖 Militar
                      </div>
                    </div>
                    {/* Barra Clima */}
                    <div className="h-4 w-full bg-surface-2 rounded-full overflow-hidden flex items-center">
                      <div
                        className="h-full bg-emerald-500/80 rounded-full transition-all duration-500 flex items-center justify-end pr-2 text-[10px] text-white font-bold"
                        style={{ width: `${Math.max(pctClima, 4)}%` }}
                      >
                        🌱 Clima
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-muted border-t border-border pt-4">
            <strong>Fonte dos Dados do Gráfico:</strong> DoD Comptroller (FY2024), EPA / Inflation Reduction Act,
            HM Treasury, BMVg Alemanha e ECCC Canadá. Conversão e consolidação pelo Controle Popular.
          </div>
        </div>
      )}

      {/* MODO TABELA DETALHADA DAS SEIS QUALIDADES */}
      {modoVisualizacao === "tabela" && (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 text-muted uppercase text-[11px] tracking-wider border-b border-border">
                <tr>
                  <th scope="col" className="p-3.5 font-semibold">País / Bloco</th>
                  <th scope="col" className="p-3.5 font-semibold">Eixo Temático</th>
                  <th scope="col" className="p-3.5 font-semibold">Programa & Agência</th>
                  <th scope="col" className="p-3.5 font-semibold text-right">Dotação (US$ Bi)</th>
                  <th scope="col" className="p-3.5 font-semibold text-right">% do PIB</th>
                  <th scope="col" className="p-3.5 font-semibold">Exercício</th>
                  <th scope="col" className="p-3.5 font-semibold text-center print:hidden">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {registrosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted">
                      Nenhuma dotação orçamentária encontrada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  registrosFiltrados.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-surface-2/60 transition cursor-pointer"
                      onClick={() => setRegistroSelecionado(item)}
                    >
                      {/* País e Bloco */}
                      <td className="p-3.5 font-medium text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.pais}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted">
                            {item.bloco}
                          </span>
                        </div>
                      </td>

                      {/* Eixo Temático com Badge */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            CORES_BADGE_EIXO[item.eixo]
                          }`}
                        >
                          {ICONES_EIXO[item.eixo]}
                          <span>{item.eixoRotulo}</span>
                        </span>
                      </td>

                      {/* Programa e Agência */}
                      <td className="p-3.5 max-w-xs">
                        <div className="font-semibold text-foreground truncate" title={item.programaAgencia}>
                          {item.programaAgencia}
                        </div>
                        <div className="text-[11px] text-muted truncate" title={item.orgaoExecutor}>
                          {item.orgaoExecutor}
                        </div>
                      </td>

                      {/* Valor em US$ Bi */}
                      <td className="p-3.5 text-right font-mono font-bold text-foreground text-sm whitespace-nowrap">
                        US$ {item.valorUsdBi.toFixed(1)} bi
                        <div className="text-[10px] text-muted font-normal font-sans">
                          {item.valorMoedaOriginal}
                        </div>
                      </td>

                      {/* % do PIB */}
                      <td className="p-3.5 text-right font-mono text-muted whitespace-nowrap">
                        {item.pctPib > 0 ? `${item.pctPib.toFixed(2)}%` : "—"}
                      </td>

                      {/* Exercício */}
                      <td className="p-3.5 text-muted whitespace-nowrap text-[11px]">
                        {item.anoExercicio}
                      </td>

                      {/* Botão de Detalhes / Fonte Oficial */}
                      <td className="p-3.5 text-center whitespace-nowrap print:hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setRegistroSelecionado(item)}
                            className="p-1.5 rounded-lg border border-border bg-surface hover:border-primary/40 hover:text-primary transition"
                            title="Ver análise completa e cruzamento com o Brasil"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={item.urlFonteOficial}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition"
                            title={`Abrir fonte oficial: ${item.fonteOficialNome}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL / DRAWER DE DETALHES DO REGISTRO ORÇAMENTÁRIO (Q1 + Q5) */}
      {registroSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-titulo"
          >
            {/* Topo do Modal */}
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      CORES_BADGE_EIXO[registroSelecionado.eixo]
                    }`}
                  >
                    {ICONES_EIXO[registroSelecionado.eixo]}
                    <span>{registroSelecionado.eixoRotulo}</span>
                  </span>
                  <span className="text-xs text-muted font-medium">
                    {registroSelecionado.pais} ({registroSelecionado.bloco})
                  </span>
                </div>
                <h3 id="modal-titulo" className="text-xl font-bold font-display text-foreground">
                  {registroSelecionado.programaAgencia}
                </h3>
              </div>
              <button
                onClick={() => setRegistroSelecionado(null)}
                className="p-1.5 rounded-xl border border-border text-muted hover:text-foreground hover:bg-surface-2 transition"
                aria-label="Fechar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Métricas Principais */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-surface-2 border border-border">
              <div>
                <span className="text-[10px] text-muted uppercase font-semibold block">Dotação em Dólar</span>
                <span className="text-lg font-bold font-mono text-foreground">
                  US$ {registroSelecionado.valorUsdBi.toFixed(1)} bi
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted uppercase font-semibold block">Moeda de Origem</span>
                <span className="text-base font-bold font-mono text-foreground">
                  {registroSelecionado.valorMoedaOriginal}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted uppercase font-semibold block">Peso no PIB</span>
                <span className="text-base font-bold font-mono text-foreground">
                  {registroSelecionado.pctPib > 0 ? `${registroSelecionado.pctPib}%` : "Federal"}
                </span>
              </div>
            </div>

            {/* Descrição Detalhada */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Finalidade e Destinação dos Recursos
              </h4>
              <p className="text-sm text-foreground leading-relaxed">
                {registroSelecionado.descricao}
              </p>
            </div>

            {/* Projetos em Destaque */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Projetos e Linhas Estratégicas
              </h4>
              <ul className="space-y-1 text-xs text-foreground">
                {registroSelecionado.destaqueProjetos.map((proj, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{proj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Conexão Cívica com o Brasil */}
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <span>🇧🇷 Impacto e Cruzamento com o Brasil:</span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                {registroSelecionado.cruzamentoBrasil}
              </p>
            </div>

            {/* Fonte Oficial Verificada (Regra 1 das 6 Qualidades) */}
            <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="text-muted">
                Fonte: <strong>{registroSelecionado.fonteOficialNome}</strong> ({registroSelecionado.anoExercicio})
              </div>
              <a
                href={registroSelecionado.urlFonteOficial}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-ink text-xs font-bold hover:opacity-90 transition shadow-xs"
              >
                <span>Acessar Documento Oficial da Fonte</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
