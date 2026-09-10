import React from 'react';
import type { Metadata } from 'next';
import EixoLayout from '@/app/components/eixos/EixoLayout';
import FichaCard from '@/app/components/eixos/FichaCard';
import RelacaoSuggestions from '@/app/components/eixos/RelacaoSuggestions';
import CruzamentosEducativos from '@/app/components/eixos/CruzamentosEducativos';
import { listarFichasPorSubfrente } from '@/lib/eixos/fichas';
import { calcularCruzamentosMunicipais } from '@/lib/cruzamentos/correlacionador';

export const metadata: Metadata = {
  title: 'Trabalho e Renda — Eixo Direitos em Movimento | Controle Popular',
  description:
    'Estatísticas de emprego formal, dados do Novo CAGED, estoque da RAIS e fiscalização de empregos gerados por contratos públicos.',
};

export default function TrabalhoERendaPage() {
  const fichas = listarFichasPorSubfrente('trabalho-e-renda');
  const fichaDestaque = fichas[0];

  const indicadoresTop = [
    { rotulo: 'Estoque de Empregos Formais', valor: '46,8 mi', obs: 'Carteira assinada ativa (MTE/CAGED)' },
    { rotulo: 'Saldo Líquido Anual', valor: '+1,48 mi', obs: 'Admissões superiores a desligamentos' },
    { rotulo: 'Salário Médio de Admissão', valor: 'R$ 2.140', obs: 'Média de novos postos gerados' },
    { rotulo: 'Contratos Públicos Monitorados', valor: 'R$ 48 bi', obs: 'Contratos no PNCP fiscalizados' },
  ];

  const cruzamentos = calcularCruzamentosMunicipais({
    codIbge7: '3106705',
    nome: 'Betim',
    uf: 'MG',
    populacao: 450000,
    repassesFederaisAnual: 850000000,
    totalLeitosSus: 800,
    totalHomicidiosAno: 60,
  });

  return (
    <EixoLayout
      eixoId="direitos"
      subfrenteId="trabalho-e-renda"
      heroImageSrc="/images/eixos/direitos-em-movimento-arara.jpg"
      heroImageAlt="Arara-vermelha voando sobre os vales"
      heroCaption="A dignidade do trabalho e a garantia de renda justa — vigilância sobre contratos públicos que geram empregos locais."
    >
      {/* CARTÕES DE STATUS */}
      <section aria-label="Indicadores de trabalho e renda" className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
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

      {/* GRÁFICO SVG: SALDO POR SETOR ECONÔMICO */}
      <section aria-labelledby="titulo-grafico-setores" className="mb-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 id="titulo-grafico-setores" className="font-display text-lg font-bold text-foreground">
              Geração de Vagas por Grande Setor Econômico (Novo CAGED)
            </h2>
            <p className="text-xs text-muted">Saldo líquido de criação de postos de trabalho formais com carteira assinada</p>
          </div>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted border border-border">
            Ministério do Trabalho e Emprego
          </span>
        </div>

        <div className="space-y-4 my-6">
          {[
            { setor: 'Serviços', saldo: '+782.410', pct: 85, cor: 'var(--cp-eixo-direitos, #c0392b)' },
            { setor: 'Comércio', saldo: '+312.190', pct: 45, cor: 'var(--cp-secondary, #6d28d9)' },
            { setor: 'Indústria Geral', saldo: '+241.050', pct: 36, cor: 'var(--cp-accent, #0e8f6e)' },
            { setor: 'Construção Civil', saldo: '+128.940', pct: 25, cor: 'var(--cp-tertiary, #8a5300)' },
            { setor: 'Agropecuária', saldo: '+18.230', pct: 10, cor: 'var(--cp-focus, #12467b)' },
          ].map((item) => (
            <div key={item.setor} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-foreground">{item.setor}</span>
                <span className="font-bold text-foreground">{item.saldo} vagas</span>
              </div>
              <div className="h-3 w-full rounded-full bg-surface-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.pct}%`, backgroundColor: item.cor }}
                  role="progressbar"
                  aria-valuenow={item.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMPONENTE EDUCATIVO: CONTRATOS PÚBLICOS × EMPREGO */}
      <CruzamentosEducativos
        cruzamentos={cruzamentos}
        nomeMunicipio="Polo Industrial: Betim (MG)"
      />

      {/* FICHAS TEMÁTICAS */}
      <section aria-labelledby="titulo-fichas-trabalho" className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 id="titulo-fichas-trabalho" className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Fichas de Renda, Trabalho e Compras Públicas
            </h2>
            <p className="text-sm text-muted">
              Rastreamento de empresas contratadas e geração de emprego local
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
