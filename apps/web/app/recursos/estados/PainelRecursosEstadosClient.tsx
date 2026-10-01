"use client";

/**
 * @file apps/web/app/recursos/estados/PainelRecursosEstadosClient.tsx
 * @description Componente interativo client para visualização, busca, ordenação e exportação dos 5 eixos
 * de recursos públicos dos 27 estados brasileiros:
 * 1. Outorgas de Água (ANA e órgãos estaduais)
 * 2. Energia Elétrica (ANEEL e CCEE)
 * 3. Gasto com Combustível (PNCP e ANP)
 * 4. Parcerias Público-Privadas & Concessões (BNDES Hub e portais estaduais)
 * 5. Emendas Parlamentares (27 Assembleias Legislativas)
 *
 * Conformidade com as Seis Qualidades (AGENTS.md § 8):
 * 1. Links diretos e verificados para fontes oficiais de cada estado e eixo.
 * 2. Busca em tempo real sem acento e filtros por Região e Eixo Temático.
 * 3. Ordenação em todas as colunas numéricas e nominais.
 * 4. Microresumo dinâmico e gráfico nativo SVG acessível.
 * 5. Tags e orações curtas para integração com Seu Nonô.
 * 6. Exportação CSV com BOM UTF-8 (separador ;) e impressão nativa (@media print).
 */

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  ExternalLink,
  Droplets,
  Zap,
  Fuel,
  Handshake,
  Landmark,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Info,
  CheckCircle2,
  X,
  Layers,
  BarChart3,
  HelpCircle,
  Building,
} from "lucide-react";
import {
  type EstadoRecursoConsolidado,
  type RegiaoBrasil,
  gerarCsvRecursos27Estados,
} from "@/lib/recursos/dados-recursos-27-estados";

interface PainelRecursosEstadosClientProps {
  estadosIniciais: EstadoRecursoConsolidado[];
}

type EixoTematico = "todos" | "agua" | "energia" | "combustivel" | "ppps" | "emendas";

type TipoOrdenacao =
  | "uf"
  | "estado"
  | "agua_vazao"
  | "agua_interferencias"
  | "energia_tarifa"
  | "energia_assimetria"
  | "combustivel_gasto"
  | "ppps_investimento"
  | "emendas_total"
  | "emendas_pix";

export default function PainelRecursosEstadosClient({
  estadosIniciais,
}: PainelRecursosEstadosClientProps) {
  // Estado de filtros
  const [busca, setBusca] = useState("");
  const [regiaoFiltro, setRegiaoFiltro] = useState<string>("todas");
  const [eixoAtivo, setEixoAtivo] = useState<EixoTematico>("todos");
  const [colunaOrdenacao, setColunaOrdenacao] = useState<TipoOrdenacao>("uf");
  const [ordemCrescente, setOrdemCrescente] = useState(true);
  const [estadoModal, setEstadoModal] = useState<EstadoRecursoConsolidado | null>(null);

  // Normalização sem acentos para busca textual resiliente
  const normalizar = (txt: string) =>
    txt
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  // Lista filtrada e ordenada
  const estadosFiltrados = useMemo(() => {
    const termo = normalizar(busca.trim());

    const filtrados = estadosIniciais.filter((item) => {
      const matchRegiao =
        regiaoFiltro === "todas" || item.regiao === regiaoFiltro;

      if (!matchRegiao) return false;
      if (!termo) return true;

      const textoPesquisa = [
        item.uf,
        item.estado,
        item.regiao,
        item.capital,
        item.outorgas.orgaoGestorEstadual,
        item.outorgas.finalidadePredominante,
        item.energia.distribuidoraLider,
        item.combustivel.combustivelMaisConsumido,
        item.combustivel.orgaoFiscalizador,
        item.ppps.concessaoDestaque,
        ...item.ppps.setoresPrioritarios,
        ...item.outorgas.baciasPrincipais,
      ].join(" ");

      return normalizar(textoPesquisa).includes(termo);
    });

    // Ordenação dinâmica
    filtrados.sort((a, b) => {
      let valA: string | number = 0;
      let valB: string | number = 0;

      switch (colunaOrdenacao) {
        case "uf":
          valA = a.uf;
          valB = b.uf;
          break;
        case "estado":
          valA = a.estado;
          valB = b.estado;
          break;
        case "agua_vazao":
          valA = a.outorgas.vazaoTotalM3AnoMilhoes;
          valB = b.outorgas.vazaoTotalM3AnoMilhoes;
          break;
        case "agua_interferencias":
          valA = a.outorgas.totalInterferencias;
          valB = b.outorgas.totalInterferencias;
          break;
        case "energia_tarifa":
          valA = a.energia.tarifaResidencialKwhBrl;
          valB = b.energia.tarifaResidencialKwhBrl;
          break;
        case "energia_assimetria":
          valA = a.energia.assimetriaTarifariaRatio;
          valB = b.energia.assimetriaTarifariaRatio;
          break;
        case "combustivel_gasto":
          valA = a.combustivel.totalGastoAnualBrlMilhoes;
          valB = b.combustivel.totalGastoAnualBrlMilhoes;
          break;
        case "ppps_investimento":
          valA = a.ppps.investimentoTotalContratadoBrlBilhoes;
          valB = b.ppps.investimentoTotalContratadoBrlBilhoes;
          break;
        case "emendas_total":
          valA = a.emendas.totalEmendasAutorizadasBrlMilhoes;
          valB = b.emendas.totalEmendasAutorizadasBrlMilhoes;
          break;
        case "emendas_pix":
          valA = a.emendas.percentualEmendasPix;
          valB = b.emendas.percentualEmendasPix;
          break;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return ordemCrescente
          ? valA.localeCompare(valB, "pt-BR")
          : valB.localeCompare(valA, "pt-BR");
      }

      return ordemCrescente
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });

    return filtrados;
  }, [estadosIniciais, busca, regiaoFiltro, colunaOrdenacao, ordemCrescente]);

  // Totais agregados da seleção atual (Qualidade 4)
  const agregados = useMemo(() => {
    const qtd = estadosFiltrados.length;
    if (qtd === 0) {
      return {
        vazaoTotalBiM3: 0,
        tarifaMedia: 0,
        assimetriaMedia: 0,
        combustivelTotalMilhoes: 0,
        pppsTotalBilhoes: 0,
        emendasTotalMilhoes: 0,
      };
    }

    const vazaoTotalBiM3 =
      estadosFiltrados.reduce((acc, e) => acc + e.outorgas.vazaoTotalM3AnoMilhoes, 0) / 1000;
    const tarifaMedia =
      estadosFiltrados.reduce((acc, e) => acc + e.energia.tarifaResidencialKwhBrl, 0) / qtd;
    const assimetriaMedia =
      estadosFiltrados.reduce((acc, e) => acc + e.energia.assimetriaTarifariaRatio, 0) / qtd;
    const combustivelTotalMilhoes = estadosFiltrados.reduce(
      (acc, e) => acc + e.combustivel.totalGastoAnualBrlMilhoes,
      0
    );
    const pppsTotalBilhoes = estadosFiltrados.reduce(
      (acc, e) => acc + e.ppps.investimentoTotalContratadoBrlBilhoes,
      0
    );
    const emendasTotalMilhoes = estadosFiltrados.reduce(
      (acc, e) => acc + e.emendas.totalEmendasAutorizadasBrlMilhoes,
      0
    );

    return {
      vazaoTotalBiM3,
      tarifaMedia,
      assimetriaMedia,
      combustivelTotalMilhoes,
      pppsTotalBilhoes,
      emendasTotalMilhoes,
    };
  }, [estadosFiltrados]);

  // Função para alterar ordenação ao clicar no cabeçalho
  const alternarOrdenacao = (coluna: TipoOrdenacao) => {
    if (colunaOrdenacao === coluna) {
      setOrdemCrescente(!ordemCrescente);
    } else {
      setColunaOrdenacao(coluna);
      // Colunas numéricas iniciam em descrescente por conveniência investigativa
      setOrdemCrescente(coluna === "uf" || coluna === "estado");
    }
  };

  // Exportação CSV nativa com separador ';' e BOM UTF-8 (Qualidade 6)
  const baixarCsv = () => {
    const conteudoCsv = gerarCsvRecursos27Estados(estadosFiltrados);
    const blob = new Blob([conteudoCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dataIso = new Date().toISOString().split("T")[0];
    link.href = url;
    link.setAttribute("download", `controle-popular-recursos-27-estados-${dataIso}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Top 5 para o mini gráfico SVG responsivo
  const top5Grafico = useMemo(() => {
    const copia = [...estadosFiltrados];
    switch (eixoAtivo) {
      case "agua":
        return copia
          .sort((a, b) => b.outorgas.vazaoTotalM3AnoMilhoes - a.outorgas.vazaoTotalM3AnoMilhoes)
          .slice(0, 5)
          .map((e) => ({
            rotulo: e.uf,
            nome: e.estado,
            valor: e.outorgas.vazaoTotalM3AnoMilhoes / 1000,
            unidade: "bi m³/ano",
          }));
      case "energia":
        return copia
          .sort((a, b) => b.energia.assimetriaTarifariaRatio - a.energia.assimetriaTarifariaRatio)
          .slice(0, 5)
          .map((e) => ({
            rotulo: e.uf,
            nome: e.estado,
            valor: e.energia.assimetriaTarifariaRatio,
            unidade: "x assimetria",
          }));
      case "combustivel":
        return copia
          .sort(
            (a, b) =>
              b.combustivel.totalGastoAnualBrlMilhoes - a.combustivel.totalGastoAnualBrlMilhoes
          )
          .slice(0, 5)
          .map((e) => ({
            rotulo: e.uf,
            nome: e.estado,
            valor: e.combustivel.totalGastoAnualBrlMilhoes,
            unidade: "R$ Mi/ano",
          }));
      case "ppps":
        return copia
          .sort(
            (a, b) =>
              b.ppps.investimentoTotalContratadoBrlBilhoes -
              a.ppps.investimentoTotalContratadoBrlBilhoes
          )
          .slice(0, 5)
          .map((e) => ({
            rotulo: e.uf,
            nome: e.estado,
            valor: e.ppps.investimentoTotalContratadoBrlBilhoes,
            unidade: "R$ Bi contratado",
          }));
      case "emendas":
      default:
        return copia
          .sort(
            (a, b) =>
              b.emendas.totalEmendasAutorizadasBrlMilhoes -
              a.emendas.totalEmendasAutorizadasBrlMilhoes
          )
          .slice(0, 5)
          .map((e) => ({
            rotulo: e.uf,
            nome: e.estado,
            valor: e.emendas.totalEmendasAutorizadasBrlMilhoes,
            unidade: "R$ Mi autorizados",
          }));
    }
  }, [estadosFiltrados, eixoAtivo]);

  const valorMaximoGrafico = Math.max(...top5Grafico.map((g) => g.valor), 1);

  return (
    <div className="space-y-8">
      {/* 1. SELEÇÃO DE EIXOS TEMÁTICOS (ABAS SUPERIORES) */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {[
          { id: "todos", rotulo: "Visão Geral (5 Eixos)", icone: Layers },
          { id: "agua", rotulo: "💧 Outorgas de Água", icone: Droplets },
          { id: "energia", rotulo: "⚡ Tarifas de Energia", icone: Zap },
          { id: "combustivel", rotulo: "⛽ Combustível Público", icone: Fuel },
          { id: "ppps", rotulo: "🤝 PPPs & Concessões", icone: Handshake },
          { id: "emendas", rotulo: "🏛️ Emendas Estaduais", icone: Landmark },
        ].map((tab) => {
          const Icone = tab.icone;
          const ativo = eixoAtivo === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setEixoAtivo(tab.id as EixoTematico);
                // Ajusta coluna padrão de ordenação de acordo com o eixo
                if (tab.id === "agua") setColunaOrdenacao("agua_vazao");
                else if (tab.id === "energia") setColunaOrdenacao("energia_assimetria");
                else if (tab.id === "combustivel") setColunaOrdenacao("combustivel_gasto");
                else if (tab.id === "ppps") setColunaOrdenacao("ppps_investimento");
                else if (tab.id === "emendas") setColunaOrdenacao("emendas_total");
                else setColunaOrdenacao("uf");
                setOrdemCrescente(tab.id === "todos");
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                ativo
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface-2/60 text-muted hover:text-foreground hover:bg-surface-2 border border-border/60"
              }`}
            >
              <Icone size={16} />
              <span>{tab.rotulo}</span>
            </button>
          );
        })}
      </div>

      {/* 2. BARRA DE BUSCA, FILTROS E AÇÕES DE EXPORTAÇÃO */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Campo de Busca em Tempo Real */}
        <div className="relative flex-1 max-w-lg">
          <label htmlFor="busca-estados" className="sr-only">
            Buscar por estado, capital, órgão gestor ou concessionária
          </label>
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="busca-estados"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por UF, estado, concessionária, órgão ambiental..."
            className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-border bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-1"
              aria-label="Limpar busca"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtro por Região */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted shrink-0" aria-hidden="true" />
          <label htmlFor="filtro-regiao" className="text-xs font-semibold text-muted shrink-0">
            Região:
          </label>
          <select
            id="filtro-regiao"
            value={regiaoFiltro}
            onChange={(e) => setRegiaoFiltro(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="todas">Todas as 5 Regiões</option>
            <option value="Norte">Norte (7)</option>
            <option value="Nordeste">Nordeste (9)</option>
            <option value="Centro-Oeste">Centro-Oeste (4)</option>
            <option value="Sudeste">Sudeste (4)</option>
            <option value="Sul">Sul (3)</option>
          </select>
        </div>

        {/* Botões de Exportação CSV e Impressão (Qualidade 6) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={baixarCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-border bg-surface hover:bg-surface-2 text-foreground transition shadow-2xs"
            title="Exportar dados filtrados em CSV (BOM UTF-8 para Excel)"
          >
            <Download size={15} className="text-emerald-600 dark:text-emerald-400" />
            <span>CSV Excel</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-border bg-surface hover:bg-surface-2 text-muted hover:text-foreground transition shadow-2xs"
            title="Imprimir relatório auditável"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* 3. MINI GRÁFICO SVG NATIVO E AGREGADOS DINÂMICOS (Qualidades 4 e 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Painel de Indicadores Filtrados */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Agregados da Seleção
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
              {estadosFiltrados.length} {estadosFiltrados.length === 1 ? "Estado" : "Estados"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-surface-2/40 border border-border/50">
              <span className="text-muted block">💧 Vazão Outorgada:</span>
              <span className="text-sm font-bold font-mono text-foreground">
                {agregados.vazaoTotalBiM3.toFixed(1).replace(".", ",")} bi m³/ano
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/40 border border-border/50">
              <span className="text-muted block">⚡ Assimetria Média:</span>
              <span className="text-sm font-bold font-mono text-foreground">
                {agregados.assimetriaMedia.toFixed(2).replace(".", ",")}x
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/40 border border-border/50">
              <span className="text-muted block">⛽ Combustível Anual:</span>
              <span className="text-sm font-bold font-mono text-foreground">
                R$ {(agregados.combustivelTotalMilhoes / 1000).toFixed(2).replace(".", ",")} Bi
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/40 border border-border/50">
              <span className="text-muted block">🤝 PPPs Contratadas:</span>
              <span className="text-sm font-bold font-mono text-foreground">
                R$ {agregados.pppsTotalBilhoes.toFixed(1).replace(".", ",")} Bi
              </span>
            </div>
          </div>

          <div className="pt-1 text-xs text-muted flex items-center justify-between">
            <span>Emendas Totais Autorizadas:</span>
            <span className="font-mono font-bold text-foreground">
              R$ {(agregados.emendasTotalMilhoes / 1000).toFixed(2).replace(".", ",")} Bilhões
            </span>
          </div>
        </div>

        {/* Mini Gráfico SVG Nativo - Top 5 Estados no Eixo */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Top 5 Estados em Destaque — {eixoAtivo.toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-muted">Valores Oficiais Medidos</span>
          </div>

          {top5Grafico.length > 0 ? (
            <div className="space-y-2 pt-1" role="img" aria-label="Gráfico de barras dos top 5 estados">
              {top5Grafico.map((item) => {
                const percentual = Math.min(100, Math.max(8, (item.valor / valorMaximoGrafico) * 100));
                return (
                  <div key={item.rotulo} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">
                        {item.nome} ({item.rotulo})
                      </span>
                      <span className="font-mono text-muted">
                        {item.valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}{" "}
                        {item.unidade}
                      </span>
                    </div>
                    <div className="w-full bg-surface-2 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted py-8 text-center">Nenhum estado atende aos filtros atuais.</p>
          )}
        </div>
      </div>

      {/* 4. TABELA DE DADOS RESILIENTE E ORDENÁVEL (Qualidades 1, 2 e 3) */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/60 text-muted font-semibold text-xs tracking-wider uppercase">
                <th scope="col" className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao("uf")}
                    className="inline-flex items-center gap-1 hover:text-foreground font-bold"
                  >
                    <span>UF</span>
                    {colunaOrdenacao === "uf" &&
                      (ordemCrescente ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                  </button>
                </th>
                <th scope="col" className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao("estado")}
                    className="inline-flex items-center gap-1 hover:text-foreground font-bold"
                  >
                    <span>Estado / Região</span>
                    {colunaOrdenacao === "estado" &&
                      (ordemCrescente ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                  </button>
                </th>

                {/* Colunas variáveis conforme o eixo selecionado */}
                {(eixoAtivo === "todos" || eixoAtivo === "agua") && (
                  <>
                    <th scope="col" className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => alternarOrdenacao("agua_vazao")}
                        className="inline-flex items-center gap-1 hover:text-foreground font-bold ml-auto"
                      >
                        <span>Vazão Água</span>
                        {colunaOrdenacao === "agua_vazao" &&
                          (ordemCrescente ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                      </button>
                    </th>
                    <th scope="col" className="py-3 px-3 hidden md:table-cell">
                      Órgão Gestor Hídrico
                    </th>
                  </>
                )}

                {(eixoAtivo === "todos" || eixoAtivo === "energia") && (
                  <>
                    <th scope="col" className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => alternarOrdenacao("energia_tarifa")}
                        className="inline-flex items-center gap-1 hover:text-foreground font-bold ml-auto"
                      >
                        <span>Tarifa Residencial</span>
                        {colunaOrdenacao === "energia_tarifa" &&
                          (ordemCrescente ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                      </button>
                    </th>
                    <th scope="col" className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => alternarOrdenacao("energia_assimetria")}
                        className="inline-flex items-center gap-1 hover:text-foreground font-bold ml-auto"
                        title="Assimetria: quanto o cidadão comum paga a mais por kWh em comparação à grande indústria"
                      >
                        <span>Assimetria</span>
                        {colunaOrdenacao === "energia_assimetria" &&
                          (ordemCrescente ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                      </button>
                    </th>
                  </>
                )}

                {(eixoAtivo === "todos" || eixoAtivo === "combustivel") && (
                  <th scope="col" className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacao("combustivel_gasto")}
                      className="inline-flex items-center gap-1 hover:text-foreground font-bold ml-auto"
                    >
                      <span>Combustível Anual</span>
                      {colunaOrdenacao === "combustivel_gasto" &&
                        (ordemCrescente ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                    </button>
                  </th>
                )}

                {(eixoAtivo === "todos" || eixoAtivo === "ppps") && (
                  <th scope="col" className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacao("ppps_investimento")}
                      className="inline-flex items-center gap-1 hover:text-foreground font-bold ml-auto"
                    >
                      <span>PPPs Contratadas</span>
                      {colunaOrdenacao === "ppps_investimento" &&
                        (ordemCrescente ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                    </button>
                  </th>
                )}

                {(eixoAtivo === "todos" || eixoAtivo === "emendas") && (
                  <>
                    <th scope="col" className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => alternarOrdenacao("emendas_total")}
                        className="inline-flex items-center gap-1 hover:text-foreground font-bold ml-auto"
                      >
                        <span>Emendas ALE</span>
                        {colunaOrdenacao === "emendas_total" &&
                          (ordemCrescente ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                      </button>
                    </th>
                    <th scope="col" className="py-3 px-3 text-right hidden sm:table-cell">
                      <button
                        type="button"
                        onClick={() => alternarOrdenacao("emendas_pix")}
                        className="inline-flex items-center gap-1 hover:text-foreground font-bold ml-auto"
                        title="Emendas PIX: transferências especiais sem vinculação direta a projeto prévio"
                      >
                        <span>% PIX</span>
                        {colunaOrdenacao === "emendas_pix" &&
                          (ordemCrescente ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                      </button>
                    </th>
                  </>
                )}

                <th scope="col" className="py-3 px-3 text-center">
                  Ações & Fontes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {estadosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted">
                    Nenhum estado localizado com os critérios selecionados.
                  </td>
                </tr>
              ) : (
                estadosFiltrados.map((item) => (
                  <tr
                    key={item.uf}
                    className="hover:bg-surface-2/40 transition-colors cursor-pointer group"
                    onClick={() => setEstadoModal(item)}
                  >
                    <td className="py-3.5 px-3 font-mono font-bold text-foreground">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-2 border border-border group-hover:border-primary/40 group-hover:text-primary transition">
                        {item.uf}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-foreground">{item.estado}</div>
                      <div className="text-xs text-muted flex items-center gap-1.5">
                        <span>{item.capital}</span>
                        <span>·</span>
                        <span className="rounded bg-surface-2 px-1.5 py-0.2 text-[10px]">
                          {item.regiao}
                        </span>
                      </div>
                    </td>

                    {/* Água */}
                    {(eixoAtivo === "todos" || eixoAtivo === "agua") && (
                      <>
                        <td className="py-3.5 px-3 text-right font-mono">
                          <span className="font-bold text-sky-600 dark:text-sky-400">
                            {(item.outorgas.vazaoTotalM3AnoMilhoes / 1000).toFixed(2).replace(".", ",")}{" "}
                            bi m³
                          </span>
                          <span className="block text-[11px] text-muted">
                            {item.outorgas.totalInterferencias.toLocaleString("pt-BR")} pontos
                          </span>
                        </td>
                        <td className="py-3.5 px-3 hidden md:table-cell text-xs text-muted max-w-[200px] truncate">
                          {item.outorgas.orgaoGestorEstadual}
                        </td>
                      </>
                    )}

                    {/* Energia */}
                    {(eixoAtivo === "todos" || eixoAtivo === "energia") && (
                      <>
                        <td className="py-3.5 px-3 text-right font-mono">
                          <span className="font-bold text-foreground">
                            R$ {item.energia.tarifaResidencialKwhBrl.toFixed(2).replace(".", ",")}
                          </span>
                          <span className="block text-[11px] text-muted">/ kWh residencial</span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                              item.energia.assimetriaTarifariaRatio >= 1.8
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            }`}
                          >
                            {item.energia.assimetriaTarifariaRatio.toFixed(2).replace(".", ",")}x
                          </span>
                        </td>
                      </>
                    )}

                    {/* Combustível */}
                    {(eixoAtivo === "todos" || eixoAtivo === "combustivel") && (
                      <td className="py-3.5 px-3 text-right font-mono">
                        <span className="font-bold text-foreground">
                          R$ {item.combustivel.totalGastoAnualBrlMilhoes.toFixed(1).replace(".", ",")}{" "}
                          Mi
                        </span>
                        <span className="block text-[11px] text-muted">
                          {item.combustivel.consumoEstimadoLitrosMilhoes.toFixed(1).replace(".", ",")}{" "}
                          Mi L ({item.combustivel.combustivelMaisConsumido})
                        </span>
                      </td>
                    )}

                    {/* PPPs */}
                    {(eixoAtivo === "todos" || eixoAtivo === "ppps") && (
                      <td className="py-3.5 px-3 text-right font-mono">
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          R${" "}
                          {item.ppps.investimentoTotalContratadoBrlBilhoes
                            .toFixed(1)
                            .replace(".", ",")}{" "}
                          Bi
                        </span>
                        <span className="block text-[11px] text-muted">
                          {item.ppps.totalContratosAtivos} contratos
                        </span>
                      </td>
                    )}

                    {/* Emendas */}
                    {(eixoAtivo === "todos" || eixoAtivo === "emendas") && (
                      <>
                        <td className="py-3.5 px-3 text-right font-mono">
                          <span className="font-bold text-foreground">
                            R${" "}
                            {item.emendas.totalEmendasAutorizadasBrlMilhoes
                              .toFixed(1)
                              .replace(".", ",")}{" "}
                            Mi
                          </span>
                          <span className="block text-[11px] text-muted">
                            {item.totalDeputados} dep. (~R${" "}
                            {item.emendas.cotaMediaPorDeputadoBrlMilhoes
                              .toFixed(1)
                              .replace(".", ",")}{" "}
                            Mi/cada)
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono hidden sm:table-cell">
                          <span className="font-bold text-foreground">
                            {item.emendas.percentualEmendasPix.toFixed(1).replace(".", ",")}%
                          </span>
                        </td>
                      </>
                    )}

                    {/* Ações */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEstadoModal(item);
                          }}
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-2 transition"
                          title="Ver raio-x completo do estado"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL DETALHADO DO ESTADO (RAIO-X COMPLETO DOS 5 EIXOS COM LINKS OFICIAIS) */}
      {estadoModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-titulo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setEstadoModal(null)}
        >
          <div
            className="w-full max-w-3xl rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="flex items-start justify-between border-b border-border/70 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                    {estadoModal.uf}
                  </span>
                  <h2 id="modal-titulo" className="text-xl sm:text-2xl font-bold text-foreground">
                    {estadoModal.estado} — Raio-X dos Recursos Públicos
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-muted">
                  Capital: {estadoModal.capital} · Região: {estadoModal.regiao} · {estadoModal.totalDeputados} Deputados Estaduais
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEstadoModal(null)}
                className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-2 transition"
                aria-label="Fechar janela"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo dos 5 Eixos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Eixo 1: Água */}
              <div className="rounded-2xl border border-border bg-surface-2/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                    <Droplets size={14} /> Outorgas de Água
                  </span>
                  <a
                    href={estadoModal.outorgas.fonteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    <span>Fonte Oficial</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
                <div className="text-xs space-y-1 text-foreground">
                  <p>
                    <strong>Vazão Total:</strong>{" "}
                    {(estadoModal.outorgas.vazaoTotalM3AnoMilhoes / 1000).toFixed(2).replace(".", ",")}{" "}
                    bilhões m³/ano
                  </p>
                  <p>
                    <strong>Interferências:</strong>{" "}
                    {estadoModal.outorgas.totalInterferencias.toLocaleString("pt-BR")} outorgas ativas
                  </p>
                  <p>
                    <strong>Órgão Regulador:</strong> {estadoModal.outorgas.orgaoGestorEstadual}
                  </p>
                  <p>
                    <strong>Uso Predominante:</strong> {estadoModal.outorgas.finalidadePredominante}
                  </p>
                  <p className="text-muted text-[11px]">
                    <strong>Bacias:</strong> {estadoModal.outorgas.baciasPrincipais.join(", ")}
                  </p>
                </div>
              </div>

              {/* Eixo 2: Energia */}
              <div className="rounded-2xl border border-border bg-surface-2/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Zap size={14} /> Energia & Tarifas
                  </span>
                  <a
                    href={estadoModal.energia.fonteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    <span>CCEE / ANEEL</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
                <div className="text-xs space-y-1 text-foreground">
                  <p>
                    <strong>Distribuidora Líder:</strong> {estadoModal.energia.distribuidoraLider}
                  </p>
                  <p>
                    <strong>Tarifa Residencial:</strong> R${" "}
                    {estadoModal.energia.tarifaResidencialKwhBrl.toFixed(2).replace(".", ",")} / kWh
                  </p>
                  <p>
                    <strong>Tarifa Industrial Livre:</strong> R${" "}
                    {estadoModal.energia.tarifaIndustrialKwhBrl.toFixed(2).replace(".", ",")} / kWh
                  </p>
                  <p>
                    <strong>Assimetria Cidadão/Indústria:</strong>{" "}
                    <span className="font-bold">
                      {estadoModal.energia.assimetriaTarifariaRatio.toFixed(2).replace(".", ",")}x mais caro
                    </span>
                  </p>
                  <p className="text-muted text-[11px]">
                    <strong>Matriz Predominante:</strong> {estadoModal.energia.fonteMatrizPredominante} (
                    {estadoModal.energia.capacidadeInstaladaMw.toLocaleString("pt-BR")} MW instalados)
                  </p>
                </div>
              </div>

              {/* Eixo 3: Combustível */}
              <div className="rounded-2xl border border-border bg-surface-2/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <Fuel size={14} /> Gasto de Combustível Público
                  </span>
                  <a
                    href={estadoModal.combustivel.fonteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    <span>PNCP / ANP</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
                <div className="text-xs space-y-1 text-foreground">
                  <p>
                    <strong>Despesa Anual de Frota:</strong> R${" "}
                    {estadoModal.combustivel.totalGastoAnualBrlMilhoes.toFixed(1).replace(".", ",")} milhões
                  </p>
                  <p>
                    <strong>Consumo Estimado:</strong>{" "}
                    {estadoModal.combustivel.consumoEstimadoLitrosMilhoes.toFixed(1).replace(".", ",")}{" "}
                    milhões de litros
                  </p>
                  <p>
                    <strong>Combustível Principal:</strong>{" "}
                    {estadoModal.combustivel.combustivelMaisConsumido}
                  </p>
                  <p>
                    <strong>Preço de Referência ANP:</strong> R${" "}
                    {estadoModal.combustivel.precoMedioAnpBrlLitro.toFixed(2).replace(".", ",")} / L
                  </p>
                  <p className="text-muted text-[11px]">
                    <strong>Fiscalização:</strong> {estadoModal.combustivel.orgaoFiscalizador}
                  </p>
                </div>
              </div>

              {/* Eixo 4: PPPs & Concessões */}
              <div className="rounded-2xl border border-border bg-surface-2/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <Handshake size={14} /> PPPs & Concessões
                  </span>
                  <a
                    href={estadoModal.ppps.fonteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    <span>Portal de Parcerias</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
                <div className="text-xs space-y-1 text-foreground">
                  <p>
                    <strong>Contratos Ativos:</strong> {estadoModal.ppps.totalContratosAtivos} concessões
                  </p>
                  <p>
                    <strong>Investimento Contratado:</strong> R${" "}
                    {estadoModal.ppps.investimentoTotalContratadoBrlBilhoes.toFixed(1).replace(".", ",")}{" "}
                    bilhões
                  </p>
                  <p>
                    <strong>Concessão Destaque:</strong> {estadoModal.ppps.concessaoDestaque}
                  </p>
                  <p className="text-muted text-[11px]">
                    <strong>Setores:</strong> {estadoModal.ppps.setoresPrioritarios.join(", ")}
                  </p>
                </div>
              </div>

              {/* Eixo 5: Emendas Parlamentares (Span 2) */}
              <div className="md:col-span-2 rounded-2xl border border-border bg-surface-2/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Landmark size={14} /> Emendas Parlamentares na Assembleia Legislativa
                  </span>
                  <a
                    href={estadoModal.emendas.fonteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    <span>Transparência ALE{estadoModal.uf}</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-foreground">
                  <div className="p-2 rounded-lg bg-surface border border-border/40">
                    <span className="text-muted block text-[11px]">Total Autorizado:</span>
                    <span className="font-bold font-mono">
                      R$ {estadoModal.emendas.totalEmendasAutorizadasBrlMilhoes.toFixed(1).replace(".", ",")}{" "}
                      Mi
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-border/40">
                    <span className="text-muted block text-[11px]">Cota / Deputado:</span>
                    <span className="font-bold font-mono">
                      ~R$ {estadoModal.emendas.cotaMediaPorDeputadoBrlMilhoes.toFixed(2).replace(".", ",")}{" "}
                      Mi
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-border/40">
                    <span className="text-muted block text-[11px]">Transferências PIX:</span>
                    <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                      {estadoModal.emendas.percentualEmendasPix.toFixed(1).replace(".", ",")}% do total
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted">
                  Regra impositiva estadual: {estadoModal.emendas.percentualImpositivoRcl}% da RCL. Setor com
                  maior destinação de recursos:{" "}
                  <strong className="text-foreground">{estadoModal.emendas.setorMaisBeneficiado}</strong>.
                </p>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/70 text-xs">
              <Link
                href={`/assembleias/${estadoModal.uf.toLowerCase()}`}
                className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline"
              >
                <span>Ver projetos de lei e deputados da ALE{estadoModal.uf}</span>
                <ChevronRight size={14} />
              </Link>
              <button
                type="button"
                onClick={() => setEstadoModal(null)}
                className="px-4 py-2 rounded-xl bg-surface-2 text-foreground font-semibold hover:bg-border/60 transition w-full sm:w-auto text-center"
              >
                Fechar Raio-X
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
