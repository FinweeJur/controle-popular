import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import AberturaHero from "@/app/components/abertura/AberturaHero";
import BorderGlow from "@/app/components/react-bits/BorderGlow";
import Magnet from "@/app/components/react-bits/Magnet";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

/**
 * `/direitos-comparados/universidades` — integração com universidades e impacto social.
 *
 * ═══ O QUE É ═══
 *
 * Expansão do sistema universitário com indicadores sociais e monitoramento 
 * do impacto social da pesquisa em políticas públicas. Relacionamento entre 
 * grupos de pesquisa e políticas públicas, com foco em impacto social e 
 * desenvolvimento regional.
 *
 * ═══ FUNCIONALIDADES ═══
 *
 * - Indicadores universitários sociais
 * - Monitoramento de impacto social da pesquisa
 * - Relações entre universidade e governo
 * - Avaliação de contribuição para políticas públicas
 * - Mapeamento de extensão comunitária
 */

export const metadata: Metadata = {
  title: "Universidades e Impacto Social — Relações com políticas públicas | Controle Popular",
  description:
    "Integração do sistema universitário com indicadores sociais e monitoramento do impacto da pesquisa em políticas públicas.",
};

export default function UniversidadesPage() {
  return (
    <>
      <AberturaHero paginaId="direitos-comparados-universidades" titulo="Universidades e Impacto" />
      <main
        id="conteudo-principal"
        tabIndex={-1}
        className="mx-auto max-w-6xl px-4 py-12 sm:py-16"
      >
        <nav className="text-sm text-text-soft">
          <Link href="/" className="hover:text-primary">
            Início
          </Link>{" "}
          · <Link href="/direitos-comparados" className="hover:text-primary">
            Direitos Comparados
          </Link>{" "}
          · <span className="text-text">Universidades e Impacto</span>
        </nav>

        <header className="mt-4 space-y-4">
          <p
            className="text-[.82em] font-semibold uppercase tracking-wide"
            style={{ color: "var(--cp-alert)" }}
          >
            Impacto Social
          </p>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Universidades e Impacto Social</h2>
          <p className="max-w-2xl text-[1.05em] text-text-soft">
            Monitoramento do impacto social da pesquisa universitária e relações entre 
            grupos de pesquisa e políticas públicas. Dados de extensão, inovação e 
            contribuição para desenvolvimento regional.
          </p>
        </header>

        {/* MÉTRICAS DE IMPACTO */}
        <section className="mt-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary">2.345</div>
                <div className="text-sm text-muted mt-1">Projetos de Extensão</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary">567</div>
                <div className="text-sm text-muted mt-1">Políticas Públicas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary">89.234</div>
                <div className="text-sm text-muted mt-1">Beneficiários Diretos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary">R$ 456M</div>
                <div className="text-sm text-muted mt-1">Investimento Social</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* DIMENSÕES DE IMPACTO */}
        <section className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Dimensões de Impacto Social</h3>
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
            <Magnet forca={0.06} afastamento={44}>
              <BorderGlow
                className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary"
                corFundo="var(--cp-surface)"
                raio={10}
              >
                <Link href="/direitos-comparados/universidades/educacao" className="group flex h-full flex-col">
                  <h4 className="font-semibold mb-2">📚 Educação Básica</h4>
                  <p className="text-sm text-text-soft mb-4">
                    Contribuição das universidades para educação básica e formação docente.
                  </p>
                  <div className="space-y-2 text-xs text-text-soft">
                    <div>• Projetos de formação continuada</div>
                    <div>• Monitoramento de escolas</div>
                    <div>• Material didático gratuito</div>
                    <div>• Alfabetização de jovens e adultos</div>
                  </div>
                  <span className="mt-auto font-medium text-primary">Ver educação →</span>
                </Link>
              </BorderGlow>
            </Magnet>

            <Magnet forca={0.06} afastamento={44}>
              <BorderGlow
                className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary"
                corFundo="var(--cp-surface)"
                raio={10}
              >
                <Link href="/direitos-comparados/universidades/saude" className="group flex h-full flex-col">
                  <h4 className="font-semibold mb-2">🏥 Saúde Comunitária</h4>
                  <p className="text-sm text-text-soft mb-4">
                    Atenção básica, saúde mental e ações preventivas em comunidades.
                  </p>
                  <div className="space-y-2 text-xs text-text-soft">
                    <div>• Programas de saúde básica</div>
                    <div>• Atendimento especializado</div>
                    <div>• Campanhas de prevenção</div>
                    <div>• Saúde mental comunitária</div>
                  </div>
                  <span className="mt-auto font-medium text-primary">Ver saúde →</span>
                </Link>
              </BorderGlow>
            </Magnet>

            <Magnet forca={0.06} afastamento={44}>
              <BorderGlow
                className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary"
                corFundo="var(--cp-surface)"
                raio={10}
              >
                <Link href="/direitos-comparados/universidades/tecnologia" className="group flex h-full flex-col">
                  <h4 className="font-semibold mb-2">🔧 Tecnologia e Inovação</h4>
                  <p className="text-sm text-text-soft mb-4">
                    Transferência de tecnologia e soluções para problemas locais.
                  </p>
                  <div className="space-y-2 text-xs text-text-soft">
                    <div>• Incubadoras de empresas</div>
                    <div>• Patentes populares</div>
                    <div>• Software social</div>
                    <div>• Tecnologias agrícolas</div>
                  </div>
                  <span className="mt-auto font-medium text-primary">Ver tecnologia →</span>
                </Link>
              </BorderGlow>
            </Magnet>

            <Magnet forca={0.06} afastamento={44}>
              <BorderGlow
                className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary"
                corFundo="var(--cp-surface)"
                raio={10}
              >
                <Link href="/direitos-comparados/universidades/cultura" className="group flex h-full flex-col">
                  <h4 className="font-semibold mb-2">🎭 Cultura e Memória</h4>
                  <p className="text-sm text-text-soft mb-4">
                    Preservação cultural e memória histórica das comunidades locais.
                  </p>
                  <div className="space-y-2 text-xs text-text-soft">
                    <div>• Acervos digitais</div>
                    <div>• Patrimônio cultural</div>
                    <div>• História oral</div>
                    <div>• Festivais populares</div>
                  </div>
                  <span className="mt-auto font-medium text-primary">Ver cultura →</span>
                </Link>
              </BorderGlow>
            </Magnet>

            <Magnet forca={0.06} afastamento={44}>
              <BorderGlow
                className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary"
                corFundo="var(--cp-surface)"
                raio={10}
              >
                <Link href="/direitos-comparados/universidades/ambiente" className="group flex h-full flex-col">
                  <h4 className="font-semibold mb-2">🌱 Meio Ambiente</h4>
                  <p className="text-sm text-text-soft mb-4">
                    Conservação ambiental e desenvolvimento sustentável local.
                  </p>
                  <div className="space-y-2 text-xs text-text-soft">
                    <div>• Reflorestamento</div>
                    <div>• Conservação de água</div>
                    <div>• Agricultura sustentável</div>
                    <div>• Educação ambiental</div>
                  </div>
                  <span className="mt-auto font-medium text-primary">Ver ambiente →</span>
                </Link>
              </BorderGlow>
            </Magnet>

            <Magnet forca={0.06} afastamento={44}>
              <BorderGlow
                className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary"
                corFundo="var(--cp-surface)"
                raio={10}
              >
                <Link href="/direitos-comparados/universidades/justica" className="group flex h-full flex-col">
                  <h4 className="font-semibold mb-2">⚖️ Justiça Social</h4>
                  <p className="text-sm text-text-soft mb-4">
                    Acesso à justiça e defesa de direitos das comunidades.
                  </p>
                  <div className="space-y-2 text-xs text-text-soft">
                    <div>• Assistência jurídica</div>
                    <div>• Defesa de direitos</div>
                    <div>• Mediação comunitária</div>
                    <div>• Educação para cidadania</div>
                  </div>
                  <span className="mt-auto font-medium text-primary">Ver justiça →</span>
                </Link>
              </BorderGlow>
            </Magnet>
          </div>
        </section>

        {/* CASOS DE SUCESSO */}
        <section className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Casos de Destaque</h3>
          <div className="grid gap-4">
            {[
              {
                title: "Programa de Saúde da Família",
                institution: "USP - Ribeirão Preto",
                impact: "Atendimento a 50.000 pessoas em 100 municípios",
                area: "Saúde Comunitária"
              },
              {
                title: "Tecnologia Social de Irrigação",
                institution: "UFV - Viçosa",
                impact: "Aumento de 40% na produtividade de 200 famílias",
                area: "Tecnologia e Inovação"
              },
              {
                title: "Escola de Educação do Campo",
                institution: "UEFS - Feira de Santana",
                impact: "Formação de 1.000 educadores em 50 comunidades",
                area: "Educação Básica"
              },
              {
                title: "Incubadora de Empreendedores",
                institution: "UFRGS - Porto Alegre",
                impact: "Criação de 200 empresas e 1.000 empregos",
                area: "Tecnologia e Inovação"
              }
            ].map((case_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{case_.title}</h4>
                      <p className="text-sm text-muted">{case_.institution}</p>
                    </div>
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                      {case_.area}
                    </span>
                  </div>
                  <p className="text-sm text-text-soft">{case_.impact}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* INDICADORES DE IMPACTO */}
        <section className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Indicadores de Impacto</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Impacto Quantitativo</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-text-soft space-y-2">
                  <li>• Pessoas atendidas diretamente</li>
                  <li>• Municípios cobertos</li>
                  <li>• Escolas beneficiadas</li>
                  <li>• Profissionais formados</li>
                  <li>• Empresas criadas</li>
                  <li>• Patentes geradas</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Impacto Qualitativo</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-text-soft space-y-2">
                  <li>• Melhoria dos indicadores sociais</li>
                  <li>• Fortalecimento de instituições locais</li>
                  <li>• Preservação cultural</li>
                  <li>• Sustentabilidade ambiental</li>
                  <li>• Inclusão digital</li>
                  <li>• Cidadania ativa</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FONTES */}
        <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-display text-xl font-bold mb-4">Fontes dos Dados</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Fontes Oficiais</h4>
              <ul className="text-sm text-text-soft space-y-1">
                <li>• MEC (INEP, e-MEC)</li>
                <li>• CAPES (Censo da Educação Superior)</li>
                <li>• CNPq (Diretório de Grupos)</li>
                <li>• MS (CNES, SIH)</li>
                <li>• IBGE (Cidades, Pesquisas)</li>
                <li>• Relatórios de instituições</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Indicadores Disponíveis</h4>
              <ul className="text-sm text-text-soft space-y-1">
                <li>• Projetos de extensão</li>
                <li>• Beneficiários diretos</li>
                <li>• Investimento social</li>
                <li>• Polít públicas influenciadas</li>
                <li>• Indicadores sociais locais</li>
                <li>• Sustentabilidade financeira</li>
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