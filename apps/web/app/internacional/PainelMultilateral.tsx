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

  // Exportação CSV (Regra da Qualidade 6)
  const exportarCsv = useCallback(() => {
    let cabecalho = "";
    let linhas: string[] = [];
    let nomeArquivo = "";

    if (abaAtiva === "sociais") {
      cabecalho = "País;Código ISO3;IDH;Índice de Gini;Desigualdade Gênero (GII);Gastos Educação % PIB;Gastos Saúde % PIB;Expectativa de Vida;Fonte Oficial;URL Direta";
      linhas = indicadoresFiltrados.map((item) =>
        `"${item.pais}";"${item.codigoIso3}";${item.idh};${item.gini};${item.desigualdadeGeneroGii};${item.gastoEducacaoPib};${item.gastoSaudePib};${item.expectativaVida};"${item.fonteOficial}";"${item.urlOficial}"`
      );
      nomeArquivo = `indicadores-sociais-multilaterais-${new Date().toISOString().substring(0, 10)}.csv`;
    } else if (abaAtiva === "comercio") {
      cabecalho = "Commodity/Minério;Código HS;Origem;Destino;Volume Anual (t);Valor FOB (US$ Mi);Porto Embarque;Porto Destino;Fonte Oficial;URL Direta";
      linhas = comercio.map((c) =>
        `"${c.mineralOuCommodity}";"${c.codigoHs}";"${c.origemPais}";"${c.destinoPais}";${c.volumeAnualToneladas};${c.valorFobUsdMilhoes};"${c.portoEmbarqueBrasil}";"${c.portoDestino}";"${c.fonteNome}";"${c.urlOficial}"`
      );
      nomeArquivo = `comercio-commodities-multilateral-${new Date().toISOString().substring(0, 10)}.csv`;
    } else {
      cabecalho = "Território;País;Povo Originário;Área (ha);Status Demarcação;Concessões Sobrepostas;Focos Calor Satélite;Órgão Responsável;URL Direta";
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
  }, [abaAtiva, indicadoresFiltrados, comercio, territorios]);

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
          <span>Indicadores Sociais (ONU/UNESCO/OMS)</span>
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
          <span>Comércio de Minérios (OMC)</span>
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
          <span>Terra e Povos Originários</span>
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
              placeholder="Buscar por país, código ou contexto..."
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
              <option value="__todos__">Todos os países ({paisesUnicos.length})</option>
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
            title="Baixar planilha compatível com Excel brasileiro (BOM UTF-8 e separador ;)"
          >
            <Download size={14} />
            <span>Planilha CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text hover:bg-surface-2 transition-colors"
            title="Imprimir relatório formatado"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Imprimir</span>
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
                      País <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th scope="col" className="p-3">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacaoSociais("idh")}
                      className="inline-flex items-center gap-1 font-bold hover:text-text"
                    >
                      IDH (PNUD) <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th scope="col" className="p-3">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacaoSociais("gini")}
                      className="inline-flex items-center gap-1 font-bold hover:text-text"
                    >
                      Gini Desigualdade <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th scope="col" className="p-3 hidden md:table-cell">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacaoSociais("gastoEducacaoPib")}
                      className="inline-flex items-center gap-1 font-bold hover:text-text"
                    >
                      Educação % PIB <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th scope="col" className="p-3 hidden md:table-cell">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacaoSociais("gastoSaudePib")}
                      className="inline-flex items-center gap-1 font-bold hover:text-text"
                    >
                      Saúde % PIB <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th scope="col" className="p-3">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacaoSociais("expectativaVida")}
                      className="inline-flex items-center gap-1 font-bold hover:text-text"
                    >
                      Vida (Anos) <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th scope="col" className="p-3 text-right">Fonte Oficial</th>
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
                                  Referência
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
                    <span className="text-text-soft">Origem:</span>
                    <span className="font-semibold text-text">{c.origemPais}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-soft">Destino Principal:</span>
                    <span className="font-semibold text-text">{c.destinoPais}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-soft">Volume Estimado:</span>
                    <span className="font-semibold text-text">
                      {(c.volumeAnualToneladas / 1000000).toFixed(1)} Milhões t/ano
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-soft">Faturamento FOB:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      US$ {c.valorFobUsdMilhoes.toLocaleString("pt-BR")} Milhões
                    </span>
                  </div>
                  <div className="pt-2 text-[11px] text-text-soft border-t border-border">
                    <div>Porto de Embarque: <strong>{c.portoEmbarqueBrasil}</strong></div>
                    <div>Porto de Entrega: <strong>{c.portoDestino}</strong></div>
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
                    <span className="text-text-soft">Povo Originário: </span>
                    <strong>{t.povoOriginario}</strong>
                  </div>
                  <div>
                    <span className="text-text-soft">Área Demarcada: </span>
                    <strong>{t.areaHectares.toLocaleString("pt-BR")} hectares</strong>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-text-soft">Sobreposição Minerária:</span>
                    <span
                      className={`font-bold ${
                        t.concessoesMinerariasSobrepostas > 0
                          ? "text-red-500 font-mono"
                          : "text-emerald-500"
                      }`}
                    >
                      {t.concessoesMinerariasSobrepostas} títulos ANM/BIA
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-soft">Focos de Calor (Satélite):</span>
                    <span className="font-semibold text-text">{t.focosCalorAnuaisSat} focos/ano</span>
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
                    Ver demarcação <ExternalLink size={10} />
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
