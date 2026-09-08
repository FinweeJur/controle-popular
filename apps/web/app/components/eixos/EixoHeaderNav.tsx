'use client';

import React from 'react';
import Link from 'next/link';
import type { EixoId } from '@/lib/eixos/types';
import { CATALOGO_EIXOS } from '@/lib/eixos/catalogo';

interface Props {
  eixoAtivo?: EixoId;
  subfrenteAtiva?: string;
}

export default function EixoHeaderNav({ eixoAtivo, subfrenteAtiva }: Props) {
  const eixos = Object.values(CATALOGO_EIXOS);

  return (
    <nav
      aria-label="Navegação pelos 3 Eixos Temáticos"
      className="w-full border-b border-border bg-surface/95 backdrop-blur-md sticky top-0 z-30"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* BARRA PRINCIPAL DOS 3 EIXOS */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Eixos Temáticos
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {eixos.map((eixo) => {
              const isAtivo = eixo.id === eixoAtivo;
              const linkHref =
                eixo.id === 'direitos'
                  ? '/direitos-em-movimento'
                  : `/${eixo.id === 'terra' ? 'terra-e-territorios' : 'estado-e-economia'}`;

              return (
                <Link
                  key={eixo.id}
                  href={linkHref}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                    isAtivo
                      ? 'shadow-sm font-semibold'
                      : 'text-muted hover:text-foreground hover:bg-surface-2'
                  }`}
                  style={
                    isAtivo
                      ? {
                          backgroundColor: `var(${eixo.corVar})`,
                          color: `var(${eixo.corInkVar})`,
                        }
                      : undefined
                  }
                  aria-current={isAtivo ? 'page' : undefined}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `var(${eixo.corVar})` }} />
                  {eixo.titulo}
                </Link>
              );
            })}
          </div>
        </div>

        {/* SUBFRENTES DO EIXO ATIVO */}
        {eixoAtivo && (
          <div className="flex items-center gap-1 overflow-x-auto py-2 border-t border-border/40 text-xs no-scrollbar">
            <span className="text-muted pr-2 font-medium shrink-0">Subfrentes:</span>
            {CATALOGO_EIXOS[eixoAtivo].subfrentes.map((sub) => {
              const isSubAtiva = sub.id === subfrenteAtiva || sub.slug === subfrenteAtiva;
              const subHref =
                sub.rotaLegada ??
                (eixoAtivo === 'terra'
                  ? `/terra-e-territorios/${sub.slug}`
                  : eixoAtivo === 'estado'
                  ? `/estado-e-economia/${sub.slug}`
                  : `/direitos-em-movimento/${sub.slug}`);

              return (
                <Link
                  key={sub.id}
                  href={subHref}
                  className={`shrink-0 rounded-md px-2.5 py-1 transition-colors ${
                    isSubAtiva
                      ? 'bg-surface-2 font-semibold text-foreground border border-border'
                      : 'text-muted hover:text-foreground hover:bg-surface-2/60'
                  }`}
                >
                  {sub.titulo}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
