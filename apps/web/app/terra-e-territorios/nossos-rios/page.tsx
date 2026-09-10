import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import EixoLayout from '@/app/components/eixos/EixoLayout';
import FichaCard from '@/app/components/eixos/FichaCard';
import RelacaoSuggestions from '@/app/components/eixos/RelacaoSuggestions';
import { listarFichasPorSubfrente } from '@/lib/eixos/fichas';

import { DADOS_RIOS } from '@/lib/ambiental/nossos-rios-dados';

export const metadata: Metadata = {
  title: 'Nossos Rios e Bacias — Eixo Terra e Territórios | Controle Popular',
  description:
    'Monitoramento hidrológico, qualidade das águas, bacias atingidas (Rio Doce, Paraopeba), saneamento básico e reparação integral.',
};

export default function NossosRiosPage() {
  const fichas = listarFichasPorSubfrente('nossos-rios');
  const fichaDestaque = fichas[0];
  const listaRios = Object.values(DADOS_RIOS);

  const indicadoresRios = [
    { rotulo: 'Calhas Fluviais Auditadas', valor: '9', obs: 'Doce, Paraopeba, Velhas, Chico, Jequi, Tietê, Guandu, Paraíba, Araguari' },
    { rotulo: 'Recursos de Reparação', valor: 'R$ 176+ bi', obs: 'Repactuação Mariana (R$ 171 bi) + Brumadinho (R$ 5,48 bi)' },
    { rotulo: 'Municípios Atingidos Monitorados', valor: '75', obs: '26 na bacia do Paraopeba + 49 na Bacia do Rio Doce (MG/ES)' },
    { rotulo: 'População em Bacias Monitoradas', valor: '73+ mi', obs: 'Dados oficiais ANA, IGAM, CETESB e CEDAE' },
  ];

  return (
    <EixoLayout
      eixoId="terra"
      subfrenteId="nossos-rios"
      heroImageSrc="/images/eixos/nossos-rios-peixes-agua.jpg"
      heroImageAlt="Pôr do sol sobre o rio com corte subaquático mostrando peixes nativos e leito preservado"
      heroCaption="Pôr do sol e vida subaquática nos rios brasileiros — a fiscalização da qualidade das águas, saneamento e reparação justa dos rios atingidos por barragens."
    >
      {/* CARTÕES DE STATUS */}
      <section aria-label="Indicadores hídricos" className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {indicadoresRios.map((item) => (
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

      {/* PAINÉIS DE ACORDOS E REPARAÇÃO */}
      <section className="mb-10 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
        <h2 className="font-display text-xl font-bold text-foreground mb-2">
          Grandes Bacias e Reparação de Desastres
        </h2>
        <p className="text-sm text-muted mb-6">
          Acesso direto aos observatórios especializados de desastres da mineração e auditorias independentes:
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/paraopeba"
            className="group rounded-xl border border-border bg-surface-2/40 p-5 transition-all hover:border-emerald-500/40 hover:bg-surface-2/80"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
              Bacia do Rio Paraopeba
            </span>
            <h3 className="font-display text-lg font-bold text-foreground group-hover:text-emerald-600 transition-colors">
              Observatório da Reparação de Brumadinho →
            </h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Execução do Acordo Judicial de R$ 5,48 bi, repasses aos 853 municípios, auditoria AECOM/AJRI e biblioteca de 467 relatórios.
            </p>
          </Link>

          <Link
            href="/ambiental/mariana"
            className="group rounded-xl border border-border bg-surface-2/40 p-5 transition-all hover:border-emerald-500/40 hover:bg-surface-2/80"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
              Bacia do Rio Doce
            </span>
            <h3 className="font-display text-lg font-bold text-foreground group-hover:text-emerald-600 transition-colors">
              Acordo de Repactuação do Rio Doce (Mariana) →
            </h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Fiscalização dos repasses aos municípios atingidos, TACs, monitoramento ambiental e indenizações individuais.
            </p>
          </Link>
        </div>
      </section>

      {/* CATÁLOGO DAS 9 CALHAS FLUVIAIS MONITORADAS */}
      <section className="mb-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Observatório das 9 Calhas Fluviais e Bacias Estratégicas
            </h2>
            <p className="text-xs text-muted mt-1">
              Extensão da calha, população atendida, comitês de bacia e fontes oficiais auditadas
            </p>
          </div>
          <span className="rounded-full bg-surface-2 border border-border px-3 py-1 text-xs font-semibold text-muted">
            9 rios auditados
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {listaRios.map((rio) => (
            <Link
              key={rio.id}
              href={`/ambiental/nossos-rios/${rio.id}`}
              className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all hover:border-emerald-500/50 hover:bg-surface-2/40"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🌊</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {rio.numeroProtagonista.valor}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-base font-bold text-foreground group-hover:text-emerald-600 transition-colors">
                  {rio.nome} →
                </h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  {rio.numeroProtagonista.rotulo}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 text-xs text-muted space-y-1">
                <div className="flex justify-between">
                  <span>População na bacia:</span>
                  <span className="font-semibold text-foreground">{rio.populacaoBacia.split(' ')[0]} {rio.populacaoBacia.split(' ')[1]}</span>
                </div>
                <div className="flex justify-between">
                  <span>Municípios monitorados:</span>
                  <span className="font-semibold text-foreground">{rio.municipiosBacia}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fonte oficial:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{rio.numeroProtagonista.fonte}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FICHAS DE RIOS E BACIAS */}
      <section aria-labelledby="titulo-fichas-rios" className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 id="titulo-fichas-rios" className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Fichas Hídricas e Qualidade da Água
            </h2>
            <p className="text-sm text-muted">
              Diagnósticos das bacias urbanas e rurais, comitês de bacia e despoluição
            </p>
          </div>
          <span className="rounded-full bg-surface-2 border border-border px-3 py-1 text-xs font-semibold text-muted">
            {fichas.length} fichas
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {fichas.map((ficha) => (
            <FichaCard key={ficha.id} ficha={ficha} />
          ))}
        </div>

        {fichaDestaque && <RelacaoSuggestions fichaAtual={fichaDestaque} />}
      </section>
    </EixoLayout>
  );
}
