/**
 * @file apps/web/app/internacional/inteligencia/page.tsx
 * @description Central de Inteligência e Documentos Desclassificados do G20 e Twelve Eyes.
 *
 * Papel no portal:
 * Centraliza e sistematiza documentos oficiais, relatórios contemporâneos e arquivos históricos
 * desclassificados emitidos por agências de inteligência dos Estados Unidos (CIA, FBI, NSA),
 * alianças internacionais (Five Eyes, Nine Eyes, Twelve Eyes) e potências do G20 (SNI, MI5, CSIS, BND, DGSE, ASIO, KGB).
 *
 * Regras e decisões:
 * - Regra das Seis Qualidades (AGENTS.md §8): links de custódia oficial direta,
 *   busca em tempo real multifacetada, ordenação dinâmica, agregados de topo medidos,
 *   integração com o Seu Nonô e exportação em CSV com BOM UTF-8.
 * - Regra de Fonte Mínima (AGENTS.md §5.10): parágrafo de resumo sob o título nunca menor que text-sm.
 * - Totalmente responsivo para smartphones (<= 640px) e compatível com impressão.
 */

import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  COBERTURA_DESCLASSIFICADOS,
  obterDocumentosDesclassificados,
} from "@/lib/internacional/dados-desclassificados";
import PainelInteligencia from "./PainelInteligencia";
import FooterGlobal from "@/app/components/FooterGlobal";
import { Shield, FileText, Globe2, Eye, LockOpen, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Central de Inteligência & Documentos Desclassificados | Controle Popular",
  description:
    "Acervo cívico unificado de relatórios de inteligência, segurança cibernética e dossiês desclassificados do G20, FBI, NSA, CIA e Twelve Eyes: busca, temas, pessoas, datas e links oficiais canônicos.",
};

export default function PaginaInteligenciaG20() {
  const documentos = obterDocumentosDesclassificados();

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
        <span className="font-semibold text-text">Inteligência & Desclassificados</span>
      </nav>

      {/* CABEÇALHO DA PÁGINA */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-semibold text-primary">
              <LockOpen size={12} />
              Inteligência & Desclassificados
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <Shield size={12} />
              FBI, NSA, CIA & Twelve Eyes
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Globe2 size={12} />
              Memória e Soberania Cívica
            </span>
          </div>

          <Link
            href="/internacional/inteligencia/mapa"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition shadow-xs"
          >
            <MapPin size={13} />
            <span>🗺️ Explorar no Mapa Global</span>
          </Link>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Central de Inteligência & Documentos Desclassificados
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-text-soft sm:text-base">
          Consulte relatórios de inteligência, avaliações cibernéticas, telegramas diplomáticos, diretrizes de segurança
          e dossiês desclassificados dos Estados Unidos (CIA, FBI, NSA) e potências da aliança Twelve Eyes. Acesse fontes primárias,
          identificadores de custódia arquivística oficial, pessoas e países citados, e faça buscas
          avançadas com exportação de dados.
        </p>
      </header>

      {/* CARTÕES DE TOPO COM AGREGADOS MEDIDOS */}
      <section
        aria-label="Indicadores agregados do acervo"
        className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <FileText size={14} className="text-primary" />
            <span>Documentos Sistematizados</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text font-mono">
            {COBERTURA_DESCLASSIFICADOS.totalDocumentos} Registros
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Dossiês com links canônicos oficiais e PDFs.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Shield size={14} className="text-blue-600 dark:text-blue-400" />
            <span>Órgãos de Inteligência</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text font-mono">
            {COBERTURA_DESCLASSIFICADOS.totalOrgaos} Agências
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            FBI, NSA, CIA, SNI, CSIS, MI5, BND, DGSE...
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Globe2 size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Países de Origem</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text font-mono">
            {COBERTURA_DESCLASSIFICADOS.totalPaisesOrigem} Nações
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            EUA, Twelve Eyes, Europa e América Latina.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Eye size={14} className="text-amber-600 dark:text-amber-400" />
            <span>Mencionam o Brasil</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text font-mono">
            {COBERTURA_DESCLASSIFICADOS.totalDocsMencionamBrasil} Dossiês
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Impacto direto na soberania e história nacional.
          </div>
        </div>
      </section>

      {/* PAINEL INTERATIVO COM AS SEIS QUALIDADES */}
      <main id="conteudo-principal">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-border bg-surface p-12 text-center text-text-soft">
              <div className="animate-spin text-primary inline-block mb-3">⟳</div>
              <p className="text-sm font-semibold">Carregando central de inteligência...</p>
            </div>
          }
        >
          <PainelInteligencia documentos={documentos} />
        </Suspense>
      </main>

      {/* RODAPÉ GLOBAL */}
      <div className="mt-16">
        <FooterGlobal />
      </div>
    </div>
  );
}
