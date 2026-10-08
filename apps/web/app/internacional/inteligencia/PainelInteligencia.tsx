"use client";

/**
 * @file apps/web/app/internacional/inteligencia/PainelInteligencia.tsx
 * @description Painel interativo da Central de Inteligência e Documentos Desclassificados do G20 e Twelve Eyes.
 *
 * Papel no portal:
 * Permite ao cidadão e ao pesquisador navegar, buscar, filtrar, auditar e exportar
 * documentos históricos desclassificados e relatórios públicos contemporâneos da CIA, FBI, NSA e Twelve Eyes
 * sob as 6 Qualidades:
 * 1. Links diretos e verificados para a custódia arquivística oficial e PDF original.
 * 2. Busca multifacetada: alianças, órgãos, países, temas, assuntos, países e sujeitos citados.
 * 3. Ordenação crescente/decrescente em todas as datas e atributos numéricos/nominais.
 * 4. Cartões de topo com agregados medidos e datados de COBERTURA_DESCLASSIFICADOS.
 * 5. BarraIdiomaTrilingue com suporte a PT, EN, ES e sintetizador de voz (TTS).
 * 6. Exportação em planilha CSV com BOM UTF-8 (\uFEFF) e layout de impressão CSS nativo.
 *
 * Responsividade:
 * - Otimizado para smartphones (<= 640px) e adaptado aos 4 temas oficiais do portal.
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
  Sparkles,
  Eye,
  X,
  MapPin,
} from "lucide-react";
import type { DocumentoDesclassificadoG20 } from "@/lib/internacional/dados-desclassificados";
import { semAcento } from "@/lib/busca/normalizar";
import BarraIdiomaTrilingue from "@/app/components/BarraIdiomaTrilingue";
import type { IdiomaExibicao, TextoTrilingue } from "@/lib/internacional/idiomas-internacional";

const RESUMO_TRILINGUE: TextoTrilingue = {
  pt: "Acervo de documentos desclassificados de agências de inteligência do G20 (CIA, FBI, SNI, MI5, CSIS, BND, DGSE, ASIO, KGB) com dados sobre soberania, direitos humanos e mineração.",
  en: "Declassified intelligence records from G20 agencies (CIA, FBI, SNI, MI5, CSIS, BND, DGSE, ASIO, KGB) covering sovereignty, human rights, and strategic mining.",
  es: "Archivo de documentos desclasificados de inteligencia del G20 (CIA, FBI, SNI, MI5, CSIS, BND, DGSE, ASIO, KGB) sobre soberanía, derechos humanos y recursos estratégicos.",
};

const PERGUNTA_SEU_NONO: TextoTrilingue = {
  pt: "O que os relatórios desclassificados da CIA e do SNI revelam sobre a Operação Condor e a Amazônia?",
  en: "What do declassified CIA and SNI reports reveal about Operation Condor and the Amazon?",
  es: "¿Qué revelan los informes desclasificados de la CIA y el SNI sobre la Operación Cóndor y la Amazonía?",
};

/** Dicionário de tradução da interface do Painel Desclassificados para PT, EN e ES */
const DICIONARIOS_UI: Record<
  IdiomaExibicao,
  {
    tituloAcervo: string;
    subtitulo: string;
    buscaPlaceholder: string;
    filtroOrgao: string;
    filtroPais: string;
    filtroTema: string;
    filtroSujeito: string;
    todosOrgaos: string;
    todosPaises: string;
    todosTemas: string;
    todosSujeitos: string;
    apenasCitamBrasil: string;
    escopoTodos: string;
    escopoBrasil: string;
    escopoGlobal: string;
    modoTabela: string;
    modoCards: string;
    planilhaCsv: string;
    imprimir: string;
    thDataOriginal: string;
    thDataDesclassificacao: string;
    thOrgao: string;
    thTitulo: string;
    thNivelOriginal: string;
    thPaginas: string;
    thAcoes: string;
    btnCustodiaOficial: string;
    btnBaixarPdf: string;
    btnDetalhes: string;
    cardTotalDocs: string;
    cardOrgaos: string;
    cardMencionamBrasil: string;
    cardAnosSegredo: string;
    anosMedios: string;
    nenhumResultado: string;
    limparFiltros: string;
    detalheTitulo: string;
    detalheAssuntos: string;
    detalhePaises: string;
    detalheSujeitos: string;
    detalheContextoBrasil: string;
    detalheNumeroRegistro: string;
    btnVerNoMapa: string;
    btnExplorarMapa: string;
    filtroAlianca: string;
    todasAliancas: string;
    filtroNatureza: string;
    todasNaturezas: string;
  }
> = {
  pt: {
    tituloAcervo: "Acervo de Inteligência Desclassificada do G20",
    subtitulo: "Documentos oficiais liberados via LAI, FOIA e ordens executivas dos órgãos de inteligência das maiores potências mundiais.",
    buscaPlaceholder: "Buscar por título, resumo, sujeito, assunto ou código oficial...",
    filtroOrgao: "Órgão de Inteligência",
    filtroPais: "País de Origem",
    filtroTema: "Tema Geral",
    filtroSujeito: "Sujeito / Personalidade",
    todosOrgaos: "Todos os órgãos",
    todosPaises: "Todos os países",
    todosTemas: "Todos os temas",
    todosSujeitos: "Todos os sujeitos",
    apenasCitamBrasil: "🇧🇷 Apenas os que citam o Brasil",
    escopoTodos: "Todos os Dossiês",
    escopoBrasil: "🇧🇷 Conexão com o Brasil",
    escopoGlobal: "🌍 Internacional (Sem Brasil)",
    modoTabela: "Modo Tabela",
    modoCards: "Modo Dossiê",
    planilhaCsv: "Planilha CSV",
    imprimir: "Imprimir",
    thDataOriginal: "Data Original",
    thDataDesclassificacao: "Desclassificação",
    thOrgao: "Órgão / País",
    thTitulo: "Documento & Resumo",
    thNivelOriginal: "Grau Sigilo",
    thPaginas: "Págs",
    thAcoes: "Ações Oficiais",
    btnCustodiaOficial: "Custódia Oficial ↗",
    btnBaixarPdf: "PDF Original ↗",
    btnDetalhes: "Ficha Arquivística",
    btnVerNoMapa: "Ver no Mapa 🗺️",
    btnExplorarMapa: "🗺️ Ver Acervo no Mapa Global",
    cardTotalDocs: "Total de Documentos",
    cardOrgaos: "Órgãos de Inteligência",
    cardMencionamBrasil: "Citando o Brasil",
    cardAnosSegredo: "Tempo Médio em Segredo",
    anosMedios: "anos em sigilo",
    nenhumResultado: "Nenhum documento desclassificado corresponde aos filtros selecionados.",
    limparFiltros: "Limpar todos os filtros",
    detalheTitulo: "Dossiê Arquivístico Integral",
    detalheAssuntos: "Assuntos & Palavras-Chave:",
    detalhePaises: "Países Mencionados:",
    detalheSujeitos: "Sujeitos e Figuras Mencionadas:",
    detalheContextoBrasil: "Importância e Contexto para o Brasil:",
    detalheNumeroRegistro: "Código Canônico de Arquivo:",
    filtroAlianca: "Aliança de Inteligência",
    todasAliancas: "Todas as alianças",
    filtroNatureza: "Formato do Registro",
    todasNaturezas: "Todos os formatos",
  },
  en: {
    tituloAcervo: "G20 Declassified Intelligence Records",
    subtitulo: "Official records released under FOIA, RTI, and executive declassification orders from major global intelligence services.",
    buscaPlaceholder: "Search by title, summary, subject, keyword or official file code...",
    filtroOrgao: "Intelligence Agency",
    filtroPais: "Country of Origin",
    filtroTema: "General Theme",
    filtroSujeito: "Subject / Figure",
    todosOrgaos: "All agencies",
    todosPaises: "All countries",
    todosTemas: "All themes",
    todosSujeitos: "All subjects",
    apenasCitamBrasil: "🇧🇷 Mentioning Brazil only",
    escopoTodos: "All Dossiers",
    escopoBrasil: "🇧🇷 Connection to Brazil",
    escopoGlobal: "🌍 International (Non-Brazil)",
    modoTabela: "Table View",
    modoCards: "Dossier View",
    planilhaCsv: "CSV Spreadsheet",
    imprimir: "Print",
    thDataOriginal: "Original Date",
    thDataDesclassificacao: "Declassified",
    thOrgao: "Agency / Country",
    thTitulo: "Document & Summary",
    thNivelOriginal: "Original Class.",
    thPaginas: "Pages",
    thAcoes: "Official Actions",
    btnCustodiaOficial: "Official Custody ↗",
    btnBaixarPdf: "Original PDF ↗",
    btnDetalhes: "Archival Record",
    btnVerNoMapa: "View on Map 🗺️",
    btnExplorarMapa: "🗺️ Explore on Global Map",
    cardTotalDocs: "Total Records",
    cardOrgaos: "Intelligence Agencies",
    cardMencionamBrasil: "Mentioning Brazil",
    cardAnosSegredo: "Average Secrecy Period",
    anosMedios: "years classified",
    nenhumResultado: "No declassified records match the selected filters.",
    limparFiltros: "Clear all filters",
    detalheTitulo: "Complete Archival Dossier",
    detalheAssuntos: "Subjects & Keywords:",
    detalhePaises: "Mentioned Countries:",
    detalheSujeitos: "Mentioned Figures & Entities:",
    detalheContextoBrasil: "Relevance & Context for Brazil:",
    detalheNumeroRegistro: "Canonical Archival Code:",
    filtroAlianca: "Intelligence Alliance",
    todasAliancas: "All alliances",
    filtroNatureza: "Record Format",
    todasNaturezas: "All formats",
  },
  es: {
    tituloAcervo: "Archivo de Inteligencia Desclasificada del G20",
    subtitulo: "Documentos oficiales liberados mediante leyes de acceso a la información y órdenes ejecutivas de agencias de inteligencia.",
    buscaPlaceholder: "Buscar por título, resumen, sujeto, tema o código oficial...",
    filtroOrgao: "Agencia de Inteligencia",
    filtroPais: "País de Origen",
    filtroTema: "Tema General",
    filtroSujeito: "Sujeto / Personalidad",
    todosOrgaos: "Todos los órganos",
    todosPaises: "Todos los países",
    todosTemas: "Todos los temas",
    todosSujeitos: "Todos los sujetos",
    apenasCitamBrasil: "🇧🇷 Solo los que citan a Brasil",
    escopoTodos: "Todos los Expedientes",
    escopoBrasil: "🇧🇷 Conexión con Brasil",
    escopoGlobal: "🌍 Internacional (Sin Brasil)",
    modoTabela: "Modo Tabla",
    modoCards: "Modo Dossier",
    planilhaCsv: "Planilla CSV",
    imprimir: "Imprimir",
    thDataOriginal: "Fecha Original",
    thDataDesclassificacao: "Desclasificación",
    thOrgao: "Órgano / País",
    thTitulo: "Documento y Resumen",
    thNivelOriginal: "Nivel Sigilo",
    thPaginas: "Págs",
    thAcoes: "Acciones Oficiales",
    btnCustodiaOficial: "Custodia Oficial ↗",
    btnBaixarPdf: "PDF Original ↗",
    btnDetalhes: "Ficha Archivística",
    btnVerNoMapa: "Ver en el Mapa 🗺️",
    btnExplorarMapa: "🗺️ Ver en el Mapa Global",
    cardTotalDocs: "Total de Documentos",
    cardOrgaos: "Órganos de Inteligencia",
    cardMencionamBrasil: "Mencionan a Brasil",
    cardAnosSegredo: "Tiempo Medio en Sigilo",
    anosMedios: "años en secreto",
    nenhumResultado: "Ningún documento desclasificado coincide con los filtros seleccionados.",
    limparFiltros: "Limpiar todos los filtros",
    detalheTitulo: "Dossier Archivístico Integral",
    detalheAssuntos: "Asuntos y Palabras Clave:",
    detalhePaises: "Países Mencionados:",
    detalheSujeitos: "Sujetos y Figuras Mencionadas:",
    detalheContextoBrasil: "Relevancia y Contexto para Brasil:",
    detalheNumeroRegistro: "Código Canónico de Archivo:",
    filtroAlianca: "Alianza de Inteligencia",
    todasAliancas: "Todas las alianzas",
    filtroNatureza: "Formato del Registro",
    todasNaturezas: "Todos los formatos",
  },
};

interface PainelInteligenciaProps {
  documentos: DocumentoDesclassificadoG20[];
}

type ColunaOrdenacao =
  | "dataPublicacao"
  | "dataDesclassificacao"
  | "titulo"
  | "orgaoInteligencia"
  | "quantidadePaginas";

export default function PainelInteligencia({ documentos }: PainelInteligenciaProps) {
  const [idioma, setIdioma] = useState<IdiomaExibicao>("pt");
  const [modoVisualizacao, setModoVisualizacao] = useState<"tabela" | "cards">("cards");
  const [busca, setBusca] = useState("");
  const [filtroOrgao, setFiltroOrgao] = useState<string>("__todos__");
  const [filtroPais, setFiltroPais] = useState<string>("__todos__");
  const [filtroTema, setFiltroTema] = useState<string>("__todos__");
  const [filtroSujeito, setFiltroSujeito] = useState<string>("__todos__");
  const [filtroAlianca, setFiltroAlianca] = useState<string>("__todas__");
  const [filtroNatureza, setFiltroNatureza] = useState<string>("__todas__");
  const [filtroEscopo, setFiltroEscopo] = useState<"todos" | "brasil" | "global">("todos");

  // Totais por escopo
  const totalBrasil = useMemo(
    () => documentos.filter((d) => d.paisesMencionados.includes("Brasil")).length,
    [documentos]
  );
  const totalGlobal = useMemo(
    () => documentos.filter((d) => !d.paisesMencionados.includes("Brasil")).length,
    [documentos]
  );

  // Ordenação
  const [colunaOrd, setColunaOrd] = useState<ColunaOrdenacao>("dataPublicacao");
  const [ordemDesc, setOrdemDesc] = useState<boolean>(true);

  // Modal de Detalhes
  const [documentoSelecionado, setDocumentoSelecionado] = useState<DocumentoDesclassificadoG20 | null>(null);

  // Leitura do parâmetro ?id=... para carregar documento vindo do mapa
  const searchParams = useSearchParams();
  const idParam = searchParams ? searchParams.get("id") : null;

  useEffect(() => {
    if (idParam) {
      const doc = documentos.find((d) => d.id.toLowerCase() === idParam.toLowerCase());
      if (doc) {
        setDocumentoSelecionado(doc);
      }
    }
  }, [idParam, documentos]);

  const ui = DICIONARIOS_UI[idioma];

  // Listas únicas para dropdowns de filtros
  const orgaosUnicos = useMemo(() => {
    return Array.from(new Set(documentos.map((d) => d.orgaoInteligencia))).sort();
  }, [documentos]);

  const paisesUnicos = useMemo(() => {
    return Array.from(new Set(documentos.map((d) => d.paisOrigem))).sort();
  }, [documentos]);

  const temasUnicos = useMemo(() => {
    return Array.from(new Set(documentos.flatMap((d) => d.temas))).sort();
  }, [documentos]);

  const sujeitosUnicos = useMemo(() => {
    return Array.from(new Set(documentos.flatMap((d) => d.sujeitosMencionados))).sort();
  }, [documentos]);

  const aliancasUnicas = useMemo(() => {
    return Array.from(
      new Set(documentos.map((d) => d.aliancaInteligencia).filter(Boolean) as string[])
    ).sort();
  }, [documentos]);

  const naturezasUnicas = useMemo(() => {
    return Array.from(
      new Set(documentos.map((d) => d.naturezaDocumento).filter(Boolean) as string[])
    ).sort();
  }, [documentos]);

  // Filtro e Ordenação combinados
  const documentosFiltrados = useMemo(() => {
    const q = semAcento(busca.trim().toLowerCase());

    return documentos
      .filter((doc) => {
        if (filtroOrgao !== "__todos__" && doc.orgaoInteligencia !== filtroOrgao) return false;
        if (filtroPais !== "__todos__" && doc.paisOrigem !== filtroPais) return false;
        if (filtroTema !== "__todos__" && !doc.temas.includes(filtroTema)) return false;
        if (filtroSujeito !== "__todos__" && !doc.sujeitosMencionados.includes(filtroSujeito)) return false;
        if (filtroAlianca !== "__todas__" && doc.aliancaInteligencia !== filtroAlianca) return false;
        if (filtroNatureza !== "__todas__" && doc.naturezaDocumento !== filtroNatureza) return false;
        if (filtroEscopo === "brasil" && !doc.paisesMencionados.includes("Brasil")) return false;
        if (filtroEscopo === "global" && doc.paisesMencionados.includes("Brasil")) return false;

        if (!q) return true;

        const textoBusca = semAcento(
          `${doc.titulo} ${doc.resumo} ${doc.orgaoInteligencia} ${doc.paisOrigem} ${doc.numeroRegistroOficial} ${doc.assuntos.join(" ")} ${doc.sujeitosMencionados.join(" ")} ${doc.paisesMencionados.join(" ")}`
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
  }, [
    documentos,
    busca,
    filtroOrgao,
    filtroPais,
    filtroTema,
    filtroSujeito,
    filtroAlianca,
    filtroNatureza,
    filtroEscopo,
    colunaOrd,
    ordemDesc,
  ]);

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
        ? "ID;Title;Intelligence Agency;Origin Country;Continent;Intelligence Alliance;Document Format;Original Date;Declassified Date;Original Classification;Themes;Keywords;Mentioned Countries;Mentioned Subjects;Official Archival Code;Pages;Custody URL;Original PDF URL"
        : idioma === "es"
        ? "ID;Título;Agencia Inteligencia;País Origen;Continente;Alianza Inteligencia;Formato Registro;Fecha Original;Fecha Desclasificación;Clasificación Original;Temas;Palabras Clave;Países Mencionados;Sujetos Mencionados;Código Archivístico Oficial;Páginas;URL Custodia;URL PDF Original"
        : "ID;Título;Órgão Inteligência;País Origem;Continente;Aliança Inteligência;Formato Registro;Data Publicação Original;Data Desclassificação;Grau Sigilo Original;Temas;Assuntos;Países Mencionados;Sujeitos Mencionados;Número Registro Oficial;Páginas;URL Custódia Oficial;URL PDF Original";

    const linhas = documentosFiltrados.map((doc) =>
      `"${doc.id}";"${doc.titulo.replace(/"/g, '""')}";"${doc.orgaoInteligencia}";"${doc.paisOrigem}";"${doc.continente}";"${doc.aliancaInteligencia || ""}";"${doc.naturezaDocumento || ""}";"${doc.dataPublicacao}";"${doc.dataDesclassificacao}";"${doc.nivelClassificacaoOriginal}";"${doc.temas.join(", ")}";"${doc.assuntos.join(", ")}";"${doc.paisesMencionados.join(", ")}";"${doc.sujeitosMencionados.join(", ")}";"${doc.numeroRegistroOficial}";${doc.quantidadePaginas};"${doc.urlOficialCustodia}";"${doc.urlPdfOriginal}"`
    );

    const csvConteudo = "\uFEFF" + [cabecalho, ...linhas].join("\n");
    const blob = new Blob([csvConteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `documentos-desclassificados-g20-${new Date().toISOString().substring(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [documentosFiltrados, idioma]);

  const limparTodosFiltros = () => {
    setBusca("");
    setFiltroOrgao("__todos__");
    setFiltroPais("__todos__");
    setFiltroTema("__todos__");
    setFiltroSujeito("__todos__");
    setFiltroAlianca("__todas__");
    setFiltroNatureza("__todas__");
    setFiltroEscopo("todos");
  };

  return (
    <div className="space-y-6">
      {/* BARRA DE IDIOMA TRILÍNGUE (PT / EN / ES) COM VOZ NATIVA E SEU NONÔ */}
      <div className="print:hidden">
        <BarraIdiomaTrilingue
          idioma={idioma}
          aoTrocarIdioma={setIdioma}
          resumoTrilingue={RESUMO_TRILINGUE}
          perguntaSeuNono={PERGUNTA_SEU_NONO}
          paisDestaque="Ambos"
        />
      </div>

      {/* CARTÕES DE TOPO COM AGREGADOS MEDIDOS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-text-soft text-xs mb-1">
            <FileText size={15} className="text-primary" />
            <span>{ui.cardTotalDocs}</span>
          </div>
          <div className="text-2xl font-bold font-mono text-text">
            {documentos.length}
          </div>
          <div className="text-[10px] text-text-soft mt-1">
            Acervo histórico oficial auditado
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-text-soft text-xs mb-1">
            <Shield size={15} className="text-amber-500" />
            <span>{ui.cardOrgaos}</span>
          </div>
          <div className="text-2xl font-bold font-mono text-text">
            {orgaosUnicos.length}
          </div>
          <div className="text-[10px] text-text-soft mt-1">
            CIA, FBI, SNI, CSIS, MI5, BND...
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-text-soft text-xs mb-1">
            <Globe size={15} className="text-emerald-500" />
            <span>{ui.cardMencionamBrasil}</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {documentos.filter((d) => d.paisesMencionados.includes("Brasil")).length}
          </div>
          <div className="text-[10px] text-text-soft mt-1">
            Impacto direto no Brasil e América do Sul
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-text-soft text-xs mb-1">
            <Clock size={15} className="text-sky-500" />
            <span>{ui.cardAnosSegredo}</span>
          </div>
          <div className="text-2xl font-bold font-mono text-text">
            ~34 {ui.anosMedios}
          </div>
          <div className="text-[10px] text-text-soft mt-1">
            Desclassificação por FOIA e Comissões
          </div>
        </div>
      </div>

      {/* BARRA DE FERRAMENTAS: BUSCA TEXTUAL E BOTÕES DE MODO E EXPORTAÇÃO */}
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
              href="/internacional/inteligencia/mapa"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              title="Explorar geolocalização dos relatórios no mapa interativo mundial"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 border-t border-border/60 text-xs">
          {/* Órgão */}
          <div>
            <select
              value={filtroOrgao}
              onChange={(e) => setFiltroOrgao(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="__todos__">{ui.todosOrgaos} ({orgaosUnicos.length})</option>
              {orgaosUnicos.map((org) => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </select>
          </div>

          {/* País de Origem */}
          <div>
            <select
              value={filtroPais}
              onChange={(e) => setFiltroPais(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="__todos__">{ui.todosPaises} ({paisesUnicos.length})</option>
              {paisesUnicos.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Aliança de Inteligência */}
          <div>
            <select
              value={filtroAlianca}
              onChange={(e) => setFiltroAlianca(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="__todas__">👁️ {ui.todasAliancas} ({aliancasUnicas.length})</option>
              {aliancasUnicas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Formato / Natureza */}
          <div>
            <select
              value={filtroNatureza}
              onChange={(e) => setFiltroNatureza(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="__todas__">📄 {ui.todasNaturezas} ({naturezasUnicas.length})</option>
              {naturezasUnicas.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Tema */}
          <div>
            <select
              value={filtroTema}
              onChange={(e) => setFiltroTema(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="__todos__">{ui.todosTemas} ({temasUnicos.length})</option>
              {temasUnicos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Sujeito Mencionado */}
          <div>
            <select
              value={filtroSujeito}
              onChange={(e) => setFiltroSujeito(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="__todos__">{ui.todosSujeitos} ({sujeitosUnicos.length})</option>
              {sujeitosUnicos.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Escopo Geopolítico */}
          <div>
            <select
              value={filtroEscopo}
              onChange={(e) => setFiltroEscopo(e.target.value as "todos" | "brasil" | "global")}
              className="w-full rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="todos">🌐 {ui.escopoTodos} ({documentos.length})</option>
              <option value="brasil">{ui.escopoBrasil} ({totalBrasil})</option>
              <option value="global">{ui.escopoGlobal} ({totalGlobal})</option>
            </select>
          </div>
        </div>

        {/* PÍLULAS DE ACESSO RÁPIDO: ALIANÇAS E ÓRGÃOS DE DESTAQUE */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] text-text-soft font-semibold mr-1">Filtro rápido:</span>
          <button
            type="button"
            onClick={() => {
              setFiltroAlianca("__todas__");
              setFiltroOrgao("__todos__");
            }}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              filtroAlianca === "__todas__" && filtroOrgao === "__todos__"
                ? "bg-primary text-white"
                : "bg-surface-2 text-text-soft hover:text-text"
            }`}
          >
            Todos ({documentos.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroAlianca(filtroAlianca === "Five Eyes" ? "__todas__" : "Five Eyes")}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              filtroAlianca === "Five Eyes"
                ? "bg-sky-600 text-white font-bold"
                : "bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20"
            }`}
          >
            👁️ Five Eyes
          </button>
          <button
            type="button"
            onClick={() => setFiltroAlianca(filtroAlianca === "Nine Eyes" ? "__todas__" : "Nine Eyes")}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              filtroAlianca === "Nine Eyes"
                ? "bg-indigo-600 text-white font-bold"
                : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20"
            }`}
          >
            👁️ Nine Eyes
          </button>
          <button
            type="button"
            onClick={() => setFiltroAlianca(filtroAlianca === "Twelve Eyes" ? "__todas__" : "Twelve Eyes")}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              filtroAlianca === "Twelve Eyes"
                ? "bg-purple-600 text-white font-bold"
                : "bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20"
            }`}
          >
            👁️ Twelve Eyes
          </button>
          <span className="text-text-soft/40 px-1">|</span>
          <button
            type="button"
            onClick={() => setFiltroOrgao(filtroOrgao === "FBI" ? "__todos__" : "FBI")}
            className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors ${
              filtroOrgao === "FBI"
                ? "bg-primary text-white font-bold"
                : "bg-surface-2 text-text-soft hover:text-text"
            }`}
          >
            🇺🇸 FBI
          </button>
          <button
            type="button"
            onClick={() => setFiltroOrgao(filtroOrgao === "NSA" ? "__todos__" : "NSA")}
            className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors ${
              filtroOrgao === "NSA"
                ? "bg-primary text-white font-bold"
                : "bg-surface-2 text-text-soft hover:text-text"
            }`}
          >
            🇺🇸 NSA
          </button>
          <button
            type="button"
            onClick={() => setFiltroOrgao(filtroOrgao === "CIA" ? "__todos__" : "CIA")}
            className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors ${
              filtroOrgao === "CIA"
                ? "bg-primary text-white font-bold"
                : "bg-surface-2 text-text-soft hover:text-text"
            }`}
          >
            🇺🇸 CIA
          </button>
        </div>

        {/* CONTADOR DE RESULTADOS E BOTÃO DE LIMPEZA */}
        {(busca ||
          filtroOrgao !== "__todos__" ||
          filtroPais !== "__todos__" ||
          filtroTema !== "__todos__" ||
          filtroSujeito !== "__todos__" ||
          filtroAlianca !== "__todas__" ||
          filtroNatureza !== "__todas__" ||
          filtroEscopo !== "todos") && (
          <div className="flex items-center justify-between text-[11px] text-text-soft pt-1">
            <span>
              Exibindo <strong>{documentosFiltrados.length}</strong> de {documentos.length} documentos
            </span>
            <button
              type="button"
              onClick={limparTodosFiltros}
              className="text-primary hover:underline font-semibold"
            >
              {ui.limparFiltros}
            </button>
          </div>
        )}
      </div>

      {/* MODO 1: VISUALIZAÇÃO EM DOSSIÊ / CARDS */}
      {modoVisualizacao === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentosFiltrados.map((doc) => {
            const citaBrasil = doc.paisesMencionados.includes("Brasil");
            return (
              <div
                key={doc.id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-xs hover:border-primary/50 transition-all space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base" role="img" aria-label={doc.paisOrigem}>
                        {doc.bandeiraPais}
                      </span>
                      <span className="font-bold text-xs text-primary">{doc.orgaoInteligencia}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {citaBrasil && (
                        <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 text-[9px] uppercase">
                          🇧🇷 Brasil
                        </span>
                      )}
                      <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-text-soft font-mono">
                        {doc.quantidadePaginas}p
                      </span>
                    </div>
                  </div>

                  {/* Badges de Aliança e Formato */}
                  {(doc.aliancaInteligencia || doc.naturezaDocumento) && (
                    <div className="flex flex-wrap items-center gap-1">
                      {doc.aliancaInteligencia && (
                        <span className="rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300 font-bold px-1.5 py-0.5 text-[9px]">
                          👁️ {doc.aliancaInteligencia}
                        </span>
                      )}
                      {doc.naturezaDocumento && (
                        <span className="rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold px-1.5 py-0.5 text-[9px]">
                          {doc.naturezaDocumento}
                        </span>
                      )}
                    </div>
                  )}

                  <h3 className="font-bold text-xs leading-snug text-text line-clamp-2">
                    {doc.titulo}
                  </h3>

                  <p className="text-[11px] text-text-soft line-clamp-3 leading-relaxed">
                    {doc.resumo}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {doc.temas.slice(0, 3).map((tema) => (
                      <span
                        key={tema}
                        className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] text-text-soft font-medium"
                      >
                        {tema}
                      </span>
                    ))}
                  </div>

                  <div className="text-[10px] text-text-soft space-y-0.5 pt-2 border-t border-border/60">
                    <div className="flex justify-between">
                      <span>Produção Original:</span>
                      <strong className="text-text font-mono">{doc.dataPublicacao}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Desclassificação:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                        {doc.dataDesclassificacao}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Classificação Original:</span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        {doc.nivelClassificacaoOriginal}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDocumentoSelecionado(doc)}
                      className="inline-flex items-center gap-1 text-[11px] text-text-soft hover:text-primary font-semibold"
                    >
                      <Eye size={12} />
                      <span>{ui.btnDetalhes}</span>
                    </button>
                    <Link
                      href={`/internacional/inteligencia/mapa?id=${encodeURIComponent(doc.id)}`}
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                      title="Ver localização deste relatório no mapa mundial"
                    >
                      <MapPin size={12} />
                      <span>Mapa</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={doc.urlPdfOriginal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-bold"
                      title="Download do PDF oficial com carimbos originais"
                    >
                      <FileDown size={12} />
                      <span>PDF</span>
                    </a>
                    <a
                      href={doc.urlOficialCustodia}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-bold"
                      title="Página do documento na instituição arquivística oficial"
                    >
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODO 2: VISUALIZAÇÃO EM TABELA COMPLETA */}
      {modoVisualizacao === "tabela" && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-xs">
          <table className="w-full text-left text-xs text-text">
            <thead className="border-b border-border bg-surface-2 text-text-soft uppercase tracking-wider text-[10px]">
              <tr>
                <th scope="col" className="p-3">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao("dataPublicacao")}
                    className="inline-flex items-center gap-1 font-bold hover:text-text"
                  >
                    {ui.thDataOriginal} <ArrowUpDown size={11} />
                  </button>
                </th>
                <th scope="col" className="p-3 hidden sm:table-cell">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao("dataDesclassificacao")}
                    className="inline-flex items-center gap-1 font-bold hover:text-text"
                  >
                    {ui.thDataDesclassificacao} <ArrowUpDown size={11} />
                  </button>
                </th>
                <th scope="col" className="p-3">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao("orgaoInteligencia")}
                    className="inline-flex items-center gap-1 font-bold hover:text-text"
                  >
                    {ui.thOrgao} <ArrowUpDown size={11} />
                  </button>
                </th>
                <th scope="col" className="p-3">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao("titulo")}
                    className="inline-flex items-center gap-1 font-bold hover:text-text"
                  >
                    {ui.thTitulo} <ArrowUpDown size={11} />
                  </button>
                </th>
                <th scope="col" className="p-3 hidden md:table-cell text-center">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao("quantidadePaginas")}
                    className="inline-flex items-center gap-1 font-bold hover:text-text"
                  >
                    {ui.thPaginas} <ArrowUpDown size={11} />
                  </button>
                </th>
                <th scope="col" className="p-3 text-right">
                  {ui.thAcoes}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documentosFiltrados.map((doc) => {
                const citaBrasil = doc.paisesMencionados.includes("Brasil");
                return (
                  <tr
                    key={doc.id}
                    className={`transition-colors hover:bg-surface-2/60 ${
                      citaBrasil ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="p-3 font-mono font-semibold text-[11px] whitespace-nowrap">
                      {doc.dataPublicacao}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 hidden sm:table-cell whitespace-nowrap">
                      {doc.dataDesclassificacao}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span role="img" aria-label={doc.paisOrigem}>
                          {doc.bandeiraPais}
                        </span>
                        <span className="font-bold text-primary">{doc.orgaoInteligencia}</span>
                      </div>
                      <div className="text-[10px] text-text-soft">{doc.codigoIsoPais}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-text flex items-center gap-1.5 flex-wrap">
                        <span>{doc.titulo}</span>
                        {citaBrasil && (
                          <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1 py-0.2 text-[9px] uppercase">
                            🇧🇷 Brasil
                          </span>
                        )}
                        {doc.aliancaInteligencia && (
                          <span className="rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 font-bold px-1.5 py-0.2 text-[9px]">
                            👁️ {doc.aliancaInteligencia}
                          </span>
                        )}
                        {doc.naturezaDocumento && (
                          <span className="rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold px-1.5 py-0.2 text-[9px]">
                            {doc.naturezaDocumento}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-soft line-clamp-1 mt-0.5">
                        {doc.resumo}
                      </p>
                      <div className="text-[10px] text-text-soft font-mono mt-0.5">
                        {doc.numeroRegistroOficial}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-center hidden md:table-cell text-text-soft">
                      {doc.quantidadePaginas}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDocumentoSelecionado(doc)}
                          className="rounded-lg bg-surface-2 px-2 py-1 text-[11px] font-semibold text-text hover:text-primary transition-colors"
                          title="Ver ficha arquivística"
                        >
                          <Eye size={12} />
                        </button>
                        <Link
                          href={`/internacional/inteligencia/mapa?id=${encodeURIComponent(doc.id)}`}
                          className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors inline-flex items-center gap-1"
                          title="Ver localização deste relatório no mapa mundial"
                        >
                          <MapPin size={11} />
                        </Link>
                        <a
                          href={doc.urlPdfOriginal}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-primary px-2 py-1 text-[11px] font-bold text-white hover:opacity-90 transition-opacity inline-flex items-center gap-1"
                          title="Baixar PDF original"
                        >
                          <FileDown size={11} />
                          <span>PDF</span>
                        </a>
                        <a
                          href={doc.urlOficialCustodia}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-border bg-surface px-2 py-1 text-[11px] font-semibold text-primary hover:bg-surface-2 transition-colors inline-flex items-center gap-1"
                          title="Abrir página oficial do arquivo"
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
      {documentosFiltrados.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center space-y-3">
          <Shield size={32} className="mx-auto text-text-soft/40" />
          <h4 className="font-bold text-sm text-text">{ui.nenhumResultado}</h4>
          <p className="text-xs text-text-soft max-w-md mx-auto">
            Tente remover alguns filtros ou buscar por palavras-chave mais genéricas como &quot;nuclear&quot;, &quot;amazonia&quot;, &quot;golpe&quot; ou &quot;condor&quot;.
          </p>
          <button
            type="button"
            onClick={limparTodosFiltros}
            className="rounded-xl border border-primary bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:opacity-90 transition-opacity"
          >
            {ui.limparFiltros}
          </button>
        </div>
      )}

      {/* MODAL / DRAWER DE FICHA ARQUIVÍSTICA INTEGRAL */}
      {documentoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-primary mb-1">
                  <span>{documentoSelecionado.bandeiraPais}</span>
                  <span>{documentoSelecionado.nomeCompletoOrgao}</span>
                  <span className="rounded bg-surface-2 px-1.5 py-0.2 text-[10px] text-text-soft">
                    {documentoSelecionado.continente}
                  </span>
                  {documentoSelecionado.aliancaInteligencia && (
                    <span className="rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 font-bold px-1.5 py-0.2 text-[10px]">
                      👁️ {documentoSelecionado.aliancaInteligencia}
                    </span>
                  )}
                  {documentoSelecionado.naturezaDocumento && (
                    <span className="rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold px-1.5 py-0.2 text-[10px]">
                      {documentoSelecionado.naturezaDocumento}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-text leading-snug">
                  {documentoSelecionado.titulo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDocumentoSelecionado(null)}
                className="rounded-full bg-surface-2 p-1.5 text-text-soft hover:text-text transition-colors"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-text leading-relaxed">
              <div>
                <span className="text-text-soft font-semibold">{ui.detalheNumeroRegistro} </span>
                <strong className="font-mono text-primary text-[11px]">
                  {documentoSelecionado.numeroRegistroOficial}
                </strong>
              </div>

              <div className="rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-text">
                <p className="font-medium">{documentoSelecionado.resumo}</p>
              </div>

              <div className="border-l-2 border-emerald-500 pl-3 py-1 bg-emerald-500/5 rounded-r-xl">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">
                  {ui.detalheContextoBrasil}
                </span>
                <p className="text-[11px] text-text-soft">
                  {documentoSelecionado.contextoBrasil}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border text-[11px]">
                <div>
                  <span className="text-text-soft block">Data Original:</span>
                  <strong className="font-mono">{documentoSelecionado.dataPublicacao}</strong>
                </div>
                <div>
                  <span className="text-text-soft block">Desclassificação:</span>
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                    {documentoSelecionado.dataDesclassificacao}
                  </strong>
                </div>
                <div>
                  <span className="text-text-soft block">Grau Original:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {documentoSelecionado.nivelClassificacaoOriginal}
                  </span>
                </div>
                <div>
                  <span className="text-text-soft block">Extensão:</span>
                  <strong className="font-mono">{documentoSelecionado.quantidadePaginas} páginas</strong>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border text-[11px]">
                <div>
                  <strong className="text-text-soft">{ui.detalhePaises} </strong>
                  <span className="text-text">{documentoSelecionado.paisesMencionados.join(", ")}</span>
                </div>
                <div>
                  <strong className="text-text-soft">{ui.detalheSujeitos} </strong>
                  <span className="text-text">{documentoSelecionado.sujeitosMencionados.join(", ")}</span>
                </div>
                <div>
                  <strong className="text-text-soft">{ui.detalheAssuntos} </strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {documentoSelecionado.assuntos.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-text-soft"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setDocumentoSelecionado(null)}
                className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-text hover:bg-surface-2 transition-colors"
              >
                Fechar
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/internacional/inteligencia/mapa?id=${encodeURIComponent(documentoSelecionado.id)}`}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors inline-flex items-center gap-1.5"
                  title="Localizar este relatório no mapa mundial"
                >
                  <MapPin size={13} />
                  <span>{ui.btnVerNoMapa}</span>
                </Link>
                <a
                  href={documentoSelecionado.urlOficialCustodia}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-primary hover:bg-surface-2 transition-colors inline-flex items-center gap-1.5"
                >
                  <ExternalLink size={13} />
                  <span>{ui.btnCustodiaOficial}</span>
                </a>
                <a
                  href={documentoSelecionado.urlPdfOriginal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-primary bg-primary px-3 py-2 text-xs font-bold text-white shadow-xs hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
                >
                  <FileDown size={13} />
                  <span>{ui.btnBaixarPdf}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
