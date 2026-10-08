"use client";

/**
 * @file apps/web/app/internacional/desclassificados/mapa/MapaDesclassificadosClient.tsx
 * @description Mapa interativo mundial geolocalizando todos os 56 relatórios de inteligência do G20.
 *
 * Papel no portal:
 * Permite ao cidadão navegar geograficamente pelos arquivos desclassificados da CIA,
 * SNI, MI5, CSIS, BND, DGSE, ASIO, KGB e outros serviços. Ao clicar em qualquer ponto
 * ou camada, abre a ficha arquivística com resumo analítico e link direto para a página
 * do relatório no acervo completo.
 *
 * Regras e decisões técnicas (AGENTS.md §5.10 e §8):
 * - Mapa vetorial SVG nativo de alta performance (sem bibliotecas externas pesadas).
 * - Projeção Equirretangular precisa (lat/lng -> x/y).
 * - Suporte a deep-link por query param (?id=DOC-...).
 * - Camadas de filtragem por escopo (Todos / Apenas Brasil / Global) e por agência.
 * - Leitura e descrições com piso mínimo text-sm (14px).
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
  Lock,
  Globe2,
  Eye,
} from "lucide-react";
import type { DocumentoDesclassificadoG20 } from "@/lib/internacional/dados-desclassificados";
import { semAcento } from "@/lib/busca/normalizar";

interface MapaInteligenciaClientProps {
  documentos: DocumentoDesclassificadoG20[];
}

type CamadaEscopo = "todos" | "brasil" | "global";

/**
 * Converte latitude e longitude para coordenadas SVG (viewBox 0 0 1000 500).
 * Projeção Equirretangular:
 * X: -180 a +180 -> 0 a 1000
 * Y: +90 a -90 -> 0 a 500
 */
function projetarCoordenadas(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x, y };
}

/** Cores por bloco de agências */
function obterCorAgencia(orgao: string): string {
  const o = orgao.toUpperCase();
  if (o.includes("SNI") || o.includes("DSI") || o.includes("CSN") || o.includes("ABIN")) {
    return "#10b981"; // Verde esmeralda (Brasil)
  }
  if (o.includes("CIA") || o.includes("FBI") || o.includes("NSC")) {
    return "#3b82f6"; // Azul (EUA)
  }
  if (o.includes("MI5") || o.includes("JIC") || o.includes("SIS")) {
    return "#8b5cf6"; // Violeta (Reino Unido)
  }
  if (o.includes("KGB") || o.includes("FSB")) {
    return "#ef4444"; // Vermelho (Rússia / URSS)
  }
  if (o.includes("BND") || o.includes("STASI")) {
    return "#f59e0b"; // Âmbar (Alemanha)
  }
  if (o.includes("DGSE") || o.includes("SHD")) {
    return "#06b6d4"; // Ciano (França)
  }
  if (o.includes("CSIS")) {
    return "#14b8a6"; // Teal (Canadá)
  }
  if (o.includes("ASIO")) {
    return "#f97316"; // Laranja (Austrália)
  }
  return "#6366f1"; // Índigo padrão
}

export default function MapaInteligenciaClient({
  documentos,
}: MapaInteligenciaClientProps) {
  const searchParams = useSearchParams();
  const idInicial = searchParams.get("id") || "";

  const [documentoSelecionado, setDocumentoSelecionado] = useState<DocumentoDesclassificadoG20 | null>(null);
  const [camadaAtiva, setCamadaAtiva] = useState<CamadaEscopo>("todos");
  const [filtroOrgao, setFiltroOrgao] = useState<string>("todos");
  const [busca, setBusca] = useState<string>("");

  // Seleciona documento da URL se fornecido
  useEffect(() => {
    if (idInicial) {
      const achado = documentos.find((d) => d.id.toLowerCase() === idInicial.toLowerCase());
      if (achado) {
        setDocumentoSelecionado(achado);
      }
    }
  }, [idInicial, documentos]);

  const orgaosDisponiveis = useMemo(() => {
    return Array.from(new Set(documentos.map((d) => d.orgaoInteligencia))).sort();
  }, [documentos]);

  // Filtra documentos pela camada, órgão e busca
  const documentosVisiveis = useMemo(() => {
    const q = semAcento(busca.trim().toLowerCase());
    return documentos.filter((d) => {
      // 1. Filtro de camada de escopo
      if (camadaAtiva === "brasil" && !d.paisesMencionados.includes("Brasil")) {
        return false;
      }
      if (camadaAtiva === "global" && d.paisesMencionados.includes("Brasil")) {
        return false;
      }

      // 2. Filtro de órgão
      if (filtroOrgao !== "todos" && d.orgaoInteligencia !== filtroOrgao) {
        return false;
      }

      // 3. Busca textual
      if (!q) return true;
      const alvo = semAcento(
        `${d.titulo} ${d.resumo} ${d.orgaoInteligencia} ${d.paisOrigem} ${d.localidadeFoco || ""} ${d.assuntos.join(" ")}`
      ).toLowerCase();
      return alvo.includes(q);
    });
  }, [documentos, camadaAtiva, filtroOrgao, busca]);

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
              onClick={() => setCamadaAtiva("todos")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                camadaAtiva === "todos"
                  ? "bg-primary text-white shadow-xs"
                  : "border border-border bg-surface-2 text-foreground hover:border-primary/50"
              }`}
            >
              📍 Todas as Operações ({documentos.length})
            </button>

            <button
              type="button"
              onClick={() => setCamadaAtiva("brasil")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                camadaAtiva === "brasil"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "border border-border bg-surface-2 text-foreground hover:border-emerald-500/50"
              }`}
            >
              🇧🇷 Conexão Brasil (
              {documentos.filter((d) => d.paisesMencionados.includes("Brasil")).length})
            </button>

            <button
              type="button"
              onClick={() => setCamadaAtiva("global")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                camadaAtiva === "global"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "border border-border bg-surface-2 text-foreground hover:border-sky-500/50"
              }`}
            >
              🌐 Operações Globais G20 (
              {documentos.filter((d) => !d.paisesMencionados.includes("Brasil")).length})
            </button>
          </div>

          {/* Links de navegação */}
          <div className="flex items-center gap-2">
            <Link
              href="/internacional/inteligencia"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-primary hover:border-primary transition"
            >
              <Eye size={14} />
              <span>Ver em Lista / Dossiês</span>
            </Link>
          </div>
        </div>

        {/* Busca e Filtro por Órgão */}
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
              placeholder="Buscar por localidade, agência, tema ou palavras do relatório..."
              className="w-full rounded-xl border border-border bg-surface-2 py-2 pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <select
              value={filtroOrgao}
              onChange={(e) => setFiltroOrgao(e.target.value)}
              aria-label="Filtrar por agência de inteligência"
              className="w-full rounded-xl border border-border bg-surface-2 py-2 px-3 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="todos">Todas as agências ({orgaosDisponiveis.length})</option>
              {orgaosDisponiveis.map((org) => (
                <option key={org} value={org}>
                  {org}
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
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Mostrando <strong>{documentosVisiveis.length}</strong> de{" "}
              <strong>{documentos.length}</strong> locais de inteligência desclassificados
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
            aria-label="Mapa mundial interativo com locais dos relatórios de inteligência desclassificados do G20."
          >
            <defs>
              {/* Gradiente de oceano */}
              <radialGradient id="oceano-glow" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </radialGradient>

              {/* Filtro de brilho nos marcadores */}
              <filter id="glow-pin" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Fundo do Oceano */}
            <rect width="1000" height="500" fill="url(#oceano-glow)" />

            {/* Linhas de Grade Geográfica (Equador, Trópicos e Meridianos) */}
            <g stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.45">
              {/* Equador (Lat 0) */}
              <line x1="0" y1="250" x2="1000" y2="250" stroke="#475569" strokeWidth="0.8" />
              {/* Trópico de Câncer (+23.5°) */}
              <line x1="0" y1="185" x2="1000" y2="185" />
              {/* Trópico de Capricórnio (-23.5°) */}
              <line x1="0" y1="315" x2="1000" y2="315" />
              {/* Meridiano de Greenwich (Lng 0) */}
              <line x1="500" y1="0" x2="500" y2="500" stroke="#475569" strokeWidth="0.8" />
              {/* Meridianos principais */}
              <line x1="250" y1="0" x2="250" y2="500" />
              <line x1="750" y1="0" x2="750" y2="500" />
            </g>

            {/* Silhuetas Vetoriais Simplificadas dos Continentes (Alta Performance) */}
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

            {/* Marcadores Interativos dos 56 Documentos */}
            {documentosVisiveis.map((doc) => {
              const lat = doc.latitude ?? -15.7939;
              const lng = doc.longitude ?? -47.8828;
              const { x, y } = projetarCoordenadas(lat, lng);
              const selecionado = documentoSelecionado?.id === doc.id;
              const cor = obterCorAgencia(doc.orgaoInteligencia);

              return (
                <g
                  key={doc.id}
                  className="cursor-pointer transition-transform duration-200"
                  onClick={() => setDocumentoSelecionado(doc)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${doc.orgaoInteligencia}: ${doc.titulo}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setDocumentoSelecionado(doc);
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

                  {/* Halo do Marcador */}
                  <circle
                    cx={x}
                    cy={y}
                    r={selecionado ? "11" : "6"}
                    fill={cor}
                    fillOpacity={selecionado ? "0.45" : "0.25"}
                  />

                  {/* Ponto Central do Marcador */}
                  <circle
                    cx={x}
                    cy={y}
                    r={selecionado ? "6.5" : "4"}
                    fill={cor}
                    stroke="#ffffff"
                    strokeWidth={selecionado ? "1.8" : "1"}
                    filter="url(#glow-pin)"
                  />

                  <title>{`${doc.bandeiraPais} ${doc.orgaoInteligencia}: ${doc.titulo} (${doc.localidadeFoco})`}</title>
                </g>
              );
            })}
          </svg>

          {/* Dica flutuante quando nada estiver selecionado */}
          {!documentoSelecionado && (
            <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-xs border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 pointer-events-none hidden sm:flex items-center gap-2 shadow-lg">
              <MapPin size={14} className="text-emerald-400" />
              <span>Clique em qualquer ponto no mapa para abrir o resumo do dossiê.</span>
            </div>
          )}
        </div>
      </div>

      {/* Painel do Dossiê Selecionado (Abre ao Clicar no Local ou Camada) */}
      {documentoSelecionado && (
        <section
          aria-labelledby="heading-dossie-selecionado"
          className="rounded-3xl border-2 border-primary/40 bg-surface p-5 sm:p-7 shadow-lg space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          {/* Topo do Dossiê */}
          <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  <span>{documentoSelecionado.bandeiraPais}</span>
                  <span>{documentoSelecionado.orgaoInteligencia}</span>
                </span>

                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <Lock size={12} />
                  <span>{documentoSelecionado.nivelClassificacaoOriginal}</span>
                </span>

                {documentoSelecionado.localidadeFoco && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted">
                    <MapPin size={12} className="text-primary" />
                    <span>{documentoSelecionado.localidadeFoco}</span>
                  </span>
                )}
              </div>

              <h2
                id="heading-dossie-selecionado"
                className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground leading-snug"
              >
                {documentoSelecionado.titulo}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setDocumentoSelecionado(null)}
              className="p-1.5 rounded-xl border border-border bg-surface-2 text-muted hover:text-foreground hover:border-primary transition"
              aria-label="Fechar painel do documento"
            >
              <X size={18} />
            </button>
          </div>

          {/* Datas e Metadados Arquivísticos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs rounded-xl bg-surface-2/40 p-3">
            <div>
              <span className="text-muted block">Produção Original:</span>
              <strong className="font-mono text-foreground">{documentoSelecionado.dataPublicacao}</strong>
            </div>
            <div>
              <span className="text-muted block">Desclassificação:</span>
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                {documentoSelecionado.dataDesclassificacao}
              </strong>
            </div>
            <div>
              <span className="text-muted block">Páginas:</span>
              <strong className="font-mono text-foreground">{documentoSelecionado.quantidadePaginas}p</strong>
            </div>
            <div>
              <span className="text-muted block">Registro Arquivístico:</span>
              <span className="font-mono text-muted truncate block" title={documentoSelecionado.numeroRegistroOficial}>
                {documentoSelecionado.numeroRegistroOficial}
              </span>
            </div>
          </div>

          {/* Resumo do Documento (Fonte mínima text-sm — Regra §5.10 AGENTS.md) */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Resumo Analítico Cívico:
            </h3>
            <p className="text-sm sm:text-base text-foreground leading-relaxed bg-surface-2/30 p-4 rounded-2xl border border-border/60">
              {documentoSelecionado.resumo}
            </p>
          </div>

          {/* Contexto Brasil */}
          {documentoSelecionado.contextoBrasil && (
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                🇧🇷 Conexão com a Soberania e História do Brasil:
              </span>
              <p className="text-sm text-muted leading-relaxed">
                {documentoSelecionado.contextoBrasil}
              </p>
            </div>
          )}

          {/* Assuntos e Pessoas Citadas */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {documentoSelecionado.assuntos.map((ass) => (
              <span
                key={ass}
                className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted font-medium"
              >
                #{ass}
              </span>
            ))}
            {documentoSelecionado.sujeitosMencionados.map((suj) => (
              <span
                key={suj}
                className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary font-semibold"
              >
                👤 {suj}
              </span>
            ))}
          </div>

          {/* Links e Ações Obrigatórias do Requisito */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={documentoSelecionado.urlPdfOriginal}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground hover:border-primary transition"
              >
                <FileDown size={14} className="text-primary" />
                <span>Abrir PDF Original com Carimbos</span>
                <ExternalLink size={11} className="text-muted" />
              </a>

              <a
                href={documentoSelecionado.urlOficialCustodia}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted hover:text-foreground hover:border-primary transition"
              >
                <span>Fonte Arquivística Custodiante</span>
                <ExternalLink size={11} />
              </a>
            </div>

            {/* LINK OBRIGATÓRIO PARA A PÁGINA DO RELATÓRIO COM RESUMO */}
            <Link
              href={`/internacional/inteligencia?id=${encodeURIComponent(documentoSelecionado.id)}`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-white hover:opacity-95 transition shadow-sm"
            >
              <span>Ver Dossiê no Acervo Completo</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}

      {/* Lista Rápida dos Relatórios Mapeados (Para Consulta e Acessibilidade) */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2 text-xs">
          <span className="font-bold text-foreground uppercase tracking-wider">
            Índice de Documentos ({documentosVisiveis.length})
          </span>
          <span className="text-muted">Clique para localizar no mapa</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {documentosVisiveis.map((doc) => {
            const selecionado = documentoSelecionado?.id === doc.id;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => setDocumentoSelecionado(doc)}
                className={`text-left p-2.5 rounded-xl border transition flex items-start gap-2 ${
                  selecionado
                    ? "border-primary bg-primary/10 shadow-xs"
                    : "border-border bg-surface-2/40 hover:border-primary/50"
                }`}
              >
                <span className="text-base shrink-0 mt-0.5" role="img" aria-label={doc.paisOrigem}>
                  {doc.bandeiraPais}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-primary truncate">{doc.orgaoInteligencia}</span>
                    <span className="font-mono text-muted">{doc.dataPublicacao.substring(0, 4)}</span>
                  </div>
                  <div className="text-xs font-semibold text-foreground line-clamp-1 leading-snug">
                    {doc.titulo}
                  </div>
                  {doc.localidadeFoco && (
                    <div className="text-[10px] text-muted truncate mt-0.5">
                      📍 {doc.localidadeFoco}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
