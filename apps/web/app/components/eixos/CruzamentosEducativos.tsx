import React from 'react';
import type { CruzamentoMunicipalItem } from '@/lib/eixos/types';

interface Props {
  cruzamentos: CruzamentoMunicipalItem[];
  nomeMunicipio?: string;
}

export default function CruzamentosEducativos({ cruzamentos, nomeMunicipio }: Props) {
  if (!cruzamentos || cruzamentos.length === 0) return null;

  return (
    <section aria-labelledby="titulo-cruzamentos-educativos" className="my-8 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">🧠</span>
            <h2 id="titulo-cruzamentos-educativos" className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              O que esses dados dizem juntos?
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted">
            {nomeMunicipio
              ? `Cruzamentos analíticos em linguagem cidadã para ${nomeMunicipio}`
              : 'Cruzamentos analíticos entre saúde, educação, finanças e segurança pública'}
          </p>
        </div>

        <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
          Metodologia Data Ocean
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {cruzamentos.map((item, index) => {
          let statusCor = 'border-border bg-surface-2/40 text-foreground';
          let statusBadge = 'bg-surface-2 text-muted';
          let statusIcon = 'ℹ️';

          if (item.status === 'positivo') {
            statusCor = 'border-emerald-500/30 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200';
            statusBadge = 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold';
            statusIcon = '✅';
          } else if (item.status === 'atencao') {
            statusCor = 'border-amber-500/40 bg-amber-500/5 text-amber-950 dark:text-amber-200';
            statusBadge = 'bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold';
            statusIcon = '⚠️';
          } else if (item.status === 'sem-dado') {
            // Selo próprio: ausência de dado não pode ler-se como "Regular".
            // O leitor precisa ver que o portal não sabe, não que está tudo bem.
            statusCor = 'border-dashed border-border bg-surface-2/60 text-muted';
            statusBadge = 'bg-surface-2 text-muted border border-border';
            statusIcon = '❔';
          }

          return (
            <div
              key={item.titulo}
              className={`flex flex-col justify-between rounded-xl border p-5 transition-all ${statusCor}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">
                    Cruzamento #{index + 1}
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-xs ${statusBadge}`}>
                    {statusIcon}{' '}
                    {item.status === 'positivo'
                      ? 'Positivo'
                      : item.status === 'atencao'
                        ? 'Alerta'
                        : item.status === 'sem-dado'
                          ? 'Sem dado'
                          : 'Regular'}
                  </span>
                </div>

                <h3 className="font-display text-base font-bold text-foreground mb-1">
                  {item.titulo}
                </h3>
                <div className="inline-block font-mono text-xs text-muted mb-3 rounded bg-surface px-2 py-0.5 border border-border/50">
                  {item.formula}
                </div>

                <p className="text-sm leading-relaxed text-muted">
                  {item.explicacao}
                </p>

                {item.criterio && (
                  <p className="mt-2 text-xs text-muted border-l-2 border-border pl-2">
                    {item.criterio}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 text-xs text-muted">
                <span className="font-semibold text-foreground">Bases: </span>
                {item.indicadoresEnvolvidos.join(' + ')}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl bg-surface-2/60 border border-dashed border-border p-4 text-xs text-muted flex flex-wrap items-center justify-between gap-3">
        <p>
          💡 <strong>Princípio Editorial:</strong> Os dados vêm de fonte oficial
          (DataSUS, INEP, SINESP, Tesouro); os limites que viram selo são
          critério deste portal e aparecem escritos em cada card. Nenhuma
          correlação implica condenação isolada — lacuna declarada e ressalva
          viajam coladas ao número.
        </p>
      </div>
    </section>
  );
}
