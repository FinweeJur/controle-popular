import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import EixoLayout from '@/app/components/eixos/EixoLayout';
import {
  listarCidadesEstrategicas,
  obterEstatisticasExpansao,
} from '@/lib/cidades/estrategicas';
import TabelaCidadesClient from '@/app/cidades/TabelaCidadesClient';

export const metadata: Metadata = {
  title: '199 Cidades Estratégicas — Eixo Terra e Territórios | Controle Popular',
  description:
    'Rede nacional de fiscalização municipal em 27 capitais e 172 polos regionais do interior do Brasil.',
};

export default function CidadesEstrategicasEixoPage() {
  const cidades = listarCidadesEstrategicas();
  const stats = obterEstatisticasExpansao();

  return (
    <EixoLayout
      eixoId="terra"
      subfrenteId="cidades"
      heroImageSrc="/images/eixos/terra-e-territorios-ipe-lobo.jpg"
      heroImageAlt="Lobo-guará e ipê amarelo no topo da serra"
      heroCaption="Rede de fiscalização municipal: 199 polos regionais e capitais acompanhados com dados oficiais e cruzamentos leigos."
    >
      {/* CABEÇALHO COM CONTADORES E FILTROS */}
      <section className="mb-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
              Cidades Monitoradas
            </span>
            <span className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {stats.totalCidades}
            </span>
            <span className="text-[11px] text-muted block mt-1">
              100% com código IBGE 7 dígitos
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
              Capitais Estaduais
            </span>
            <span className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {stats.totalCapitais}
            </span>
            <span className="text-[11px] text-muted block mt-1">
              26 Estados + Distrito Federal
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
              Polos do Interior
            </span>
            <span className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {stats.totalPolosInterior}
            </span>
            <span className="text-[11px] text-muted block mt-1">
              Cidades polo e sedes regionais
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
              População Abrangida
            </span>
            <span className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              112+ mi
            </span>
            <span className="text-[11px] text-muted block mt-1">
              Mais de 55% da população do país
            </span>
          </div>
        </div>

        {/* TABELA CLIENTE COM BUSCA E FILTROS */}
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Catálogo das 199 Cidades Estratégicas
              </h2>
              <p className="text-xs text-muted mt-1">
                Filtre por nome, UF ou região geográfica para acessar o perfil individual de cada município
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Base auditada IBGE / DATASUS</span>
            </div>
          </div>

          <TabelaCidadesClient cidades={cidades} />
        </div>
      </section>
    </EixoLayout>
  );
}
