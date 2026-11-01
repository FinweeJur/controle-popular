import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import AberturaHero from "@/app/components/abertura/AberturaHero";
import BorderGlow from "@/app/components/react-bits/BorderGlow";
import Magnet from "@/app/components/react-bits/Magnet";

/**
 * `/direitos-comparados` — comparador de direitos fundamentais entre estados, instituições e períodos.
 *
 * ═══ O QUE É ═══
 *
 * Nova frente do Eixo 2 que permite comparar indicadores de direitos fundamentais 
 * entre diferentes unidades federativas, instituições e períodos históricos.
 * Integra dados de IBGE, TSE, CNJ, MEC, MS, CNPq/CAPES e Portal da Transparência.
 *
 * ═══ COMPONENTES ═══
 *
 * 1. Comparador de Direitos: Interface comparativa entre estados (saúde, educação, trabalho)
 * 2. Sistema de Grupos de Pesquisa: Análise de redes de cooperação e produção científica  
 * 3. Integração com Universidades: Indicadores sociais e monitoramento de impacto
 *
 * ═══ FONTES ═══
 *
 * - IBGE (Cidades, IDH, indicadores sociais)
 * - TSE (eleições, financiamento de campanhas)
 * - CNJ (justiça, acesso à justiça)
 * - MEC/INEP (educação básica e superior)
 * - MS (saúde, SUS, CNES)
 * - CNPq/CAPES (pesquisa, grupos de pesquisa)
 * - Portal da Transparência (gastos públicos)
 */

export const metadata: Metadata = {
  title: "Direitos Comparados — Indicadores entre estados e instituições | Controle Popular",
  description:
    "Compare indicadores de direitos fundamentais entre estados, instituições e períodos. IDH, acesso a serviços, educação, saúde, justiça e produção científica com fontes oficiais.",
};

export default function DireitosComparadosHub() {
  return (
    <>
      <AberturaHero paginaId="direitos-comparados" titulo="Direitos Comparados" />
      <main
        id="conteudo-principal"
        tabIndex={-1}
        className="mx-auto max-w-4xl px-4 py-12 sm:py-16"
      >
        <nav className="text-sm text-text-soft">
          <Link href="/" className="hover:text-primary">
            Início
          </Link>{" "}
          · <span className="text-text">Direitos Comparados</span>
        </nav>

        <header className="mt-4 space-y-4">
          <p
            className="text-[.82em] font-semibold uppercase tracking-wide"
            style={{ color: "var(--cp-alert)" }}
          >
            Eixo 2: Direitos em Movimento · Análise Comparativa
          </p>
          {/* h2, não h1: o h1 único da página vive na abertura viva acima. */}
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Direitos Comparados</h2>
          <p className="max-w-2xl text-[1.05em] text-text-soft">
            Compare indicadores de direitos fundamentais entre estados, instituições e períodos históricos.
            Dados de IDH, educação, saúde, justiça, trabalho e produção científica com fontes oficiais.
          </p>
        </header>

        {/* COMPONENTES PRINCIPAIS */}
        <div className="mt-8 grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
          {/* 1. Comparador de Direitos */}
          <Magnet forca={0.06} afastamento={44} className="h-full">
            <BorderGlow
              className="h-full rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary"
              corFundo="var(--cp-surface)"
              raio={10}
            >
              <Link href="/direitos-comparados/indicadores" className="group flex h-full flex-col">
                <span
                  className="text-[.82em] font-semibold uppercase tracking-wide"
                  style={{ color: "var(--cp-alert)" }}
                >
                  Indicadores Fundamentais
                </span>
                <h3 className="mt-2 font-display text-xl font-semibold group-hover:text-primary">
                  Comparador de Direitos
                </h3>
                <p className="mt-2 text-[.95em] text-text-soft">
                  Interface comparativa entre estados em saúde, educação, trabalho e acesso à justiça.
                  Gráficos comparativos e mapas com diferenciais regionais e históricos.
                </p>
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-text-soft">• IDH e indicadores sociais</div>
                  <div className="text-xs text-text-soft">• Educação básica e superior</div>
                  <div className="text-xs text-text-soft">• Saúde e rede SUS</div>
                  <div className="text-xs text-text-soft"> Justiça e acesso à justiça</div>
                </div>
                <span className="mt-5 font-medium text-primary">Ver comparador →</span>
              </Link>
            </BorderGlow>
          </Magnet>

          {/* 2. Sistema de Grupos de Pesquisa */}
          <Magnet forca={0.06} afastamento={44} className="h-full">
            <BorderGlow
              className="h-full rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary"
              corFundo="var(--cp-surface)"
              raio={10}
            >
              <Link href="/direitos-comparados/pesquisa" className="group flex h-full flex-col">
                <span
                  className="text-[.82em] font-semibold uppercase tracking-wide"
                  style={{ color: "var(--cp-alert)" }}
                >
                  Rede de Pesquisa
                </span>
                <h3 className="mt-2 font-display text-xl font-semibold group-hover:text-primary">
                  Grupos de Pesquisa
                </h3>
                <p className="mt-2 text-[.95em] text-text-soft">
                  Análise de redes de cooperação entre instituições, indicadores de produção 
                  científica e mapeamento de áreas do conhecimento por estado/região.
                </p>
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-text-soft">• Redes de cooperação</div>
                  <div className="text-xs text-text-soft">• Produção científica</div>
                  <div className="text-xs text-text-soft">• Áreas do conhecimento</div>
                  <div className="text-xs text-text-soft">• Evolução histórica</div>
                </div>
                <span className="mt-5 font-medium text-primary">Ver rede →</span>
              </Link>
            </BorderGlow>
          </Magnet>

          {/* 3. Integração com Universidades */}
          <Magnet forca={0.06} afastamento={44} className="h-full">
            <BorderGlow
              className="h-full rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary"
              corFundo="var(--cp-surface)"
              raio={10}
            >
              <Link href="/direitos-comparados/universidades" className="group flex h-full flex-col">
                <span
                  className="text-[.82em] font-semibold uppercase tracking-wide"
                  style={{ color: "var(--cp-alert)" }}
                >
                  Impacto Social
                </span>
                <h3 className="mt-2 font-display text-xl font-semibold group-hover:text-primary">
                  Universidades e Impacto
                </h3>
                <p className="mt-2 text-[.95em] text-text-soft">
                  Expansão do sistema universitário com indicadores sociais e monitoramento 
                  do impacto social da pesquisa em políticas públicas.
                </p>
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-text-soft">• Indicadores universitários</div>
                  <div className="text-xs text-text-soft">• Impacto social</div>
                  <div className="text-xs text-text-soft">• Políticas públicas</div>
                  <div className="text-xs text-text-soft">• Relações universidade-governo</div>
                </div>
                <span className="mt-5 font-medium text-primary">Ver universidades →</span>
              </Link>
            </BorderGlow>
          </Magnet>
        </div>

        {/* FONTES E METODOLOGIA */}
        <section className="mt-12 rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-display text-xl font-bold mb-4">Fontes e Metodologia</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Fontes Oficiais</h4>
              <ul className="text-sm text-text-soft space-y-1">
                <li>• IBGE (Cidades, IDH, indicadores sociais)</li>
                <li>• TSE (eleições, financiamento)</li>
                <li>• CNJ (justiça, acesso)</li>
                <li>• MEC/INEP (educação)</li>
                <li>• MS (saúde, SUS)</li>
                <li>• CNPq/CAPES (pesquisa)</li>
                <li>• Portal da Transparência (gastos)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Indicadores Disponíveis</h4>
              <ul className="text-sm text-text-soft space-y-1">
                <li>• IDH e dimensões (renda, educação, longevidade)</li>
                <li>• IDEB e educação básica</li>
                <li>• Leitos e estabelecimentos de saúde</li>
                <li>• Acesso à justiça (varas, defensorias)</li>
                <li>• Emprego e formalização</li>
                <li>• Produção científica e patentes</li>
                <li>• Gastos públicos por área</li>
              </ul>
            </div>
          </div>
        </section>

        <div className="mt-8">
          <FooterGlobal />
        </div>
      </main>
    </>
  );
}