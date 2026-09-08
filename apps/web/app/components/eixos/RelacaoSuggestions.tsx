import React from 'react';
import type { Ficha } from '@/lib/eixos/types';
import { obterFichasRelacionadas } from '@/lib/eixos/relacionador';
import { listarTodasFichas } from '@/lib/eixos/fichas';
import FichaCard from './FichaCard';

interface Props {
  fichaAtual: Ficha;
  fichasDisponiveis?: Ficha[];
  limite?: number;
}

export default function RelacaoSuggestions({
  fichaAtual,
  fichasDisponiveis,
  limite = 3,
}: Props) {
  const todas = fichasDisponiveis ?? listarTodasFichas();
  const relacoes = obterFichasRelacionadas(fichaAtual, todas, { limite });

  if (relacoes.length === 0) return null;

  return (
    <section aria-labelledby="titulo-sugestoes-cruzadas" className="mt-8 pt-6 border-t border-border">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg" aria-hidden="true">🔗</span>
        <h3 id="titulo-sugestoes-cruzadas" className="font-display text-base sm:text-lg font-bold text-foreground">
          Quem também olha isso (Cruzamentos Interdisciplinares)
        </h3>
      </div>
      <p className="text-xs text-muted mb-4">
        Conexões entre eixos temáticos identificadas automaticamente por pertinência geográfica ou temática.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {relacoes.map((rel) => {
          let badgeCor = 'bg-primary/10 text-primary border-primary/20';
          let badgeTexto = 'Tema Correlato';

          if (rel.tipoConexao === 'interdisciplinar') {
            badgeCor = 'bg-accent/15 text-accent border-accent/30';
            badgeTexto = 'Interdisciplinar';
          } else if (rel.tipoConexao === 'mesmo-municipio') {
            badgeCor = 'bg-surface-2 text-foreground border-border';
            badgeTexto = 'Mesmo Território';
          }

          return (
            <div
              key={rel.ficha.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-2/40 p-3.5 transition-all hover:bg-surface-2/70"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeCor}`}>
                    {badgeTexto}
                  </span>
                  <span className="text-[10px] text-muted font-mono">
                    Score: {rel.score}
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground/90 mb-3 italic">
                  &ldquo;{rel.motivo}&rdquo;
                </p>
                <FichaCard ficha={rel.ficha} variant="compact" showEixoTag={true} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
