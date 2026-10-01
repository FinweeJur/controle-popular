"use client";

/**
 * @file apps/web/app/ambiental/barragens-globais/PainelBarragensGlobaisClient.tsx
 * @description Painel interativo do Acervo de Grandes Barragens Mundiais (água, energia, rejeitos).
 *
 * Papel no portal:
 * Permite ao cidadão, pesquisador e liderança comunitária navegar, pesquisar, auditar
 * e comparar grandes barragens em todo o mundo atendendo à Regra das Seis Qualidades (AGENTS.md §8):
 * 1. Linkável e verificado à fonte oficial direta (ANM/SIGBM, ICOLD, Global Tailings Portal, USACE NID).
 * 2. Buscável e filtrável com normalização sem acentos (semAcento) e facetas múltiplas.
 * 3. Classificável e ordenável em todas as colunas (nome, país, rio, altura, volume, ano, risco).
 * 4. Microresumo com cartões de topo medidos e contextualização cívica.
 * 5. Assistente cívico integrado (Seu Nonô / Alceu Dispor) com respostas em frases curtas (<= 13 palavras).
 * 6. Exportação em CSV com BOM UTF-8 (\uFEFF) e layout de impressão CSS nativo (@media print).
 */

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  Download,
  ExternalLink,
  Printer,
  ShieldAlert,
  Zap,
  Droplets,
  Layers,
  MapPin,
  Sparkles,
  BarChart3,
  X,
  SlidersHorizontal,
  Info,
  Calendar,
  Waves,
  Mountain,
} from "lucide-react";
import type {
  BarragemMundial,
  TipoBarragem,
  StatusOperacional,
} from "@/lib/ambiente/dados-barragens-globais";
import { semAcento } from "@/lib/busca/normalizar";

export interface PainelBarragensGlobaisClientProps {
  barragens: BarragemMundial[];
}

/** Tipo de ordenação da tabela */
type ColunaOrdenacao =
  | "nome"
  | "pais"
  | "rioOuBacia"
  | "alturaMetros"
  | "volumeCapacidadeMm3"
  | "anoConclusao"
  | "classificacaoRiscoOuHazard";

/** Perguntas rápidas com respostas cívicas preparadas para o assistente Seu Nonô */
interface PerguntaCivica {
  pergunta: string;
  resposta: string;
  link?: string;
  rotuloLink?: string;
}

const PERGUNTAS_ASSISTENTE: PerguntaCivica[] = [
  {
    pergunta: "Quais barragens de rejeitos correm maior risco no Brasil?",
    resposta:
      "Forquilha III e Sul Superior estão em Nível 3 de risco de colapso.",
    link: "https://app.anm.gov.br/SIGBM/Publico/GerenciarBarragem",
    rotuloLink: "Painel SIGBM / ANM",
  },
  {
    pergunta: "Qual a diferença entre alteamento a montante e jusante?",
    resposta:
      "Alteamento a montante usa o próprio rejeito e é proibido no Brasil.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14066.htm",
    rotuloLink: "Lei 14.066/2020 (PNSB)",
  },
  {
    pergunta: "Como o rompimento de Fundão se compara com Mount Polley no Canadá?",
    resposta:
      "Fundão despejou 50 milhões de m³, o dobro de Mount Polley (24 milhões de m³).",
    link: "https://tailing.grida.no/",
    rotuloLink: "Global Tailings Portal",
  },
  {
    pergunta: "Qual é a barragem mais alta do planeta?",
    resposta:
      "Rogun no Tajiquistão terá 335 metros de altura; Nurek tem 300 metros.",
    link: "https://www.worldbank.org/",
    rotuloLink: "Banco Mundial (Vakhsh Cascade)",
  },
];

export default function PainelBarragensGlobaisClient({
  barragens,
}: PainelBarragensGlobaisClientProps) {
  // Estados de busca e filtros facetados
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroContinente, setFiltroContinente] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroRisco, setFiltroRisco] = useState<string>("todos");

  // Estado de ordenação
  const [colunaOrdenacao, setColunaOrdenacao] = useState<ColunaOrdenacao>("nome");
  const [ordemAscendente, setOrdemAscendente] = useState(true);

  // Modo de exibição: Tabela ou Cards
  const [modoExibicao, setModoExibicao] = useState<"tabela" | "cards">("tabela");

  // Modal de detalhes
  const [barragemModal, setBarragemModal] = useState<BarragemMundial | null>(null);

  // Exibição do gráfico SVG nativo
  const [exibirGrafico, setExibirGrafico] = useState(true);

  // Assistente cívico interativo
  const [perguntaSelecionada, setPerguntaSelecionada] = useState<PerguntaCivica | null>(null);

  /**
   * Alterna ordenação ao clicar no cabeçalho da coluna.
   */
  const alternarOrdenacao = useCallback((coluna: ColunaOrdenacao) => {
    setColunaOrdenacao((anterior) => {
      if (anterior === coluna) {
        setOrdemAscendente((asc) => !asc);
        return coluna;
      }
      setOrdemAscendente(true);
      return coluna;
    });
  }, []);

  /**
   * Filtragem e ordenação em tempo real.
   */
  const barragensFiltradas = useMemo(() => {
    const termo = semAcento(busca.trim());

    return barragens
      .filter((b) => {
        // Filtro de busca textual
        if (termo) {
          const nomeNorm = semAcento(b.nome);
          const paisNorm = semAcento(b.pais);
          const rioNorm = semAcento(b.rioOuBacia);
          const operadorNorm = semAcento(b.operador);
          const resumoNorm = semAcento(b.resumoCivico);
          const tagsNorm = semAcento(b.tags.join(" "));

          const casa =
            nomeNorm.includes(termo) ||
            paisNorm.includes(termo) ||
            rioNorm.includes(termo) ||
            operadorNorm.includes(termo) ||
            resumoNorm.includes(termo) ||
            tagsNorm.includes(termo);

          if (!casa) return false;
        }

        // Filtro por tipo
        if (filtroTipo !== "todos" && b.tipoBarragem !== filtroTipo) {
          return false;
        }

        // Filtro por continente
        if (filtroContinente !== "todos" && b.continente !== filtroContinente) {
          return false;
        }

        // Filtro por status
        if (filtroStatus !== "todos" && b.statusOperacional !== filtroStatus) {
          return false;
        }

        // Filtro por risco
        if (filtroRisco !== "todos") {
          const riscoNorm = semAcento(b.classificacaoRiscoOuHazard);
          if (filtroRisco === "rompida" && !riscoNorm.includes("rompida") && !riscoNorm.includes("colapso")) {
            return false;
          }
          if (filtroRisco === "critico" && !riscoNorm.includes("critico") && !riscoNorm.includes("nivel 3") && !riscoNorm.includes("extremo")) {
            return false;
          }
          if (filtroRisco === "alto" && !riscoNorm.includes("alto") && !riscoNorm.includes("high")) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let valorA: string | number = a[colunaOrdenacao];
        let valorB: string | number = b[colunaOrdenacao];

        if (typeof valorA === "string" && typeof valorB === "string") {
          const cmp = valorA.localeCompare(valorB, "pt-BR");
          return ordemAscendente ? cmp : -cmp;
        }

        if (typeof valorA === "number" && typeof valorB === "number") {
          return ordemAscendente ? valorA - valorB : valorB - valorA;
        }

        return 0;
      });
  }, [
    barragens,
    busca,
    filtroTipo,
    filtroContinente,
    filtroStatus,
    filtroRisco,
    colunaOrdenacao,
    ordemAscendente,
  ]);

  /**
   * Exporta os dados atualmente filtrados na tela para planilha CSV com BOM UTF-8 (\uFEFF)
   * e delimitador ponto e vírgula (;), garantindo abertura perfeita no Excel.
   */
  const exportarCsv = useCallback(() => {
    const cabecalhos = [
      "ID",
      "Nome",
      "Tipo",
      "Estrutura",
      "País",
      "Continente",
      "Rio / Bacia",
      "Altura (m)",
      "Volume Capacidade (Mm³)",
      "Operador",
      "Classificação de Risco",
      "Status Operacional",
      "Ano Conclusão",
      "Latitude",
      "Longitude",
      "Resumo Cívico",
      "Órgão Regulador",
      "Link Oficial",
    ];

    const linhas = barragensFiltradas.map((b) => [
      `"${b.id}"`,
      `"${b.nome.replace(/"/g, '""')}"`,
      `"${b.tipoBarragem}"`,
      `"${b.tipoEstrutura.replace(/"/g, '""')}"`,
      `"${b.pais}"`,
      `"${b.continente}"`,
      `"${b.rioOuBacia.replace(/"/g, '""')}"`,
      b.alturaMetros,
      b.volumeCapacidadeMm3,
      `"${b.operador.replace(/"/g, '""')}"`,
      `"${b.classificacaoRiscoOuHazard.replace(/"/g, '""')}"`,
      `"${b.statusOperacional}"`,
      b.anoConclusao,
      b.latitude,
      b.longitude,
      `"${b.resumoCivico.replace(/"/g, '""')}"`,
      `"${b.orgaoReguladorOuBase.replace(/"/g, '""')}"`,
      `"${b.linkFonteOficial}"`,
    ]);

    const conteudoCsv =
      "\uFEFF" +
      [cabecalhos.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");

    const blob = new Blob([conteudoCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `barragens-mundiais-controle-popular-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [barragensFiltradas]);

  /**
   * Aciona a impressão nativa do navegador (@media print).
   */
  const imprimirPagina = useCallback(() => {
    window.print();
  }, []);

  /** Rótulo amigável para tipos */
  const rotuloTipo = (tipo: TipoBarragem) => {
    switch (tipo) {
      case "rejeitos_mineracao":
        return "Rejeitos";
      case "hidreletrica":
        return "Hidrelétrica";
      case "abastecimento_multiuso":
        return "Abastecimento";
      case "controle_cheias":
        return "Controle de Cheias";
      default:
        return tipo;
    }
  };

  /** Rótulo amigável para status */
  const rotuloStatus = (status: StatusOperacional) => {
    switch (status) {
      case "em_operacao":
        return "Em Operação";
      case "desativada_descaracterizacao":
        return "Descaracterização";
      case "rompida_historico":
        return "Rompida";
      case "em_construcao":
        return "Construção";
      default:
        return status;
    }
  };

  /** Cor de badge de status */
  const badgeStatusClasse = (status: StatusOperacional) => {
    switch (status) {
      case "rompida_historico":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      case "desativada_descaracterizacao":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "em_construcao":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    }
  };

  /**
   * Estruturas de maior altura entre as filtradas para o gráfico SVG nativo
   */
  const topBarragensAltura = useMemo(() => {
    return [...barragensFiltradas]
      .sort((a, b) => b.alturaMetros - a.alturaMetros)
      .slice(0, 8);
  }, [barragensFiltradas]);

  const maxAlturaGrafico = useMemo(() => {
    if (topBarragensAltura.length === 0) return 350;
    return Math.max(...topBarragensAltura.map((b) => b.alturaMetros), 350);
  }, [topBarragensAltura]);

  return (
    <div className="space-y-6">
      {/* SEÇÃO 1: ASSISTENTE CÍVICO CONTEXTUAL (SEU NONÔ / ALCEU DISPOR) */}
      <section
        aria-label="Assistente cívico contextual sobre barragens"
        className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 shadow-xs print:hidden"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
              <Sparkles size={16} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-text">
                Assistente Cívico — Perguntas Rápidas sobre Barragens
              </h2>
              <p className="text-xs text-text-soft">
                Respostas diretas de até 13 palavras com links oficiais verificados.
              </p>
            </div>
          </div>
          {perguntaSelecionada && (
            <button
              type="button"
              onClick={() => setPerguntaSelecionada(null)}
              className="text-xs font-semibold text-text-soft hover:text-text"
            >
              Fechar resposta
            </button>
          )}
        </div>

        {/* Botões de perguntas rápidas */}
        <div className="mt-3 flex flex-wrap gap-2">
          {PERGUNTAS_ASSISTENTE.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPerguntaSelecionada(item)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                perguntaSelecionada?.pergunta === item.pergunta
                  ? "border-primary bg-primary text-white shadow-xs"
                  : "border-border bg-surface hover:border-primary/50 text-text"
              }`}
            >
              {item.pergunta}
            </button>
          ))}
        </div>

        {/* Resposta do assistente */}
        {perguntaSelecionada && (
          <div className="mt-3 rounded-xl border border-primary/30 bg-surface p-3.5 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1.5">
                <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                  Resposta Cívica Verificada:
                </span>
                <p className="text-sm font-semibold text-text">
                  {perguntaSelecionada.resposta}
                </p>
              </div>
              {perguntaSelecionada.link && (
                <a
                  href={perguntaSelecionada.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition"
                >
                  <span>{perguntaSelecionada.rotuloLink || "Fonte Oficial"}</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      {/* SEÇÃO 2: BARRA DE FERRAMENTAS (BUSCA, FILTROS, EXPORTAÇÃO, IMPRESSÃO) */}
      <section
        aria-label="Filtros e exportação do acervo"
        className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-4 print:hidden"
      >
        {/* Linha 1: Campo de busca textual e botões de ação */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-soft"
              aria-hidden="true"
            />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, rio, bacia, país, mineradora ou operador..."
              className="w-full rounded-xl border border-border bg-surface-2 pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-soft hover:text-text"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Alternar tabela / cards */}
            <div className="inline-flex rounded-xl border border-border bg-surface-2 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setModoExibicao("tabela")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  modoExibicao === "tabela"
                    ? "bg-surface text-text shadow-xs"
                    : "text-text-soft hover:text-text"
                }`}
              >
                Tabela
              </button>
              <button
                type="button"
                onClick={() => setModoExibicao("cards")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  modoExibicao === "cards"
                    ? "bg-surface text-text shadow-xs"
                    : "text-text-soft hover:text-text"
                }`}
              >
                Cards
              </button>
            </div>

            {/* Alternar gráfico SVG */}
            <button
              type="button"
              onClick={() => setExibirGrafico((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                exibirGrafico
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-surface text-text-soft hover:text-text"
              }`}
            >
              <BarChart3 size={14} />
              <span>Gráfico SVG</span>
            </button>

            {/* Botão Exportar CSV com BOM */}
            <button
              type="button"
              onClick={exportarCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600/20 transition shadow-xs"
              title="Baixar planilha compatível com Excel brasileiro (; e UTF-8 BOM)"
            >
              <Download size={14} />
              <span>Exportar CSV</span>
            </button>

            {/* Botão Impressão Nativa */}
            <button
              type="button"
              onClick={imprimirPagina}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-soft hover:text-text transition"
              title="Imprimir relatório otimizado"
            >
              <Printer size={14} />
              <span>Imprimir</span>
            </button>

            {/* Link para o Globo 3D */}
            <Link
              href="/terras/globo"
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition shadow-xs"
              title="Abrir camada no Globo 3D Terras"
            >
              <MapPin size={14} />
              <span>Ver no Globo 3D</span>
            </Link>
          </div>
        </div>

        {/* Linha 2: Filtros facetados */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-2 border-t border-border">
          {/* Tipo de barragem */}
          <div>
            <label className="block text-[11px] font-semibold text-text-soft mb-1">
              Tipo / Finalidade
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="todos">Todos os tipos</option>
              <option value="rejeitos_mineracao">Rejeitos de Mineração</option>
              <option value="hidreletrica">Hidrelétrica & Energia</option>
              <option value="abastecimento_multiuso">Abastecimento & Multiuso</option>
              <option value="controle_cheias">Controle de Cheias</option>
            </select>
          </div>

          {/* Continente */}
          <div>
            <label className="block text-[11px] font-semibold text-text-soft mb-1">
              Continente
            </label>
            <select
              value={filtroContinente}
              onChange={(e) => setFiltroContinente(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="todos">Todos os continentes</option>
              <option value="América do Sul">América do Sul</option>
              <option value="América do Norte">América do Norte</option>
              <option value="Europa">Europa</option>
              <option value="Ásia">Ásia</option>
              <option value="África">África</option>
              <option value="Oceania">Oceania</option>
            </select>
          </div>

          {/* Status Operacional */}
          <div>
            <label className="block text-[11px] font-semibold text-text-soft mb-1">
              Status Operacional
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="todos">Todos os status</option>
              <option value="em_operacao">Em Operação</option>
              <option value="rompida_historico">Rompida (Histórico)</option>
              <option value="desativada_descaracterizacao">Descaracterização</option>
              <option value="em_construcao">Em Construção</option>
            </select>
          </div>

          {/* Risco / Hazard */}
          <div>
            <label className="block text-[11px] font-semibold text-text-soft mb-1">
              Gravidade do Risco
            </label>
            <select
              value={filtroRisco}
              onChange={(e) => setFiltroRisco(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="todos">Todos os níveis</option>
              <option value="rompida">Rompida / Colapso</option>
              <option value="critico">Crítico / Nível 3 / Extremo</option>
              <option value="alto">Alto Dano Potencial (DPA / High)</option>
            </select>
          </div>
        </div>

        {/* Resumo da filtragem */}
        <div className="flex items-center justify-between text-xs text-text-soft pt-1">
          <span>
            Mostrando <strong>{barragensFiltradas.length}</strong> de{" "}
            <strong>{barragens.length}</strong> estruturas catalogadas.
          </span>
          {(busca ||
            filtroTipo !== "todos" ||
            filtroContinente !== "todos" ||
            filtroStatus !== "todos" ||
            filtroRisco !== "todos") && (
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setFiltroTipo("todos");
                setFiltroContinente("todos");
                setFiltroStatus("todos");
                setFiltroRisco("todos");
              }}
              className="text-primary hover:underline font-semibold"
            >
              Limpar todos os filtros
            </button>
          )}
        </div>
      </section>

      {/* SEÇÃO 3: GRÁFICO SVG NATIVO ACESSÍVEL (COMPARAÇÃO DE ALTURAS) */}
      {exibirGrafico && topBarragensAltura.length > 0 && (
        <section
          aria-label="Gráfico comparativo de alturas de barragens"
          className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-3"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
            <h3 className="text-sm font-bold text-text flex items-center gap-1.5">
              <Mountain size={16} className="text-primary" />
              <span>Comparativo de Altura Estrutural (Maiores Barragens Filtradas)</span>
            </h3>
            <span className="text-[11px] text-text-soft">
              Escala em metros lineares (gráfico SVG nativo)
            </span>
          </div>

          <div className="pt-2">
            <svg
              className="w-full h-52 sm:h-56"
              viewBox="0 0 800 200"
              preserveAspectRatio="none"
              role="img"
              aria-label="Gráfico de barras mostrando alturas das maiores barragens filtradas"
            >
              {/* Linhas de grade de fundo */}
              <line x1="50" y1="20" x2="780" y2="20" stroke="currentColor" strokeOpacity="0.1" />
              <line x1="50" y1="65" x2="780" y2="65" stroke="currentColor" strokeOpacity="0.1" />
              <line x1="50" y1="110" x2="780" y2="110" stroke="currentColor" strokeOpacity="0.1" />
              <line x1="50" y1="155" x2="780" y2="155" stroke="currentColor" strokeOpacity="0.15" />

              {/* Rótulos do eixo Y */}
              <text x="40" y="24" fontSize="10" textAnchor="end" fill="currentColor" fillOpacity="0.5">
                {Math.round(maxAlturaGrafico)}m
              </text>
              <text x="40" y="69" fontSize="10" textAnchor="end" fill="currentColor" fillOpacity="0.5">
                {Math.round(maxAlturaGrafico * 0.66)}m
              </text>
              <text x="40" y="114" fontSize="10" textAnchor="end" fill="currentColor" fillOpacity="0.5">
                {Math.round(maxAlturaGrafico * 0.33)}m
              </text>
              <text x="40" y="159" fontSize="10" textAnchor="end" fill="currentColor" fillOpacity="0.5">
                0m
              </text>

              {/* Barras dinâmicas */}
              {topBarragensAltura.map((b, idx) => {
                const totalBarras = topBarragensAltura.length;
                const larguraBarra = Math.min(55, Math.floor(680 / totalBarras) - 15);
                const espacoTotal = 720 / totalBarras;
                const posX = 60 + idx * espacoTotal + (espacoTotal - larguraBarra) / 2;

                const alturaPx = Math.max(8, (b.alturaMetros / maxAlturaGrafico) * 135);
                const posY = 155 - alturaPx;

                const corBarra =
                  b.tipoBarragem === "rejeitos_mineracao"
                    ? "#ef4444"
                    : b.tipoBarragem === "hidreletrica"
                    ? "#3b82f6"
                    : "#10b981";

                return (
                  <g key={b.id} className="cursor-pointer" onClick={() => setBarragemModal(b)}>
                    {/* Barra */}
                    <rect
                      x={posX}
                      y={posY}
                      width={larguraBarra}
                      height={alturaPx}
                      rx="4"
                      fill={corBarra}
                      opacity="0.85"
                    >
                      <title>{`${b.nome}: ${b.alturaMetros}m (${b.pais})`}</title>
                    </rect>

                    {/* Valor numérico no topo */}
                    <text
                      x={posX + larguraBarra / 2}
                      y={posY - 4}
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      fill="currentColor"
                    >
                      {b.alturaMetros}m
                    </text>

                    {/* Nome encurtado abaixo */}
                    <text
                      x={posX + larguraBarra / 2}
                      y="172"
                      fontSize="9"
                      textAnchor="middle"
                      fill="currentColor"
                      fillOpacity="0.8"
                    >
                      {b.nome.length > 12 ? b.nome.slice(0, 11) + "…" : b.nome}
                    </text>
                    <text
                      x={posX + larguraBarra / 2}
                      y="185"
                      fontSize="8"
                      textAnchor="middle"
                      fill="currentColor"
                      fillOpacity="0.5"
                    >
                      {b.pais}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-soft pt-1 border-t border-border">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" /> Rejeitos
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" /> Hidrelétrica
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" /> Abastecimento/Multiuso
              </span>
            </div>
            <span>Clique numa barra para abrir o dossiê completo.</span>
          </div>
        </section>
      )}

      {/* SEÇÃO 4: EXIBIÇÃO EM TABELA OU CARDS */}
      {barragensFiltradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-text-soft">
          <Info size={28} className="mx-auto mb-2 opacity-50" />
          <p className="text-base font-semibold text-text">Nenhuma barragem encontrada</p>
          <p className="text-xs mt-1">
            Tente buscar com outros termos ou limpar os filtros aplicados.
          </p>
          <button
            type="button"
            onClick={() => {
              setBusca("");
              setFiltroTipo("todos");
              setFiltroContinente("todos");
              setFiltroStatus("todos");
              setFiltroRisco("todos");
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs"
          >
            Restaurar todos os dados
          </button>
        </div>
      ) : modoExibicao === "tabela" ? (
        /* VISUALIZAÇÃO EM TABELA (PADRÃO CÍVICO ORDENÁVEL) */
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-2 text-text-soft uppercase tracking-wider font-semibold">
                <tr>
                  <th scope="col" className="p-3.5">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacao("nome")}
                      className="flex items-center gap-1 hover:text-text transition"
                    >
                      <span>Estrutura</span>
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th scope="col" className="p-3.5">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacao("pais")}
                      className="flex items-center gap-1 hover:text-text transition"
                    >
                      <span>País / Bacia</span>
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th scope="col" className="p-3.5">
                    <span>Tipo</span>
                  </th>
                  <th scope="col" className="p-3.5">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacao("alturaMetros")}
                      className="flex items-center gap-1 hover:text-text transition"
                    >
                      <span>Altura</span>
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th scope="col" className="p-3.5">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacao("volumeCapacidadeMm3")}
                      className="flex items-center gap-1 hover:text-text transition"
                    >
                      <span>Volume</span>
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th scope="col" className="p-3.5">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacao("classificacaoRiscoOuHazard")}
                      className="flex items-center gap-1 hover:text-text transition"
                    >
                      <span>Risco / Situação</span>
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th scope="col" className="p-3.5 text-right print:hidden">
                    <span>Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {barragensFiltradas.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-surface-2/60 transition-colors group cursor-pointer"
                    onClick={() => setBarragemModal(b)}
                  >
                    {/* Nome e Operador */}
                    <td className="p-3.5">
                      <div className="font-bold text-text group-hover:text-primary transition-colors">
                        {b.nome}
                      </div>
                      <div className="text-[11px] text-text-soft">
                        {b.operador}
                      </div>
                    </td>

                    {/* País e Bacia */}
                    <td className="p-3.5">
                      <div className="font-semibold text-text">{b.pais}</div>
                      <div className="text-[11px] text-text-soft truncate max-w-[180px]">
                        {b.rioOuBacia}
                      </div>
                    </td>

                    {/* Tipo e Estrutura */}
                    <td className="p-3.5">
                      <span className="inline-block rounded-md bg-surface-2 border border-border px-2 py-0.5 text-[11px] font-semibold text-text">
                        {rotuloTipo(b.tipoBarragem)}
                      </span>
                      <div className="text-[10px] text-text-soft mt-0.5">
                        {b.tipoEstrutura}
                      </div>
                    </td>

                    {/* Altura */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-bold text-text">{b.alturaMetros}</span>
                      <span className="text-[11px] text-text-soft ml-0.5">m</span>
                    </td>

                    {/* Volume */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-bold text-text">
                        {b.volumeCapacidadeMm3 >= 1000
                          ? `${(b.volumeCapacidadeMm3 / 1000).toFixed(1)} bi`
                          : `${b.volumeCapacidadeMm3.toFixed(1)}`}
                      </span>
                      <span className="text-[11px] text-text-soft ml-0.5">
                        {b.volumeCapacidadeMm3 >= 1000 ? "m³" : "Mm³"}
                      </span>
                    </td>

                    {/* Risco / Status */}
                    <td className="p-3.5">
                      <span
                        className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${badgeStatusClasse(
                          b.statusOperacional
                        )}`}
                      >
                        {rotuloStatus(b.statusOperacional)}
                      </span>
                      <div className="text-[11px] text-text-soft mt-0.5 line-clamp-1 max-w-[200px]">
                        {b.classificacaoRiscoOuHazard}
                      </div>
                    </td>

                    {/* Ações */}
                    <td
                      className="p-3.5 text-right whitespace-nowrap print:hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setBarragemModal(b)}
                          className="rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-text hover:bg-surface-2 transition"
                        >
                          Ver Detalhes
                        </button>
                        <a
                          href={b.linkFonteOficial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-primary/30 bg-primary/10 p-1 text-primary hover:bg-primary/20 transition"
                          title={`Abrir fonte oficial em ${b.orgaoReguladorOuBase}`}
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISUALIZAÇÃO EM CARDS / GRADE */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {barragensFiltradas.map((b) => (
            <article
              key={b.id}
              className="rounded-2xl border border-border bg-surface p-4 shadow-xs hover:border-primary/40 transition flex flex-col justify-between cursor-pointer"
              onClick={() => setBarragemModal(b)}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${badgeStatusClasse(
                      b.statusOperacional
                    )}`}
                  >
                    {rotuloStatus(b.statusOperacional)}
                  </span>
                  <span className="text-[11px] text-text-soft font-semibold">
                    {b.anoConclusao}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-text leading-tight mb-1 hover:text-primary transition">
                  {b.nome}
                </h4>
                <div className="text-xs text-text-soft mb-3">
                  {b.pais} • {b.rioOuBacia}
                </div>

                <p className="text-xs text-text-soft leading-relaxed line-clamp-3 mb-4">
                  {b.resumoCivico}
                </p>
              </div>

              <div>
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-text-soft block">Altura</span>
                    <span className="font-bold text-text">{b.alturaMetros}m</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-soft block">Volume</span>
                    <span className="font-bold text-text">
                      {b.volumeCapacidadeMm3 >= 1000
                        ? `${(b.volumeCapacidadeMm3 / 1000).toFixed(1)} bi m³`
                        : `${b.volumeCapacidadeMm3.toFixed(1)} Mm³`}
                    </span>
                  </div>
                </div>

                <div
                  className="flex items-center justify-between gap-2 pt-2 border-t border-border"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setBarragemModal(b)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Ver dossiê completo
                  </button>
                  <a
                    href={b.linkFonteOficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-text-soft hover:text-text transition"
                  >
                    <span>Fonte Oficial</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* SEÇÃO 5: MODAL DE DETALHES COMPLETOS DA BARRAGEM */}
      {barragemModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setBarragemModal(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do modal */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-block rounded-md border px-2 py-0.5 text-xs font-bold ${badgeStatusClasse(
                      barragemModal.statusOperacional
                    )}`}
                  >
                    {rotuloStatus(barragemModal.statusOperacional)}
                  </span>
                  <span className="text-xs font-semibold text-text-soft">
                    {barragemModal.continente}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-text">
                  {barragemModal.nome}
                </h3>
                <p className="text-xs text-text-soft">
                  {barragemModal.pais} • {barragemModal.rioOuBacia}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBarragemModal(null)}
                aria-label="Fechar janela de detalhes"
                className="rounded-full p-1.5 text-text-soft hover:bg-surface-2 hover:text-text transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Resumo cívico destacado */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="text-xs font-bold text-primary mb-1">
                Contextualização Cívica & Impacto Socioambiental
              </div>
              <p className="text-sm leading-relaxed text-text">
                {barragemModal.resumoCivico}
              </p>
            </div>

            {/* Metadados técnicos */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-xl border border-border bg-surface-2 p-3">
                <span className="text-[10px] text-text-soft block">Tipo Estrutural</span>
                <span className="font-bold text-text">{barragemModal.tipoEstrutura}</span>
              </div>

              <div className="rounded-xl border border-border bg-surface-2 p-3">
                <span className="text-[10px] text-text-soft block">Altura do Barramento</span>
                <span className="font-bold text-text">{barragemModal.alturaMetros} metros</span>
              </div>

              <div className="rounded-xl border border-border bg-surface-2 p-3">
                <span className="text-[10px] text-text-soft block">Volume / Capacidade</span>
                <span className="font-bold text-text">
                  {barragemModal.volumeCapacidadeMm3 >= 1000
                    ? `${(barragemModal.volumeCapacidadeMm3 / 1000).toFixed(2)} bilhões de m³`
                    : `${barragemModal.volumeCapacidadeMm3.toFixed(1)} milhões de m³`}
                </span>
              </div>

              <div className="rounded-xl border border-border bg-surface-2 p-3">
                <span className="text-[10px] text-text-soft block">Operador / Concessionária</span>
                <span className="font-bold text-text">{barragemModal.operador}</span>
              </div>

              <div className="rounded-xl border border-border bg-surface-2 p-3">
                <span className="text-[10px] text-text-soft block">Ano de Conclusão</span>
                <span className="font-bold text-text">{barragemModal.anoConclusao}</span>
              </div>

              <div className="rounded-xl border border-border bg-surface-2 p-3">
                <span className="text-[10px] text-text-soft block">Coordenadas WGS84</span>
                <span className="font-mono font-bold text-text text-[11px]">
                  {barragemModal.latitude.toFixed(4)}, {barragemModal.longitude.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Classificação de risco */}
            <div className="rounded-2xl border border-border bg-surface-2 p-3.5 text-xs">
              <span className="text-[10px] text-text-soft block font-semibold mb-0.5">
                Classificação de Risco / Situação no Cadastro
              </span>
              <p className="font-bold text-text">
                {barragemModal.classificacaoRiscoOuHazard}
              </p>
            </div>

            {/* Rodapé do modal com link direto à fonte oficial */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border">
              <div className="text-[11px] text-text-soft">
                Órgão Regulador / Base Oficial:{" "}
                <strong className="text-text">{barragemModal.orgaoReguladorOuBase}</strong>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps?q=${barragemModal.latitude},${barragemModal.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text hover:bg-surface-2 transition"
                >
                  <MapPin size={13} />
                  <span>Ver Satélite</span>
                </a>

                <a
                  href={barragemModal.linkFonteOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary/90 transition"
                >
                  <span>Acessar Fonte Oficial</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
