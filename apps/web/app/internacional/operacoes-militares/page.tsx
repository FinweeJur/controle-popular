/**
 * @file apps/web/app/internacional/operacoes-militares/page.tsx
 * @description Acervo Cívico de Operações Militares, Conflitos Globais, PMCs e Contratos de Defesa.
 *
 * Papel no portal:
 * Centraliza e sistematiza intervenções militares, deposições de regimes, atuação de empresas
 * militares privadas (mercenários) e mega-contratos armamentistas das potências da América do Norte
 * e Europa, com abrangência mundial e geolocalização completa.
 *
 * Regras e decisões:
 * - Regra das Seis Qualidades (AGENTS.md §8): links diretos oficiais, filtros facetados,
 *   ordenação, cartões de topo medidos, assistente cívico e exportação em CSV com BOM UTF-8.
 * - Regra de Fonte Mínima (AGENTS.md §5.10): parágrafo de resumo nunca menor que text-sm (14px).
 * - Suspense para envolver cliente com leitura de parâmetros de busca (useSearchParams).
 * - Totalmente responsivo para smartphones (<= 640px) e compatível com impressão.
 */

import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  COBERTURA_OPERACOES_MILITARES,
  obterOperacoesMilitares,
} from "@/lib/internacional/dados-operacoes-militares";
import PainelOperacoesMilitares from "./PainelOperacoesMilitares";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  Crosshair,
  Shield,
  Globe2,
  AlertTriangle,
  MapPin,
  FileText,
  DollarSign,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Operações Militares, Golpes de Estado, PMCs e Contratos de Defesa | Controle Popular",
  description:
    "Acervo cívico unificado de intervenções armadas, deposições de regimes, mercenários (Blackwater, Wagner) e mega-contratos bélicos de potências globais com geolocalização e fontes oficiais.",
};

export default function PaginaOperacoesMilitares() {
  const operacoes = obterOperacoesMilitares();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* BREADCRUMB E NAVEGAÇÃO ESTRUTURAL */}
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-xs text-text-soft"
      >
        <Link href="/" className="hover:underline hover:text-primary">
          Início
        </Link>
        <span>/</span>
        <Link href="/internacional" className="hover:underline hover:text-primary">
          Internacional
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">Operações Militares & Defesa</span>
      </nav>

      {/* CABEÇALHO DA PÁGINA */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
              <Crosshair size={12} />
              Intervenções Armadas & Conflitos
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <Shield size={12} />
              Deposições de Regime & Golpes
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
              <AlertTriangle size={12} />
              PMCs & Mercenários
            </span>
          </div>

          <Link
            href="/internacional/operacoes-militares/mapa"
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-700 dark:text-red-400 hover:bg-red-500/20 transition shadow-xs"
          >
            <MapPin size={13} />
            <span>🗺️ Explorar no Mapa Global</span>
          </Link>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Operações Militares, Conflitos, PMCs e Contratos de Defesa
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-text-soft sm:text-base">
          Consulte o registro documentado de intervenções militares, golpes de Estado,
          operações de empresas militares privadas (Blackwater, Wagner, DynCorp) e mega-contratos
          bélicos de potências da América do Norte e Europa. Acesse relatórios do Congresso dos EUA,
          resoluções do Conselho de Segurança da ONU, desfechos na soberania e conexões com a América Latina.
        </p>
      </header>

      {/* CARTÕES DE TOPO COM AGREGADOS MEDIDOS */}
      <section
        aria-label="Indicadores agregados do acervo militar"
        className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Crosshair size={14} className="text-red-600 dark:text-red-400" />
            <span>Ações Catalogadas</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {COBERTURA_OPERACOES_MILITARES.totalOperacoes} Dossiês
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Conflitos, golpes e contratos auditados.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Globe2 size={14} className="text-primary" />
            <span>Teatros & Países</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {COBERTURA_OPERACOES_MILITARES.totalPaisesTeatro} Nações
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Em todos os continentes do globo.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Shield size={14} className="text-purple-600 dark:text-purple-400" />
            <span>PMCs & Empreiteiras</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {COBERTURA_OPERACOES_MILITARES.totalPMCs + COBERTURA_OPERACOES_MILITARES.totalContratadasDefesa} Entidades
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Mercenários e indústria armamentista.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Globe2 size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>América Latina & Brasil</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {COBERTURA_OPERACOES_MILITARES.totalComConexaoBrasilOuLatam} Ações
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Golpes e intervenções históricas na região.
          </div>
        </div>
      </section>

      {/* PAINEL INTERATIVO COM AS SEIS QUALIDADES */}
      <main id="conteudo-principal-militar">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-border bg-surface p-12 text-center text-text-soft">
              <div className="animate-spin text-primary inline-block mb-3">⟳</div>
              <p className="text-sm font-semibold">Carregando acervo de operações militares...</p>
            </div>
          }
        >
          <PainelOperacoesMilitares operacoes={operacoes} />
        </Suspense>
      </main>

      {/* RODAPÉ GLOBAL */}
      <div className="mt-16">
        <FooterGlobal />
      </div>
    </div>
  );
}
