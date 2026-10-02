"use client";

/**
 * @file apps/web/app/ambiental/crise-climatica/PainelCriseClimaticaClient.tsx
 * @description Componente cliente interativo do Acervo Global da Crise Climática.
 *
 * Papel no portal:
 * Implementa a navegação analítica, busca em tempo real tolerante a acentos,
 * filtros facetados por continente, setor e tipo de atividade, ordenação por todas
 * as colunas numéricas e nominais, gráficos SVG vetoriais acessíveis nativos,
 * painel de contexto cívico com o Seu Nonô e exportação em CSV com BOM UTF-8 (\uFEFF)
 * e layout de impressão vetorial nativo (@media print) segundo o Padrão das Seis Qualidades.
 *
 * Fontes oficiais:
 * - Climate TRACE (Emissões globais de GEE e inventário de ativos)
 * - IPCC AR6 WG3 (Mitigação das Mudanças Climáticas)
 * - Copernicus Climate Change Service / ECMWF (Reanálise ERA5)
 * - WMO / OMM (State of the Global Climate)
 * - UNFCCC NDC Registry (Metas do Acordo de Paris)
 * - Global Energy Monitor / GEM (Usinas e infraestrutura fóssil)
 * - SEEG / Observatório do Clima (Inventário nacional de emissões)
 */

import React, { useState, useMemo } from "react";
import {
  Search,
  Download,
  Printer,
  ExternalLink,
  Flame,
  Globe2,
  Factory,
  ThermometerSun,
  Target,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle,
} from "lucide-react";
import {
  obterEmissoesG20,
  obterInstalacoesPoluidoras,
  obterAnomaliasEventosExtremos,
  obterNdcsESetores,
  exportarCsvEmissoesG20,
  exportarCsvInstalacoes,
  exportarCsvAnomalias,
  exportarCsvNdcsSetores,
  type PaisEmissaoG20,
  type InstalacaoPoluidoraGlobal,
  type AnomaliaEventoExtremo,
  type NdcSetorGlobal,
} from "@/lib/clima/dados-crise-climatica";
import { formatNumberBR } from "@/lib/betim/format";
// Botão compartilhado que dispara o Seu Nonô via evento `abrir-seu-nono`;
// as perguntas abaixo eram texto estático sem ação.
import BotaoPerguntarNono from "@/app/components/BotaoPerguntarNono";

type AbaAtiva = "paises" | "instalacoes" | "anomalias" | "ndcs";

function normalizar(texto: string): string {
  return (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function dispararDownloadCsv(conteudo: string, nomeArquivo: string) {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", nomeArquivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function PainelCriseClimaticaClient() {
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>("paises");
  const [busca, setBusca] = useState("");

  // Filtros facetados
  const [filtroContinente, setFiltroContinente] = useState("todos");
  const [filtroCat, setFiltroCat] = useState("todos");
  const [filtroTipoAtividade, setFiltroTipoAtividade] = useState("todos");
  const [filtroCategoriaAnomalia, setFiltroCategoriaAnomalia] = useState("todos");

  // Ordenação
  const [ordemColuna, setOrdemColuna] = useState<string>("emissoesTotaisMtCo2e");
  const [ordemDirecao, setOrdemDirecao] = useState<"asc" | "desc">("desc");

  // Dados originais
  const paises = useMemo(() => obterEmissoesG20(), []);
  const instalacoes = useMemo(() => obterInstalacoesPoluidoras(), []);
  const anomalias = useMemo(() => obterAnomaliasEventosExtremos(), []);
  const ndcs = useMemo(() => obterNdcsESetores(), []);

  // Lista de continentes únicos para o filtro
  const continentes = useMemo(() => {
    return Array.from(new Set(paises.map((p) => p.continente))).sort();
  }, [paises]);

  // Lista de tipos de atividade para instalações
  const tiposAtividade = useMemo(() => {
    return Array.from(new Set(instalacoes.map((i) => i.tipoAtividade))).sort();
  }, [instalacoes]);

  // Categorias de anomalias
  const categoriasAnomalias = useMemo(() => {
    return Array.from(new Set(anomalias.map((a) => a.categoria))).sort();
  }, [anomalias]);

  // Alterna ordenação
  const toggleOrdenacao = (coluna: string) => {
    if (ordemColuna === coluna) {
      setOrdemDirecao((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrdemColuna(coluna);
      setOrdemDirecao("desc");
    }
  };

  // Ícone de ordenação
  const renderIconeOrdem = (coluna: string) => {
    if (ordemColuna !== coluna) {
      return <ArrowUpDown className="inline-block ml-1 h-3.5 w-3.5 text-muted/60" />;
    }
    return ordemDirecao === "asc" ? (
      <ArrowUp className="inline-block ml-1 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
    ) : (
      <ArrowDown className="inline-block ml-1 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
    );
  };

  // 1. Filtragem e Ordenação de Países
  const paisesFiltrados = useMemo(() => {
    const termo = normalizar(busca);
    const res = paises.filter((p) => {
      if (filtroContinente !== "todos" && p.continente !== filtroContinente) return false;
      if (filtroCat !== "todos" && p.classificacaoCat !== filtroCat) return false;
      if (!termo) return true;
      return (
        normalizar(p.pais).includes(termo) ||
        normalizar(p.codigoIso3).includes(termo) ||
        normalizar(p.setorLiderEmissao).includes(termo) ||
        normalizar(p.observacaoCivica).includes(termo)
      );
    });

    return [...res].sort((a, b) => {
      let vA = (a as unknown as Record<string, unknown>)[ordemColuna];
      let vB = (b as unknown as Record<string, unknown>)[ordemColuna];
      if (typeof vA === "number" && typeof vB === "number") {
        return ordemDirecao === "asc" ? vA - vB : vB - vA;
      }
      vA = String(vA ?? "");
      vB = String(vB ?? "");
      return ordemDirecao === "asc"
        ? (vA as string).localeCompare(vB as string, "pt-BR")
        : (vB as string).localeCompare(vA as string, "pt-BR");
    });
  }, [paises, busca, filtroContinente, filtroCat, ordemColuna, ordemDirecao]);

  // 2. Filtragem e Ordenação de Instalações
  const instalacoesFiltradas = useMemo(() => {
    const termo = normalizar(busca);
    const res = instalacoes.filter((i) => {
      if (filtroTipoAtividade !== "todos" && i.tipoAtividade !== filtroTipoAtividade) return false;
      if (!termo) return true;
      return (
        normalizar(i.nomeInstalacao).includes(termo) ||
        normalizar(i.operadorControlador).includes(termo) ||
        normalizar(i.pais).includes(termo) ||
        normalizar(i.cidadeEstado).includes(termo) ||
        normalizar(i.combustivelPrincipal).includes(termo)
      );
    });

    return [...res].sort((a, b) => {
      let vA = (a as unknown as Record<string, unknown>)[ordemColuna];
      let vB = (b as unknown as Record<string, unknown>)[ordemColuna];
      if (typeof vA === "number" && typeof vB === "number") {
        return ordemDirecao === "asc" ? vA - vB : vB - vA;
      }
      vA = String(vA ?? "");
      vB = String(vB ?? "");
      return ordemDirecao === "asc"
        ? (vA as string).localeCompare(vB as string, "pt-BR")
        : (vB as string).localeCompare(vA as string, "pt-BR");
    });
  }, [instalacoes, busca, filtroTipoAtividade, ordemColuna, ordemDirecao]);

  // 3. Filtragem e Ordenação de Anomalias
  const anomaliasFiltradas = useMemo(() => {
    const termo = normalizar(busca);
    const res = anomalias.filter((a) => {
      if (filtroCategoriaAnomalia !== "todos" && a.categoria !== filtroCategoriaAnomalia) return false;
      if (!termo) return true;
      return (
        normalizar(a.tituloEvento).includes(termo) ||
        normalizar(a.regiaoAfetada).includes(termo) ||
        normalizar(a.paisesAbrangidos).includes(termo) ||
        normalizar(a.sumarioCientifico).includes(termo)
      );
    });

    return [...res].sort((a, b) => {
      let vA = (a as unknown as Record<string, unknown>)[ordemColuna];
      let vB = (b as unknown as Record<string, unknown>)[ordemColuna];
      if (typeof vA === "number" && typeof vB === "number") {
        return ordemDirecao === "asc" ? vA - vB : vB - vA;
      }
      vA = String(vA ?? "");
      vB = String(vB ?? "");
      return ordemDirecao === "asc"
        ? (vA as string).localeCompare(vB as string, "pt-BR")
        : (vB as string).localeCompare(vA as string, "pt-BR");
    });
  }, [anomalias, busca, filtroCategoriaAnomalia, ordemColuna, ordemDirecao]);

  // 4. Filtragem e Ordenação de NDCs e Setores
  const ndcsFiltrados = useMemo(() => {
    const termo = normalizar(busca);
    const res = ndcs.filter((s) => {
      if (!termo) return true;
      return (
        normalizar(s.setorEconomico).includes(termo) ||
        normalizar(s.subsetor).includes(termo) ||
        normalizar(s.tecnologiaChaveTransicao).includes(termo) ||
        normalizar(s.desafioTransição).includes(termo)
      );
    });

    return [...res].sort((a, b) => {
      let vA = (a as unknown as Record<string, unknown>)[ordemColuna];
      let vB = (b as unknown as Record<string, unknown>)[ordemColuna];
      if (typeof vA === "number" && typeof vB === "number") {
        return ordemDirecao === "asc" ? vA - vB : vB - vA;
      }
      vA = String(vA ?? "");
      vB = String(vB ?? "");
      return ordemDirecao === "asc"
        ? (vA as string).localeCompare(vB as string, "pt-BR")
        : (vB as string).localeCompare(vA as string, "pt-BR");
    });
  }, [ndcs, busca, ordemColuna, ordemDirecao]);

  // Exportador de CSV sob medida
  const handleBaixarCsv = () => {
    if (abaAtiva === "paises") {
      const csv = exportarCsvEmissoesG20(paisesFiltrados);
      dispararDownloadCsv(csv, "emissoes-g20-crise-climatica.csv");
    } else if (abaAtiva === "instalacoes") {
      const csv = exportarCsvInstalacoes(instalacoesFiltradas);
      dispararDownloadCsv(csv, "mega-instalacoes-poluidoras-globais.csv");
    } else if (abaAtiva === "anomalias") {
      const csv = exportarCsvAnomalias(anomaliasFiltradas);
      dispararDownloadCsv(csv, "anomalias-eventos-extremos-copernicus.csv");
    } else {
      const csv = exportarCsvNdcsSetores(ndcsFiltrados);
      dispararDownloadCsv(csv, "metas-ndcs-intensidade-setorial.csv");
    }
  };

  const handleLimparFiltros = () => {
    setBusca("");
    setFiltroContinente("todos");
    setFiltroCat("todos");
    setFiltroTipoAtividade("todos");
    setFiltroCategoriaAnomalia("todos");
  };

  return (
    <div className="space-y-8">
      {/* ═══ BARRA DE CONTROLE SUPERIOR (ABAS, BUSCA E EXPORTAÇÃO) ═══ */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-1 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between print:hidden">
        {/* NAVEGAÇÃO DE ABAS */}
        <div
          role="tablist"
          aria-label="Pilares da Crise Climática"
          className="flex flex-wrap gap-1.5"
        >
          <button
            role="tab"
            aria-selected={abaAtiva === "paises"}
            onClick={() => {
              setAbaAtiva("paises");
              setOrdemColuna("emissoesTotaisMtCo2e");
              setOrdemDirecao("desc");
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              abaAtiva === "paises"
                ? "bg-foreground text-background shadow"
                : "bg-surface-2 text-muted hover:bg-surface-3 hover:text-foreground"
            }`}
          >
            <Globe2 className="h-4 w-4" />
            <span>Países do G20 ({paises.length})</span>
          </button>

          <button
            role="tab"
            aria-selected={abaAtiva === "instalacoes"}
            onClick={() => {
              setAbaAtiva("instalacoes");
              setOrdemColuna("emissoesAnuaisMtCo2e");
              setOrdemDirecao("desc");
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              abaAtiva === "instalacoes"
                ? "bg-foreground text-background shadow"
                : "bg-surface-2 text-muted hover:bg-surface-3 hover:text-foreground"
            }`}
          >
            <Factory className="h-4 w-4" />
            <span>Mega-Instalações Poluidoras ({instalacoes.length})</span>
          </button>

          <button
            role="tab"
            aria-selected={abaAtiva === "anomalias"}
            onClick={() => {
              setAbaAtiva("anomalias");
              setOrdemColuna("danosEconomicosUsdBilhoes");
              setOrdemDirecao("desc");
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              abaAtiva === "anomalias"
                ? "bg-foreground text-background shadow"
                : "bg-surface-2 text-muted hover:bg-surface-3 hover:text-foreground"
            }`}
          >
            <ThermometerSun className="h-4 w-4" />
            <span>Anomalias & Extremos ({anomalias.length})</span>
          </button>

          <button
            role="tab"
            aria-selected={abaAtiva === "ndcs"}
            onClick={() => {
              setAbaAtiva("ndcs");
              setOrdemColuna("emissaoGlobalAnualGtCo2e");
              setOrdemDirecao("desc");
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              abaAtiva === "ndcs"
                ? "bg-foreground text-background shadow"
                : "bg-surface-2 text-muted hover:bg-surface-3 hover:text-foreground"
            }`}
          >
            <Target className="h-4 w-4" />
            <span>Metas NDCs & Setores ({ndcs.length})</span>
          </button>
        </div>

        {/* BOTÕES DE EXPORTAÇÃO E IMPRESSÃO (REGRA DAS SEIS QUALIDADES - ITEM 6) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleBaixarCsv}
            title="Baixar planilha compatível com Excel brasileiro (BOM UTF-8 e ;)"
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-3 active:scale-95"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Baixar CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            title="Imprimir relatório analítico em formato limpo"
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-3 active:scale-95"
          >
            <Printer className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* ═══ FILTROS E BUSCA TEMPO REAL (ITEM 2) ═══ */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-1 p-4 print:hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* CAMPO DE BUSCA TEXTUAL */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por país, empresa, combustível, evento, cidade ou tecnologia..."
              className="w-full rounded-xl border border-border bg-surface-2 pl-10 pr-9 py-2 text-sm text-foreground placeholder:text-muted focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                title="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* FACETAS ESPECÍFICAS POR ABA */}
          <div className="flex flex-wrap items-center gap-2">
            {abaAtiva === "paises" && (
              <>
                <select
                  value={filtroContinente}
                  onChange={(e) => setFiltroContinente(e.target.value)}
                  className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-foreground focus:outline-none"
                  aria-label="Filtrar por continente"
                >
                  <option value="todos">Todos os Continentes</option>
                  {continentes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={filtroCat}
                  onChange={(e) => setFiltroCat(e.target.value)}
                  className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-foreground focus:outline-none"
                  aria-label="Filtrar por avaliação CAT"
                >
                  <option value="todos">Toda Ambição CAT</option>
                  <option value="Compatível 1.5°C">Compatível 1.5°C</option>
                  <option value="Quase Suficiente">Quase Suficiente</option>
                  <option value="Insuficiente">Insuficiente</option>
                  <option value="Altamente Insuficiente">Altamente Insuficiente</option>
                  <option value="Criticamente Insuficiente">Criticamente Insuficiente</option>
                </select>
              </>
            )}

            {abaAtiva === "instalacoes" && (
              <select
                value={filtroTipoAtividade}
                onChange={(e) => setFiltroTipoAtividade(e.target.value)}
                className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-foreground focus:outline-none"
                aria-label="Filtrar por tipo de atividade"
              >
                <option value="todos">Todas as Atividades Industriais</option>
                {tiposAtividade.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}

            {abaAtiva === "anomalias" && (
              <select
                value={filtroCategoriaAnomalia}
                onChange={(e) => setFiltroCategoriaAnomalia(e.target.value)}
                className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-foreground focus:outline-none"
                aria-label="Filtrar por categoria de evento"
              >
                <option value="todos">Todas as Categorias Climáticas</option>
                {categoriasAnomalias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            {(busca ||
              filtroContinente !== "todos" ||
              filtroCat !== "todos" ||
              filtroTipoAtividade !== "todos" ||
              filtroCategoriaAnomalia !== "todos") && (
              <button
                onClick={handleLimparFiltros}
                className="rounded-xl border border-dashed border-border px-3 py-2 text-xs font-medium text-muted hover:text-foreground"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* CONTADOR DE REGISTROS NA TELA */}
        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            {abaAtiva === "paises" &&
              `Exibindo ${paisesFiltrados.length} de ${paises.length} países e blocos do G20.`}
            {abaAtiva === "instalacoes" &&
              `Exibindo ${instalacoesFiltradas.length} de ${instalacoes.length} mega-instalações industriais.`}
            {abaAtiva === "anomalias" &&
              `Exibindo ${anomaliasFiltradas.length} de ${anomalias.length} anomalias e desastres globais.`}
            {abaAtiva === "ndcs" &&
              `Exibindo ${ndcsFiltrados.length} de ${ndcs.length} setores e trajetórias de descarbonização.`}
          </span>
          <span className="italic">
            Ordenado por: <strong>{ordemColuna}</strong> ({ordemDirecao === "asc" ? "crescente" : "decrescente"})
          </span>
        </div>
      </div>

      {/* ═══ GRÁFICO VETORIAL NATIVO ACESSÍVEL (ITEM 6) ═══ */}
      <section
        aria-label="Gráfico de comparação analítica visual"
        className="rounded-2xl border border-border bg-surface-1 p-5 shadow-sm print:border-none print:shadow-none"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              {abaAtiva === "paises" && "Distribuição de Emissões entre as Maiores Potências (Mt CO₂e/ano)"}
              {abaAtiva === "instalacoes" && "Volume de Emissão das Instalações Pontuais vs Equivalente em Carros"}
              {abaAtiva === "anomalias" && "Estimativa de Prejuízos Econômicos por Evento Extremo (Bilhões USD)"}
              {abaAtiva === "ndcs" && "Participação nas Emissões Mundiais por Setor Econômico (%)"}
            </h3>
            <p className="text-xs text-muted">
              Gráfico vetorial de alta legibilidade com contraste auditado (OKLCH).
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Dados 2024–2026
          </span>
        </div>

        {/* SVG NATIVO RESPONSIVO */}
        {abaAtiva === "paises" && (
          <div className="space-y-2.5">
            {paisesFiltrados.slice(0, 7).map((p) => {
              const maxEmissao = paises[0]?.emissoesTotaisMtCo2e || 14320;
              const larguraPct = Math.max(4, Math.round((p.emissoesTotaisMtCo2e / maxEmissao) * 100));
              const ehBrasil = p.codigoIso3 === "BRA";

              return (
                <div key={p.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <span>{p.bandeira}</span>
                      <span>{p.pais}</span>
                      {ehBrasil && (
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          Brasil (Foco Cívico)
                        </span>
                      )}
                    </span>
                    <span className="text-muted">
                      <strong>{formatNumberBR(p.emissoesTotaisMtCo2e)} Mt CO₂e</strong> ({p.participacaoGlobalPct}% global • {p.emissoesPerCapitaTCo2e} t/hab)
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-surface-3">
                    <div
                      style={{ width: `${larguraPct}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        ehBrasil
                          ? "bg-emerald-600 dark:bg-emerald-500"
                          : "bg-indigo-600 dark:bg-indigo-500"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {abaAtiva === "instalacoes" && (
          <div className="space-y-2.5">
            {instalacoesFiltradas.slice(0, 6).map((inst) => {
              const maxEmissao = instalacoes[0]?.emissoesAnuaisMtCo2e || 51.5;
              const larguraPct = Math.max(5, Math.round((inst.emissoesAnuaisMtCo2e / maxEmissao) * 100));

              return (
                <div key={inst.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground truncate max-w-md">
                      {inst.nomeInstalacao} ({inst.pais})
                    </span>
                    <span className="text-muted">
                      <strong>{inst.emissoesAnuaisMtCo2e} Mt CO₂e</strong> ≈ {inst.equivalenciaCarrosPasseioMilhoes}M carros
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-surface-3">
                    <div
                      style={{ width: `${larguraPct}%` }}
                      className="h-full rounded-full bg-rose-600 dark:bg-rose-500 transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {abaAtiva === "anomalias" && (
          <div className="space-y-2.5">
            {anomaliasFiltradas.slice(0, 6).map((a) => {
              const maxDano = 310.0;
              const larguraPct = Math.max(4, Math.round((a.danosEconomicosUsdBilhoes / maxDano) * 100));

              return (
                <div key={a.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground truncate max-w-md">
                      {a.tituloEvento}
                    </span>
                    <span className="text-muted">
                      <strong>USD {a.danosEconomicosUsdBilhoes} bi</strong> ({a.anomaliaOuMagnitude})
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-surface-3">
                    <div
                      style={{ width: `${larguraPct}%` }}
                      className="h-full rounded-full bg-amber-600 dark:bg-amber-500 transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {abaAtiva === "ndcs" && (
          <div className="space-y-2.5">
            {ndcsFiltrados.slice(0, 6).map((s) => {
              const maxPct = 28.2;
              const larguraPct = Math.max(4, Math.round((s.participacaoEmissoesGlobaisPct / maxPct) * 100));

              return (
                <div key={s.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground truncate max-w-md">
                      {s.setorEconomico}
                    </span>
                    <span className="text-muted">
                      <strong>{s.emissaoGlobalAnualGtCo2e} Gt CO₂e</strong> ({s.participacaoEmissoesGlobaisPct}% global • meta -{s.potencialReducaoPct}%)
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-surface-3">
                    <div
                      style={{ width: `${larguraPct}%` }}
                      className="h-full rounded-full bg-sky-600 dark:bg-sky-500 transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══ TABELAS DE DADOS AUDITÁVEIS (ORDENÁVEIS E LINKÁVEIS - ITENS 1 E 3) ═══ */}
      <section aria-label="Tabela detalhada de registros climáticos">
        {/* ABA 1: PAÍSES DO G20 */}
        {abaAtiva === "paises" && (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface-1 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-2 text-muted uppercase tracking-wider font-semibold">
                <tr>
                  <th
                    scope="col"
                    className="cursor-pointer px-4 py-3 hover:text-foreground"
                    onClick={() => toggleOrdenacao("pais")}
                  >
                    País {renderIconeOrdem("pais")}
                  </th>
                  <th
                    scope="col"
                    className="cursor-pointer px-4 py-3 hover:text-foreground text-right"
                    onClick={() => toggleOrdenacao("emissoesTotaisMtCo2e")}
                  >
                    Emissões Totais {renderIconeOrdem("emissoesTotaisMtCo2e")}
                  </th>
                  <th
                    scope="col"
                    className="cursor-pointer px-4 py-3 hover:text-foreground text-right"
                    onClick={() => toggleOrdenacao("emissoesPerCapitaTCo2e")}
                  >
                    Per Capita {renderIconeOrdem("emissoesPerCapitaTCo2e")}
                  </th>
                  <th
                    scope="col"
                    className="cursor-pointer px-4 py-3 hover:text-foreground text-right"
                    onClick={() => toggleOrdenacao("participacaoGlobalPct")}
                  >
                    % Global {renderIconeOrdem("participacaoGlobalPct")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Setor Líder & Perfil
                  </th>
                  <th
                    scope="col"
                    className="cursor-pointer px-4 py-3 hover:text-foreground"
                    onClick={() => toggleOrdenacao("classificacaoCat")}
                  >
                    Avaliação CAT {renderIconeOrdem("classificacaoCat")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Fonte Direta
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paisesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted">
                      Nenhum país encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  paisesFiltrados.map((p) => {
                    const ehBrasil = p.codigoIso3 === "BRA";
                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors hover:bg-surface-2/60 ${
                          ehBrasil ? "bg-emerald-50/50 dark:bg-emerald-950/20 font-medium" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{p.bandeira}</span>
                            <div>
                              <span className="font-semibold text-foreground">{p.pais}</span>
                              <span className="ml-1 text-[11px] text-muted">({p.codigoIso3})</span>
                              <div className="text-[11px] text-muted">{p.continente}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                          {formatNumberBR(p.emissoesTotaisMtCo2e)} Mt
                          <span className="block text-[11px] font-normal text-muted">
                            {p.variacaoDecenalPct > 0 ? `+${p.variacaoDecenalPct}%` : `${p.variacaoDecenalPct}%`} em 10a
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-muted">
                          {p.emissoesPerCapitaTCo2e} t/hab
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                          {p.participacaoGlobalPct}%
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="text-foreground line-clamp-1 font-medium">{p.setorLiderEmissao}</div>
                          <div className="text-[11px] text-muted line-clamp-1">{p.observacaoCivica}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              p.classificacaoCat === "Compatível 1.5°C"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                                : p.classificacaoCat === "Quase Suficiente"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300"
                                : p.classificacaoCat === "Insuficiente"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
                            }`}
                          >
                            {p.classificacaoCat}
                          </span>
                          <span className="block text-[10px] text-muted mt-0.5">
                            Net-Zero: {p.anoNetZero}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={p.urlFonteOficial}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-surface-3 hover:text-emerald-600 transition-colors"
                          >
                            <span>Fonte</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ABA 2: MEGA-INSTALAÇÕES POLUIDORAS */}
        {abaAtiva === "instalacoes" && (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface-1 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-2 text-muted uppercase tracking-wider font-semibold">
                <tr>
                  <th
                    scope="col"
                    className="cursor-pointer px-4 py-3 hover:text-foreground"
                    onClick={() => toggleOrdenacao("nomeInstalacao")}
                  >
                    Instalação & Operador {renderIconeOrdem("nomeInstalacao")}
                  </th>
                  <th
                    scope="col"
                    className="cursor-pointer px-4 py-3 hover:text-foreground"
                    onClick={() => toggleOrdenacao("pais")}
                  >
                    País / Local {renderIconeOrdem("pais")}
                  </th>
                  <th
                    scope="col"
                    className="cursor-pointer px-4 py-3 hover:text-foreground"
                    onClick={() => toggleOrdenacao("tipoAtividade")}
                  >
                    Atividade {renderIconeOrdem("tipoAtividade")}
                  </th>
                  <th
                    scope="col"
                    className="cursor-pointer px-4 py-3 hover:text-foreground text-right"
                    onClick={() => toggleOrdenacao("emissoesAnuaisMtCo2e")}
                  >
                    Emissões Anuais {renderIconeOrdem("emissoesAnuaisMtCo2e")}
                  </th>
                  <th
                    scope="col"
                    className="cursor-pointer px-4 py-3 hover:text-foreground text-right"
                    onClick={() => toggleOrdenacao("equivalenciaCarrosPasseioMilhoes")}
                  >
                    Equiv. Carros {renderIconeOrdem("equivalenciaCarrosPasseioMilhoes")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Combustível & Impacto
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Fonte Direta
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {instalacoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted">
                      Nenhuma instalação encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  instalacoesFiltradas.map((inst) => (
                    <tr key={inst.id} className="transition-colors hover:bg-surface-2/60">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{inst.nomeInstalacao}</div>
                        <div className="text-[11px] text-muted">{inst.operadorControlador}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-foreground font-medium">{inst.pais}</div>
                        <div className="text-[11px] text-muted">{inst.cidadeEstado}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded bg-surface-3 px-2 py-0.5 text-[11px] font-medium text-foreground">
                          {inst.tipoAtividade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        {inst.emissoesAnuaisMtCo2e} Mt CO₂e
                        <span className="block text-[10px] font-normal text-muted">ano base {inst.anoReferencia}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground font-semibold">
                        {inst.equivalenciaCarrosPasseioMilhoes} milhões
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="text-foreground font-medium truncate">{inst.combustivelPrincipal}</div>
                        <div className="text-[11px] text-muted line-clamp-1">{inst.contextoImpacto}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={inst.urlFonteOficial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-surface-3 hover:text-emerald-600 transition-colors"
                        >
                          <span>Fonte</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ABA 3: ANOMALIAS & EVENTOS EXTREMOS */}
        {abaAtiva === "anomalias" && (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface-1 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-2 text-muted uppercase tracking-wider font-semibold">
                <tr>
                  <th
                    scope="col"
                    className="cursor-pointer px-4 py-3 hover:text-foreground"
                    onClick={() => toggleOrdenacao("tituloEvento")}
                  >
                    Evento & Categoria {renderIconeOrdem("tituloEvento")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Região & Abrangência
                  </th>
                  <th
                    scope="col"
                    className="cursor-pointer px-4 py-3 hover:text-foreground"
                    onClick={() => toggleOrdenacao("anoInicio")}
                  >
                    Período {renderIconeOrdem("anoInicio")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Magnitude / Anomalia
                  </th>
                  <th
                    scope="col"
                    className="cursor-pointer px-4 py-3 hover:text-foreground text-right"
                    onClick={() => toggleOrdenacao("danosEconomicosUsdBilhoes")}
                  >
                    Danos Estimados {renderIconeOrdem("danosEconomicosUsdBilhoes")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Monitoramento
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Boletim
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {anomaliasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted">
                      Nenhum evento climático encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  anomaliasFiltradas.map((a) => (
                    <tr key={a.id} className="transition-colors hover:bg-surface-2/60">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{a.tituloEvento}</div>
                        <span className="inline-block mt-0.5 rounded bg-surface-3 px-1.5 py-0.2 text-[10px] font-medium text-muted">
                          {a.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-foreground font-medium">{a.regiaoAfetada}</div>
                        <div className="text-[11px] text-muted">{a.paisesAbrangidos}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-foreground">
                        {a.anoInicio === a.anoFim ? a.anoInicio : `${a.anoInicio}–${a.anoFim}`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{a.anomaliaOuMagnitude}</div>
                        <div className="text-[11px] text-muted line-clamp-1">{a.populacaoOuAreaImpactada}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                        USD {a.danosEconomicosUsdBilhoes} bi
                      </td>
                      <td className="px-4 py-3 text-muted text-[11px] max-w-xs">
                        <div className="font-medium text-foreground">{a.orgaoMonitoramento}</div>
                        <div className="line-clamp-1">{a.sumarioCientifico}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={a.urlBoletimOficial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-surface-3 hover:text-emerald-600 transition-colors"
                        >
                          <span>Boletim</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ABA 4: METAS NDCS E INTENSIDADE SETORIAL */}
        {abaAtiva === "ndcs" && (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface-1 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-2 text-muted uppercase tracking-wider font-semibold">
                <tr>
                  <th
                    scope="col"
                    className="cursor-pointer px-4 py-3 hover:text-foreground"
                    onClick={() => toggleOrdenacao("setorEconomico")}
                  >
                    Setor & Atividade {renderIconeOrdem("setorEconomico")}
                  </th>
                  <th
                    scope="col"
                    className="cursor-pointer px-4 py-3 hover:text-foreground text-right"
                    onClick={() => toggleOrdenacao("emissaoGlobalAnualGtCo2e")}
                  >
                    Emissão Global {renderIconeOrdem("emissaoGlobalAnualGtCo2e")}
                  </th>
                  <th
                    scope="col"
                    className="cursor-pointer px-4 py-3 hover:text-foreground text-right"
                    onClick={() => toggleOrdenacao("participacaoEmissoesGlobaisPct")}
                  >
                    % Mundial {renderIconeOrdem("participacaoEmissoesGlobaisPct")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Intensidade Fóssil vs Limpa
                  </th>
                  <th
                    scope="col"
                    className="cursor-pointer px-4 py-3 hover:text-foreground text-right"
                    onClick={() => toggleOrdenacao("potencialReducaoPct")}
                  >
                    Potencial Redução {renderIconeOrdem("potencialReducaoPct")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Tecnologia Chave & Desafio
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Roteiro IEA
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ndcsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted">
                      Nenhum setor encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  ndcsFiltrados.map((s) => (
                    <tr key={s.id} className="transition-colors hover:bg-surface-2/60">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{s.setorEconomico}</div>
                        <div className="text-[11px] text-muted">{s.subsetor}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-sky-600 dark:text-sky-400">
                        {s.emissaoGlobalAnualGtCo2e} Gt CO₂e
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                        {s.participacaoEmissoesGlobaisPct}%
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-foreground">
                          {s.valorIntensidadeFossil} → <strong className="text-emerald-600 dark:text-emerald-400">{s.valorIntensidadeLimpa}</strong>
                        </div>
                        <div className="text-[10px] text-muted">{s.intensidadeCarbonoUnidade}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        -{s.potencialReducaoPct}%
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="text-foreground font-medium truncate">{s.tecnologiaChaveTransicao}</div>
                        <div className="text-[11px] text-muted line-clamp-1">{s.desafioTransição}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={s.urlFonteOficial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-surface-3 hover:text-emerald-600 transition-colors"
                        >
                          <span>Roteiro</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ═══ ASSISTENTE CÍVICO CONTEXTUAL (SEU NONÔ - ITEM 5) ═══ */}
      <section
        aria-label="Assistente cívico sobre a crise climática"
        className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-foreground shadow-sm print:hidden"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-600 p-2.5 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-bold text-foreground">
                Pergunte ao Seu Nonô & Alceu Dispor: Como a Crise Climática afeta o Brasil?
              </h3>
              <span className="rounded-full bg-emerald-600/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                Assistente Cívico ONSA
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              O Controle Popular traduz números complexos em orações diretas para defesa da cidadania.
              Cada dado exibido aqui tem vínculo oficial direto com satélites, acordos internacionais e tribunais.
            </p>
            <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-surface-1 p-3">
                {/* Pergunta vira botão: abre o Seu Nonô já com a dúvida. */}
                <BotaoPerguntarNono
                  pergunta="O Brasil polui como a China?"
                  rotulo="1. O Brasil polui como a China?"
                  classeExtra="mb-1 w-full justify-start text-left"
                />
                <p className="text-[12px] text-muted leading-snug">
                  Não. O Brasil emite 6 vezes menos que a China. Quase metade vem do desmatamento.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface-1 p-3">
                <BotaoPerguntarNono
                  pergunta="A meta de 1,5°C ainda é viável?"
                  rotulo="2. A meta de 1,5°C ainda é viável?"
                  classeExtra="mb-1 w-full justify-start text-left"
                />
                <p className="text-[12px] text-muted leading-snug">
                  O ano de 2024 ultrapassou 1,64°C. Exige reduzir 43% das emissões mundiais até 2030.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface-1 p-3">
                <BotaoPerguntarNono
                  pergunta="Quem paga a conta dos extremos?"
                  rotulo="3. Quem paga a conta dos extremos?"
                  classeExtra="mb-1 w-full justify-start text-left"
                />
                <p className="text-[12px] text-muted leading-snug">
                  As populações periféricas e ribeirinhas sofrem mais com secas, enchentes e ondas térmicas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
