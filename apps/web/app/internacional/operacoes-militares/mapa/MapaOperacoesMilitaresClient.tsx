"use client";

/**
 * @file apps/web/app/internacional/operacoes-militares/mapa/MapaOperacoesMilitaresClient.tsx
 * @description Mapa mundial vetorial interativo de operacoes militares, contratos de defesa e PMCs.
 *
 * Papel no portal:
 * Permite ao cidadao navegar cartograficamente por intervencoes militares, golpes de Estado,
 * acoes de empresas militares privadas (mercenarios) e mega-contratos de armamentos.
 * Ao clicar em qualquer ponto ou camada, abre a gaveta analitica com resumo civico,
 * custos, baixas, desfecho soberano e link direto para a ficha completa no acervo.
 *
 * Regras e decisoes tecnicas (AGENTS.md §5.10 e §8):
 * - Mapa vetorial SVG nativo de alta performance (sem bibliotecas externas pesadas).
 * - Projecao Equirretangular precisa (lat/lng -> x/y).
 * - Suporte a deep-link por query param (?id=OP-...).
 * - Camadas de filtragem por tipo de operacao, continente e busca textual.
 * - Descricoes com piso minimo text-sm (14px).
 */

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Shield,
  MapPin,
  ExternalLink,
  FileDown,
  Layers,
  ArrowRight,
  X,
  Search,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertTriangle,
  Globe2,
  Eye,
  Crosshair,
} from "lucide-react";
import type {
  OperacaoMilitarGlobal,
  TipoOperacaoMilitar,
} from "@/lib/internacional/dados-operacoes-militares";
import { semAcento } from "@/lib/busca/normalizar";

interface MapaOperacoesMilitaresClientProps {
  operacoes: OperacaoMilitarGlobal[];
}

type CamadaTipo = "todas" | "latam" | TipoOperacaoMilitar;

/**
 * Converte latitude e longitude para coordenadas SVG (viewBox 0 0 1000 500).
 * Projecao Equirretangular:
 * X: -180 a +180 -> 0 a 1000
 * Y: +90 a -90 -> 0 a 500
 */
function projetarCoordenadas(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x, y };
}

/** Cores por tipo de operacao */
function obterCorTipoOperacao(tipo: TipoOperacaoMilitar): string {
  switch (tipo) {
    case "intervencao_militar_direta":
      return "#ef4444"; // Vermelho
    case "deposicao_regime_golpe":
      return "#f59e0b"; // Âmbar
    case "pmc_milicia_privada":
      return "#8b5cf6"; // Violeta
    case "contrato_defesa_armamento":
      return "#06b6d4"; // Ciano
    case "guerra_proxy_apoio_rebelde":
      return "#10b981"; // Esmeralda
    case "operacao_paz_mandato_onu":
      return "#3b82f6"; // Azul
    default:
      return "#6366f1";
  }
}

/** Nome amigável por tipo de operação */
function formatarTipoOperacao(tipo: TipoOperacaoMilitar): string {
  switch (tipo) {
    case "intervencao_militar_direta":
      return "Intervenção Militar Direta";
    case "deposicao_regime_golpe":
      return "Deposição de Regime / Golpe";
    case "pmc_milicia_privada":
      return "PMC / Milícia Privada";
    case "contrato_defesa_armamento":
      return "Contrato Bélico / Defesa";
    case "guerra_proxy_apoio_rebelde":
      return "Guerra por Procuração / Proxy";
    case "operacao_paz_mandato_onu":
      return "Missão sob Mandato ONU";
    default:
      return tipo;
  }
}

export default function MapaOperacoesMilitaresClient({
  operacoes,
}: MapaOperacoesMilitaresClientProps) {
  const searchParams = useSearchParams();
  const idInicial = searchParams ? searchParams.get("id") || "" : "";

  const [operacaoSelecionada, setOperacaoSelecionada] = useState<OperacaoMilitarGlobal | null>(null);
  const [camadaAtiva, setCamadaAtiva] = useState<CamadaTipo>("todas");
  const [filtroContinente, setFiltroContinente] = useState<string>("todos");
  const [busca, setBusca] = useState<string>("");

  // Seleciona operacao da URL se fornecido
  useEffect(() => {
    if (idInicial) {
      const achado = operacoes.find((op) => op.id.toLowerCase() === idInicial.toLowerCase());
      if (achado) {
        setOperacaoSelecionada(achado);
      }
    }
  }, [idInicial, operacoes]);

  const continentesDisponiveis = useMemo(() => {
    return Array.from(new Set(operacoes.map((op) => op.continenteTeatro))).sort();
  }, [operacoes]);

  // Filtra operacoes pela camada, continente e busca
  const operacoesVisiveis = useMemo(() => {
    const q = semAcento(busca.trim().toLowerCase());
    return operacoes.filter((op) => {
      // 1. Filtro de camada
      if (camadaAtiva === "latam") {
        const isLatam =
          op.continenteTeatro === "América do Sul" ||
          op.continenteTeatro === "América Central e Caribe" ||
          op.conexaoBrasilOuAmericaLatina.length > 0;
        if (!isLatam) return false;
      } else if (camadaAtiva !== "todas" && op.tipoOperacao !== camadaAtiva) {
        return false;
      }

      // 2. Filtro de continente
      if (filtroContinente !== "todos" && op.continenteTeatro !== filtroContinente) {
        return false;
      }

      // 3. Busca textual
      if (!q) return true;
      const alvo = semAcento(
        `${op.codinome} ${op.titulo} ${op.resumo} ${op.paisTeatro} ${op.localidadeFoco} ${op.paisesPatrocinadores.join(" ")} ${op.orgaosForcasEnvolvidas.join(" ")} ${op.pmcsEnvolvidas.join(" ")} ${op.principaisContratadasDefesa.join(" ")} ${op.assuntos.join(" ")}`
      ).toLowerCase();
      return alvo.includes(q);
    });
  }, [operacoes, camadaAtiva, filtroContinente, busca]);

  return (
    <div className="space-y-6">
      {/* Barra de Controles e Camadas do Mapa */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Seletor de Camadas */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5 mr-1">
              <Layers size={14} className="text-primary" />
              <span>Camadas:</span>
            </span>

            <button
              type="button"
              onClick={() => setCamadaAtiva("todas")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                camadaAtiva === "todas"
                  ? "bg-primary text-white shadow-xs"
                  : "border border-border bg-surface-2 text-foreground hover:border-primary/50"
              }`}
            >
              📍 Todas as Ações ({operacoes.length})
            </button>

            <button
              type="button"
              onClick={() => setCamadaAtiva("latam")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                camadaAtiva === "latam"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "border border-border bg-surface-2 text-foreground hover:border-primary/50"
              }`}
            >
              🌎 América Latina & Brasil
            </button>

            <button
              type="button"
              onClick={() => setCamadaAtiva("deposicao_regime_golpe")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                camadaAtiva === "deposicao_regime_golpe"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "border border-border bg-surface-2 text-foreground hover:border-primary/50"
              }`}
            >
              🏛️ Golpes e Deposições
            </button>

            <button
              type="button"
              onClick={() => setCamadaAtiva("pmc_milicia_privada")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                camadaAtiva === "pmc_milicia_privada"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "border border-border bg-surface-2 text-foreground hover:border-primary/50"
              }`}
            >
              🪖 PMCs e Mercenários
            </button>

            <button
              type="button"
              onClick={() => setCamadaAtiva("intervencao_militar_direta")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                camadaAtiva === "intervencao_militar_direta"
                  ? "bg-red-600 text-white shadow-xs"
                  : "border border-border bg-surface-2 text-foreground hover:border-primary/50"
              }`}
            >
              ⚔️ Intervenções Diretas
            </button>

            <button
              type="button"
              onClick={() => setCamadaAtiva("contrato_defesa_armamento")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                camadaAtiva === "contrato_defesa_armamento"
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "border border-border bg-surface-2 text-foreground hover:border-primary/50"
              }`}
            >
              🏭 Contratos de Defesa
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/internacional/operacoes-militares"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary transition"
            >
              <span>Ir para o Acervo Textual</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Busca e Filtro por Continente */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/70">
          <div className="sm:col-span-2 relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por codinome, cidade, país, PMC, empresa ou arma..."
              className="w-full rounded-xl border border-border bg-surface-2 py-2 pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <select
              value={filtroContinente}
              onChange={(e) => setFiltroContinente(e.target.value)}
              aria-label="Filtrar por continente do teatro"
              className="w-full rounded-xl border border-border bg-surface-2 py-2 px-3 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="todos">Todos os continentes ({continentesDisponiveis.length})</option>
              {continentesDisponiveis.map((cont) => (
                <option key={cont} value={cont}>
                  {cont}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Visualizador do Mapa Mundial SVG */}
      <div className="relative rounded-3xl border border-border bg-slate-950 text-slate-100 overflow-hidden shadow-md">
        {/* Barra superior de status do mapa */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            <span>
              Mostrando <strong>{operacoesVisiveis.length}</strong> de{" "}
              <strong>{operacoes.length}</strong> teatros e contratos geolocalizados
            </span>
          </div>
          <span className="hidden sm:inline text-[11px] text-slate-500">
            Projeção Cártográfica Equirretangular · Clique no marcador para inspecionar
          </span>
        </div>

        {/* Canvas SVG Responsivo */}
        <div className="relative w-full aspect-[2/1] min-h-[320px] max-h-[580px] bg-slate-950 flex items-center justify-center">
          <svg
            viewBox="0 0 1000 500"
            className="w-full h-full select-none"
            role="img"
            aria-label="Mapa mundial interativo com operações militares, golpes, PMCs e contratos de armas."
          >
            <defs>
              <radialGradient id="oceano-mil-glow" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </radialGradient>

              <filter id="glow-mil-pin" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Fundo do Oceano */}
            <rect width="1000" height="500" fill="url(#oceano-mil-glow)" />

            {/* Linhas de Grade Geográfica */}
            <g stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.45">
              <line x1="0" y1="250" x2="1000" y2="250" stroke="#475569" strokeWidth="0.8" />
              <line x1="0" y1="185" x2="1000" y2="185" />
              <line x1="0" y1="315" x2="1000" y2="315" />
              <line x1="500" y1="0" x2="500" y2="500" stroke="#475569" strokeWidth="0.8" />
              <line x1="250" y1="0" x2="250" y2="500" />
              <line x1="750" y1="0" x2="750" y2="500" />
            </g>

            {/* Silhuetas Vetoriais dos Continentes */}
            <g fill="#1e293b" stroke="#334155" strokeWidth="0.8" opacity="0.75">
              {/* América do Norte e Groenlândia */}
              <path d="M 120,40 L 260,35 L 320,60 L 290,130 L 230,160 L 260,210 L 220,240 L 190,260 L 150,220 L 120,170 L 90,120 Z" />
              {/* América Central */}
              <path d="M 210,250 L 260,260 L 280,290 L 250,300 Z" />
              {/* América do Sul */}
              <path d="M 270,300 L 350,310 L 390,370 L 360,450 L 310,480 L 280,450 L 265,370 Z" />
              {/* Europa */}
              <path d="M 450,80 L 580,75 L 590,130 L 530,160 L 460,165 L 430,120 Z" />
              {/* África */}
              <path d="M 460,175 L 580,170 L 610,240 L 570,350 L 520,380 L 470,320 L 440,230 Z" />
              {/* Ásia e Eurásia */}
              <path d="M 590,65 L 890,60 L 930,140 L 860,240 L 780,270 L 680,250 L 620,180 L 600,120 Z" />
              {/* Oceania e Austrália */}
              <path d="M 770,340 L 880,335 L 900,410 L 820,430 L 760,390 Z" />
              {/* Nova Zelândia */}
              <path d="M 910,430 L 935,420 L 930,460 Z" />
            </g>

            {/* Marcadores Interativos das Operações */}
            {operacoesVisiveis.map((op) => {
              const { x, y } = projetarCoordenadas(op.latitude, op.longitude);
              const selecionado = operacaoSelecionada?.id === op.id;
              const cor = obterCorTipoOperacao(op.tipoOperacao);

              return (
                <g
                  key={op.id}
                  className="cursor-pointer transition-transform duration-200"
                  onClick={() => setOperacaoSelecionada(op)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${op.codinome}: ${op.titulo}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setOperacaoSelecionada(op);
                    }
                  }}
                >
                  {/* Anel de Pulso Animado para o Marcador Selecionado */}
                  {selecionado && (
                    <circle
                      cx={x}
                      cy={y}
                      r="16"
                      fill="none"
                      stroke={cor}
                      strokeWidth="2"
                      opacity="0.85"
                      className="animate-ping"
                    />
                  )}

                  {/* Círculo de fundo do marcador */}
                  <circle
                    cx={x}
                    cy={y}
                    r={selecionado ? "9" : "5.5"}
                    fill={cor}
                    stroke="#ffffff"
                    strokeWidth={selecionado ? "2.5" : "1.2"}
                    filter="url(#glow-mil-pin)"
                    className="hover:scale-125 transition-transform"
                  />

                  {/* Ponto central */}
                  <circle
                    cx={x}
                    cy={y}
                    r={selecionado ? "3.5" : "2"}
                    fill="#ffffff"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legenda de Tipos e Cores */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-t border-slate-800 text-xs text-slate-300">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-slate-400">Legenda de Tipos:</span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              <span>Intervenção Direta</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <span>Golpe / Deposição</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-purple-500" />
              <span>PMC / Mercenários</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-cyan-500" />
              <span>Contrato de Defesa</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span>Proxy / Guerrilhas</span>
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {operacoesVisiveis.length} eventos no mapa
          </span>
        </div>
      </div>

      {/* GAVETA / PAINEL DE INSPEÇÃO DA OPERAÇÃO SELECIONADA */}
      {operacaoSelecionada && (
        <section
          aria-label="Ficha analítica da operação militar selecionada"
          className="rounded-3xl border-2 border-primary/40 bg-surface p-6 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-md px-2.5 py-0.5 text-xs font-bold text-white shadow-xs"
                  style={{
                    backgroundColor: obterCorTipoOperacao(operacaoSelecionada.tipoOperacao),
                  }}
                >
                  {formatarTipoOperacao(operacaoSelecionada.tipoOperacao)}
                </span>
                <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-mono text-muted">
                  {operacaoSelecionada.duracaoEstimada}
                </span>
                <span className="text-xs font-semibold text-primary">
                  📍 {operacaoSelecionada.localidadeFoco}, {operacaoSelecionada.paisTeatro} (
                  {operacaoSelecionada.continenteTeatro})
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                {operacaoSelecionada.codinome}
              </h2>
              <div className="text-sm font-semibold text-muted">
                {operacaoSelecionada.titulo}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOperacaoSelecionada(null)}
              className="self-end md:self-auto rounded-full bg-surface-2 p-1.5 text-muted hover:text-foreground hover:bg-surface border border-border transition"
              title="Fechar ficha"
              aria-label="Fechar ficha analítica"
            >
              <X size={18} />
            </button>
          </div>

          {/* Resumo Analítico e Impactos */}
          <div className="space-y-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Resumo Cívico e Histórico:
              </span>
              <p className="mt-1 text-sm sm:text-base text-foreground leading-relaxed">
                {operacaoSelecionada.resumo}
              </p>
            </div>

            {/* Desfecho Institucional e Soberania */}
            <div className="rounded-xl border border-border bg-surface-2/60 p-3.5 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Shield size={14} />
                <span>Desfecho Institucional & Impacto na Soberania:</span>
              </span>
              <p className="text-sm text-foreground leading-relaxed">
                {operacaoSelecionada.desfechoSoberania}
              </p>
            </div>

            {/* Conexão com o Brasil ou América Latina */}
            {operacaoSelecionada.conexaoBrasilOuAmericaLatina && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Globe2 size={14} />
                  <span>Conexão com a Soberania do Brasil e América Latina:</span>
                </span>
                <p className="text-sm text-foreground leading-relaxed">
                  {operacaoSelecionada.conexaoBrasilOuAmericaLatina}
                </p>
              </div>
            )}

            {/* Métricas: Baixas e Custos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 text-xs">
              <div className="rounded-xl border border-border bg-surface-2 p-2.5">
                <span className="text-muted block font-semibold">Baixas Estimadas:</span>
                <strong className="text-foreground text-sm font-mono block mt-0.5">
                  {operacaoSelecionada.baixasEstimadas || "Não especificado"}
                </strong>
              </div>

              <div className="rounded-xl border border-border bg-surface-2 p-2.5">
                <span className="text-muted block font-semibold">Custo Financeiro Estimado:</span>
                <strong className="text-foreground text-sm font-mono block mt-0.5">
                  {operacaoSelecionada.custoFinanceiroEstimado || "Não especificado"}
                </strong>
              </div>

              <div className="rounded-xl border border-border bg-surface-2 p-2.5">
                <span className="text-muted block font-semibold">Patrocinadores / Intervenientes:</span>
                <span className="text-foreground font-semibold block mt-0.5">
                  {operacaoSelecionada.paisesPatrocinadores.join(", ")}
                </span>
              </div>

              <div className="rounded-xl border border-border bg-surface-2 p-2.5">
                <span className="text-muted block font-semibold">Forças / PMCs / Indústria:</span>
                <span className="text-foreground font-semibold block mt-0.5">
                  {[
                    ...operacaoSelecionada.orgaosForcasEnvolvidas,
                    ...operacaoSelecionada.pmcsEnvolvidas,
                    ...operacaoSelecionada.principaisContratadasDefesa,
                  ]
                    .slice(0, 3)
                    .join(", ") || "Forças governamentais"}
                </span>
              </div>
            </div>

            {/* Tags e Assuntos */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {operacaoSelecionada.assuntos.map((ass) => (
                <span
                  key={ass}
                  className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted font-medium"
                >
                  #{ass}
                </span>
              ))}
            </div>

            {/* Links e Ações Oficiais */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={operacaoSelecionada.urlFonteOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted hover:text-foreground hover:border-primary transition"
                >
                  <span>{operacaoSelecionada.fonteOficialNome}</span>
                  <ExternalLink size={11} />
                </a>

                {operacaoSelecionada.urlDocumentoOriginalPdf && (
                  <a
                    href={operacaoSelecionada.urlDocumentoOriginalPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground hover:border-primary transition"
                  >
                    <FileDown size={14} className="text-primary" />
                    <span>PDF / Relatório Oficial</span>
                    <ExternalLink size={11} className="text-muted" />
                  </a>
                )}
              </div>

              <Link
                href={`/internacional/operacoes-militares?id=${encodeURIComponent(operacaoSelecionada.id)}`}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-white hover:opacity-95 transition shadow-sm"
              >
                <span>Ver Dossiê no Acervo Completo</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* LISTA RÁPIDA DOS EVENTOS NO MAPA */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2 text-xs">
          <span className="font-bold text-foreground uppercase tracking-wider">
            Índice de Ações e Conflitos ({operacoesVisiveis.length})
          </span>
          <span className="text-muted">Clique para localizar no mapa mundial</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {operacoesVisiveis.map((op) => {
            const selecionado = operacaoSelecionada?.id === op.id;
            const cor = obterCorTipoOperacao(op.tipoOperacao);

            return (
              <button
                key={op.id}
                type="button"
                onClick={() => setOperacaoSelecionada(op)}
                className={`text-left p-2.5 rounded-xl border transition flex items-start gap-2.5 ${
                  selecionado
                    ? "border-primary bg-primary/10 shadow-xs"
                    : "border-border bg-surface-2/40 hover:border-primary/50"
                }`}
              >
                <span
                  className="h-3 w-3 rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: cor }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-foreground truncate">{op.codinome}</span>
                    <span className="font-mono text-muted">{op.anoInicio}</span>
                  </div>
                  <div className="text-xs text-muted line-clamp-1 leading-snug">
                    {op.titulo}
                  </div>
                  <div className="text-[10px] text-muted truncate mt-0.5">
                    📍 {op.localidadeFoco}, {op.paisTeatro}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
