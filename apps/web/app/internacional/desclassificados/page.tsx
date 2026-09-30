/**
 * @file apps/web/app/internacional/desclassificados/page.tsx
 * @description Acervo de Documentos Desclassificados de Inteligência do G20.
 *
 * Papel no portal:
 * Centraliza e sistematiza documentos históricos e contemporâneos desclassificados
 * emitidos por agências de inteligência e segurança dos países membros do G20
 * (CIA, FBI, SNI/ABIN, MI5, CSIS, BND, DGSE, ASIO, SIDE, KGB/Wilson Center, etc.).
 *
 * Regras e decisões:
 * - Regra das Seis Qualidades (AGENTS.md §8): links de custódia oficial direta,
 *   busca em tempo real multifacetada, ordenação por data e relevância, agregados
 *   de topo datados, contexto para o Seu Nonô e exportação em CSV com BOM UTF-8.
 * - Regra de Fonte Mínima (AGENTS.md §5.10): parágrafo de resumo nunca menor que text-sm.
 * - Totalmente responsivo para smartphones (<= 640px) e compatível com impressão.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  COBERTURA_DESCLASSIFICADOS,
  obterDocumentosDesclassificados,
} from "@/lib/internacional/dados-desclassificados";
import PainelDesclassificados from "./PainelDesclassificados";
import FooterGlobal from "@/app/components/FooterGlobal";
import { Shield, FileText, Globe2, Eye, LockOpen, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Documentos Desclassificados de Inteligência do G20 | Controle Popular",
  description:
    "Acervo cívico unificado de documentos oficiais desclassificados de agências de inteligência do G20 (CIA, FBI, SNI, MI5, CSIS, BND, DGSE, ASIO, SIDE, KGB): busca, temas, pessoas, datas e links oficiais.",
};

export default function PaginaDesclassificadosG20() {
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
        <span className="font-semibold text-text">Documentos Desclassificados</span>
      </nav>

      {/* CABEÇALHO DA PÁGINA */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-semibold text-primary">
            <LockOpen size={12} />
            Acervo Desclassificado
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Shield size={12} />
            Serviços de Inteligência do G20
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Globe2 size={12} />
            Memória e Soberania Cívica
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Arquivos de Inteligência Desclassificados do G20
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-text-soft sm:text-base">
          Consulte relatórios de inteligência, telegramas diplomáticos, pareceres de segurança
          e dossiês desclassificados por agências estatais das nações do G20. Acesse fontes primárias,
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
          <div className="mt-2 text-2xl font-bold text-text">
            {COBERTURA_DESCLASSIFICADOS.totalDocumentos} Registros
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Dossiês completos com links canônicos.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Shield size={14} className="text-blue-600 dark:text-blue-400" />
            <span>Órgãos de Inteligência</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {COBERTURA_DESCLASSIFICADOS.totalOrgaos} Agências
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            CIA, FBI, SNI, CSIS, MI5, KGB, BND, etc.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Globe2 size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Países de Origem</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {COBERTURA_DESCLASSIFICADOS.totalPaisesOrigem} Nações
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Américas, Europa, Ásia e Oceania.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Eye size={14} className="text-amber-600 dark:text-amber-400" />
            <span>Mencionam o Brasil</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {COBERTURA_DESCLASSIFICADOS.totalDocsMencionamBrasil} Dossiês
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Impacto direto na política e história nacional.
          </div>
        </div>
      </section>

      {/* PAINEL INTERATIVO COM AS SEIS QUALIDADES */}
      <main id="conteudo-principal">
        <PainelDesclassificados documentos={documentos} />
      </main>

      {/* RODA PÉ GLOBAL */}
      <div className="mt-16">
        <FooterGlobal />
      </div>
    </div>
  );
}
