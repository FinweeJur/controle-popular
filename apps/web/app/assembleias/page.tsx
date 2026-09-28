/**
 * Página principal (Hub Nacional) das 27 Assembleias Legislativas Estaduais.
 *
 * Papel no portal:
 * Centraliza o monitoramento cívico dos parlamentos estaduais brasileiros,
 * cobrindo 1.059 deputados estaduais e distritais nas 27 unidades federativas.
 *
 * Fontes oficiais:
 * - Portais de transparência e dados abertos das 27 Assembleias Legislativas.
 * - Artigo 27 da Constituição Federal de 1988 (composição das bancadas).
 *
 * Regra das Seis Qualidades (AGENTS.md § 8):
 * - Links oficiais diretos para cada Casa e processo legislativo.
 * - Filtros combináveis por macrorregião e busca textual em tempo real.
 * - Indicadores agregados nacionais no topo da página.
 * - Exportação e navegação rápida para as páginas estaduais.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Landmark, ArrowLeft, Bot, ShieldCheck } from "lucide-react";
import HubAssembleiasClient from "./HubAssembleiasClient";
import {
  listarTodasAssembleias,
  obterMetricasNacionaisAssembleias,
} from "@/lib/assembleias/dados";

export const metadata: Metadata = {
  title: "Assembleias Legislativas dos Estados | Controle Popular",
  description:
    "Auditoria cívica, proposições de lei, comissões, rankings de produtividade e dados das 27 Assembleias Legislativas estaduais brasileiras.",
};

export default function AssembleiasPage() {
  const assembleias = listarTodasAssembleias();
  const metricas = obterMetricasNacionaisAssembleias();

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* ═══ NAVEGAÇÃO BREADCRUMB ═══ */}
        <nav aria-label="Trilha de navegação" className="flex items-center gap-2 text-xs text-muted">
          <Link href="/" className="hover:text-foreground transition-colors">
            Início
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground font-semibold">Assembleias Legislativas</span>
        </nav>

        {/* ═══ CABEÇALHO DO HUB NACIONAL ═══ */}
        <header className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Landmark size={14} aria-hidden="true" />
                <span>Poder Legislativo Estadual</span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground">
                Assembleias Legislativas do Brasil
              </h1>

              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Monitoramento cidadão de todas as 27 Casas Legislativas estaduais e distrital.
                Consulte projetos de lei de interesse social, comissões temáticas,
                audiências públicas, composição da mesa diretora e ranking de atuação cívica.
              </p>
            </div>

            {/* Selo de auditoria cívica */}
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2 p-4 text-xs shrink-0">
              <ShieldCheck className="h-8 w-8 text-primary shrink-0" aria-hidden="true" />
              <div>
                <strong className="block font-bold text-foreground">
                  Auditoria 100% Cívica
                </strong>
                <span className="text-muted block text-[11px]">
                  Dados abertos oficiais auditados
                </span>
              </div>
            </div>
          </div>

          {/* Dica de RAG do Assistente Cívico (Regra § 8.5) */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-foreground">
            <Bot size={18} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">
              <strong>Assistente Cívico Seu Nonô:</strong> Você pode perguntar sobre qualquer
              deputado estadual, projeto de lei sobre saúde ou meio ambiente, e orçamento das Casas.
              Experimente: <em>&quot;Quais as prioridades da Comissão de Meio Ambiente da ALMG?&quot;</em>
            </p>
          </div>
        </header>

        {/* ═══ INTERFACE INTERATIVA DO HUB ═══ */}
        <HubAssembleiasClient assembleias={assembleias} metricas={metricas} />
      </div>
    </main>
  );
}
