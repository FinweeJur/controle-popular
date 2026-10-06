import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import EixoLayout from '@/app/components/eixos/EixoLayout';
import FichaCard from '@/app/components/eixos/FichaCard';
import SpotlightCard from '@/app/components/react-bits/SpotlightCard';
import BorderGlow from '@/app/components/react-bits/BorderGlow';
import Magnet from '@/app/components/react-bits/Magnet';
import BotaoBrilho from '@/app/components/react-bits/BotaoBrilho';
import { CATALOGO_EIXOS } from '@/lib/eixos/catalogo';
import { listarFichasPorEixo } from '@/lib/eixos/fichas';
import MeioAmbienteRelacionado from '@/app/components/MeioAmbienteRelacionado';
import { obterEstatisticasExpansao } from '@/lib/cidades/estrategicas';

export const metadata: Metadata = {
  title: 'Estado e Economia — Eixo 3 | Controle Popular',
  description:
    'Transparência institucional, orçamento público, compras no PNCP, controle de gastos do Judiciário e votações no Congresso.',
};

/**
 * Cartão de destaque do eixo Estado e Economia: brilho de borda + ímã.
 * Mesmo papel do `CartaoDestaque` de `/terra-e-territorios`: os quatro cartões
 * das "Portas Prioritárias" têm a mesma anatomia, e repetir o invólucro (agora
 * com dois efeitos) garantiria deriva entre eles.
 */
function CartaoDestaque({
  href,
  etiqueta,
  titulo,
  descricao,
  acao,
}: {
  href: string;
  etiqueta: string;
  titulo: string;
  descricao: string;
  acao: string;
}) {
  return (
    <Magnet forca={0.06} afastamento={44} className="h-full">
      <BorderGlow
        className="h-full rounded-xl border border-blue-500/40 bg-surface p-4 shadow-xs transition-all hover:border-blue-500 hover:bg-blue-500/10"
        corFundo="var(--cp-surface)"
        raio={12}
      >
        <Link href={href} className="group flex h-full flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
              {etiqueta}
            </span>
            <h3 className="font-display text-base font-bold text-foreground group-hover:text-blue-500 mt-1">
              {titulo}
            </h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">{descricao}</p>
          </div>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-3 flex items-center justify-between">
            <span>{acao}</span>
            <span>→</span>
          </span>
        </Link>
      </BorderGlow>
    </Magnet>
  );
}

export default function EstadoEEconomiaHub() {
  const subfrentes = CATALOGO_EIXOS.estado.subfrentes;
  const fichas = listarFichasPorEixo('estado');

  const indicadoresEstado = [
    { rotulo: 'Contratos Públicos PNCP', valor: 'R$ 142 bi', obs: 'Compras e licitações federais e municipais' },
    { rotulo: 'Magistrados Monitorados', valor: '252', obs: 'Composição dos tribunais, idade e vacância' },
    { rotulo: 'Proposições Legislativas', valor: '8.940', obs: 'Câmara e Senado com foco em direitos e MG' },
    { rotulo: 'Transferências Federais', valor: 'R$ 8,2 bi', obs: 'Repasses aos municípios mineiros (ComunicaBR)' },
  ];

  return (
    <EixoLayout
      eixoId="estado"
      abertura
      heroImageSrc="/images/eixos/direitos-em-movimento-arara.jpg"
      heroImageAlt="Vista aérea sobre os territórios e instituições"
      heroCaption="O poder público e o fluxo do dinheiro — o Eixo Estado e Economia fiscaliza contratos, orçamentos, tribunais e leis."
    >
        {/* 1. CARTÕES DE STATUS INSTITUCIONAIS — SpotlightCard (React Bits,
            vendor): luz que segue o cursor; some em reduced-motion/alto
            contraste, cartão fica normal. */}
        <section aria-label="Indicadores institucionais e financeiros" className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-12">
          {indicadoresEstado.map((item) => (
            <SpotlightCard key={item.rotulo} className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
                {item.rotulo}
              </span>
              <span className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                {item.valor}
              </span>
              <span className="text-xs text-muted block mt-1">
                {item.obs}
              </span>
            </SpotlightCard>
          ))}
        </section>

        {/* 1.1 DESTAQUES PRIORITÁRIOS DO EIXO 3 */}
        <section aria-label="Subfrentes prioritárias" className="mb-12 rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 p-6 sm:p-8">
          <div className="mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-500">✦ Portas Prioritárias</span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mt-1">
              Subfrentes em Destaque Cívico
            </h2>
            <p className="text-sm text-muted">
              Rastreamento direto dos cofres públicos, legislativos estaduais e integridade do Judiciário.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CartaoDestaque
              href="/estado-e-economia/orcamento"
              etiqueta="✦ Contas Públicas"
              titulo="Orçamento de MG"
              descricao="Receitas, despesas, transferências e séries macroeconômicas do BCB."
              acao="Ver Orçamento"
            />

            <CartaoDestaque
              href="/judiciario/instituicoes"
              etiqueta="✦ Controle Social"
              titulo="Quem Fiscaliza a Justiça"
              descricao="CNJ, CNMP, corregedorias, tribunais de contas e balcão virtual de 990 varas."
              acao="Ver Órgãos"
            />

            <CartaoDestaque
              href="/assembleias"
              etiqueta="✦ Legislativo"
              titulo="27 Assembleias Estaduais"
              descricao="Deputados, gastos de gabinete, tramitações e comissões parlamentares."
              acao="Vigiar Assembleias"
            />

            <CartaoDestaque
              href="/ambiental/contratos"
              etiqueta="✦ PNCP & Licitações"
              titulo="Radar de Compras & Contratos"
              descricao="Contratações públicas federais e municipais, fornecedores e atas de registro de preço."
              acao="Ver Contratos"
            />
          </div>
        </section>

        {/* 2. SUBFRENTES DO EIXO */}
        <section aria-labelledby="subfrentes-estado-titulo" className="mb-12">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id="subfrentes-estado-titulo" className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Subfrentes de Estado, Orçamento e Justiça
              </h2>
              <p className="text-sm text-muted">
                Acompanhamento contínuo dos poderes republicanos e do poder econômico
              </p>
            </div>
            <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
              6 Subfrentes Integradas
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subfrentes.map((sub) => {
              const href =
                sub.id === 'orcamento'
                  ? '/estado-e-economia/orcamento'
                  : sub.id === 'judiciario'
                    ? '/estado-e-economia/judiciario'
                    : sub.rotaLegada ?? `/estado-e-economia/${sub.slug}`;

              return (
                <Link
                  key={sub.id}
                  href={href}
                  className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:border-blue-500/40 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted">
                        Subfrente
                      </span>
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                        Acessar →
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {sub.titulo}
                    </h3>
                    <p className="mt-2 text-xs text-muted leading-relaxed">
                      {sub.descricao}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1 pt-3 border-t border-border/50">
                    {sub.tagsRelacionadas.slice(0, 3).map((t) => (
                      <span key={t} className="rounded bg-surface-2 px-2 py-0.5 text-xs text-muted">
                        #{t}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 3. BLOCO DE FISCALIZAÇÃO DO DINHEIRO PÚBLICO */}
        <section className="mb-12 rounded-2xl border border-border bg-surface-2/40 p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                Controle Social
              </span>
              <h3 className="font-display text-2xl font-bold text-foreground mt-2">
                Para onde vai o dinheiro dos seus impostos?
              </h3>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                O portal unifica dados de compras públicas do Portal Nacional de Contratações Públicas (PNCP), transferências do Transferegov e séries macroeconômicas do Banco Central (BCB Olinda).
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <BotaoBrilho raio={12}>
                  <Link
                    href="/estado-e-economia/orcamento"
                    className="rounded-xl bg-blue-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors"
                  >
                    Explorar Painel Orçamentário →
                  </Link>
                </BotaoBrilho>
                <BotaoBrilho raio={12}>
                  <Link
                    href="/congresso"
                    className="rounded-xl border border-border bg-surface px-4 py-2 text-xs sm:text-sm font-semibold text-foreground hover:bg-surface-2 transition-colors"
                  >
                    Acompanhar o Congresso 🏛️
                  </Link>
                </BotaoBrilho>
                <BotaoBrilho raio={12}>
                  <Link
                    href="/judiciario/contatos"
                    className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 transition-colors"
                  >
                    Varas e Balcão Virtual ⚖️
                  </Link>
                </BotaoBrilho>
                <BotaoBrilho raio={12}>
                  <Link
                    href="/ambiental"
                    className="rounded-xl border border-current bg-surface px-4 py-2 text-xs sm:text-sm font-semibold text-foreground hover:bg-surface-2 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Ver o Observatório Meio Ambiente</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </BotaoBrilho>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 text-xs space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-muted">
                Garantias Editoriais de Auditoria:
              </h4>
              <ul className="space-y-2 text-muted">
                <li>
                  🔍 <strong>Sem acusações sem prova:</strong> Aparecer em bases públicas é ponto de partida para apuração, nunca conclusão de irregularidade.
                </li>
                <li>
                  ⚖️ <strong>Critérios objetivos:</strong> Valores e datas citados refletem fielmente atos dos diários oficiais e do PNCP.
                </li>
                <li>
                  🛡️ <strong>Privacidade Rigorosa:</strong> CPFs anonimizados via algoritmo mod-11 conforme a LGPD.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4. FICHAS TEMÁTICAS DO EIXO */}
        {fichas.length > 0 && (
          <section aria-labelledby="fichas-estado-titulo" className="mb-12">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 id="fichas-estado-titulo" className="font-display text-xl sm:text-2xl font-bold text-foreground">
                  Fichas de Orçamento, Justiça e Legislação
                </h2>
                <p className="text-sm text-muted">
                  Auditorias financeiras, processos ambientais e composição de órgãos públicos
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
      <MeioAmbienteRelacionado />
      </EixoLayout>
  );
}
