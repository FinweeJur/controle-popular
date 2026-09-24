"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Download,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  Users,
  Scale,
  FileText,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  X,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Layers,
  BarChart3,
  TrendingDown,
  Clock,
  Landmark,
} from "lucide-react";
import {
  obterTodosOrgaosCapacidade,
  obterMetricasGeraisCapacidade,
  type OrgaoCapacidade,
  type UnidadeOrganograma,
} from "@/lib/ambiental/capacidade-orgaos";
import { formatNumberBR } from "@/lib/betim/format";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";

type ColunaOrdenavel =
  | "sigla"
  | "esfera"
  | "efetivo2026"
  | "variacaoEfetivoPct"
  | "orcamentoRealPct"
  | "processosRepresados"
  | "sobrecargaProcessosPorAnalista"
  | "anosHiatoConcurso";

type DirecaoOrdem = "asc" | "desc";
type AbaGrafico = "perda-servidores" | "sobrecarga" | "ambos";
type FiltroEsfera = "todas" | "Estadual MG" | "Federal" | "Outros Estados";

export default function TabelaCapacidade() {
  const [todosOrgaos] = useState<OrgaoCapacidade[]>(() => obterTodosOrgaosCapacidade());
  const [metricasGerais] = useState(() => obterMetricasGeraisCapacidade());

  const [busca, setBusca] = useState("");
  const [esferaFiltro, setEsferaFiltro] = useState<FiltroEsfera>("todas");
  const [faixaFiltro, setFaixaFiltro] = useState<string>("todas");
  const [concursoFiltro, setConcursoFiltro] = useState<string>("todos");
  const [colunaOrdem, setColunaOrdem] = useState<ColunaOrdenavel>("sobrecargaProcessosPorAnalista");
  const [direcaoOrdem, setDirecaoOrdem] = useState<DirecaoOrdem>("desc");
  const [abaGrafico, setAbaGrafico] = useState<AbaGrafico>("ambos");
  const [orgaoSelecionado, setOrgaoSelecionado] = useState<OrgaoCapacidade | null>(null);
  const [abaGaveta, setAbaGaveta] = useState<"organograma" | "lideranca" | "concurso" | "contatos">("organograma");

  // Fechar gaveta com teclado ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && orgaoSelecionado) {
        setOrgaoSelecionado(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [orgaoSelecionado]);

  // Classificação de esfera compatível
  const classificarEsfera = useCallback((orgao: OrgaoCapacidade): "Estadual MG" | "Federal" | "Outros Estados" => {
    if (orgao.esfera === "Federal") return "Federal";
    if (orgao.uf === "MG") return "Estadual MG";
    return "Outros Estados";
  }, []);

  // Classificação de faixa de variação
  const classificarFaixa = useCallback((variacao: number): string => {
    if (variacao <= -30) return "Queda acentuada (> 30%)";
    if (variacao <= -10) return "Queda moderada (10% a 30%)";
    return "Estável (< 10%)";
  }, []);

  // Contagens para os filtros
  const contagensEsferas = useMemo(() => {
    return {
      todas: todosOrgaos.length,
      "Estadual MG": todosOrgaos.filter((o) => classificarEsfera(o) === "Estadual MG").length,
      Federal: todosOrgaos.filter((o) => classificarEsfera(o) === "Federal").length,
      "Outros Estados": todosOrgaos.filter((o) => classificarEsfera(o) === "Outros Estados").length,
    };
  }, [todosOrgaos, classificarEsfera]);

  const contagensFaixas = useMemo(() => {
    return {
      todas: todosOrgaos.length,
      "Queda acentuada (> 30%)": todosOrgaos.filter(
        (o) => classificarFaixa(o.variacaoPercentualEfetivo2016_2026) === "Queda acentuada (> 30%)"
      ).length,
      "Queda moderada (10% a 30%)": todosOrgaos.filter(
        (o) => classificarFaixa(o.variacaoPercentualEfetivo2016_2026) === "Queda moderada (10% a 30%)"
      ).length,
      "Estável (< 10%)": todosOrgaos.filter(
        (o) => classificarFaixa(o.variacaoPercentualEfetivo2016_2026) === "Estável (< 10%)"
      ).length,
    };
  }, [todosOrgaos, classificarFaixa]);

  // Filtragem combinada
  const orgaosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return todosOrgaos.filter((o) => {
      // Busca em texto
      if (termo) {
        const correspondeTexto =
          o.sigla.toLowerCase().includes(termo) ||
          o.nomeCompleto.toLowerCase().includes(termo) ||
          o.papelRegulatorio.toLowerCase().includes(termo) ||
          o.lideranca.nome.toLowerCase().includes(termo);
        if (!correspondeTexto) return false;
      }

      // Esfera
      if (esferaFiltro !== "todas") {
        if (classificarEsfera(o) !== esferaFiltro) return false;
      }

      // Faixa de variação
      if (faixaFiltro !== "todas") {
        if (classificarFaixa(o.variacaoPercentualEfetivo2016_2026) !== faixaFiltro) return false;
      }

      // Concurso
      if (concursoFiltro === "critico" && (o.ultimoConcurso?.hiatoAnosAnterior || 0) < 10) {
        return false;
      }
      if (concursoFiltro === "recente" && (o.ultimoConcurso?.hiatoAnosAnterior || 0) >= 10) {
        return false;
      }

      return true;
    });
  }, [todosOrgaos, busca, esferaFiltro, faixaFiltro, concursoFiltro, classificarEsfera, classificarFaixa]);

  // Ordenação por coluna (Regra 5)
  const orgaosOrdenados = useMemo(() => {
    return [...orgaosFiltrados].sort((a, b) => {
      let valA: string | number = 0;
      let valB: string | number = 0;

      const efA2026 = a.serieServidores.find((s) => s.ano === 2026)?.efetivos || 0;
      const efB2026 = b.serieServidores.find((s) => s.ano === 2026)?.efetivos || 0;

      switch (colunaOrdem) {
        case "sigla":
          valA = a.sigla;
          valB = b.sigla;
          break;
        case "esfera":
          valA = classificarEsfera(a);
          valB = classificarEsfera(b);
          break;
        case "efetivo2026":
          valA = efA2026;
          valB = efB2026;
          break;
        case "variacaoEfetivoPct":
          valA = a.variacaoPercentualEfetivo2016_2026;
          valB = b.variacaoPercentualEfetivo2016_2026;
          break;
        case "orcamentoRealPct":
          valA = a.variacaoRealOrcamento2016_2026;
          valB = b.variacaoRealOrcamento2016_2026;
          break;
        case "processosRepresados":
          valA = a.processosAtivosEstimados;
          valB = b.processosAtivosEstimados;
          break;
        case "sobrecargaProcessosPorAnalista":
          valA = a.indiceSobrecarga;
          valB = b.indiceSobrecarga;
          break;
        case "anosHiatoConcurso":
          valA = a.ultimoConcurso?.hiatoAnosAnterior || 0;
          valB = b.ultimoConcurso?.hiatoAnosAnterior || 0;
          break;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return direcaoOrdem === "asc"
          ? valA.localeCompare(valB, "pt-BR")
          : valB.localeCompare(valA, "pt-BR");
      }

      return direcaoOrdem === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
  }, [orgaosFiltrados, colunaOrdem, direcaoOrdem, classificarEsfera]);

  const alternarOrdem = (coluna: ColunaOrdenavel) => {
    if (colunaOrdem === coluna) {
      setDirecaoOrdem((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setColunaOrdem(coluna);
      setDirecaoOrdem(coluna === "sigla" || coluna === "esfera" ? "asc" : "desc");
    }
  };

  const limparFiltros = () => {
    setBusca("");
    setEsferaFiltro("todas");
    setFaixaFiltro("todas");
    setConcursoFiltro("todos");
  };

  const temFiltroAtivo =
    busca.trim() !== "" ||
    esferaFiltro !== "todas" ||
    faixaFiltro !== "todas" ||
    concursoFiltro !== "todos";

  // Exportação CSV (Regra 3 - Separador ; e BOM UTF-8)
  const handleBaixarCsv = useCallback(() => {
    const colunas: ColunaCsv<OrgaoCapacidade>[] = [
      { chave: "sigla", rotulo: "Sigla" },
      { chave: "nomeCompleto", rotulo: "Órgão Ambiental" },
      {
        chave: "esfera",
        rotulo: "Esfera",
        formatar: (_, o) => `${o.esfera} (${o.uf})`,
      },
      { chave: "papelRegulatorio", rotulo: "Papel Regulatório" },
      {
        chave: "sigla",
        rotulo: "Efetivo em 2016",
        formatar: (_, o) => o.serieServidores.find((s) => s.ano === 2016)?.efetivos || 0,
      },
      {
        chave: "sigla",
        rotulo: "Efetivo Atual (2026)",
        formatar: (_, o) => o.serieServidores.find((s) => s.ano === 2026)?.efetivos || 0,
      },
      {
        chave: "variacaoPercentualEfetivo2016_2026",
        rotulo: "Variação de Efetivo (%)",
        formatar: (v) => `${v}%`,
      },
      {
        chave: "variacaoRealOrcamento2016_2026",
        rotulo: "Variação Orçamento Real IPCA (%)",
        formatar: (v) => `${v}%`,
      },
      { chave: "processosAtivosEstimados", rotulo: "Processos Represados / Em Trâmite" },
      { chave: "analistasProcessamento", rotulo: "Analistas Técnicos Ativos" },
      {
        chave: "indiceSobrecarga",
        rotulo: "Sobrecarga (Processos / Analista)",
        formatar: (v) => Number(v).toFixed(1),
      },
      {
        chave: "sigla",
        rotulo: "Último Concurso (Ano)",
        formatar: (_, o) => o.ultimoConcurso?.ano || "Sem registro",
      },
      {
        chave: "sigla",
        rotulo: "Vagas do Concurso",
        formatar: (_, o) => o.ultimoConcurso?.vagas || 0,
      },
      {
        chave: "sigla",
        rotulo: "Hiato de Espera (Anos)",
        formatar: (_, o) => `${o.ultimoConcurso?.hiatoAnosAnterior || 0} anos`,
      },
      {
        chave: "sigla",
        rotulo: "Situação do Concurso",
        formatar: (_, o) => o.ultimoConcurso?.situacao || "—",
      },
      {
        chave: "sigla",
        rotulo: "Titular / Diretor Geral",
        formatar: (_, o) => `${o.lideranca.nome} (${o.lideranca.cargo})`,
      },
      {
        chave: "sigla",
        rotulo: "Telefone Institucional",
        formatar: (_, o) => o.contatos.telefones[0] || o.lideranca.telefone,
      },
      {
        chave: "sigla",
        rotulo: "Email Institucional",
        formatar: (_, o) => o.contatos.emailGeral || o.lideranca.email,
      },
      {
        chave: "sigla",
        rotulo: "Ouvidoria Oficial",
        formatar: (_, o) => o.contatos.ouvidoria?.canal || "Ouvidoria Geral",
      },
      {
        chave: "sigla",
        rotulo: "Portal da Transparência",
        formatar: (_, o) => o.linksOficiais.transparencia,
      },
      {
        chave: "sigla",
        rotulo: "Relatório de Gestão",
        formatar: (_, o) => o.linksOficiais.relatoriosGestao,
      },
    ];

    baixarCsv(colunas, orgaosOrdenados, "capacidade-institucional-orgaos-ambientais");
  }, [orgaosOrdenados]);

  // Cálculos dinâmicos dos cartões
  const totalOrgaosFiltrados = orgaosFiltrados.length;
  const mediaPerdaFiltrada =
    totalOrgaosFiltrados > 0
      ? Number(
          (
            orgaosFiltrados.reduce(
              (acc, o) => acc + o.variacaoPercentualEfetivo2016_2026,
              0
            ) / totalOrgaosFiltrados
          ).toFixed(1)
        )
      : 0;

  const volumeRepresadoFiltrado = orgaosFiltrados.reduce(
    (acc, o) => acc + o.processosAtivosEstimados,
    0
  );

  const maxSobrecargaFiltrada = orgaosFiltrados.reduce(
    (max, o) =>
      o.indiceSobrecarga > max.valor
        ? { orgao: o.sigla, valor: o.indiceSobrecarga }
        : max,
    { orgao: "—", valor: 0 }
  );

  return (
    <div className="w-full space-y-8">
      {/* ═══ 2. CARTÕES DE TOPO (AGENTS.md §8) ═══ */}
      <section aria-label="Indicadores Consolidados de Capacidade Institucional">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Órgãos */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs transition hover:border-border/80">
            <div className="flex items-center justify-between text-text-soft">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Órgãos Mapeados
              </span>
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 font-tabular text-3xl font-extrabold text-foreground">
              {totalOrgaosFiltrados}
              <span className="ml-1 text-sm font-normal text-muted">
                / {todosOrgaos.length} no painel
              </span>
            </p>
            <p className="mt-1 text-xs text-text-soft">
              Estadual MG, Outros Estados e Federal
            </p>
          </div>

          {/* Card 2: Perda Média (-31,4% / consolidada) */}
          <div className="rounded-2xl border border-alert/30 bg-surface p-5 shadow-xs transition hover:border-alert/50">
            <div className="flex items-center justify-between text-alert">
              <span className="text-xs font-semibold uppercase tracking-wider text-alert">
                Perda Média de Servidores
              </span>
              <TrendingDown className="h-4 w-4 text-alert" />
            </div>
            <p className="mt-2 font-tabular text-3xl font-extrabold text-alert">
              {mediaPerdaFiltrada > 0 ? `+${mediaPerdaFiltrada}%` : `${mediaPerdaFiltrada}%`}
            </p>
            <p className="mt-1 text-xs text-text-soft">
              Perda consolidada de -31,4% em 10 anos (2016–2026)
            </p>
          </div>

          {/* Card 3: Processos Represados */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs transition hover:border-border/80">
            <div className="flex items-center justify-between text-text-soft">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Processos Represados
              </span>
              <Scale className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 font-tabular text-3xl font-extrabold text-foreground">
              {formatNumberBR(volumeRepresadoFiltrado)}
            </p>
            <p className="mt-1 text-xs text-text-soft">
              Fila ativa em licenças, outorgas e CAR
            </p>
          </div>

          {/* Card 4: Maior Sobrecarga (Destaque IEF-MG e CAR) */}
          <div className="rounded-2xl border border-alert/40 bg-surface-2/60 p-5 shadow-xs transition hover:border-alert">
            <div className="flex items-center justify-between text-alert">
              <span className="text-xs font-semibold uppercase tracking-wider text-alert">
                Maior Sobrecarga
              </span>
              <AlertTriangle className="h-4 w-4 text-alert" />
            </div>
            <p className="mt-2 font-tabular text-2xl font-black text-alert">
              {maxSobrecargaFiltrada.orgao}: {formatNumberBR(Math.round(maxSobrecargaFiltrada.valor))}
              <span className="ml-1 text-xs font-medium text-text-soft">proc/analista</span>
            </p>
            <p className="mt-1 text-xs font-semibold text-alert">
              Destaque: IEF-MG e passivo crítico do CAR
            </p>
          </div>
        </div>

        {/* Alerta de Hiatos de Concurso Público */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-text-soft">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Alerta de Concursos Públicos:</strong> O <strong>IEPHA-MG</strong> está há{" "}
              <strong>13 anos sem concurso</strong>; o <strong>IEF-MG</strong> esperou{" "}
              <strong>15 anos (2008–2023)</strong> para abrir apenas 163 vagas frente a um
              déficit de centenas de analistas.
            </span>
          </div>
          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 font-semibold text-amber-700 dark:text-amber-300">
            Hiato médio de 11,8 anos
          </span>
        </div>
      </section>

      {/* ═══ 1. GRÁFICOS NATIVOS SVG INLINE (AGENTS.md §8) ═══ */}
      <section
        aria-label="Gráficos Comparativos de Perda de Servidores e Sobrecarga"
        className="rounded-3xl border border-border bg-surface p-5 sm:p-7 shadow-xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
                Painel Visual de Capacidade Analítica
              </h2>
            </div>
            <p className="mt-1 text-xs text-text-soft">
              Gráficos nativos em SVG inline sem bibliotecas externas (Regra 1).
            </p>
          </div>

          {/* Controle de abas de gráficos */}
          <div className="inline-flex rounded-xl border border-border bg-surface-2 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setAbaGrafico("ambos")}
              className={`rounded-lg px-3 py-1.5 transition ${
                abaGrafico === "ambos"
                  ? "bg-surface font-semibold text-primary shadow-2xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Ver Ambos
            </button>
            <button
              type="button"
              onClick={() => setAbaGrafico("perda-servidores")}
              className={`rounded-lg px-3 py-1.5 transition ${
                abaGrafico === "perda-servidores"
                  ? "bg-surface font-semibold text-primary shadow-2xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Perda (2016 vs 2026)
            </button>
            <button
              type="button"
              onClick={() => setAbaGrafico("sobrecarga")}
              className={`rounded-lg px-3 py-1.5 transition ${
                abaGrafico === "sobrecarga"
                  ? "bg-surface font-semibold text-primary shadow-2xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Sobrecarga por Analista
            </button>
          </div>
        </div>

        {/* Grid de Gráficos SVG */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico 1: Comparativo 2016 vs 2026 */}
          {(abaGrafico === "perda-servidores" || abaGrafico === "ambos") && (
            <figure
              className={`flex flex-col space-y-3 ${
                abaGrafico === "perda-servidores" ? "lg:col-span-2" : ""
              }`}
            >
              <figcaption className="space-y-1">
                <h3 className="text-sm font-bold text-foreground flex items-center justify-between">
                  <span>1. Comparativo de Efetivo: 2016 vs 2026</span>
                  <span className="text-xs font-normal text-muted">Servidores Efetivos</span>
                </h3>
                <p className="text-xs text-text-soft">
                  Barras azuis (2016) vs barras vermelhas/laranjas (2026) com taxa de encolhimento.
                </p>
              </figcaption>

              <div className="w-full overflow-x-auto rounded-2xl border border-border/70 bg-surface-2/30 p-4">
                <svg
                  role="img"
                  aria-label="Gráfico de barras comparando o efetivo de servidores entre 2016 e 2026"
                  className="w-full min-w-[500px]"
                  viewBox={`0 0 540 ${orgaosOrdenados.length * 36 + 45}`}
                >
                  <title>Perda de Servidores (2016 vs 2026)</title>
                  <desc>Comparativo do efetivo de servidores por órgão com percentual de variação.</desc>

                  {/* Linhas de grade e legenda */}
                  <line x1="115" y1="20" x2="480" y2="20" stroke="var(--cp-border, #e2e8f0)" strokeWidth="1" />
                  <line x1="115" y1="20" x2="115" y2={orgaosOrdenados.length * 36 + 25} stroke="var(--cp-border, #e2e8f0)" strokeWidth="1" />

                  <rect x="130" y="5" width="12" height="8" rx="2" fill="var(--cp-primary, #12467b)" />
                  <text x="146" y="12" fontSize="9" fill="var(--cp-text-soft, #4a5568)">2016 (Efetivo Anterior)</text>

                  <rect x="260" y="5" width="12" height="8" rx="2" fill="var(--cp-alert, #c0392b)" />
                  <text x="276" y="12" fontSize="9" fill="var(--cp-text-soft, #4a5568)">2026 (Efetivo Atual)</text>

                  {orgaosOrdenados.map((orgao, idx) => {
                    const y = 30 + idx * 36;
                    const ef2016 = orgao.serieServidores.find((s) => s.ano === 2016)?.efetivos || 0;
                    const ef2026 = orgao.serieServidores.find((s) => s.ano === 2026)?.efetivos || 0;
                    const maxVal = 3200;
                    const larguraMax = 330;
                    const w16 = Math.max(6, (ef2016 / maxVal) * larguraMax);
                    const w26 = Math.max(4, (ef2026 / maxVal) * larguraMax);
                    const isForte = orgao.variacaoPercentualEfetivo2016_2026 <= -30;

                    return (
                      <g key={orgao.sigla} className="transition-all hover:opacity-90">
                        <text
                          x="108"
                          y={y + 14}
                          textAnchor="end"
                          fontSize="9.5"
                          fontWeight="600"
                          fill="var(--cp-text, #0e1726)"
                        >
                          {orgao.sigla}
                        </text>

                        {/* Barra 2016 */}
                        <rect
                          x="115"
                          y={y}
                          width={w16}
                          height="9"
                          rx="2.5"
                          fill="var(--cp-primary, #12467b)"
                          opacity="0.85"
                        />
                        <text
                          x={120 + w16}
                          y={y + 8}
                          fontSize="8"
                          fill="var(--cp-text-soft, #4a5568)"
                        >
                          {formatNumberBR(ef2016)}
                        </text>

                        {/* Barra 2026 */}
                        <rect
                          x="115"
                          y={y + 12}
                          width={w26}
                          height="9"
                          rx="2.5"
                          fill={isForte ? "var(--cp-alert, #c0392b)" : "#f59e0b"}
                        />
                        <text
                          x={120 + w26}
                          y={y + 20}
                          fontSize="8"
                          fontWeight="700"
                          fill={isForte ? "var(--cp-alert, #c0392b)" : "#d97706"}
                        >
                          {formatNumberBR(ef2026)} ({orgao.variacaoPercentualEfetivo2016_2026}%)
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Tabela de acessibilidade oculta */}
              <div className="sr-only">
                <table>
                  <caption>Comparativo de Efetivo 2016 versus 2026</caption>
                  <thead>
                    <tr>
                      <th>Órgão</th>
                      <th>Efetivo 2016</th>
                      <th>Efetivo 2026</th>
                      <th>Variação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgaosOrdenados.map((o) => (
                      <tr key={o.sigla}>
                        <td>{o.sigla}</td>
                        <td>{o.serieServidores.find((s) => s.ano === 2016)?.efetivos}</td>
                        <td>{o.serieServidores.find((s) => s.ano === 2026)?.efetivos}</td>
                        <td>{o.variacaoPercentualEfetivo2016_2026}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </figure>
          )}

          {/* Gráfico 2: Sobrecarga de Processos por Analista */}
          {(abaGrafico === "sobrecarga" || abaGrafico === "ambos") && (
            <figure
              className={`flex flex-col space-y-3 ${
                abaGrafico === "sobrecarga" ? "lg:col-span-2" : ""
              }`}
            >
              <figcaption className="space-y-1">
                <h3 className="text-sm font-bold text-foreground flex items-center justify-between">
                  <span>2. Sobrecarga de Processos por Analista</span>
                  <span className="text-xs font-bold text-alert">Processos / Analista</span>
                </h3>
                <p className="text-xs text-text-soft">
                  Liderança de sobrecarga no IGAM-MG (506), SEMAS-PA (486) e passivo IEF-MG/CAR.
                </p>
              </figcaption>

              <div className="w-full overflow-x-auto rounded-2xl border border-border/70 bg-surface-2/30 p-4">
                <svg
                  role="img"
                  aria-label="Gráfico de barras mostrando os processos por analista em cada órgão"
                  className="w-full min-w-[500px]"
                  viewBox={`0 0 540 ${orgaosOrdenados.length * 36 + 45}`}
                >
                  <title>Sobrecarga por Analista</title>
                  <desc>Razão de processos represados por analista em exercício.</desc>

                  {/* Linha de corte de alerta (> 200) */}
                  <line x1="115" y1="20" x2="480" y2="20" stroke="var(--cp-border, #e2e8f0)" strokeWidth="1" />
                  <line x1="115" y1="20" x2="115" y2={orgaosOrdenados.length * 36 + 25} stroke="var(--cp-border, #e2e8f0)" strokeWidth="1" />

                  {/* Linha Crítica de 200 */}
                  <line
                    x1="240"
                    y1="15"
                    x2="240"
                    y2={orgaosOrdenados.length * 36 + 25}
                    stroke="var(--cp-alert, #c0392b)"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    opacity="0.6"
                  />
                  <text x="245" y="12" fontSize="8" fontWeight="600" fill="var(--cp-alert, #c0392b)">
                    Limite Crítico (200 proc/analista)
                  </text>

                  {orgaosOrdenados.map((orgao, idx) => {
                    const y = 30 + idx * 36;
                    const maxSobrecarga = 550;
                    const larguraMax = 320;
                    const w = Math.max(8, (orgao.indiceSobrecarga / maxSobrecarga) * larguraMax);
                    const isCritico = orgao.indiceSobrecarga > 200;

                    return (
                      <g key={orgao.sigla} className="transition-all hover:opacity-90">
                        <text
                          x="108"
                          y={y + 15}
                          textAnchor="end"
                          fontSize="9.5"
                          fontWeight="600"
                          fill="var(--cp-text, #0e1726)"
                        >
                          {orgao.sigla}
                        </text>

                        <rect
                          x="115"
                          y={y + 3}
                          width={w}
                          height="16"
                          rx="3.5"
                          fill={isCritico ? "var(--cp-alert, #c0392b)" : "var(--cp-accent, #0e8f6e)"}
                        />

                        <text
                          x={122 + w}
                          y={y + 15}
                          fontSize="9"
                          fontWeight="700"
                          fill={isCritico ? "var(--cp-alert, #c0392b)" : "var(--cp-text, #0e1726)"}
                        >
                          {Number(orgao.indiceSobrecarga).toFixed(1)} proc/analista
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Tabela de acessibilidade oculta */}
              <div className="sr-only">
                <table>
                  <caption>Sobrecarga de processos por analista técnico</caption>
                  <thead>
                    <tr>
                      <th>Órgão</th>
                      <th>Processos</th>
                      <th>Analistas</th>
                      <th>Sobrecarga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgaosOrdenados.map((o) => (
                      <tr key={o.sigla}>
                        <td>{o.sigla}</td>
                        <td>{o.processosAtivosEstimados}</td>
                        <td>{o.analistasProcessamento}</td>
                        <td>{o.indiceSobrecarga}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </figure>
          )}
        </div>
      </section>

      {/* ═══ 4. FILTROS COMBINÁVEIS (AGENTS.md §8) ═══ */}
      <section
        aria-label="Filtros e pesquisa da capacidade institucional"
        className="rounded-3xl border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <Filter className="h-4 w-4 text-primary" />
            <span>Filtros Combináveis &amp; Pesquisa</span>
          </div>

          <div className="flex items-center gap-2">
            {temFiltroAtivo && (
              <button
                type="button"
                onClick={limparFiltros}
                className="flex items-center gap-1 text-xs font-semibold text-alert hover:underline"
              >
                <X className="h-3.5 w-3.5" />
                Limpar Filtros
              </button>
            )}

            {/* Botão Baixar CSV (Regra 3) */}
            <button
              type="button"
              onClick={handleBaixarCsv}
              className="flex items-center gap-1.5 rounded-xl border border-primary bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-ink transition shadow-2xs"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar CSV Filtrado ({orgaosFiltrados.length})
            </button>
          </div>
        </div>

        {/* Linha de Filtros */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Busca Textual */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              type="search"
              placeholder="Buscar por sigla, órgão, líder..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          {/* Filtro por Esfera */}
          <div>
            <select
              aria-label="Filtrar por Esfera Governamental"
              value={esferaFiltro}
              onChange={(e) => setEsferaFiltro(e.target.value as FiltroEsfera)}
              className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="todas">Esfera: Todas ({contagensEsferas.todas})</option>
              <option value="Estadual MG">
                Estadual MG ({contagensEsferas["Estadual MG"]})
              </option>
              <option value="Federal">
                Federal ({contagensEsferas.Federal})
              </option>
              <option value="Outros Estados">
                Outros Estados ({contagensEsferas["Outros Estados"]})
              </option>
            </select>
          </div>

          {/* Filtro por Faixa de Variação de Efetivo */}
          <div>
            <select
              aria-label="Filtrar por Variação de Pessoal"
              value={faixaFiltro}
              onChange={(e) => setFaixaFiltro(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="todas">Variação: Todas as Faixas ({contagensFaixas.todas})</option>
              <option value="Queda acentuada (> 30%)">
                Queda acentuada &gt; 30% ({contagensFaixas["Queda acentuada (> 30%)"]})
              </option>
              <option value="Queda moderada (10% a 30%)">
                Queda moderada 10% a 30% ({contagensFaixas["Queda moderada (10% a 30%)"]})
              </option>
              <option value="Estável (< 10%)">
                Estável &lt; 10% ({contagensFaixas["Estável (< 10%)"]})
              </option>
            </select>
          </div>

          {/* Filtro por Situação de Concurso */}
          <div>
            <select
              aria-label="Filtrar por Situação de Concurso"
              value={concursoFiltro}
              onChange={(e) => setConcursoFiltro(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="todos">Concursos: Todos os Cenários</option>
              <option value="critico">Hiato Crítico (&gt; 10 anos sem edital)</option>
              <option value="recente">Com Certame nos últimos 10 anos</option>
            </select>
          </div>
        </div>

        {/* Resumo de Resultados */}
        <div className="flex items-center justify-between text-xs text-text-soft pt-1">
          <span>
            Exibindo <strong>{orgaosOrdenados.length}</strong> de{" "}
            <strong>{todosOrgaos.length}</strong> órgãos ambientais mapeados
          </span>
          <span className="italic text-muted">
            Clique na linha de qualquer órgão para ver o organograma com links, contatos e atribuições.
          </span>
        </div>
      </section>

      {/* ═══ 5. TABELA COM ORDENAÇÃO POR COLUNA (AGENTS.md §8) ═══ */}
      <section aria-label="Tabela de capacidade institucional dos órgãos">
        <div className="overflow-x-auto rounded-3xl border border-border bg-surface shadow-xs">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="border-b border-border bg-surface-2 text-muted">
              <tr>
                {/* Coluna Sigla */}
                <th scope="col" className="p-3.5 font-semibold text-foreground">
                  <button
                    type="button"
                    onClick={() => alternarOrdem("sigla")}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <span>Órgão</span>
                    {colunaOrdem === "sigla" ? (
                      direcaoOrdem === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </button>
                </th>

                {/* Coluna Esfera */}
                <th scope="col" className="p-3.5 font-semibold">
                  <button
                    type="button"
                    onClick={() => alternarOrdem("esfera")}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <span>Esfera</span>
                    {colunaOrdem === "esfera" ? (
                      direcaoOrdem === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </button>
                </th>

                {/* Coluna Efetivo 2026 */}
                <th scope="col" className="p-3.5 text-right font-semibold">
                  <button
                    type="button"
                    onClick={() => alternarOrdem("efetivo2026")}
                    className="ml-auto flex items-center gap-1 hover:text-primary"
                  >
                    <span>Efetivo (2026)</span>
                    {colunaOrdem === "efetivo2026" ? (
                      direcaoOrdem === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </button>
                </th>

                {/* Coluna Variação */}
                <th scope="col" className="p-3.5 text-right font-semibold">
                  <button
                    type="button"
                    onClick={() => alternarOrdem("variacaoEfetivoPct")}
                    className="ml-auto flex items-center gap-1 hover:text-primary"
                  >
                    <span>Variação (%)</span>
                    {colunaOrdem === "variacaoEfetivoPct" ? (
                      direcaoOrdem === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </button>
                </th>

                {/* Coluna Orçamento Real */}
                <th scope="col" className="p-3.5 text-right font-semibold">
                  <button
                    type="button"
                    onClick={() => alternarOrdem("orcamentoRealPct")}
                    className="ml-auto flex items-center gap-1 hover:text-primary"
                  >
                    <span>Orçamento Real</span>
                    {colunaOrdem === "orcamentoRealPct" ? (
                      direcaoOrdem === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </button>
                </th>

                {/* Coluna Processos Represados */}
                <th scope="col" className="p-3.5 text-right font-semibold">
                  <button
                    type="button"
                    onClick={() => alternarOrdem("processosRepresados")}
                    className="ml-auto flex items-center gap-1 hover:text-primary"
                  >
                    <span>Fila Represada</span>
                    {colunaOrdem === "processosRepresados" ? (
                      direcaoOrdem === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </button>
                </th>

                {/* Coluna Sobrecarga */}
                <th scope="col" className="p-3.5 text-right font-semibold">
                  <button
                    type="button"
                    onClick={() => alternarOrdem("sobrecargaProcessosPorAnalista")}
                    className="ml-auto flex items-center gap-1 hover:text-primary"
                  >
                    <span>Sobrecarga (Proc/Analista)</span>
                    {colunaOrdem === "sobrecargaProcessosPorAnalista" ? (
                      direcaoOrdem === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </button>
                </th>

                {/* Coluna Concurso */}
                <th scope="col" className="p-3.5 font-semibold">
                  <button
                    type="button"
                    onClick={() => alternarOrdem("anosHiatoConcurso")}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <span>Último Concurso</span>
                    {colunaOrdem === "anosHiatoConcurso" ? (
                      direcaoOrdem === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </button>
                </th>

                {/* Coluna Ações e Transparência */}
                <th scope="col" className="p-3.5 text-center font-semibold">
                  Organograma &amp; Links
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {orgaosOrdenados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-text-soft">
                    Nenhum órgão encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                orgaosOrdenados.map((orgao) => {
                  const ef16 = orgao.serieServidores.find((s) => s.ano === 2016)?.efetivos || 0;
                  const ef26 = orgao.serieServidores.find((s) => s.ano === 2026)?.efetivos || 0;
                  const isCritico = orgao.indiceSobrecarga > 200;
                  const isQuedaForte = orgao.variacaoPercentualEfetivo2016_2026 <= -30;
                  const esferaRotulo = classificarEsfera(orgao);

                  return (
                    <tr
                      key={orgao.sigla}
                      onClick={() => setOrgaoSelecionado(orgao)}
                      className="cursor-pointer transition hover:bg-surface-2/60"
                    >
                      {/* Sigla e Nome */}
                      <td className="p-3.5">
                        <div className="font-bold text-foreground hover:text-primary">
                          {orgao.sigla}
                        </div>
                        <div className="text-[11px] text-text-soft line-clamp-1 max-w-[200px]" title={orgao.nomeCompleto}>
                          {orgao.nomeCompleto}
                        </div>
                        <div className="text-[10px] text-muted line-clamp-1 max-w-[200px]" title={orgao.papelRegulatorio}>
                          {orgao.papelRegulatorio}
                        </div>
                      </td>

                      {/* Esfera */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            esferaRotulo === "Estadual MG"
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : esferaRotulo === "Federal"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                : "bg-surface-2 text-text-soft border border-border"
                          }`}
                        >
                          {esferaRotulo}
                        </span>
                      </td>

                      {/* Efetivo 2026 */}
                      <td className="p-3.5 text-right font-tabular whitespace-nowrap font-medium text-foreground">
                        {formatNumberBR(ef26)}
                        <span className="block text-[10px] text-muted">
                          (era {formatNumberBR(ef16)})
                        </span>
                      </td>

                      {/* Variação Efetivo (%) */}
                      <td className="p-3.5 text-right font-tabular whitespace-nowrap">
                        <span
                          className={`inline-block rounded-md px-1.5 py-0.5 font-bold ${
                            isQuedaForte
                              ? "bg-alert/10 text-alert border border-alert/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {orgao.variacaoPercentualEfetivo2016_2026 > 0
                            ? `+${orgao.variacaoPercentualEfetivo2016_2026}%`
                            : `${orgao.variacaoPercentualEfetivo2016_2026}%`}
                        </span>
                      </td>

                      {/* Orçamento Real (%) */}
                      <td className="p-3.5 text-right font-tabular whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            orgao.variacaoRealOrcamento2016_2026 < 0
                              ? "text-alert"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {orgao.variacaoRealOrcamento2016_2026 > 0
                            ? `+${orgao.variacaoRealOrcamento2016_2026}%`
                            : `${orgao.variacaoRealOrcamento2016_2026}%`}
                        </span>
                      </td>

                      {/* Processos Represados */}
                      <td className="p-3.5 text-right font-tabular whitespace-nowrap font-medium text-foreground">
                        {formatNumberBR(orgao.processosAtivosEstimados)}
                        <span className="block text-[10px] text-muted">
                          {orgao.analistasProcessamento} analistas
                        </span>
                      </td>

                      {/* Sobrecarga */}
                      <td className="p-3.5 text-right font-tabular whitespace-nowrap">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 font-bold ${
                            orgao.sigla === "IEF-MG" || orgao.sigla === "IGAM-MG"
                              ? "bg-alert text-primary-ink shadow-xs"
                              : isCritico
                                ? "bg-alert/15 text-alert border border-alert/30"
                                : "bg-surface-2 text-foreground"
                          }`}
                        >
                          {Number(orgao.indiceSobrecarga).toFixed(1)}
                        </span>
                      </td>

                      {/* Concurso Público */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-semibold text-foreground">
                          {orgao.ultimoConcurso?.ano} ({orgao.ultimoConcurso?.vagas} vagas)
                        </div>
                        <span
                          className={`text-[10px] ${
                            (orgao.ultimoConcurso?.hiatoAnosAnterior || 0) >= 12
                              ? "text-alert font-bold"
                              : "text-muted"
                          }`}
                        >
                          {orgao.ultimoConcurso?.hiatoAnosAnterior} anos sem edital
                        </span>
                      </td>

                      {/* Ações e Links */}
                      <td className="p-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setOrgaoSelecionado(orgao)}
                            className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-primary hover:border-primary hover:bg-primary/5 transition"
                            title="Ver organograma detalhado e atribuições"
                          >
                            Organograma
                          </button>
                          <a
                            href={orgao.linksOficiais.transparencia}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md text-muted hover:text-primary transition"
                            title="Abrir Portal da Transparência Oficial do Órgão"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ 6. GAVETA / DRAWER MODAL DE DETALHAMENTO & ORGANOGRAMA ═══ */}
      {orgaoSelecionado && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-gaveta-orgao"
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={() => setOrgaoSelecionado(null)}
        >
          <div
            className="h-full w-full max-w-2xl bg-surface border-l border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho da Gaveta */}
            <div className="border-b border-border p-6 bg-surface-2/40 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                    {orgaoSelecionado.sigla}
                  </span>
                  <span className="rounded-md bg-surface-2 border border-border px-2 py-0.5 text-[11px] text-muted">
                    {classificarEsfera(orgaoSelecionado)} ({orgaoSelecionado.uf})
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      orgaoSelecionado.variacaoPercentualEfetivo2016_2026 <= -30
                        ? "bg-alert/10 text-alert"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {orgaoSelecionado.variacaoPercentualEfetivo2016_2026}% efetivo
                  </span>
                </div>

                <h2 id="titulo-gaveta-orgao" className="mt-2 font-display text-xl font-bold tracking-tight text-foreground">
                  {orgaoSelecionado.nomeCompleto}
                </h2>
                <p className="mt-1 text-xs text-text-soft">
                  {orgaoSelecionado.papelRegulatorio}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOrgaoSelecionado(null)}
                className="rounded-xl border border-border bg-surface p-2 text-muted hover:text-foreground transition"
                aria-label="Fechar painel de detalhes"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Abas Internas da Gaveta */}
            <div className="flex border-b border-border bg-surface px-6 pt-2 text-xs font-medium gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setAbaGaveta("organograma")}
                className={`pb-2.5 px-1 border-b-2 transition whitespace-nowrap ${
                  abaGaveta === "organograma"
                    ? "border-primary font-bold text-primary"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                Organograma &amp; Áreas ({orgaoSelecionado.organograma.length})
              </button>

              <button
                type="button"
                onClick={() => setAbaGaveta("lideranca")}
                className={`pb-2.5 px-1 border-b-2 transition whitespace-nowrap ${
                  abaGaveta === "lideranca"
                    ? "border-primary font-bold text-primary"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                Liderança &amp; Competências
              </button>

              <button
                type="button"
                onClick={() => setAbaGaveta("concurso")}
                className={`pb-2.5 px-1 border-b-2 transition whitespace-nowrap ${
                  abaGaveta === "concurso"
                    ? "border-primary font-bold text-primary"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                Concursos &amp; Carreira
              </button>

              <button
                type="button"
                onClick={() => setAbaGaveta("contatos")}
                className={`pb-2.5 px-1 border-b-2 transition whitespace-nowrap ${
                  abaGaveta === "contatos"
                    ? "border-primary font-bold text-primary"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                Contatos &amp; Ouvidoria
              </button>
            </div>

            {/* Conteúdo da Gaveta com rolagem */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-text-soft">
              {/* ABA 1: ORGANOGRAMA DETALHADO COM ÁREAS, TELEFONES, EMAILS E LINKS */}
              {abaGaveta === "organograma" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-primary" />
                      Estrutura Organizacional e Diretorias
                    </h3>
                    <span className="text-[11px] text-muted">
                      Links diretos e contatos dos responsáveis
                    </span>
                  </div>

                  <div className="space-y-3">
                    {orgaoSelecionado.organograma.map((area, idx) => (
                      <div
                        key={area.sigla + idx}
                        className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-2.5 hover:border-primary/40 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary mr-1.5">
                              {area.sigla}
                            </span>
                            <strong className="text-foreground text-xs font-bold">
                              {area.nome}
                            </strong>
                          </div>

                          <a
                            href={area.urlPagina}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline shrink-0"
                            title="Acessar página oficial desta diretoria"
                          >
                            <span>Página da Área</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>

                        <p className="text-text-soft leading-relaxed">
                          {area.funcao}
                        </p>

                        <div className="pt-2 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-muted block">Responsável:</span>
                            <span className="font-semibold text-foreground">
                              {area.responsavel} ({area.cargo})
                            </span>
                          </div>
                          <div>
                            <span className="text-muted block">Telefone Direto:</span>
                            <span className="font-tabular font-medium text-foreground">
                              {area.telefone}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted block">E-mail:</span>
                            <a
                              href={`mailto:${area.email}`}
                              className="font-medium text-primary hover:underline break-all"
                            >
                              {area.email}
                            </a>
                          </div>
                          <div>
                            <span className="text-muted block">Localização:</span>
                            <span className="text-text-soft">{area.endereco}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ABA 2: LIDERANÇA E RESPONSABILIDADES LEGAIS */}
              {abaGaveta === "lideranca" && (
                <div className="space-y-5">
                  {/* Titular */}
                  <div className="rounded-2xl border border-border bg-surface-2/50 p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      Comando e Titularidade
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-sm">
                          {orgaoSelecionado.lideranca.nome}
                        </h4>
                        <p className="text-xs text-text-soft">
                          {orgaoSelecionado.lideranca.cargo} · {orgaoSelecionado.lideranca.gabinete}
                        </p>
                      </div>
                    </div>
                    <div className="pt-1 border-t border-border/50 flex flex-wrap gap-4 text-[11px]">
                      <span>Tel: <strong>{orgaoSelecionado.lideranca.telefone}</strong></span>
                      <span>Email: <strong>{orgaoSelecionado.lideranca.email}</strong></span>
                    </div>
                  </div>

                  {/* Marco Legal */}
                  <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                      <Landmark className="h-3.5 w-3.5 text-primary" />
                      Marco Legal Instituidor e Regulamentar
                    </span>
                    <ul className="space-y-1">
                      {orgaoSelecionado.marcoLegal.map((lei, idx) => (
                        <li key={idx} className="font-medium text-foreground">
                          · {lei}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Atribuições Legais */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      Responsabilidades Legais e Atribuições
                    </span>
                    <ul className="space-y-2">
                      {orgaoSelecionado.responsabilidades.map((resp, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 rounded-xl border border-border/70 bg-surface-2/30 p-3"
                        >
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                          <span className="text-text leading-relaxed">{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* ABA 3: CONCURSOS E CARREIRA */}
              {abaGaveta === "concurso" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        Histórico do Concurso Público
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          (orgaoSelecionado.ultimoConcurso?.hiatoAnosAnterior || 0) >= 12
                            ? "bg-alert/15 text-alert"
                            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        }`}
                      >
                        {orgaoSelecionado.ultimoConcurso?.situacao}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                      <div className="rounded-xl border border-border bg-surface p-3">
                        <span className="text-muted block text-[10px]">Ano do Último Edital</span>
                        <strong className="font-tabular text-lg text-foreground">
                          {orgaoSelecionado.ultimoConcurso?.ano}
                        </strong>
                      </div>
                      <div className="rounded-xl border border-border bg-surface p-3">
                        <span className="text-muted block text-[10px]">Vagas Ofertadas</span>
                        <strong className="font-tabular text-lg text-foreground">
                          {orgaoSelecionado.ultimoConcurso?.vagas}
                        </strong>
                      </div>
                      <div className="rounded-xl border border-border bg-surface p-3">
                        <span className="text-muted block text-[10px]">Tempo de Espera (Hiato)</span>
                        <strong className="font-tabular text-lg text-alert">
                          {orgaoSelecionado.ultimoConcurso?.hiatoAnosAnterior} anos
                        </strong>
                      </div>
                      <div className="rounded-xl border border-border bg-surface p-3">
                        <span className="text-muted block text-[10px]">Banca Organizadora</span>
                        <strong className="text-sm text-foreground">
                          {orgaoSelecionado.ultimoConcurso?.banca}
                        </strong>
                      </div>
                    </div>

                    <div className="pt-2 text-xs text-text-soft leading-relaxed space-y-1">
                      <p>
                        <strong>Edital de Referência:</strong> {orgaoSelecionado.ultimoConcurso?.edital}
                      </p>
                      <p>
                        <strong>Déficit de Analistas Estimado:</strong> {formatNumberBR(orgaoSelecionado.ultimoConcurso?.deficitEstimado || 0)} cargos vagos.
                      </p>
                    </div>

                    <div className="pt-2">
                      <a
                        href={orgaoSelecionado.linksOficiais.concursos || orgaoSelecionado.linksOficiais.transparencia}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-primary bg-primary px-3.5 py-2 text-xs font-semibold text-primary-ink hover:opacity-90 transition shadow-2xs"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Página Oficial de Concursos do Órgão
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 4: CONTATOS INSTITUCIONAIS COMPLETOS */}
              {abaGaveta === "contatos" && (
                <div className="space-y-4">
                  {/* Sede e Endereço */}
                  <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      Endereço da Sede Oficial
                    </span>
                    <p className="text-xs text-foreground font-medium leading-relaxed">
                      {orgaoSelecionado.contatos.enderecoSede.logradouro}, {orgaoSelecionado.contatos.enderecoSede.bairro}, {orgaoSelecionado.contatos.enderecoSede.cidade} - {orgaoSelecionado.contatos.enderecoSede.uf}, CEP {orgaoSelecionado.contatos.enderecoSede.cep}
                    </p>
                  </div>

                  {/* Telefones e Emails */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-border bg-surface p-4 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-primary" />
                        Telefones da Sede
                      </span>
                      <p className="font-tabular text-xs font-bold text-foreground">
                        {orgaoSelecionado.contatos.telefones.join(" / ")}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-surface p-4 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-primary" />
                        E-mail Geral
                      </span>
                      <a
                        href={`mailto:${orgaoSelecionado.contatos.emailGeral}`}
                        className="text-xs font-semibold text-primary hover:underline break-all"
                      >
                        {orgaoSelecionado.contatos.emailGeral}
                      </a>
                    </div>
                  </div>

                  {/* Ouvidoria */}
                  <div className="rounded-2xl border border-border bg-surface-2/50 p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      Canal Oficial de Ouvidoria / Denúncias
                    </span>
                    <p className="text-xs font-semibold text-foreground">
                      {orgaoSelecionado.contatos.ouvidoria.canal}
                    </p>
                    <p className="text-xs text-text-soft">
                      Telefone da Ouvidoria: <strong>{orgaoSelecionado.contatos.ouvidoria.telefone}</strong>
                    </p>
                    <div className="pt-2">
                      <a
                        href={orgaoSelecionado.contatos.ouvidoria.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary hover:border-primary transition"
                      >
                        <span>Acessar Portal da Ouvidoria</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  {/* Sedes Regionais se houver */}
                  {orgaoSelecionado.contatos.sedesRegionais && orgaoSelecionado.contatos.sedesRegionais.length > 0 && (
                    <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                        Unidades Regionais de Atendimento
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        {orgaoSelecionado.contatos.sedesRegionais.map((reg, idx) => (
                          <div key={idx} className="rounded-xl border border-border/60 bg-surface-2/30 p-2.5 space-y-0.5">
                            <strong className="text-foreground block">{reg.nome} ({reg.cidade})</strong>
                            <p className="text-muted text-[10px]">{reg.endereco}</p>
                            <p className="font-tabular text-text-soft">{reg.telefone}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Links de Auditoria e Gestão */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    <a
                      href={orgaoSelecionado.linksOficiais.transparencia}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-primary" />
                      Portal de Transparência
                    </a>

                    <a
                      href={orgaoSelecionado.linksOficiais.relatoriosGestao}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary transition"
                    >
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      Relatórios de Gestão e Auditoria
                    </a>

                    <a
                      href={orgaoSelecionado.linksOficiais.sistemasConsulta}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary transition"
                    >
                      <Search className="h-3.5 w-3.5 text-primary" />
                      Sistemas de Consulta Aberta
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé da Gaveta */}
            <div className="border-t border-border p-4 bg-surface-2/40 flex items-center justify-between text-xs text-muted">
              <span>Fonte: Portais da Transparência, SIAPE/PEP e LOAs Oficiais</span>
              <button
                type="button"
                onClick={() => setOrgaoSelecionado(null)}
                className="rounded-xl border border-border bg-surface px-4 py-1.5 font-semibold text-foreground hover:bg-surface-2 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
