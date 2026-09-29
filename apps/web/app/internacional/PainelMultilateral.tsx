"use client";

/**
 * @file apps/web/app/internacional/PainelMultilateral.tsx
 * @description Painel interativo de dados multilaterais (ONU, UNESCO, OMS, OMC, Territórios).
 *
 * Papel no portal:
 * Permite ao cidadão e ao pesquisador comparar o Brasil com o G8 e G20 sob as 6 Qualidades:
 * 1. Links diretos e verificados para fontes oficiais (Banco Mundial, PNUD, UNESCO, OMS, OMC).
 * 2. Busca em tempo real tolerante a acentos e filtros facetados (por país e indicador).
 * 3. Ordenação crescente/decrescente em todas as colunas numéricas e nominais.
 * 4. Cartões de topo com agregados oficiais medidos e datados.
 * 5. Tags de contexto cívico para o assistente Seu Nonô com frases curtas de até 13 palavras.
 * 6. Exportação de planilha CSV com BOM UTF-8 (\uFEFF) e separador ponto-e-vírgula (;),
 *    mais formatação CSS nativa para impressão (@media print).
 *
 * Decisões técnicas e de responsividade:
 * - Responsivo para smartphones (<= 640px): abas com rolagem horizontal e tabelas sem quebra.
 * - Suporta os 4 temas do portal: Pequi, Claro, Escuro e Alto Contraste.
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Search,
  ArrowUpDown,
  Download,
  ExternalLink,
  Printer,
  Sparkles,
  Globe,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  HeartPulse,
  GraduationCap,
  Users,
  Compass,
} from "lucide-react";
import type {
  IndicadorSocialMultilateral,
  ComercioCommodityMultilateral,
  TerritorioGlobal,
} from "@/lib/internacional/dados-multilaterais";
import { semAcento } from "@/lib/busca/normalizar";
import BarraIdiomaTrilingue from "@/app/components/BarraIdiomaTrilingue";
import type { IdiomaExibicao, TextoTrilingue } from "@/lib/internacional/idiomas-internacional";

const RESUMO_TRILINGUE: TextoTrilingue = {
  pt: "Portal cívico internacional: compare o Brasil com potências do G8 e G20 em desenvolvimento humano, desigualdade, gastos sociais, minérios e direitos indígenas.",
  en: "International civic portal: compare Brazil with G8 and G20 powers in human development, inequality, social spending, minerals and indigenous rights.",
  es: "Portal cívico internacional: compare Brasil con potencias del G8 y G20 en desarrollo humano, desigualdad, gasto social, minerales y derechos indígenas.",
};

const PERGUNTA_SEU_NONO: TextoTrilingue = {
  pt: "Como o IDH e a desigualdade do Brasil se comparam aos países do G20?",
  en: "How do Brazil's HDI and inequality compare to G20 countries?",
  es: "¿Cómo se comparan el IDH y la desigualdad de Brasil con los países del G20?",
};

/** Dicionário de tradução da interface do Painel Multilateral para PT, EN e ES */
const DICIONARIOS_UI: Record<
  IdiomaExibicao,
  {
    abaSociais: string;
    abaComercio: string;
    abaTerritorios: string;
    buscaPlaceholder: string;
    todosPaises: string;
    planilhaCsv: string;
    imprimir: string;
    thPais: string;
    thIdh: string;
    thGini: string;
    thEducacao: string;
    thSaude: string;
    thVida: string;
    thFonte: string;
    referencia: string;
    origem: string;
    destino: string;
    volumeEstimado: string;
    milhoesAno: string;
    faturamentoFob: string;
    milhoesUsd: string;
    portoEmbarque: string;
    portoEntrega: string;
    povoOriginario: string;
    areaDemarcada: string;
    hectares: string;
    sobreposicaoMineraria: string;
    titulosSobrepostos: string;
    focosCalor: string;
    focosAno: string;
    verDemarcacao: string;
    nenhumResultado: string;
  }
> = {
  pt: {
    abaSociais: "Indicadores Sociais (ONU/UNESCO/OMS)",
    abaComercio: "Comércio de Minérios (OMC)",
    abaTerritorios: "Terra e Povos Originários",
    buscaPlaceholder: "Buscar por país, código ou contexto...",
    todosPaises: "Todos os países",
    planilhaCsv: "Planilha CSV",
    imprimir: "Imprimir",
    thPais: "País",
    thIdh: "IDH (PNUD)",
    thGini: "Gini Desigualdade",
    thEducacao: "Educação % PIB",
    thSaude: "Saúde % PIB",
    thVida: "Vida (Anos)",
    thFonte: "Fonte Oficial",
    referencia: "Referência",
    origem: "Origem:",
    destino: "Destino Principal:",
    volumeEstimado: "Volume Estimado:",
    milhoesAno: "Milhões t/ano",
    faturamentoFob: "Faturamento FOB:",
    milhoesUsd: "Milhões",
    portoEmbarque: "Porto de Embarque:",
    portoEntrega: "Porto de Entrega:",
    povoOriginario: "Povo Originário:",
    areaDemarcada: "Área Demarcada:",
    hectares: "hectares",
    sobreposicaoMineraria: "Sobreposição Minerária:",
    titulosSobrepostos: "títulos ANM/BIA",
    focosCalor: "Focos de Calor (Satélite):",
    focosAno: "focos/ano",
    verDemarcacao: "Ver demarcação",
    nenhumResultado: "Nenhum registro encontrado.",
  },
  en: {
    abaSociais: "Social Indicators (UN/UNESCO/WHO)",
    abaComercio: "Minerals Trade (WTO)",
    abaTerritorios: "Land & Indigenous Peoples",
    buscaPlaceholder: "Search by country, code or context...",
    todosPaises: "All countries",
    planilhaCsv: "CSV Spreadsheet",
    imprimir: "Print",
    thPais: "Country",
    thIdh: "HDI (UNDP)",
    thGini: "Gini Inequality",
    thEducacao: "Education % GDP",
    thSaude: "Health % GDP",
    thVida: "Life (Years)",
    thFonte: "Official Source",
    referencia: "Benchmark",
    origem: "Origin:",
    destino: "Main Destination:",
    volumeEstimado: "Estimated Volume:",
    milhoesAno: "Million t/yr",
    faturamentoFob: "FOB Revenue:",
    milhoesUsd: "Million",
    portoEmbarque: "Loading Port:",
    portoEntrega: "Discharge Port:",
    povoOriginario: "Indigenous People:",
    areaDemarcada: "Demarcated Area:",
    hectares: "hectares",
    sobreposicaoMineraria: "Mining Overlap:",
    titulosSobrepostos: "claims ANM/BIA",
    focosCalor: "Heat Spots (Satellite):",
    focosAno: "spots/yr",
    verDemarcacao: "View boundary",
    nenhumResultado: "No records found.",
  },
  es: {
    abaSociais: "Indicadores Sociales (ONU/UNESCO/OMS)",
    abaComercio: "Comercio de Minerales (OMC)",
    abaTerritorios: "Tierra y Pueblos Originarios",
    buscaPlaceholder: "Buscar por país, código o contexto...",
    todosPaises: "Todos los países",
    planilhaCsv: "Planilla CSV",
    imprimir: "Imprimir",
    thPais: "País",
    thIdh: "IDH (PNUD)",
    thGini: "Gini Desigualdad",
    thEducacao: "Educación % PIB",
    thSaude: "Salud % PIB",
    thVida: "Vida (Años)",
    thFonte: "Fuente Oficial",
    referencia: "Referencia",
    origem: "Origen:",
    destino: "Destino Principal:",
    volumeEstimado: "Volumen Estimado:",
    milhoesAno: "Millones t/año",
    faturamentoFob: "Facturación FOB:",
    milhoesUsd: "Millones",
    portoEmbarque: "Puerto de Embarque:",
    portoEntrega: "Puerto de Entrega:",
    povoOriginario: "Pueblo Originario:",
    areaDemarcada: "Área Demarcada:",
    hectares: "hectáreas",
    sobreposicaoMineraria: "Superposición Minera:",
    titulosSobrepostos: "títulos ANM/BIA",
    focosCalor: "Focos de Calor (Satélite):",
    focosAno: "focos/año",
    verDemarcacao: "Ver demarcación",
    nenhumResultado: "No se encontraron registros.",
  },
};

interface PainelMultilateralProps {
  indicadores: IndicadorSocialMultilateral[];
  comercio: ComercioCommodityMultilateral[];
  territorios: TerritorioGlobal[];
}

type AbaTipo = "sociais" | "comercio" | "territorios";

export default function PainelMultilateral({
  indicadores,
  comercio,
  territorios,
}: PainelMultilateralProps) {
  const [idioma, setIdioma] = useState<IdiomaExibicao>("pt");
  const [abaAtiva, setAbaAtiva] = useState<AbaTipo>("sociais");
  const [busca, setBusca] = useState("");
  const [paisFiltro, setPaisFiltro] = useState<string>("__todos__");

  // Rótulos de interface traduzidos dinamicamente conforme o idioma selecionado
  const ui = DICIONARIOS_UI[idioma];

  // Ordenação para Indicadores Sociais
  const [colunaOrdSociais, setColunaOrdSociais] = useState<keyof IndicadorSocialMultilateral>("idh");
  const [ordemDescSociais, setOrdemDescSociais] = useState(true);

  // Lista de países únicos para o filtro
  const paisesUnicos = useMemo(() => {
    return Array.from(new Set(indicadores.map((i) => i.pais))).sort();
  }, [indicadores]);

  // Filtro e Ordenação: Indicadores Sociais
  const indicadoresFiltrados = useMemo(() => {
    const q = semAcento(busca.trim().toLowerCase());
    return indicadores
      .filter((item) => {
        if (paisFiltro !== "__todos__" && item.pais !== paisFiltro) return false;
        if (!q) return true;
        const textoBusca = semAcento(
          `${item.pais} ${item.codigoIso3} ${item.resumoContexto} ${item.fonteOficial}`
        ).toLowerCase();
        return textoBusca.includes(q);
      })
      .sort((a, b) => {
        const valA = a[colunaOrdSociais];
        const valB = b[colunaOrdSociais];
        if (typeof valA === "number" && typeof valB === "number") {
          return ordemDescSociais ? valB - valA : valA - valB;
        }
        const strA = String(valA || "").toLowerCase();
        const strB = String(valB || "").toLowerCase();
        return ordemDescSociais ? strB.localeCompare(strA) : strA.localeCompare(strB);
      });
  }, [indicadores, busca, paisFiltro, colunaOrdSociais, ordemDescSociais]);

  // Alternador de ordenação
  const alternarOrdenacaoSociais = useCallback((coluna: keyof IndicadorSocialMultilateral) => {
    setColunaOrdSociais((prev) => {
      if (prev === coluna) {
        setOrdemDescSociais((d) => !d);
        return coluna;
      }
      setOrdemDescSociais(true);
      return coluna;
    });
  }, []);

  // Exportação CSV (Regra da Qualidade 6 adaptável ao idioma)
  const exportarCsv = useCallback(() => {
    let cabecalho = "";
    let linhas: string[] = [];
    let nomeArquivo = "";

    if (abaAtiva === "sociais") {
      cabecalho =
        idioma === "en"
          ? "Country;ISO3 Code;HDI;Gini Index;Gender Inequality (GII);Education Spending % GDP;Health Spending % GDP;Life Expectancy;Official Source;Direct URL"
          : idioma === "es"
          ? "País;Código ISO3;IDH;Índice de Gini;Desigualdad Género (GII);Gasto Educación % PIB;Gasto Salud % PIB;Esperanza de Vida;Fuente Oficial;URL Directa"
          : "País;Código ISO3;IDH;Índice de Gini;Desigualdade Gênero (GII);Gastos Educação % PIB;Gastos Saúde % PIB;Expectativa de Vida;Fonte Oficial;URL Direta";

      linhas = indicadoresFiltrados.map((item) =>
        `"${item.pais}";"${item.codigoIso3}";${item.idh};${item.gini};${item.desigualdadeGeneroGii};${item.gastoEducacaoPib};${item.gastoSaudePib};${item.expectativaVida};"${item.fonteOficial}";"${item.urlOficial}"`
      );
      nomeArquivo = `indicadores-sociais-multilaterais-${new Date().toISOString().substring(0, 10)}.csv`;
    } else if (abaAtiva === "comercio") {
      cabecalho =
        idioma === "en"
          ? "Commodity/Mineral;HS Code;Origin;Destination;Annual Volume (t);FOB Value (USD Million);Loading Port;Discharge Port;Official Source;Direct URL"
          : idioma === "es"
          ? "Mineral/Commodity;Código HS;Origen;Destino;Volumen Anual (t);Valor FOB (US$ Millones);Puerto Embarque;Puerto Destino;Fuente Oficial;URL Directa"
          : "Commodity/Minério;Código HS;Origem;Destino;Volume Anual (t);Valor FOB (US$ Mi);Porto Embarque;Porto Destino;Fonte Oficial;URL Direta";

      linhas = comercio.map((c) =>
        `"${c.mineralOuCommodity}";"${c.codigoHs}";"${c.origemPais}";"${c.destinoPais}";${c.volumeAnualToneladas};${c.valorFobUsdMilhoes};"${c.portoEmbarqueBrasil}";"${c.portoDestino}";"${c.fonteNome}";"${c.urlOficial}"`
      );
      nomeArquivo = `comercio-commodities-multilateral-${new Date().toISOString().substring(0, 10)}.csv`;
    } else {
      cabecalho =
        idioma === "en"
          ? "Territory;Country;Indigenous People;Area (ha);Demarcation Status;Overlapping Claims;Satellite Heat Spots;Responsible Agency;Direct URL"
          : idioma === "es"
          ? "Territorio;País;Pueblo Originario;Área (ha);Estado Demarcación;Superposición Minera;Focos Calor Satélite;Órgano Responsable;URL Directa"
          : "Território;País;Povo Originário;Área (ha);Status Demarcação;Concessões Sobrepostas;Focos Calor Satélite;Órgão Responsável;URL Direta";

      linhas = territorios.map((t) =>
        `"${t.nomeTerritorio}";"${t.pais}";"${t.povoOriginario}";${t.areaHectares};"${t.statusDemarcacao}";${t.concessoesMinerariasSobrepostas};${t.focosCalorAnuaisSat};"${t.orgaoResponsavel}";"${t.urlOficial}"`
      );
      nomeArquivo = `territorios-indigenas-global-${new Date().toISOString().substring(0, 10)}.csv`;
    }

    const csvConteudo = "\uFEFF" + [cabecalho, ...linhas].join("\n");
    const blob = new Blob([csvConteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [abaAtiva, indicadoresFiltrados, comercio, territorios, idioma]);

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

      {/* SELETOR DE ABAS PRINCIPAIS — OTIMIZADO PARA MOBILE COM SCROLL HORIZONTAL */}
      <div className="flex border-b border-border pb-2 overflow-x-auto no-scrollbar gap-2 print:hidden">
        <button
          type="button"
          onClick={() => setAbaAtiva("sociais")}
          className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-colors sm:text-sm ${
            abaAtiva === "sociais"
              ? "bg-primary text-white shadow-xs"
              : "bg-surface text-text-soft hover:bg-surface-2 hover:text-text border border-border"
          }`}
        >
          <Users size={16} />
          <span>{ui.abaSociais}</span>
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px]">
            {indicadores.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("comercio")}
          className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-colors sm:text-sm ${
            abaAtiva === "comercio"
              ? "bg-primary text-white shadow-xs"
              : "bg-surface text-text-soft hover:bg-surface-2 hover:text-text border border-border"
          }`}
        >
          <Globe size={16} />
          <span>{ui.abaComercio}</span>
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px]">
            {comercio.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("territorios")}
          className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-colors sm:text-sm ${
            abaAtiva === "territorios"
              ? "bg-primary text-white shadow-xs"
              : "bg-surface text-text-soft hover:bg-surface-2 hover:text-text border border-border"
          }`}
        >
          <Compass size={16} />
          <span>{ui.abaTerritorios}</span>
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px]">
            {territorios.length}
          </span>
        </button>
      </div>

      {/* BARRA DE FERRAMENTAS: BUSCA, FILTROS E EXPORTAÇÃO */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {/* Busca textual em tempo real */}
          <div className="relative flex-1 max-w-md">
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
              className="w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-2 text-xs text-text placeholder:text-text-soft focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Filtro por país */}
          {abaAtiva === "sociais" && (
            <select
              value={paisFiltro}
              onChange={(e) => setPaisFiltro(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="__todos__">{ui.todosPaises} ({paisesUnicos.length})</option>
              {paisesUnicos.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Botões de Ação: Exportar CSV e Imprimir */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportarCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary bg-primary px-3 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity"
            title="Download CSV"
          >
            <Download size={14} />
            <span>{ui.planilhaCsv}</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text hover:bg-surface-2 transition-colors"
            title="Print"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">{ui.imprimir}</span>
          </button>
        </div>
      </div>

      {/* CONTEÚDO DA ABA 1: INDICADORES SOCIAIS MULTILATERAIS */}
      {abaAtiva === "sociais" && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-xs">
            <table className="w-full text-left text-xs text-text">
              <thead className="border-b border-border bg-surface-2 text-text-soft uppercase tracking-wider text-[10px]">
                <tr>
                  <th scope="col" className="p-3">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacaoSociais("pais")}
                      className="inline-flex items-center gap-1 font-bold hover:text-text"
                    >
                      {ui.thPais} <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th scope="col" className="p-3">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacaoSociais("idh")}
                      className="inline-flex items-center gap-1 font-bold hover:text-text"
                    >
                      {ui.thIdh} <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th scope="col" className="p-3">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacaoSociais("gini")}
                      className="inline-flex items-center gap-1 font-bold hover:text-text"
                    >
                      {ui.thGini} <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th scope="col" className="p-3 hidden md:table-cell">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacaoSociais("gastoEducacaoPib")}
                      className="inline-flex items-center gap-1 font-bold hover:text-text"
                    >
                      {ui.thEducacao} <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th scope="col" className="p-3 hidden md:table-cell">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacaoSociais("gastoSaudePib")}
                      className="inline-flex items-center gap-1 font-bold hover:text-text"
                    >
                      {ui.thSaude} <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th scope="col" className="p-3">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacaoSociais("expectativaVida")}
                      className="inline-flex items-center gap-1 font-bold hover:text-text"
                    >
                      {ui.thVida} <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th scope="col" className="p-3 text-right">{ui.thFonte}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {indicadoresFiltrados.map((item) => {
                  const ehBrasil = item.codigoIso3 === "BRA";
                  return (
                    <tr
                      key={item.codigoIso3}
                      className={`transition-colors hover:bg-surface-2/60 ${
                        ehBrasil ? "bg-primary/5 font-semibold" : ""
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base" role="img" aria-label={item.pais}>
                            {item.bandeira}
                          </span>
                          <div>
                            <div className="font-bold text-text flex items-center gap-1">
                              {item.pais}
                              {ehBrasil && (
                                <span className="rounded bg-primary/20 text-primary text-[9px] px-1 py-0.2 uppercase">
                                  {ui.referencia}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-text-soft">{item.codigoIso3}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-semibold">
                        <span
                          className={`rounded px-1.5 py-0.5 ${
                            item.idh >= 0.9
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {item.idh.toFixed(3)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded px-1.5 py-0.5 ${
                            item.gini >= 40
                              ? "bg-red-500/10 text-red-600 dark:text-red-400 font-bold"
                              : "bg-surface-2 text-text"
                          }`}
                        >
                          {item.gini.toFixed(1)}
                        </span>
                      </td>
                      <td className="p-3 hidden md:table-cell text-text-soft">
                        {item.gastoEducacaoPib.toFixed(1)}%
                      </td>
                      <td className="p-3 hidden md:table-cell text-text-soft">
                        {item.gastoSaudePib.toFixed(1)}%
                      </td>
                      <td className="p-3 font-semibold text-text">
                        {item.expectativaVida.toFixed(1)}
                      </td>
                      <td className="p-3 text-right">
                        <a
                          href={item.urlOficial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                        >
                          {item.fonteOficial.split("/")[0]} <ExternalLink size={10} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: COMÉRCIO DE MINÉRIOS E COMMODITIES */}
      {abaAtiva === "comercio" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {comercio.map((c, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-bold text-primary">{c.mineralOuCommodity}</span>
                  <span className="text-[10px] rounded bg-surface-2 px-1.5 py-0.5 text-text-soft font-mono">
                    HS {c.codigoHs}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-soft">{ui.origem}</span>
                    <span className="font-semibold text-text">{c.origemPais}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-soft">{ui.destino}</span>
                    <span className="font-semibold text-text">{c.destinoPais}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-soft">{ui.volumeEstimado}</span>
                    <span className="font-semibold text-text">
                      {(c.volumeAnualToneladas / 1000000).toFixed(1)} {ui.milhoesAno}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-soft">{ui.faturamentoFob}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      US$ {c.valorFobUsdMilhoes.toLocaleString(idioma === "en" ? "en-US" : "pt-BR")} {ui.milhoesUsd}
                    </span>
                  </div>
                  <div className="pt-2 text-[11px] text-text-soft border-t border-border">
                    <div>{ui.portoEmbarque} <strong>{c.portoEmbarqueBrasil}</strong></div>
                    <div>{ui.portoEntrega} <strong>{c.portoDestino}</strong></div>
                  </div>
                </div>
                <div className="pt-1 text-right">
                  <a
                    href={c.urlOficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
                  >
                    {c.fonteNome} <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: TERRA E POVOS ORIGINÁRIOS */}
      {abaAtiva === "territorios" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {territorios.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-text">{t.nomeTerritorio}</h4>
                    <span className="text-[10px] text-text-soft">{t.pais}</span>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {t.statusDemarcacao}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-text">
                  <div>
                    <span className="text-text-soft">{ui.povoOriginario} </span>
                    <strong>{t.povoOriginario}</strong>
                  </div>
                  <div>
                    <span className="text-text-soft">{ui.areaDemarcada} </span>
                    <strong>{t.areaHectares.toLocaleString(idioma === "en" ? "en-US" : "pt-BR")} {ui.hectares}</strong>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-text-soft">{ui.sobreposicaoMineraria}</span>
                    <span
                      className={`font-bold ${
                        t.concessoesMinerariasSobrepostas > 0
                          ? "text-red-500 font-mono"
                          : "text-emerald-500"
                      }`}
                    >
                      {t.concessoesMinerariasSobrepostas} {ui.titulosSobrepostos}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-soft">{ui.focosCalor}</span>
                    <span className="font-semibold text-text">{t.focosCalorAnuaisSat} {ui.focosAno}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2 text-[11px]">
                  <span className="text-text-soft">{t.orgaoResponsavel}</span>
                  <a
                    href={t.urlOficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                  >
                    {ui.verDemarcacao} <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
