import React from 'react';
import type { Metadata } from 'next';
import EixoLayout from '@/app/components/eixos/EixoLayout';
import FichaCard from '@/app/components/eixos/FichaCard';
import RelacaoSuggestions from '@/app/components/eixos/RelacaoSuggestions';
import CruzamentosEducativos from '@/app/components/eixos/CruzamentosEducativos';
import { listarFichasPorSubfrente } from '@/lib/eixos/fichas';
import { calcularCruzamentosMunicipais } from '@/lib/cruzamentos/correlacionador';

export const metadata: Metadata = {
  title: 'Orçamento Público — Eixo Estado e Economia | Controle Popular',
  description:
    'Fiscalização de dotações orçamentárias, execução financeira, transferências federais (Transferegov) e indicadores macroeconômicos (BCB).',
};

export default function OrcamentoPage() {
  const fichas = listarFichasPorSubfrente('orcamento');
  const fichaDestaque = fichas[0];

  const indicadoresOrcamento = [
    { rotulo: 'Orçamento Federal Executado', valor: 'R$ 5,2 tri', obs: 'Execução orçamentária geral (SIOP)' },
    { rotulo: 'Repasses FPM / Fundeb', valor: 'R$ 380 bi', obs: 'Transferências constitucionais aos municípios' },
    { rotulo: 'IPCA Acumulado 12m', valor: '4,24%', obs: 'Banco Central do Brasil (API Olinda)' },
    { rotulo: 'Meta Selic Vigente', valor: '10,50%', obs: 'Taxa básica de juros (COPOM/BCB)' },
  ];

  const cruzamentos = calcularCruzamentosMunicipais({
    codIbge7: '3106200',
    nome: 'Belo Horizonte',
    uf: 'MG',
    populacao: 2315000,
    repassesFederaisAnual: 3500000000,
    idebAnosIniciais: 6.1,
    totalLeitosSus: 5200,
    totalHomicidiosAno: 280,
  });

  return (
    <EixoLayout
      eixoId="estado"
      subfrenteId="orcamento"
      heroImageSrc="/images/eixos/direitos-em-movimento-arara.jpg"
      heroImageAlt="Vista panorâmica do fluxo econômico"
      heroCaption="A rota do dinheiro público — o acompanhamento transparente das receitas tributárias e da destinação das verbas públicas."
    >
      {/* CARTÕES DE STATUS */}
      <section aria-label="Indicadores macroeconômicos e orçamentários" className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {indicadoresOrcamento.map((item) => (
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

      {/* GRÁFICO SVG ACESSÍVEL: COMPOSIÇÃO DAS RECEITAS MUNICIPAIS */}
      <section aria-labelledby="titulo-grafico-orcamento" className="mb-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 id="titulo-grafico-orcamento" className="font-display text-lg font-bold text-foreground">
              Estrutura Típica das Receitas Municipais (Brasil)
            </h2>
            <p className="text-xs text-muted">Proporção entre arrecadação própria e transferências de outras esferas</p>
          </div>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted border border-border">
            SICONFI / Tesouro Nacional
          </span>
        </div>

        <div className="my-6">
          <svg
            className="w-full h-8 rounded-lg overflow-hidden"
            viewBox="0 0 100 8"
            preserveAspectRatio="none"
            role="img"
            aria-label="Gráfico de barras: 62% Transferências Federais/Estaduais, 28% Tributos Próprios, 10% Operações de Crédito e Outros"
          >
            <rect x="0" y="0" width="62" height="8" fill="var(--cp-eixo-estado, #1e3a8a)" />
            <rect x="62" y="0" width="28" height="8" fill="var(--cp-accent, #0e8f6e)" />
            <rect x="90" y="0" width="10" height="8" fill="var(--cp-tertiary, #8a5300)" />
          </svg>
          <div className="flex flex-wrap items-center justify-between gap-4 mt-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs" style={{ backgroundColor: 'var(--cp-eixo-estado, #1e3a8a)' }} />
              <span className="font-semibold text-foreground">Transferências Constitucionais: 62%</span>
              <span className="text-muted">(FPM, Fundeb, SUS)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs" style={{ backgroundColor: 'var(--cp-accent, #0e8f6e)' }} />
              <span className="font-semibold text-foreground">Arrecadação Própria: 28%</span>
              <span className="text-muted">(ISS, IPTU, ITBI)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs" style={{ backgroundColor: 'var(--cp-tertiary, #8a5300)' }} />
              <span className="font-semibold text-foreground">Outras Receitas: 10%</span>
            </div>
          </div>
        </div>
      </section>

      {/* COMPONENTE EDUCATIVO DATA OCEAN */}
      <CruzamentosEducativos
        cruzamentos={cruzamentos}
        nomeMunicipio="Referência de Execução: Belo Horizonte (MG)"
      />

      {/* FICHAS DE ORÇAMENTO */}
      <section aria-labelledby="titulo-fichas-orcamento" className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 id="titulo-fichas-orcamento" className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Fichas de Execução Orçamentária e Finanças
            </h2>
            <p className="text-sm text-muted">
              Demonstrativos fiscais, LOA, LDO e auditorias de contas públicas
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
