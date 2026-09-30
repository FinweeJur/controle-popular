"use client";

/**
 * @file apps/web/app/internacional/operacoes-militares/PainelOperacoesMilitares.tsx
 * @description Painel interativo do Acervo de Operações Militares, Contratos de Defesa e PMCs.
 *
 * Papel no portal:
 * Permite ao cidadão navegar, pesquisar, filtrar, auditar e exportar intervenções militares,
 * golpes de Estado, atuação de mercenários (PMCs) e grandes contratos bélicos sob as 6 Qualidades:
 * 1. Links diretos e verificados para fontes oficiais (CRS, CSNU, National Security Archive, DoD, CIJ).
 * 2. Busca multifacetada: tipo de ação, patrocinador, continente, país teatro, PMCs e empresas bélicas.
 * 3. Ordenação crescente/decrescente em datas, nomes e atributos.
 * 4. Cartões de topo com agregados medidos e datados de COBERTURA_OPERACOES_MILITARES.
 * 5. BarraIdiomaTrilingue com suporte a PT, EN, ES e sintetizador de voz (TTS).
 * 6. Exportação em planilha CSV com BOM UTF-8 (\uFEFF) e layout de impressão CSS nativo.
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  ArrowUpDown,
  Download,
  ExternalLink,
  Printer,
  FileText,
  Shield,
  Globe,
  Clock,
  Filter,
  CheckCircle2,
  FileDown,
  Layers,
  Eye,
  X,
  MapPin,
  Crosshair,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import type {
  OperacaoMilitarGlobal,
  TipoOperacaoMilitar,
} from "@/lib/internacional/dados-operacoes-militares";
import { semAcento } from "@/lib/busca/normalizar";
import BarraIdiomaTrilingue from "@/app/components/BarraIdiomaTrilingue";
import type { IdiomaExibicao, TextoTrilingue } from "@/lib/internacional/idiomas-internacional";

const RESUMO_TRILINGUE: TextoTrilingue = {
  pt: "Acervo de operações militares, golpes de Estado, milícias privadas (PMCs) e mega-contratos de defesa das potências globais com geolocalização e impactos soberanos.",
  en: "Archive of military operations, coups, private military contractors (PMCs), and defense mega-contracts from global powers with geolocation and sovereignty impacts.",
  es: "Archivo de operaciones militares, golpes de Estado, contratistas privados (PMCs) y mega-contratos de defensa de potencias globales con geolocalización e impacto soberano.",
};

const PERGUNTA_SEU_NONO: TextoTrilingue = {
  pt: "Como a atuação de PMCs como a Blackwater e a Operação Condor impactaram a soberania nas Américas?",
  en: "How did private military companies like Blackwater and Operation Condor impact sovereignty in the Americas?",
  es: "¿Cómo impactaron la actuación de PMCs como Blackwater y la Operación Cóndor en la soberanía de las Américas?",
};

/** Dicionário de tradução da interface do Painel Militar para PT, EN e ES */
const DICIONARIOS_UI: Record<
  IdiomaExibicao,
  {
    tituloAcervo: string;
    subtitulo: string;
    buscaPlaceholder: string;
    filtroTipo: string;
    filtroContinente: string;
    filtroPatrocinador: string;
    filtroPmc: string;
    todosTipos: string;
    todosContinentes: string;
    todosPatrocinadores: string;
    todasPmcs: string;
    apenasComPmcs: string;
    apenasLatam: string;
    modoTabela: string;
    modoCards: string;
    planilhaCsv: string;
    imprimir: string;
    btnExplorarMapa: string;
    btnVerNoMapa: string;
    thAno: string;
    thCodinome: string;
    thTipo: string;
    thTeatro: string;
    thPatrocinadores: string;
    thAcoes: string;
    btnFonteOficial: string;
    btnBaixarPdf: string;
    btnDetalhes: string;
    cardTotalOperacoes: string;
    cardPaisesTeatro: string;
    cardPaisesPatrocinadores: string;
    cardPmcsContratadas: string;
    nenhumResultado: string;
    limparFiltros: string;
    detalheTitulo: string;
    detalheResumo: string;
    detalheDesfecho: string;
    detalheLatam: string;
    detalheBaixas: string;
    detalheCustos: string;
    detalheForcas: string;
  }
> = {
  pt: {
    tituloAcervo: "Acervo Global de Operações Militares, Conflitos e PMCs",
    subtitulo: "Documentação cívica de intervenções armadas, deposições de regimes, mercenários e contratos bélicos mundiais.",
    buscaPlaceholder: "Buscar por codinome, cidade, país, PMC, fabricante de armas ou tema...",
    filtroTipo: "Tipo de Operação",
    filtroContinente: "Continente do Teatro",
    filtroPatrocinador: "País Patrocinador",
    filtroPmc: "Envolvimento de PMCs",
    todosTipos: "Todos os tipos",
    todosContinentes: "Todos os continentes",
    todosPatrocinadores: "Todos os patrocinadores",
    todasPmcs: "Todas as forças",
    apenasComPmcs: "🪖 Apenas com PMCs / Mercenários",
    apenasLatam: "🌎 Apenas América Latina & Brasil",
    modoTabela: "Modo Tabela",
    modoCards: "Modo Dossiê",
    planilhaCsv: "Planilha CSV",
    imprimir: "Imprimir",
    btnExplorarMapa: "🗺️ Ver no Mapa Global",
    btnVerNoMapa: "Ver no Mapa 🗺️",
    thAno: "Ano / Duração",
    thCodinome: "Ação & Resumo",
    thTipo: "Tipo de Ação",
    thTeatro: "Teatro / Localidade",
    thPatrocinadores: "Patrocinadores",
    thAcoes: "Ações Oficiais",
    btnFonteOficial: "Fonte Oficial ↗",
    btnBaixarPdf: "PDF / Relatório ↗",
    btnDetalhes: "Ficha Completa",
    cardTotalOperacoes: "Ações Catalogadas",
    cardPaisesTeatro: "Países de Conflito",
    cardPaisesPatrocinadores: "Potências Patrocinadoras",
    cardPmcsContratadas: "PMCs & Empreiteiras",
    nenhumResultado: "Nenhuma operação ou contrato militar corresponde aos filtros selecionados.",
    limparFiltros: "Limpar todos os filtros",
    detalheTitulo: "Dossiê Histórico da Ação Militar",
    detalheResumo: "Resumo Cívico & Fatos:",
    detalheDesfecho: "Desfecho Institucional & Soberania:",
    detalheLatam: "Impacto no Brasil e América Latina:",
    detalheBaixas: "Baixas Estimadas:",
    detalheCustos: "Custo Financeiro Estimado:",
    detalheForcas: "Forças e PMCs Envolvidas:",
  },
  en: {
    tituloAcervo: "Global Archive of Military Operations, Conflicts & PMCs",
    subtitulo: "Civic documentation of military interventions, regime change, private contractors, and arms deals.",
    buscaPlaceholder: "Search by codename, city, country, PMC, arms maker, or subject...",
    filtroTipo: "Operation Type",
    filtroContinente: "Theater Continent",
    filtroPatrocinador: "Sponsoring Country",
    filtroPmc: "PMC Involvement",
    todosTipos: "All types",
    todosContinentes: "All continents",
    todosPatrocinadores: "All sponsors",
    todasPmcs: "All forces",
    apenasComPmcs: "🪖 PMCs & Mercenaries Only",
    apenasLatam: "🌎 Latin America & Brazil Only",
    modoTabela: "Table View",
    modoCards: "Dossier View",
    planilhaCsv: "CSV Spreadsheet",
    imprimir: "Print",
    btnExplorarMapa: "🗺️ Explore on Global Map",
    btnVerNoMapa: "View on Map 🗺️",
    thAno: "Year / Duration",
    thCodinome: "Operation & Summary",
    thTipo: "Action Type",
    thTeatro: "Theater / Location",
    thPatrocinadores: "Sponsors",
    thAcoes: "Official Actions",
    btnFonteOficial: "Official Source ↗",
    btnBaixarPdf: "PDF / Report ↗",
    btnDetalhes: "Full Dossier",
    cardTotalOperacoes: "Cataloged Actions",
    cardPaisesTeatro: "Conflict Countries",
    cardPaisesPatrocinadores: "Sponsoring Powers",
    cardPmcsContratadas: "PMCs & Defense Makers",
    nenhumResultado: "No military operations match the selected filters.",
    limparFiltros: "Clear all filters",
    detalheTitulo: "Military Operation Archival Dossier",
    detalheResumo: "Civic Summary & Facts:",
    detalheDesfecho: "Institutional Outcome & Sovereignty:",
    detalheLatam: "Impact on Brazil & Latin America:",
    detalheBaixas: "Estimated Casualties:",
    detalheCustos: "Estimated Financial Cost:",
    detalheForcas: "Forces & PMCs Involved:",
  },
  es: {
    tituloAcervo: "Archivo Global de Operaciones Militares, Conflictos y PMCs",
    subtitulo: "Documentación cívica de intervenciones armadas, golpes de Estado, mercenarios y contratos bélicos.",
    buscaPlaceholder: "Buscar por nombre clave, ciudad, país, PMC, fabricante de armas o tema...",
    filtroTipo: "Tipo de Operación",
    filtroContinente: "Continente del Teatro",
    filtroPatrocinador: "País Patrocinador",
    filtroPmc: "Participación de PMCs",
    todosTipos: "Todos los tipos",
    todosContinentes: "Todos los continentes",
    todosPatrocinadores: "Todos los patrocinadores",
    todasPmcs: "Todas las fuerzas",
    apenasComPmcs: "🪖 Solo PMCs / Mercenarios",
    apenasLatam: "🌎 Solo América Latina y Brasil",
    modoTabela: "Modo Tabla",
    modoCards: "Modo Dossier",
    planilhaCsv: "Planilla CSV",
    imprimir: "Imprimir",
    btnExplorarMapa: "🗺️ Ver en el Mapa Global",
    btnVerNoMapa: "Ver en el Mapa 🗺️",
    thAno: "Año / Duración",
    thCodinome: "Acción y Resumen",
    thTipo: "Tipo de Acción",
    thTeatro: "Teatro / Localidad",
    thPatrocinadores: "Patrocinadores",
    thAcoes: "Acciones Oficiales",
    btnFonteOficial: "Fuente Oficial ↗",
    btnBaixarPdf: "PDF / Informe ↗",
    btnDetalhes: "Ficha Completa",
    cardTotalOperacoes: "Acciones Catalogadas",
    cardPaisesTeatro: "Países de Conflicto",
    cardPaisesPatrocinadores: "Potencias Patrocinadoras",
    cardPmcsContratadas: "PMCs y Empresas de Defensa",
    nenhumResultado: "Ninguna operación coincide con los filtros seleccionados.",
    limparFiltros: "Limpiar todos los filtros",
    detalheTitulo: "Dossier Histórico de la Acción Militar",
    detalheResumo: "Resumen Cívico y Hechos:",
    detalheDesfecho: "Desenlace Institucional y Soberanía:",
    detalheLatam: "Impacto en Brasil y América Latina:",
    detalheBaixas: "Bajas Estimadas:",
    detalheCustos: "Costo Financiero Estimado:",
    detalheForcas: "Fuerzas y PMCs Involucradas:",
  },
};

interface PainelOperacoesMilitaresProps {
  operacoes: OperacaoMilitarGlobal[];
}

type ColunaOrdenacao = "anoInicio" | "codinome" | "paisTeatro" | "tipoOperacao";

function formatarBadgeTipo(tipo: TipoOperacaoMilitar): { rotulo: string; cor: string } {
  switch (tipo) {
    case "intervencao_militar_direta":
      return { rotulo: "Intervenção Direta", cor: "bg-red-500/10 text-red-600 border-red-500/30" };
    case "deposicao_regime_golpe":
      return { rotulo: "Deposição / Golpe", cor: "bg-amber-500/10 text-amber-600 border-amber-500/30" };
    case "pmc_milicia_privada":
      return { rotulo: "PMC / Mercenários", cor: "bg-purple-500/10 text-purple-600 border-purple-500/30" };
    case "contrato_defesa_armamento":
      return { rotulo: "Contrato de Defesa", cor: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30" };
    case "guerra_proxy_apoio_rebelde":
      return { rotulo: "Proxy / Guerrilha", cor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" };
    case "operacao_paz_mandato_onu":
      return { rotulo: "Mandato da ONU", cor: "bg-blue-500/10 text-blue-600 border-blue-500/30" };
    default:
      return { rotulo: tipo, cor: "bg-surface-2 text-muted border-border" };
  }
}

export default function PainelOperacoesMilitares({ operacoes }: PainelOperacoesMilitaresProps) {
  const [idioma, setIdioma] = useState<IdiomaExibicao>("pt");
  const [modoVisualizacao, setModoVisualizacao] = useState<"tabela" | "cards">("cards");
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("__todos__");
  const [filtroContinente, setFiltroContinente] = useState<string>("__todos__");
  const [filtroPatrocinador, setFiltroPatrocinador] = useState<string>("__todos__");
  const [apenasPmcs, setApenasPmcs] = useState<boolean>(false);
  const [apenasLatam, setApenasLatam] = useState<boolean>(false);

  // Ordenação
  const [colunaOrd, setColunaOrd] = useState<ColunaOrdenacao>("anoInicio");
  const [ordemDesc, setOrdemDesc] = useState<boolean>(true);

  // Modal de Detalhes
  const [operacaoSelecionada, setOperacaoSelecionada] = useState<OperacaoMilitarGlobal | null>(null);

  // Leitura de query param ?id=... para carregar ação vindo do mapa
  const searchParams = useSearchParams();
  const idParam = searchParams ? searchParams.get("id") : null;

  useEffect(() => {
    if (idParam) {
      const op = operacoes.find((o) => o.id.toLowerCase() === idParam.toLowerCase());
      if (op) {
        setOperacaoSelecionada(op);
      }
    }
  }, [idParam, operacoes]);

  const ui = DICIONARIOS_UI[idioma];

  // Listas únicas para dropdowns
  const tiposUnicos = useMemo(() => {
    return Array.from(new Set(operacoes.map((o) => o.tipoOperacao))).sort();
  }, [operacoes]);

  const continentesUnicos = useMemo(() => {
    return Array.from(new Set(operacoes.map((o) => o.continenteTeatro))).sort();
  }, [operacoes]);

  const patrocinadoresUnicos = useMemo(() => {
    return Array.from(new Set(operacoes.flatMap((o) => o.paisesPatrocinadores))).sort();
  }, [operacoes]);

  // Filtro e Ordenação combinados
  const operacoesFiltradas = useMemo(() => {
    const q = semAcento(busca.trim().toLowerCase());

    return operacoes
      .filter((op) => {
        if (filtroTipo !== "__todos__" && op.tipoOperacao !== filtroTipo) return false;
        if (filtroContinente !== "__todos__" && op.continenteTeatro !== filtroContinente) return false;
        if (filtroPatrocinador !== "__todos__" && !op.paisesPatrocinadores.includes(filtroPatrocinador)) return false;
        if (apenasPmcs && op.pmcsEnvolvidas.length === 0) return false;
        if (apenasLatam) {
          const isLatam =
            op.continenteTeatro === "América do Sul" ||
            op.continenteTeatro === "América Central e Caribe" ||
            op.conexaoBrasilOuAmericaLatina.length > 0;
          if (!isLatam) return false;
        }

        if (!q) return true;

        const textoBusca = semAcento(
          `${op.codinome} ${op.titulo} ${op.resumo} ${op.paisTeatro} ${op.localidadeFoco} ${op.paisesPatrocinadores.join(" ")} ${op.orgaosForcasEnvolvidas.join(" ")} ${op.pmcsEnvolvidas.join(" ")} ${op.principaisContratadasDefesa.join(" ")} ${op.assuntos.join(" ")}`
        ).toLowerCase();

        return textoBusca.includes(q);
      })
      .sort((a, b) => {
        const valA = a[colunaOrd];
        const valB = b[colunaOrd];

        if (typeof valA === "number" && typeof valB === "number") {
          return ordemDesc ? valB - valA : valA - valB;
        }

        const strA = String(valA || "").toLowerCase();
        const strB = String(valB || "").toLowerCase();
        return ordemDesc ? strB.localeCompare(strA) : strA.localeCompare(strB);
      });
  }, [operacoes, busca, filtroTipo, filtroContinente, filtroPatrocinador, apenasPmcs, apenasLatam, colunaOrd, ordemDesc]);

  // Alternador de ordenação
  const alternarOrdenacao = useCallback((coluna: ColunaOrdenacao) => {
    setColunaOrd((prev) => {
      if (prev === coluna) {
        setOrdemDesc((d) => !d);
        return coluna;
      }
      setOrdemDesc(true);
      return coluna;
    });
  }, []);

  // Exportação CSV com BOM UTF-8 (\uFEFF)
  const exportarCsv = useCallback(() => {
    const cabecalho =
      idioma === "en"
        ? "ID;Codename;Title;Operation Type;Start Year;End Year;Duration;Theater Country;Theater Continent;Focus Location;Latitude;Longitude;Sponsoring Countries;Involved Forces;PMCs;Defense Contractors;Casualties;Financial Cost;Sovereignty Outcome;Official Source;Official URL"
        : idioma === "es"
        ? "ID;Nombre Clave;Título;Tipo Operación;Año Inicio;Año Fin;Duración;País Teatro;Continente Teatro;Localidad Foco;Latitud;Longitud;Países Patrocinadores;Fuerzas Involucradas;PMCs;Empresas Defensa;Bajas;Costo Financiero;Desenlace Soberanía;Fuente Oficial;URL Oficial"
        : "ID;Codinome;Título;Tipo Operação;Ano Início;Ano Fim;Duração Estimada;País Teatro;Continente Teatro;Localidade Foco;Latitude;Longitude;Países Patrocinadores;Forças Envolvidas;PMCs Envolvidas;Principais Contratadas Defesa;Baixas Estimadas;Custo Financeiro Estimado;Desfecho Soberania;Fonte Oficial;URL Fonte Oficial";

    const linhas = operacoesFiltradas.map((op) => {
      const escape = (val: string | number | null | undefined) =>
        `"${String(val ?? "").replace(/"/g, '""')}"`;

      return [
        escape(op.id),
        escape(op.codinome),
        escape(op.titulo),
        escape(op.tipoOperacao),
        escape(op.anoInicio),
        escape(op.anoFim ?? ""),
        escape(op.duracaoEstimada),
        escape(op.paisTeatro),
        escape(op.continenteTeatro),
        escape(op.localidadeFoco),
        escape(op.latitude),
        escape(op.longitude),
        escape(op.paisesPatrocinadores.join(", ")),
        escape(op.orgaosForcasEnvolvidas.join(", ")),
        escape(op.pmcsEnvolvidas.join(", ")),
        escape(op.principaisContratadasDefesa.join(", ")),
        escape(op.baixasEstimadas),
        escape(op.custoFinanceiroEstimado),
        escape(op.desfechoSoberania),
        escape(op.fonteOficialNome),
        escape(op.urlFonteOficial),
      ].join(";");
    });

    const conteudoCsv = "\uFEFF" + [cabecalho, ...linhas].join("\r\n");
    const blob = new Blob([conteudoCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `operacoes-militares-conflitos-g20-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [operacoesFiltradas, idioma]);

  return (
    <div className="space-y-6">
      {/* BARRA DE IDIOMA TRILÍNGUE COM TTS E SEU NONÔ */}
      <div className="print:hidden">
        <BarraIdiomaTrilingue
          idioma={idioma}
          aoTrocarIdioma={setIdioma}
          resumoTrilingue={RESUMO_TRILINGUE}
          perguntaSeuNono={PERGUNTA_SEU_NONO}
          paisDestaque="Ambos"
        />
      </div>

      {/* BARRA DE FERRAMENTAS: BUSCA TEXTUAL, MODO DE VISUALIZAÇÃO E EXPORTAÇÃO */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Busca textual em tempo real */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft"
              aria-hidden="true"
            />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={ui.buscaPlaceholder}
              className="w-full rounded-xl border border-border bg-surface-2 pl-9 pr-4 py-2 text-xs text-text placeholder:text-text-soft focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Alternador de Modo de Visualização e Ações */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex rounded-xl border border-border bg-surface-2 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setModoVisualizacao("cards")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-colors ${
                  modoVisualizacao === "cards"
                    ? "bg-surface text-primary shadow-xs font-bold"
                    : "text-text-soft hover:text-text"
                }`}
              >
                <Layers size={13} />
                <span>{ui.modoCards}</span>
              </button>
              <button
                type="button"
                onClick={() => setModoVisualizacao("tabela")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-colors ${
                  modoVisualizacao === "tabela"
                    ? "bg-surface text-primary shadow-xs font-bold"
                    : "text-text-soft hover:text-text"
                }`}
              >
                <FileText size={13} />
                <span>{ui.modoTabela}</span>
              </button>
            </div>

            <Link
              href="/internacional/operacoes-militares/mapa"
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-700 dark:text-red-400 hover:bg-red-500/20 transition-colors"
              title="Explorar geolocalização dos conflitos no mapa mundial"
            >
              <MapPin size={13} />
              <span className="hidden sm:inline">{ui.btnExplorarMapa}</span>
              <span className="sm:hidden">Mapa 🗺️</span>
            </Link>

            <button
              type="button"
              onClick={exportarCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary bg-primary px-3 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity"
              title="Baixar planilha CSV com BOM UTF-8"
            >
              <Download size={13} />
              <span>{ui.planilhaCsv}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text hover:bg-surface-2 transition-colors"
              title="Imprimir relatório"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">{ui.imprimir}</span>
            </button>
          </div>
        </div>

        {/* FILTROS FACETADOS MULTIDIMENSIONAIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-border/60 text-xs">
          {/* Tipo de Operação */}
          <div>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="__todos__">{ui.todosTipos} ({tiposUnicos.length})</option>
              {tiposUnicos.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {formatarBadgeTipo(tipo).rotulo}
                </option>
              ))}
            </select>
          </div>

          {/* Continente */}
          <div>
            <select
              value={filtroContinente}
              onChange={(e) => setFiltroContinente(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="__todos__">{ui.todosContinentes} ({continentesUnicos.length})</option>
              {continentesUnicos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Patrocinador */}
          <div>
            <select
              value={filtroPatrocinador}
              onChange={(e) => setFiltroPatrocinador(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="__todos__">{ui.todosPatrocinadores} ({patrocinadoresUnicos.length})</option>
              {patrocinadoresUnicos.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Checkboxes de Escopo Rápido */}
          <div className="flex items-center gap-3 py-1">
            <label className="inline-flex items-center gap-1.5 text-xs text-text-soft cursor-pointer">
              <input
                type="checkbox"
                checked={apenasPmcs}
                onChange={(e) => setApenasPmcs(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span>{ui.apenasComPmcs}</span>
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs text-text-soft cursor-pointer">
              <input
                type="checkbox"
                checked={apenasLatam}
                onChange={(e) => setApenasLatam(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span>{ui.apenasLatam}</span>
            </label>
          </div>
        </div>

        {/* Resumo da Contagem Filtrada */}
        <div className="flex items-center justify-between text-xs text-text-soft pt-1">
          <span>
            Exibindo <strong>{operacoesFiltradas.length}</strong> de{" "}
            <strong>{operacoes.length}</strong> ações registradas.
          </span>
          {(busca ||
            filtroTipo !== "__todos__" ||
            filtroContinente !== "__todos__" ||
            filtroPatrocinador !== "__todos__" ||
            apenasPmcs ||
            apenasLatam) && (
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setFiltroTipo("__todos__");
                setFiltroContinente("__todos__");
                setFiltroPatrocinador("__todos__");
                setApenasPmcs(false);
                setApenasLatam(false);
              }}
              className="text-primary hover:underline font-semibold"
            >
              {ui.limparFiltros}
            </button>
          )}
        </div>
      </div>

      {/* MODO 1: VISUALIZAÇÃO EM CARDS / DOSSIÊS */}
      {modoVisualizacao === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {operacoesFiltradas.map((op) => {
            const badge = formatarBadgeTipo(op.tipoOperacao);

            return (
              <div
                key={op.id}
                className="rounded-2xl border border-border bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/50 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${badge.cor}`}>
                      {badge.rotulo}
                    </span>
                    <span className="font-mono text-[11px] text-text-soft">
                      {op.duracaoEstimada}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-text leading-snug line-clamp-2">
                      {op.codinome}
                    </h3>
                    <div className="text-[11px] font-semibold text-primary mt-0.5">
                      📍 {op.localidadeFoco}, {op.paisTeatro}
                    </div>
                  </div>

                  <p className="text-xs text-text-soft line-clamp-3 leading-relaxed">
                    {op.resumo}
                  </p>

                  <div className="text-[10px] text-text-soft space-y-0.5 pt-2 border-t border-border/60">
                    <div className="flex justify-between">
                      <span>Patrocinadores:</span>
                      <strong className="text-text truncate max-w-[170px]">
                        {op.paisesPatrocinadores.join(", ")}
                      </strong>
                    </div>
                    {op.baixasEstimadas && (
                      <div className="flex justify-between">
                        <span>Baixas Estimadas:</span>
                        <span className="text-red-600 dark:text-red-400 font-semibold truncate max-w-[170px]">
                          {op.baixasEstimadas}
                        </span>
                      </div>
                    )}
                    {op.pmcsEnvolvidas.length > 0 && (
                      <div className="flex justify-between">
                        <span>PMC / Mercenários:</span>
                        <strong className="text-purple-600 dark:text-purple-400 truncate max-w-[170px]">
                          {op.pmcsEnvolvidas.join(", ")}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between gap-2 text-xs mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOperacaoSelecionada(op)}
                      className="inline-flex items-center gap-1 text-[11px] text-text-soft hover:text-primary font-semibold"
                    >
                      <Eye size={12} />
                      <span>{ui.btnDetalhes}</span>
                    </button>
                    <Link
                      href={`/internacional/operacoes-militares/mapa?id=${encodeURIComponent(op.id)}`}
                      className="inline-flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 hover:underline font-semibold"
                      title="Ver localização desta ação no mapa mundial"
                    >
                      <MapPin size={12} />
                      <span>Mapa</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={op.urlFonteOficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-bold"
                      title="Página da fonte oficial"
                    >
                      <span>Fonte</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODO 2: VISUALIZAÇÃO EM TABELA */}
      {modoVisualizacao === "tabela" && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-xs">
          <table className="w-full text-left text-xs text-text">
            <thead className="border-b border-border bg-surface-2 text-text-soft uppercase tracking-wider text-[10px]">
              <tr>
                <th scope="col" className="p-3">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao("anoInicio")}
                    className="inline-flex items-center gap-1 font-bold hover:text-text"
                  >
                    {ui.thAno} <ArrowUpDown size={11} />
                  </button>
                </th>
                <th scope="col" className="p-3">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao("codinome")}
                    className="inline-flex items-center gap-1 font-bold hover:text-text"
                  >
                    {ui.thCodinome} <ArrowUpDown size={11} />
                  </button>
                </th>
                <th scope="col" className="p-3">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao("tipoOperacao")}
                    className="inline-flex items-center gap-1 font-bold hover:text-text"
                  >
                    {ui.thTipo} <ArrowUpDown size={11} />
                  </button>
                </th>
                <th scope="col" className="p-3 hidden sm:table-cell">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao("paisTeatro")}
                    className="inline-flex items-center gap-1 font-bold hover:text-text"
                  >
                    {ui.thTeatro} <ArrowUpDown size={11} />
                  </button>
                </th>
                <th scope="col" className="p-3 hidden md:table-cell">
                  {ui.thPatrocinadores}
                </th>
                <th scope="col" className="p-3 text-right">
                  {ui.thAcoes}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {operacoesFiltradas.map((op) => {
                const badge = formatarBadgeTipo(op.tipoOperacao);

                return (
                  <tr
                    key={op.id}
                    className="transition-colors hover:bg-surface-2/60"
                  >
                    <td className="p-3 font-mono font-semibold text-[11px] whitespace-nowrap">
                      {op.duracaoEstimada}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-text">
                        {op.codinome}
                      </div>
                      <p className="text-[11px] text-text-soft line-clamp-1 mt-0.5">
                        {op.resumo}
                      </p>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${badge.cor}`}>
                        {badge.rotulo}
                      </span>
                    </td>
                    <td className="p-3 hidden sm:table-cell whitespace-nowrap">
                      <div className="font-semibold text-text">{op.paisTeatro}</div>
                      <div className="text-[10px] text-text-soft">{op.localidadeFoco}</div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-text-soft">
                      {op.paisesPatrocinadores.join(", ")}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setOperacaoSelecionada(op)}
                          className="rounded-lg bg-surface-2 px-2 py-1 text-[11px] font-semibold text-text hover:text-primary transition-colors"
                          title="Ver ficha completa"
                        >
                          <Eye size={12} />
                        </button>
                        <Link
                          href={`/internacional/operacoes-militares/mapa?id=${encodeURIComponent(op.id)}`}
                          className="rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-1 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors inline-flex items-center gap-1"
                          title="Ver localização desta ação no mapa mundial"
                        >
                          <MapPin size={11} />
                        </Link>
                        <a
                          href={op.urlFonteOficial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-border bg-surface px-2 py-1 text-[11px] font-semibold text-primary hover:bg-surface-2 transition-colors inline-flex items-center gap-1"
                          title="Abrir página oficial da fonte"
                        >
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ESTADO VAZIO */}
      {operacoesFiltradas.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center space-y-3">
          <Crosshair size={32} className="mx-auto text-text-soft/60" />
          <p className="text-xs text-text-soft">{ui.nenhumResultado}</p>
          <button
            type="button"
            onClick={() => {
              setBusca("");
              setFiltroTipo("__todos__");
              setFiltroContinente("__todos__");
              setFiltroPatrocinador("__todos__");
              setApenasPmcs(false);
              setApenasLatam(false);
            }}
            className="rounded-xl border border-border bg-surface-2 px-4 py-2 text-xs font-semibold text-text hover:bg-surface transition-colors"
          >
            {ui.limparFiltros}
          </button>
        </div>
      )}

      {/* MODAL DE DETALHES COMPLETOS DA AÇÃO MILITAR */}
      {operacaoSelecionada && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold mb-1">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] ${
                      formatarBadgeTipo(operacaoSelecionada.tipoOperacao).cor
                    }`}
                  >
                    {formatarBadgeTipo(operacaoSelecionada.tipoOperacao).rotulo}
                  </span>
                  <span className="text-text-soft">
                    {operacaoSelecionada.duracaoEstimada}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-text leading-snug">
                  {operacaoSelecionada.codinome}
                </h3>
                <div className="text-xs font-semibold text-text-soft mt-0.5">
                  {operacaoSelecionada.titulo}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOperacaoSelecionada(null)}
                className="rounded-full bg-surface-2 p-1.5 text-text-soft hover:text-text transition-colors"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-text leading-relaxed">
              <div>
                <span className="text-text-soft font-semibold">Teatro de Operações: </span>
                <strong className="text-primary">
                  📍 {operacaoSelecionada.localidadeFoco}, {operacaoSelecionada.paisTeatro} ({operacaoSelecionada.continenteTeatro})
                </strong>
              </div>

              <div className="rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-text">
                <p className="font-medium">{operacaoSelecionada.resumo}</p>
              </div>

              <div className="border-l-2 border-primary pl-3 py-1 bg-primary/5 rounded-r-xl">
                <span className="text-[11px] font-bold text-primary block mb-0.5">
                  {ui.detalheDesfecho}
                </span>
                <p className="text-[11px] text-text-soft">
                  {operacaoSelecionada.desfechoSoberania}
                </p>
              </div>

              {operacaoSelecionada.conexaoBrasilOuAmericaLatina && (
                <div className="border-l-2 border-emerald-500 pl-3 py-1 bg-emerald-500/5 rounded-r-xl">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">
                    {ui.detalheLatam}
                  </span>
                  <p className="text-[11px] text-text-soft">
                    {operacaoSelecionada.conexaoBrasilOuAmericaLatina}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border text-[11px]">
                <div>
                  <span className="text-text-soft block font-semibold">{ui.detalheBaixas}</span>
                  <strong className="text-red-600 dark:text-red-400 block mt-0.5">
                    {operacaoSelecionada.baixasEstimadas || "Não especificado"}
                  </strong>
                </div>
                <div>
                  <span className="text-text-soft block font-semibold">{ui.detalheCustos}</span>
                  <strong className="text-text block mt-0.5">
                    {operacaoSelecionada.custoFinanceiroEstimado || "Não especificado"}
                  </strong>
                </div>
                <div>
                  <span className="text-text-soft block font-semibold">Patrocinadores:</span>
                  <span className="text-text block mt-0.5">
                    {operacaoSelecionada.paisesPatrocinadores.join(", ")}
                  </span>
                </div>
                <div>
                  <span className="text-text-soft block font-semibold">Fonte Oficial:</span>
                  <span className="text-text truncate block mt-0.5" title={operacaoSelecionada.fonteOficialNome}>
                    {operacaoSelecionada.fonteOficialNome}
                  </span>
                </div>
              </div>

              {/* Forças e PMCs */}
              <div className="pt-2 border-t border-border space-y-1 text-[11px]">
                <div>
                  <strong className="text-text-soft">{ui.detalheForcas} </strong>
                  <span className="text-text">
                    {[
                      ...operacaoSelecionada.orgaosForcasEnvolvidas,
                      ...operacaoSelecionada.pmcsEnvolvidas,
                      ...operacaoSelecionada.principaisContratadasDefesa,
                    ].join(" · ") || "Forças governamentais"}
                  </span>
                </div>
                <div>
                  <strong className="text-text-soft">Palavras-chave: </strong>
                  <span className="text-text-soft">
                    {operacaoSelecionada.assuntos.map((a) => `#${a}`).join(" ")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-border gap-2">
              <button
                type="button"
                onClick={() => setOperacaoSelecionada(null)}
                className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-text hover:bg-surface-2 transition-colors"
              >
                Fechar
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/internacional/operacoes-militares/mapa?id=${encodeURIComponent(operacaoSelecionada.id)}`}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-500/20 transition-colors inline-flex items-center gap-1.5"
                  title="Localizar este conflito no mapa mundial"
                >
                  <MapPin size={13} />
                  <span>{ui.btnVerNoMapa}</span>
                </Link>

                <a
                  href={operacaoSelecionada.urlFonteOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-primary hover:bg-surface-2 transition-colors inline-flex items-center gap-1.5"
                >
                  <ExternalLink size={13} />
                  <span>{ui.btnFonteOficial}</span>
                </a>

                {operacaoSelecionada.urlDocumentoOriginalPdf && (
                  <a
                    href={operacaoSelecionada.urlDocumentoOriginalPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-primary bg-primary px-3 py-2 text-xs font-bold text-white shadow-xs hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
                  >
                    <FileDown size={13} />
                    <span>{ui.btnBaixarPdf}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
