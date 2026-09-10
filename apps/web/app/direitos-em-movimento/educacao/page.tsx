import React from 'react';
import type { Metadata } from 'next';
import EixoLayout from '@/app/components/eixos/EixoLayout';
import FichaCard from '@/app/components/eixos/FichaCard';
import RelacaoSuggestions from '@/app/components/eixos/RelacaoSuggestions';
import CruzamentosEducativos from '@/app/components/eixos/CruzamentosEducativos';
import { listarFichasPorSubfrente } from '@/lib/eixos/fichas';
import { calcularCruzamentosMunicipais } from '@/lib/cruzamentos/correlacionador';

export const metadata: Metadata = {
  title: 'Educação Pública — Eixo Direitos em Movimento | Controle Popular',
  description:
    'Infraestrutura escolar, notas do IDEB, Censo Escolar e relação entre financiamento público e aprendizagem.',
};

export default function EducacaoPage() {
  const fichas = listarFichasPorSubfrente('educacao');
  const fichaDestaque = fichas[0];

  const indicadoresTop = [
    { rotulo: 'Escolas de Educação Básica', valor: '178.416', obs: 'Censo Escolar (INEP)' },
    { rotulo: 'Matrículas Totais', valor: '47,3 mi', obs: 'Redes municipal, estadual e federal' },
    { rotulo: 'IDEB Médio Anos Iniciais', valor: '5,8', obs: 'Meta nacional estipulada: 6,0' },
    { rotulo: 'Escolas com Internet Banda Larga', valor: '88,2%', obs: 'Avanço na conectividade pedagógica' },
  ];

  const cruzamentoExemplo = calcularCruzamentosMunicipais({
    codIbge7: '3106200',
    nome: 'Belo Horizonte',
    uf: 'MG',
    populacao: 2315000,
    idebAnosIniciais: 6.1,
    idebMeta: 5.8,
    repassesFederaisAnual: 1200000000,
  });

  return (
    <EixoLayout
      eixoId="direitos"
      subfrenteId="educacao"
      heroImageSrc="/images/eixos/direitos-em-movimento-arara.jpg"
      heroImageAlt="Arara-vermelha voando sobre as matas"
      heroCaption="A educação pública e gratuita como motor de emancipação social e redução das desigualdades históricas."
    >
      {/* CARTÕES DE TOPO */}
      <section aria-label="Indicadores da educação básica" className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
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

      {/* GRÁFICO SVG ACESSÍVEL: EVOLUÇÃO DO IDEB */}
      <section aria-labelledby="titulo-grafico-ideb" className="mb-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 id="titulo-grafico-ideb" className="font-display text-lg font-bold text-foreground">
              Média Nacional do IDEB (Anos Iniciais do Ensino Fundamental)
            </h2>
            <p className="text-xs text-muted">Histórico de notas oficiais mensuradas pelo INEP / Ministério da Educação</p>
          </div>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted border border-border">
            INEP / MEC
          </span>
        </div>

        {/* Gráfico SVG de Colunas Acessível */}
        <div className="my-6">
          <div className="grid grid-cols-5 gap-3 sm:gap-6 items-end h-44 border-b border-border pb-2">
            {[
              { ano: '2015', nota: 5.3, altura: '66%' },
              { ano: '2017', nota: 5.5, altura: '72%' },
              { ano: '2019', nota: 5.7, altura: '78%' },
              { ano: '2021', nota: 5.5, altura: '72%' },
              { ano: '2023', nota: 5.8, altura: '82%' },
            ].map((ponto) => (
              <div key={ponto.ano} className="flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-xs font-bold text-foreground">{ponto.nota}</span>
                <div
                  className="w-full max-w-[48px] rounded-t-lg transition-all duration-300 hover:opacity-85"
                  style={{
                    height: ponto.altura,
                    backgroundColor: 'var(--cp-eixo-direitos, #c0392b)',
                  }}
                  role="img"
                  aria-label={`Ano ${ponto.ano}: IDEB ${ponto.nota}`}
                />
                <span className="text-xs font-medium text-muted">{ponto.ano}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabela de apoio com acessibilidade */}
        <div className="overflow-x-auto mt-4 text-xs text-muted">
          <p>
            * Observação metodológica: O ciclo 2021 reflete os impactos do fechamento das escolas durante a pandemia de COVID-19. O ciclo 2023 recuperou a trajetória de evolução gradual.
          </p>
        </div>
      </section>

      {/* CRUZAMENTOS EDUCATIVOS: RENDA × IDEB */}
      <CruzamentosEducativos
        cruzamentos={cruzamentoExemplo}
        nomeMunicipio="Referência Educacional: Municípios Polo"
      />

      {/* FICHAS TEMÁTICAS */}
      <section aria-labelledby="titulo-fichas-educacao" className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 id="titulo-fichas-educacao" className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Fichas de Educação e Infraestrutura Escolar
            </h2>
            <p className="text-sm text-muted">
              Diagnósticos de escolas públicas, internet e quadras esportivas
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
