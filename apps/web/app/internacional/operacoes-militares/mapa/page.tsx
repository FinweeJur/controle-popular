/**
 * @file apps/web/app/internacional/operacoes-militares/mapa/page.tsx
 * @description Mapa Interativo Global de Operacoes Militares, Contratos de Defesa e PMCs.
 *
 * Papel no portal:
 * Permite ao cidadao explorar cartograficamente a distribuicao mundial de intervencoes militares,
 * deposicoes de regime, operacoes de contratados mercenarios e mega-contratos de armamentos.
 * Ao clicar em qualquer ponto, exibe o resumo civico, dados de soberania, custos e link para o acervo.
 *
 * Regras e decisoes:
 * - Regra das Seis Qualidades (AGENTS.md §8): Projecao SVG nativa acessivel sem bibliotecas externas pesadas.
 * - Regra de Fonte Minima (AGENTS.md §5.10): Paragrafo de descricao com piso text-sm (14px).
 * - Suspense para envolver cliente com leitura de parametros de busca (useSearchParams).
 * - Totalmente responsivo para dispositivos moveis e adaptado aos 4 temas do portal.
 */

import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  COBERTURA_OPERACOES_MILITARES,
  obterOperacoesMilitares,
} from "@/lib/internacional/dados-operacoes-militares";
import MapaOperacoesMilitaresClient from "./MapaOperacoesMilitaresClient";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  MapPin,
  Shield,
  Globe2,
  Crosshair,
  ArrowLeft,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Mapa Global de Operações Militares, Golpes e PMCs | Controle Popular",
  description:
    "Geolocalização interativa de intervenções militares, deposições de regime, mercenários e contratos bélicos de potências da América do Norte e Europa.",
};

export default function PaginaMapaOperacoesMilitares() {
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
        <Link
          href="/internacional/operacoes-militares"
          className="hover:underline hover:text-primary"
        >
          Operações Militares & Defesa
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">Mapa Mundial Interativo</span>
      </nav>

      {/* CABEÇALHO DA PÁGINA */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-semibold text-primary">
              <Crosshair size={12} />
              Georreferenciamento de Defesa
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
              <Shield size={12} />
              Operações Militares & Golpes
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
              <AlertTriangle size={12} />
              PMCs & Mercenários
            </span>
          </div>

          <Link
            href="/internacional/operacoes-militares"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text hover:border-primary transition"
          >
            <ArrowLeft size={13} />
            <span>Voltar ao Acervo Textual</span>
          </Link>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Mapa Global de Operações Militares, Conflitos e PMCs
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-text-soft sm:text-base">
          Consulte as coordenadas geográficas de intervenções militares, golpes de Estado,
          operações de empresas militares privadas (PMCs) e grandes contratos bélicos articulados
          por potências da América do Norte e Europa. Clique nos pontos para inspecionar resumos,
          desfechos na soberania e conexões históricas com a América Latina e o Brasil.
        </p>
      </header>

      {/* CARTÕES DE TOPO COM AGREGADOS MEDIDOS */}
      <section
        aria-label="Indicadores agregados do mapa militar"
        className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Crosshair size={14} className="text-red-600 dark:text-red-400" />
            <span>Ações Geolocalizadas</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {COBERTURA_OPERACOES_MILITARES.totalOperacoes} Eventos
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            100% com coordenadas geográficas exatas.
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
            Conflitos em todos os continentes.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Shield size={14} className="text-purple-600 dark:text-purple-400" />
            <span>PMCs & Contratadas</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {COBERTURA_OPERACOES_MILITARES.totalPMCs + COBERTURA_OPERACOES_MILITARES.totalContratadasDefesa} Entidades
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Corporações bélicas e mercenários privados.
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
            Golpes e intervenções na região.
          </div>
        </div>
      </section>

      {/* MAPA INTERATIVO CLIENT-SIDE COM SUSPENSE */}
      <main id="conteudo-mapa-militar">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-border bg-surface p-12 text-center text-text-soft">
              <div className="animate-spin text-primary inline-block mb-3">⟳</div>
              <p className="text-sm font-semibold">Carregando mapa interativo de operações militares...</p>
            </div>
          }
        >
          <MapaOperacoesMilitaresClient operacoes={operacoes} />
        </Suspense>
      </main>

      {/* RODAPÉ GLOBAL */}
      <div className="mt-16">
        <FooterGlobal />
      </div>
    </div>
  );
}
