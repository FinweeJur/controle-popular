import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import EixoLayout from '@/app/components/eixos/EixoLayout';
import FichaCard from '@/app/components/eixos/FichaCard';
import RelacaoSuggestions from '@/app/components/eixos/RelacaoSuggestions';
import { listarFichasPorSubfrente } from '@/lib/eixos/fichas';

export const metadata: Metadata = {
  title: 'Nossas Serras — Eixo Terra e Territórios | Controle Popular',
  description:
    'Preservação de topos de morro, patrimônio geológico, Unidades de Conservação e contenção da expansão minerária predatória.',
};

export default function NossasSerrasPage() {
  const fichas = listarFichasPorSubfrente('nossas-serras');
  const fichaDestaque = fichas[0];

  const indicadoresSerras = [
    { rotulo: 'Unidades de Conservação (CNUC)', valor: '387', obs: 'Parques, APAs e RPPNs mapeados em MG' },
    { rotulo: 'Processos de Mineração Ativos', valor: '1.899', obs: 'Faixa de amortecimento SIGMINE/ANM' },
    { rotulo: 'Cadeias Montanhosas Monitoradas', valor: '4', obs: 'Espinhaço, Canastra, Mantiqueira e Curral' },
    { rotulo: 'Sobreposições em Áreas Críticas', valor: '6', obs: 'Processos minerários × Territórios Quilombolas' },
  ];

  return (
    <EixoLayout
      eixoId="terra"
      subfrenteId="nossas-serras"
      heroImageSrc="/images/eixos/serras-cachoeira-fauna.jpg"
      heroImageAlt="Cachoeira em paredão rochoso com tamanduá e antas bebendo na lagoa"
      heroCaption="Cachoeira e fauna nativa em paredão rochoso — a defesa das serras brasileiras, caixas d'água naturais do país e refúgio da biodiversidade."
    >
      {/* CARTÕES DE STATUS */}
      <section aria-label="Indicadores de serras e unidades de conservação" className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {indicadoresSerras.map((item) => (
          <div key={item.rotulo} className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
              {item.rotulo}
            </span>
            <span className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {item.valor}
            </span>
            <span className="text-xs text-muted block mt-1">
              {item.obs}
            </span>
          </div>
        ))}
      </section>

      {/* PAINEL DE DEFESA DAS SERRAS E GLOBO 3D */}
      <section className="mb-10 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8">
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Vigilância Espacial
            </span>
            <h2 className="font-display text-2xl font-bold text-foreground mt-2">
              Topos de Morro: As Caixas D&apos;Água do Brasil
            </h2>
            <p className="mt-3 text-sm text-muted leading-relaxed">
              As serras brasileiras abrigam nascentes essenciais para o abastecimento das grandes cidades e comunidades rurais. O avanço de cavas minerárias e a supressão de vegetação rupestre ameaçam a recarga de aquíferos.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/funcaosocialterra/mapa"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
              >
                Ver Camadas no Globo 3D 🌐
              </Link>
              <Link
                href="/ambiental/licenciamento"
                className="rounded-xl border border-border bg-surface px-4 py-2 text-xs sm:text-sm font-semibold text-foreground hover:bg-surface-2 transition-colors"
              >
                Licenciamentos Ambientais (SEMAD/IBAMA) →
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 rounded-xl border border-border bg-surface-2/60 p-4 text-xs space-y-2">
            <h3 className="font-bold text-foreground uppercase tracking-wide text-xs">
              Camadas Integradas:
            </h3>
            <ul className="space-y-1.5 text-muted">
              <li>🌲 387 Unidades de Conservação (CNUC)</li>
              <li>⛏️ Polígonos de Requerimento e Lavra (ANM)</li>
              <li>⚠️ Faixa de amortecimento de 8 km</li>
              <li>⛰️ Áreas de Preservação Permanente (APP)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FICHAS DE SERRAS */}
      <section aria-labelledby="titulo-fichas-serras" className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 id="titulo-fichas-serras" className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Fichas Geológicas e de Preservação
            </h2>
            <p className="text-sm text-muted">
              Processos minerários, conflitos de terra e áreas tombadas
            </p>
          </div>
          <span className="rounded-full bg-surface-2 border border-border px-3 py-1 text-xs font-semibold text-muted">
            {fichas.length} fichas
          </span>
        </div>

        {fichas.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {fichas.map((ficha) => (
              <FichaCard key={ficha.id} ficha={ficha} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-muted text-sm">
            Fichas temáticas em processo de consolidação a partir dos dados do CNUC e SIGMINE.
          </div>
        )}

        {fichaDestaque && <RelacaoSuggestions fichaAtual={fichaDestaque} />}
      </section>
    </EixoLayout>
  );
}
