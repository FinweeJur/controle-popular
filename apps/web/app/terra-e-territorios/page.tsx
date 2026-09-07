import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import EixoLayout from '@/app/components/eixos/EixoLayout';
import FichaCard from '@/app/components/eixos/FichaCard';
import { CATALOGO_EIXOS } from '@/lib/eixos/catalogo';
import { listarFichasPorEixo } from '@/lib/eixos/fichas';
import { obterEstatisticasExpansao } from '@/lib/cidades/estrategicas';

export const metadata: Metadata = {
  title: 'Terra e Territórios — Eixo 2 | Controle Popular',
  description:
    'Soberania socioambiental, 199 cidades estratégicas, bacias hidrográficas, licenciamento ONSA, terras indígenas e defesa dos biomas.',
};

export default function TerraETerritoriosHub() {
  const subfrentes = CATALOGO_EIXOS.terra.subfrentes;
  const fichas = listarFichasPorEixo('terra');
  const statsCidades = obterEstatisticasExpansao();

  const indicadoresTerritorio = [
    { rotulo: 'Cidades Estratégicas', valor: '199', obs: '27 capitais + 172 polos regionais' },
    { rotulo: 'Bacias e Rios Monitorados', valor: '8', obs: 'Rio Doce, Paraopeba, Velhas, São Francisco' },
    { rotulo: 'Terras Indígenas e Quilombolas', valor: '414', obs: 'Áreas demarcadas no Globo 3D' },
    { rotulo: 'Barragens de Mineração', valor: '942', obs: 'SIGBM/ANM (com declaração de risco)' },
  ];

  return (
    <EixoLayout
      eixoId="terra"
      heroImageSrc="/images/eixos/terra-e-territorios-ipe-lobo.jpg"
      heroImageAlt="Lobo-guará caminhando ao lado de um ipê amarelo florido em escarpa rochosa do Cerrado"
      heroCaption="O lobo-guará e o ipê-amarelo no alto da serra — o Eixo Terra e Territórios vigia a soberania do solo, as águas e a integridade socioambiental do Brasil."
    >
      {/* 1. CARTÕES DE STATUS DO EIXO */}
      <section aria-label="Estatísticas territoriais" className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-12">
        {indicadoresTerritorio.map((item) => (
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

      {/* 2. SUBFRENTES DO EIXO */}
      <section aria-labelledby="subfrentes-terra-titulo" className="mb-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="subfrentes-terra-titulo" className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Subfrentes de Terra, Clima e Cidades
            </h2>
            <p className="text-sm text-muted">
              Explore o território por recortes municipais, hídricos, florestais e de licenciamento
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            6 Subfrentes Ativas
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subfrentes.map((sub) => {
            const href =
              sub.id === 'cidades'
                ? '/terra-e-territorios/cidades'
                : sub.id === 'nossos-rios'
                ? '/terra-e-territorios/nossos-rios'
                : sub.id === 'nossas-serras'
                ? '/terra-e-territorios/nossas-serras'
                : sub.rotaLegada ?? `/terra-e-territorios/${sub.slug}`;

            return (
              <Link
                key={sub.id}
                href={href}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:border-emerald-500/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">
                      Subfrente
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                      Acessar →
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {sub.titulo}
                  </h3>
                  <p className="mt-2 text-xs text-muted leading-relaxed">
                    {sub.descricao}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-1 pt-3 border-t border-border/50">
                  {sub.tagsRelacionadas.slice(0, 3).map((t) => (
                    <span key={t} className="rounded bg-surface-2 px-2 py-0.5 text-[10px] text-muted">
                      #{t}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. DESTAQUE ESPECIAL: BACIA DO PARAOPEBA & RIO DOCE */}
      <section className="mb-12 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
              Grandes Bacias Atingidas & Reparação
            </span>
            <h2 className="font-display text-2xl font-bold text-foreground mt-2">
              Bacia do Rio Paraopeba & Brumadinho
            </h2>
            <p className="mt-1 text-sm text-muted max-w-2xl">
              Fiscalização cidadã do Acordo Judicial de R$ 37,7 bilhões, perícias judiciais da UFMG, auditoria independente AECOM e atuação das Assessorias Técnicas Independentes (ATIs).
            </p>
          </div>
          <Link
            href="/paraopeba"
            className="rounded-xl bg-amber-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-amber-700 transition-colors inline-flex items-center gap-1.5"
          >
            <span>Acessar Painel do Paraopeba</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/paraopeba/analise"
            className="group rounded-xl border border-border bg-surface-2/40 p-4 transition-all hover:border-amber-500/40 hover:bg-surface-2/80"
          >
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block mb-1">
              Síntese Tripartite
            </span>
            <h3 className="font-display text-base font-bold text-foreground group-hover:text-amber-600 transition-colors">
              Análise Integrada →
            </h3>
            <p className="mt-1.5 text-xs text-muted leading-relaxed">
              Os 16 eixos da AECOM cruzados com o que a UFMG mediu e o que as ATIs publicaram sobre o mesmo assunto.
            </p>
          </Link>

          <Link
            href="/paraopeba/execucao"
            className="group rounded-xl border border-border bg-surface-2/40 p-4 transition-all hover:border-amber-500/40 hover:bg-surface-2/80"
          >
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block mb-1">
              R$ 5,48 bi municipais
            </span>
            <h3 className="font-display text-base font-bold text-foreground group-hover:text-amber-600 transition-colors">
              Execução por Município →
            </h3>
            <p className="mt-1.5 text-xs text-muted leading-relaxed">
              Acompanhamento de repasses e projetos de saneamento e infraestrutura nos 26 municípios atingidos.
            </p>
          </Link>

          <Link
            href="/ambiental/crimes-socioambientais"
            className="group rounded-xl border border-border bg-surface-2/40 p-4 transition-all hover:border-indigo-500/40 hover:bg-surface-2/80"
          >
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
              936 Documentos
            </span>
            <h3 className="font-display text-base font-bold text-foreground group-hover:text-indigo-600 transition-colors">
              Biblioteca de Desastres →
            </h3>
            <p className="mt-1.5 text-xs text-muted leading-relaxed">
              Acervo com micro-resumos de todos os laudos periciais, termos de ajustamento e estudos de saúde.
            </p>
          </Link>

          <Link
            href="/ambiental/mariana"
            className="group rounded-xl border border-border bg-surface-2/40 p-4 transition-all hover:border-cyan-500/40 hover:bg-surface-2/80"
          >
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 block mb-1">
              Rio Doce · R$ 171 bi
            </span>
            <h3 className="font-display text-base font-bold text-foreground group-hover:text-cyan-600 transition-colors">
              Repactuação de Mariana →
            </h3>
            <p className="mt-1.5 text-xs text-muted leading-relaxed">
              Repasses aos municípios da calha do Rio Doce, recuperação ambiental e indenizações individuais.
            </p>
          </Link>
        </div>
      </section>

      {/* 4. DESTAQUE ESPECIAL: REDE DAS 199 CIDADES E GLOBO 3D */}
      <section className="mb-12 rounded-2xl border border-border bg-surface-2/40 p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Expansão Nacional
            </span>
            <h3 className="font-display text-2xl font-bold text-foreground mt-2">
              199 Cidades Estratégicas do Brasil
            </h3>
            <p className="mt-3 text-sm text-muted leading-relaxed">
              O portal fiscaliza as 27 Capitais e 172 Polos do Interior em todas as Unidades Federativas. Cada município conta com perfil de saúde (CNES/SUS), educação (INEP/IDEB), finanças públicas e cruzamentos do Data Ocean.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/terra-e-territorios/cidades"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
              >
                Explorar as 199 Cidades →
              </Link>
              <Link
                href="/funcaosocialterra/mapa"
                className="rounded-xl border border-border bg-surface px-4 py-2 text-xs sm:text-sm font-semibold text-foreground hover:bg-surface-2 transition-colors"
              >
                Abrir Globo 3D de Camadas 🌐
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
              Distribuição Regional dos Polos Estratégicos
            </h4>
            <div className="space-y-2 text-xs">
              {Object.entries(statsCidades.distribuicaoRegiao).map(([regiao, total]) => (
                <div key={regiao} className="flex items-center justify-between">
                  <span className="text-foreground">{regiao}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{total} cidades</span>
                    <span className="text-muted font-mono">
                      ({Math.round((total / statsCidades.totalCidades) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. FICHAS TEMÁTICAS DE TERRA E MEIO AMBIENTE */}
      {fichas.length > 0 && (
        <section aria-labelledby="fichas-terra-titulo" className="mb-12">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id="fichas-terra-titulo" className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Fichas Socioambientais e Territoriais
              </h2>
              <p className="text-sm text-muted">
                Bacias hidrográficas, monitoramento de desastres e licenciamento ambiental
              </p>
            </div>
            <span className="rounded-full bg-surface-2 border border-border px-3 py-1 text-xs font-semibold text-muted">
              {fichas.length} fichas
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {fichas.map((f) => (
              <FichaCard key={f.id} ficha={f} />
            ))}
          </div>
        </section>
      )}
    </EixoLayout>
  );
}
