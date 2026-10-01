/**
 * @file apps/web/app/ambiental/barragens-globais/page.tsx
 * @description Acervo Cívico de Grandes Barragens Mundiais (água, energia, mineração).
 *
 * Papel no portal:
 * Centraliza e sistematiza o monitoramento de mais de 50 grandes barragens do planeta,
 * cobrindo estruturas de rejeitos da mineração, megacentrais hidrelétricas e represas
 * estratégicas de abastecimento hídrico e controle de cheias.
 *
 * Fontes oficiais consultadas:
 * - ICOLD (International Commission on Large Dams — World Register of Dams)
 * - Global Tailings Portal (GRID-Arendal / UNEP / Church of England Pensions Board)
 * - USACE NID (United States Army Corps of Engineers — National Inventory of Dams)
 * - ANM / SIGBM (Agência Nacional de Mineração — Sistema Integrado de Gestão de Segurança de Barragens)
 * - ANA (Agência Nacional de Águas e Saneamento Básico)
 *
 * Regras e decisões de design:
 * - Padrão das Seis Qualidades (AGENTS.md §8): links diretos oficiais, filtros facetados,
 *   ordenação, cartões de topo medidos, assistente cívico e exportação em CSV com BOM UTF-8.
 * - Regra de Fonte Mínima (AGENTS.md §5.10): parágrafo de resumo nunca menor que text-sm (14px),
 *   utilizando o componente canônico ResumoExpandivel para evitar empurrar o conteúdo.
 * - Suspense para carregamento otimizado no App Router do Next.js 16.
 */

import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  COBERTURA_BARRAGENS_GLOBAIS,
  obterBarragensGlobais,
} from "@/lib/ambiente/dados-barragens-globais";
import PainelBarragensGlobaisClient from "./PainelBarragensGlobaisClient";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  ShieldAlert,
  Zap,
  Droplets,
  Globe2,
  MapPin,
  Waves,
  Mountain,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Grandes Barragens Mundiais (Água, Energia, Mineração) | Controle Popular",
  description:
    "Acervo cívico global de barragens de rejeitos (Fundão, Feijão, Mount Polley), megahidrelétricas (Três Gargantas, Itaipu, Belo Monte) e reservatórios de água com dados oficiais do ICOLD, Global Tailings Portal, USACE NID e ANM/SIGBM.",
};

export default function PaginaBarragensGlobais() {
  const barragens = obterBarragensGlobais();

  const textoDescricao =
    "Consulte o acervo documentado de mais de 50 grandes barragens no mundo em três frentes estratégicas: rejeitos de mineração (com histórico de rompimento, liquefação e descaracterização em curso), grandes hidrelétricas mundiais e reservatórios de água e controle de cheias. Acesse dados oficiais do ICOLD, Global Tailings Portal, USACE NID e ANM/SIGBM, com geolocalização WGS84, volumes em milhões de metros cúbicos e links diretos para auditoria pública.";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* BREADCRUMB E NAVEGAÇÃO ESTRUTURAL */}
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-xs text-text-soft print:hidden"
      >
        <Link href="/" className="hover:underline hover:text-primary">
          Início
        </Link>
        <span>/</span>
        <Link href="/ambiental" className="hover:underline hover:text-primary">
          Ambiental
        </Link>
        <span>/</span>
        <Link href="/ambiental/barragens" className="hover:underline hover:text-primary">
          Barragens
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">Grandes Barragens Mundiais</span>
      </nav>

      {/* CABEÇALHO DA PÁGINA */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
              <ShieldAlert size={12} />
              Rejeitos de Mineração
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <Zap size={12} />
              Hidrelétricas & Energia
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Droplets size={12} />
              Abastecimento & Cheias
            </span>
          </div>

          <Link
            href="/terras/globo"
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition shadow-xs print:hidden"
          >
            <MapPin size={13} />
            <span>🗺️ Explorar no Globo 3D</span>
          </Link>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Grandes Barragens Mundiais: Água, Energia e Mineração
        </h1>

        {/* Resumo da página respeitando a regra de fonte mínima (§5.10) */}
        <div className="mt-3 max-w-4xl text-text-soft">
          <ResumoExpandivel texto={textoDescricao} />
        </div>
      </header>

      {/* CARTÕES DE TOPO COM AGREGADOS MEDIDOS (PADRÃO DAS SEIS QUALIDADES) */}
      <section
        aria-label="Indicadores agregados do acervo de barragens mundiais"
        className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Globe2 size={14} className="text-primary" />
            <span>Estruturas Catalogadas</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {COBERTURA_BARRAGENS_GLOBAIS.totalBarragens} Barragens
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Em {COBERTURA_BARRAGENS_GLOBAIS.totalPaises} países e 6 continentes.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <ShieldAlert size={14} className="text-red-600 dark:text-red-400" />
            <span>Rejeitos de Mineração</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {COBERTURA_BARRAGENS_GLOBAIS.totalRejeitos} Estruturas
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            {COBERTURA_BARRAGENS_GLOBAIS.totalRompidaHistorico} rompidas e {COBERTURA_BARRAGENS_GLOBAIS.totalDescaracterizacao} em descaracterização.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Zap size={14} className="text-blue-600 dark:text-blue-400" />
            <span>Grandes Hidrelétricas</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {COBERTURA_BARRAGENS_GLOBAIS.totalHidreletricas} Centrais
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Três Gargantas, Itaipu, Belo Monte e mais.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Waves size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Capacidade Armazenada</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {(COBERTURA_BARRAGENS_GLOBAIS.volumeTotalMm3 / 1000).toFixed(0)} bi m³
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Volume de reservatórios acumulado.
          </div>
        </div>
      </section>

      {/* PAINEL INTERATIVO COM AS SEIS QUALIDADES */}
      <main id="conteudo-principal-barragens">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-border bg-surface p-12 text-center text-text-soft">
              <div className="animate-spin text-primary inline-block mb-3">⟳</div>
              <p className="text-sm font-semibold">Carregando acervo de grandes barragens mundiais...</p>
            </div>
          }
        >
          <PainelBarragensGlobaisClient barragens={barragens} />
        </Suspense>
      </main>

      {/* RODAPÉ GLOBAL */}
      <div className="mt-16 print:hidden">
        <FooterGlobal />
      </div>
    </div>
  );
}
