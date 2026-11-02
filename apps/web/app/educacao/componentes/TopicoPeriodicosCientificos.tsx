"use client";

/**
 * @file apps/web/app/educacao/componentes/TopicoPeriodicosCientificos.tsx
 * @description Módulo de Periódicos Científicos Mundiais e Ciência Cívica Aberta.
 *
 * Papel no portal:
 *   Reúne o acervo de 23.577 periódicos científicos auditados no DOAJ e SciELO,
 *   destacando revistas com submissão em fluxo contínuo e chamadas cíclicas
 *   sem taxas de publicação para o autor (Diamond Open Access).
 *
 * Regras respeitadas:
 *   - Regra 5.9: comentário explicativo no cabeçalho.
 *   - Regra 5.14: responsividade (390 px) e sem estouro lateral.
 *   - Regra 5.16: fonte mínima de 12 px (text-xs = 12px).
 */

import React from "react";
import { BookOpen } from "lucide-react";
import PainelEducacaoPeriodicos, { type PeriodicoItem } from "../PainelEducacaoPeriodicos";

export interface MetricasPeriodicos {
  total_periodicos: number;
  gratuitos_diamond: number;
  total_fluxo_continuo: number;
  total_ciclicos_confirmados: number;
  total_paises: number;
}

interface TopicoPeriodicosCientificosProps {
  amostra: PeriodicoItem[];
  atualizadoEm: string;
  metricas: MetricasPeriodicos;
}

const fmt = (n: number) => n.toLocaleString("pt-BR");

export default function TopicoPeriodicosCientificos({
  amostra,
  atualizadoEm,
  metricas,
}: TopicoPeriodicosCientificosProps) {
  const dataFormatada = atualizadoEm.split("-").reverse().join("/");

  return (
    <div className="mt-8 space-y-8">
      {/* Banner de Métricas Globais Auditadas */}
      <section
        aria-label="Agregados medidos de periódicos"
        className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Periódicos Científicos de Acesso Aberto no Mundo
              </h2>
              <p className="text-xs text-muted">
                Auditados a partir do DOAJ e coleções SciELO em {fmt(metricas.total_paises)} países
              </p>
            </div>
          </div>

          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted border border-border">
            Atualizado em {dataFormatada}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-4xl">
          Catálogo sistematizado de revistas acadêmicas que adotam revisão por pares ética, licenças
          Creative Commons e registros persistentes (DOI e ISSN). Prioridade absoluta para o modelo{" "}
          <strong>Acesso Aberto Diamante</strong> — revistas 100% gratuitas onde nem o autor paga
          para publicar (sem APC) nem o leitor paga para acessar.
        </p>

        {/* 4 Indicadores Rápidos */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-surface-2 border border-border">
            <span className="text-xs text-muted block">Total Catalogado</span>
            <span className="text-xl font-extrabold text-foreground mt-0.5 block">
              {fmt(metricas.total_periodicos)}
            </span>
            <span className="text-xs text-muted block mt-0.5">Mundial (141 países)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-2 border border-border">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block">
              Sem APC (Diamante)
            </span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {fmt(metricas.gratuitos_diamond)}
            </span>
            <span className="text-xs text-muted block mt-0.5">62,5% do acervo auditado</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-2 border border-border">
            <span className="text-xs text-muted block">Fluxo Contínuo</span>
            <span className="text-xl font-extrabold text-foreground mt-0.5 block">
              {fmt(metricas.total_fluxo_continuo)}
            </span>
            <span className="text-xs text-muted block mt-0.5">Submissão aberta o ano todo</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-2 border border-border">
            <span className="text-xs text-muted block">Chamadas Cíclicas</span>
            <span className="text-xl font-extrabold text-foreground mt-0.5 block">
              {fmt(metricas.total_ciclicos_confirmados)}
            </span>
            <span className="text-xs text-muted block mt-0.5">Semestrais, anuais e temáticas</span>
          </div>
        </div>
      </section>

      {/* Catálogo Interativo com Busca, Ordenação e Filtros */}
      <PainelEducacaoPeriodicos
        amostra={amostra}
        atualizadoEm={atualizadoEm}
      />
    </div>
  );
}
