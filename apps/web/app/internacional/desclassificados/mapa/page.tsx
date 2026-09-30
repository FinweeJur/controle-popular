/**
 * @file apps/web/app/internacional/desclassificados/mapa/page.tsx
 * @description Mapa Interativo Global de Documentos Desclassificados de Inteligência do G20.
 *
 * Papel no portal:
 * Apresenta a distribuição geográfica das operações, telegramas e dossiês
 * desclassificados de órgãos de inteligência (CIA, FBI, SNI, CSIS, MI5, KGB, BND, etc.).
 * Ao selecionar qualquer ponto ou camada no mapa, o leitor visualiza o resumo cívico,
 * pessoas citadas, fonte arquivística oficial e o link para o relatório no acervo completo.
 *
 * Regras e decisões:
 * - Regra das Seis Qualidades (AGENTS.md §8): Projeção SVG nativa acessível sem bibliotecas pesadas.
 * - Regra de Fonte Mínima (AGENTS.md §5.10): Texto de descrição com piso de text-sm (14px).
 * - Suspense para envolver cliente com leitura de parâmetros de busca (useSearchParams).
 * - Totalmente responsivo para dispositivos móveis e suporte aos temas do portal.
 */

import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  COBERTURA_DESCLASSIFICADOS,
  obterDocumentosDesclassificados,
} from "@/lib/internacional/dados-desclassificados";
import MapaDesclassificadosClient from "./MapaDesclassificadosClient";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  MapPin,
  Shield,
  Globe2,
  FileText,
  ArrowLeft,
  LockOpen,
  Eye,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Mapa Global de Inteligência Desclassificada do G20 | Controle Popular",
  description:
    "Geolocalização interativa dos relatórios e dossiês de inteligência desclassificados do G20: CIA, SNI, MI5, CSIS, BND, KGB e outros serviços com links para os relatórios oficiais.",
};

export default function PaginaMapaDesclassificadosG20() {
  const documentos = obterDocumentosDesclassificados();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* BREADCRUMB E NAVEGAÇÃO */}
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
          href="/internacional/desclassificados"
          className="hover:underline hover:text-primary"
        >
          Documentos Desclassificados
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">Mapa Global Interativo</span>
      </nav>

      {/* CABEÇALHO DA PÁGINA */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-semibold text-primary">
              <MapPin size={12} />
              Georreferenciamento de Inteligência
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <Shield size={12} />
              G20 Desclassificado
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Globe2 size={12} />
              Projeção Vetorial Nativa
            </span>
          </div>

          <Link
            href="/internacional/desclassificados"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text hover:border-primary transition"
          >
            <ArrowLeft size={13} />
            <span>Voltar ao Acervo Textual</span>
          </Link>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Mapa Global de Documentos Desclassificados do G20
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-text-soft sm:text-base">
          Navegue pelas coordenadas e áreas de foco de todos os relatórios históricos
          desclassificados por órgãos de inteligência das nações do G20. Clique nos pontos
          ou filtre pelas camadas temáticas para consultar a ficha arquivística, resumo
          analítico, links oficiais de custódia e o dossiê detalhado no acervo.
        </p>
      </header>

      {/* CARTÕES DE TOPO COM AGREGADOS */}
      <section
        aria-label="Indicadores agregados do mapa"
        className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <MapPin size={14} className="text-primary" />
            <span>Pontos Geolocalizados</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {COBERTURA_DESCLASSIFICADOS.totalDocumentos} Locais
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            100% dos relatórios com coordenadas oficiais.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Shield size={14} className="text-blue-600 dark:text-blue-400" />
            <span>Serviços de Inteligência</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {COBERTURA_DESCLASSIFICADOS.totalOrgaos} Agências
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            CIA, FBI, SNI, CSIS, MI5, KGB, BND e mais.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Globe2 size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Países Representados</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {COBERTURA_DESCLASSIFICADOS.totalPaisesOrigem} Nações
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Operações em 4 continentes globais.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Eye size={14} className="text-amber-600 dark:text-amber-400" />
            <span>Conexão Brasil</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {COBERTURA_DESCLASSIFICADOS.totalDocsMencionamBrasil} Dossiês
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Com impacto direto na soberania nacional.
          </div>
        </div>
      </section>

      {/* MAPA INTERATIVO CLIENT-SIDE COM SUSPENSE */}
      <main id="conteudo-mapa">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-border bg-surface p-12 text-center text-text-soft">
              <div className="animate-spin text-primary inline-block mb-3">⟳</div>
              <p className="text-sm font-semibold">Carregando mapa interativo dos relatórios...</p>
            </div>
          }
        >
          <MapaDesclassificadosClient documentos={documentos} />
        </Suspense>
      </main>

      {/* RODAPÉ GLOBAL */}
      <div className="mt-16">
        <FooterGlobal />
      </div>
    </div>
  );
}
