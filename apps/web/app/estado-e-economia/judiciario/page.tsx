import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import EixoLayout from '@/app/components/eixos/EixoLayout';
import FichaCard from '@/app/components/eixos/FichaCard';
import RelacaoSuggestions from '@/app/components/eixos/RelacaoSuggestions';
import { listarFichasPorSubfrente } from '@/lib/eixos/fichas';

export const metadata: Metadata = {
  title: 'Judiciário e Justiça — Eixo Estado e Economia | Controle Popular',
  description:
    'Composição dos sete tribunais superiores e regionais, vacância de magistrados, inspeções do CNJ e processos ambientais do SIRENEJud.',
};

export default function JudiciarioEixoPage() {
  const fichas = listarFichasPorSubfrente('judiciario');
  const fichaDestaque = fichas[0];

  const indicadoresJudiciario = [
    { rotulo: 'Magistrados Monitorados', valor: '252', obs: 'STF, STJ, TST, TSE, STM, TJMG e TRF-6' },
    { rotulo: 'Ações Ambientais Ativas', valor: '1.420', obs: 'Mapeadas pelo SIRENEJud/CNJ em MG' },
    { rotulo: 'Inspeções Disciplinares', valor: '48', obs: 'Relatórios públicos da Corregedoria Nacional (CNJ)' },
    { rotulo: 'Folha de Remunerações', valor: '100%', obs: 'Dados abertos de subsídios e indenizações' },
  ];

  return (
    <EixoLayout
      eixoId="estado"
      subfrenteId="judiciario"
      heroImageSrc="/images/eixos/direitos-em-movimento-arara.jpg"
      heroImageAlt="Vista do sistema judiciário"
      heroCaption="O controle social sobre o Poder Judiciário — transparência de decisões ambientais, composição das cortes e remunerações públicas."
    >
      {/* CARTÕES DE STATUS */}
      <section aria-label="Indicadores do Judiciário" className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {indicadoresJudiciario.map((item) => (
          <div key={item.rotulo} className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
              {item.rotulo}
            </span>
            <span className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {item.valor}
            </span>
            <span className="text-[11px] text-muted block mt-1">
              {item.obs}
            </span>
          </div>
        ))}
      </section>

      {/* INTEGRAÇÃO COM O ACERVO HISTÓRICO DO JUDICIÁRIO */}
      <section className="mb-10 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
        <h2 className="font-display text-xl font-bold text-foreground mb-2">
          Observatórios Consolidados do Judiciário
        </h2>
        <p className="text-sm text-muted mb-6">
          Acesse os painéis interativos completos de composição de cortes e processos ambientais:
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/judiciario"
            className="group rounded-xl border border-border bg-surface-2/40 p-5 transition-all hover:border-blue-500/40 hover:bg-surface-2/80"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
              Tribunais e Magistrados
            </span>
            <h3 className="font-display text-lg font-bold text-foreground group-hover:text-blue-600 transition-colors">
              Painel Geral do Judiciário →
            </h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Composição nominal dos 7 tribunais, idade média de aposentadoria compulsória, vagas abertas e indicações do Senado.
            </p>
          </Link>

          <Link
            href="/judiciario/sirenejud"
            className="group rounded-xl border border-border bg-surface-2/40 p-5 transition-all hover:border-blue-500/40 hover:bg-surface-2/80"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
              Processos Ambientais
            </span>
            <h3 className="font-display text-lg font-bold text-foreground group-hover:text-blue-600 transition-colors">
              Observatório SIRENEJud / CNJ →
            </h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Consulta de ações civis públicas, desmatamento e crimes ambientais georreferenciados em todo o território nacional.
            </p>
          </Link>
        </div>
      </section>

      {/* FICHAS DO JUDICIÁRIO */}
      <section aria-labelledby="titulo-fichas-judiciario" className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 id="titulo-fichas-judiciario" className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Fichas e Relatórios do Judiciário
            </h2>
            <p className="text-sm text-muted">
              Auditorias disciplinares do CNJ e processos de repercussão socioambiental
            </p>
          </div>
          <span className="rounded-full bg-surface-2 border border-border px-3 py-1 text-xs font-semibold text-muted">
            {fichas.length} fichas catalogadas
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
