import React from 'react';
import type { Metadata } from 'next';
import EixoLayout from '@/app/components/eixos/EixoLayout';
import FichaCard from '@/app/components/eixos/FichaCard';
import RelacaoSuggestions from '@/app/components/eixos/RelacaoSuggestions';
import CruzamentosEducativos from '@/app/components/eixos/CruzamentosEducativos';
import { listarFichasPorSubfrente } from '@/lib/eixos/fichas';
import { calcularCruzamentosMunicipais } from '@/lib/cruzamentos/correlacionador';

export const metadata: Metadata = {
  title: 'Saúde Pública — Eixo Direitos em Movimento | Controle Popular',
  description:
    'Capacidade instalada do SUS, estabelecimentos CNES, leitos de internação e razão leito/habitante nos municípios brasileiros.',
};

export default function SaudePublicaPage() {
  const fichas = listarFichasPorSubfrente('saude-publica');
  const fichaDestaque = fichas[0];

  // Dados sintéticos oficiais de referência (DataSUS / CNES)
  const indicadoresTop = [
    { rotulo: 'Estabelecimentos CNES', valor: '348.210', obs: 'Brasil (públicos e conveniados)' },
    { rotulo: 'Leitos SUS Ativos', valor: '315.420', obs: '72,4% da rede total' },
    { rotulo: 'Razão Média Leitos', valor: '1,95', obs: 'Leitos/mil hab. (referência OMS: 2,5 a 3,0)' },
    { rotulo: 'Internações SUS / Ano', valor: '11,4 mi', obs: 'AIHs aprovadas e pagas (SIH-SUS)' },
  ];

  const cruzamentoExemplo = calcularCruzamentosMunicipais({
    codIbge7: '3106200',
    nome: 'Belo Horizonte',
    uf: 'MG',
    populacao: 2315000,
    totalLeitosSus: 5200,
    totalHomicidiosAno: 280,
    idebAnosIniciais: 6.1,
  });

  return (
    <EixoLayout
      eixoId="direitos"
      subfrenteId="saude-publica"
      heroImageSrc="/images/eixos/direitos-em-movimento-arara.jpg"
      heroImageAlt="Arara-vermelha sobrevoando a mata nativa"
      heroCaption="A saúde pública como direito fundamental inalienável — vigilância cidadã da capacidade instalada do SUS."
    >
      {/* 1. CARTÕES DE TOPO / STATUS */}
      <section aria-label="Indicadores gerais de saúde" className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {indicadoresTop.map((item) => (
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

      {/* 2. GRÁFICO SVG ACESSÍVEL — CAPACIDADE DE LEITOS (Regra: sem lib externa de gráfico) */}
      <section aria-labelledby="titulo-grafico-leitos" className="mb-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 id="titulo-grafico-leitos" className="font-display text-lg font-bold text-foreground">
              Distribuição de Leitos de Internação no Brasil
            </h2>
            <p className="text-xs text-muted">Proporção entre leitos vinculados ao SUS e leitos exclusivamente privados (CNES/DataSUS)</p>
          </div>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted border border-border">
            Fonte: CNES / Ministério da Saúde
          </span>
        </div>

        {/* Barra de Distribuição em SVG Acessível */}
        <div className="my-6">
          <svg
            className="w-full h-8 rounded-lg overflow-hidden"
            viewBox="0 0 100 8"
            preserveAspectRatio="none"
            role="img"
            aria-label="Gráfico de barras: 72,4% leitos SUS, 27,6% leitos privados"
          >
            <rect x="0" y="0" width="72.4" height="8" fill="var(--cp-eixo-direitos, #c0392b)" />
            <rect x="72.4" y="0" width="27.6" height="8" fill="var(--cp-secondary, #6d28d9)" />
          </svg>
          <div className="flex flex-wrap items-center justify-between gap-4 mt-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs" style={{ backgroundColor: 'var(--cp-eixo-direitos, #c0392b)' }} />
              <span className="font-semibold text-foreground">Leitos SUS: 72,4%</span>
              <span className="text-muted">(315.420 leitos)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs" style={{ backgroundColor: 'var(--cp-secondary, #6d28d9)' }} />
              <span className="font-semibold text-foreground">Exclusivamente Privados: 27,6%</span>
              <span className="text-muted">(120.180 leitos)</span>
            </div>
          </div>
        </div>

        {/* Tabela de acessibilidade alternativa para o gráfico */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs text-left border-t border-border/60">
            <thead>
              <tr className="text-muted font-semibold">
                <th className="py-2">Segmento</th>
                <th className="py-2">Leitos Ativos</th>
                <th className="py-2">Participação</th>
                <th className="py-2">Acesso Cidadão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr>
                <td className="py-2 font-medium">Público / Conveniado SUS</td>
                <td className="py-2">315.420</td>
                <td className="py-2">72,4%</td>
                <td className="py-2 text-emerald-600 dark:text-emerald-400">100% Universal e Gratuito</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">Rede Privada / Saúde Suplementar</td>
                <td className="py-2">120.180</td>
                <td className="py-2">27,6%</td>
                <td className="py-2 text-muted">Planos de saúde ou desembolso direto</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. COMPONENTE EDUCATIVO DATA OCEAN: CRUZAMENTO SAÚDE × SEGURANÇA */}
      <CruzamentosEducativos
        cruzamentos={cruzamentoExemplo}
        nomeMunicipio="Exemplo de Referência: Belo Horizonte (MG)"
      />

      {/* 4. FICHAS TEMÁTICAS DA SUBFRENTE */}
      <section aria-labelledby="titulo-fichas-saude" className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 id="titulo-fichas-saude" className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Fichas e Relatórios de Saúde Pública
            </h2>
            <p className="text-sm text-muted">
              Auditorias, capacidade hospitalar e fiscalização municipal
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

        {/* SUGESTÕES CRUZADAS INTERDISCIPLINARES */}
        {fichaDestaque && (
          <RelacaoSuggestions fichaAtual={fichaDestaque} />
        )}
      </section>
    </EixoLayout>
  );
}
