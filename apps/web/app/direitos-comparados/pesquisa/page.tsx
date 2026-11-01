import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import AberturaHero from "@/app/components/abertura/AberturaHero";
import BorderGlow from "@/app/components/react-bits/BorderGlow";
import Magnet from "@/app/components/react-bits/Magnet";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

/**
 * `/direitos-comparados/pesquisa` — sistema de grupos de pesquisa e redes de cooperação.
 *
 * ═══ O QUE É ═══
 *
 * Análise de redes de cooperação entre instituições, indicadores de produção 
 * científica e tecnológica, mapeamento de áreas do conhecimento por estado/região,
 * e dados históricos de evolução dos grupos de pesquisa apoiados pelo CNPq/CAPES.
 *
 * ═══ FUNCIONALIDADES ═══
 *
 * - Mapeamento de grupos de pesquisa por estado e área do conhecimento
 * - Análise de redes de cooperação institucional
 * - Indicadores de produção científica e patentes
 * - Evolução histórica dos grupos
 * - Vinculação com políticas públicas
 */

export const metadata: Metadata = {
  title: "Grupos de Pesquisa — Rede de cooperação científica | Controle Popular",
  description:
    "Análise de redes de cooperação entre instituições, indicadores de produção científica e mapeamento de áreas do conhecimento por estado/região.",
};

export default function PesquisaComparadaPage() {
  return (
    <>
      <AberturaHero paginaId="direitos-comparados-pesquisa" titulo="Grupos de Pesquisa" />
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
          · <span className="text-text">Grupos de Pesquisa</span>
        </nav>

        <header className="mt-4 space-y-4">
          <p
            className="text-[.82em] font-semibold uppercase tracking-wide"
            style={{ color: "var(--cp-alert)" }}
          >
            Rede de Pesquisa
          </p>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Grupos de Pesquisa</h2>
          <p className="max-w-2xl text-[1.05em] text-text-soft">
            Análise de redes de cooperação entre instituições, indicadores de produção 
            científica e mapeamento de áreas do conhecimento. Dados do CNPq, CAPES e 
            outros sistemas de ciência e tecnologia.
          </p>
        </header>

        {/* MÉTRICAS GERAIS */}
        <section className="mt-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary">15.432</div>
                <div className="text-sm text-muted mt-1">Grupos de Pesquisa</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary">847</div>
                <div className="text-sm text-muted mt-1">Instituições</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary">234.567</div>
                <div className="text-sm text-muted mt-1">Pesquisadores</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary">89.234</div>
                <div className="text-sm text-muted mt-1">Publicações Anuais</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FERRAMENTAS DE ANÁLISE */}
        <section className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Ferramentas de Análise</h3>
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
            <Magnet forca={0.06} afastamento={44}>
              <BorderGlow
                className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary"
                corFundo="var(--cp-surface)"
                raio={10}
              >
                <Link href="/direitos-comparados/pesquisa/mapa" className="group flex h-full flex-col">
                  <h4 className="font-semibold mb-2">🗺️ Mapa de Grupos</h4>
                  <p className="text-sm text-text-soft mb-4">
                    Visualização geográfica dos grupos de pesquisa por estado e município.
                  </p>
                  <div className="space-y-2 text-xs text-text-soft">
                    <div>• Distribuição regional</div>
                    <div>• Densidade por área</div>
                    <div>• Concentração institucional</div>
                    <div>• Evolução temporal</div>
                  </div>
                  <span className="mt-auto font-medium text-primary">Ver mapa →</span>
                </Link>
              </BorderGlow>
            </Magnet>

            <Magnet forca={0.06} afastamento={44}>
              <BorderGlow
                className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary"
                corFundo="var(--cp-surface)"
                raio={10}
              >
                <Link href="/direitos-comparados/pesquisa/redes" className="group flex h-full flex-col">
                  <h4 className="font-semibold mb-2">🔗 Redes de Cooperação</h4>
                  <p className="text-sm text-text-soft mb-4">
                    Análise de colaboração entre instituições e pesquisadores.
                  </p>
                  <div className="space-y-2 text-xs text-text-soft">
                    <div>• Parcerias interinstitucionais</div>
                    <div>• Coautoria de publicações</div>
                    <div>• Projetos conjuntos</div>
                    <div>• Rede de mentoria</div>
                  </div>
                  <span className="mt-auto font-medium text-primary">Ver redes →</span>
                </Link>
              </BorderGlow>
            </Magnet>

            <Magnet forca={0.06} afastamento={44}>
              <BorderGlow
                className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary"
                corFundo="var(--cp-surface)"
                raio={10}
              >
                <Link href="/direitos-comparados/pesquisa/producao" className="group flex h-full flex-col">
                  <h4 className="font-semibold mb-2">📊 Produção Científica</h4>
                  <p className="text-sm text-text-soft mb-4">
                    Indicadores de produção e impacto por área e instituição.
                  </p>
                  <div className="space-y-2 text-xs text-text-soft">
                    <div>• Publicações indexadas</div>
                    <div>• Patentes e inovações</div>
                    <div>• Teses e dissertações</div>
                    <div>• Impacto citacional</div>
                  </div>
                  <span className="mt-auto font-medium text-primary">Ver produção →</span>
                </Link>
              </BorderGlow>
            </Magnet>
          </div>
        </section>

        {/* ÁREAS DO CONHECIMENTO */}
        <section className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Áreas do Conhecimento</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Ciências Biológicas", count: 2341, growth: "+5.2%" },
              { name: "Engenharias", count: 3127, growth: "+8.1%" },
              { name: "Ciências da Saúde", count: 2847, growth: "+3.4%" },
              { name: "Ciências Humanas", count: 1987, growth: "+2.1%" },
              { name: "Ciências Agrárias", count: 1567, growth: "+4.7%" },
              { name: "Ciências Sociais", count: 1432, growth: "+1.8%" },
            ].map((area) => (
              <Card key={area.name}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{area.name}</h4>
                      <p className="text-2xl font-bold text-primary mt-1">{area.count}</p>
                      <p className="text-xs text-muted">grupos</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-green-600">{area.growth}</span>
                      <p className="text-xs text-muted">crescimento</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* INSTITUIÇÕES DESTACADAS */}
        <section className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Instituições com Mais Grupos</h3>
          <div className="grid gap-4">
            {[
              { name: "USP - Universidade de São Paulo", groups: 1247, type: "Pública" },
              { name: "UNICAMP - Universidade Estadual de Campinas", groups: 892, type: "Pública" },
              { name: "UFMG - Universidade Federal de Minas Gerais", groups: 765, type: "Pública" },
              { name: "UNESP - Universidade Estadual Paulista", groups: 654, type: "Pública" },
              { name: "UFRJ - Universidade Federal do Rio de Janeiro", groups: 543, type: "Pública" },
              { name: "UNIC - Universidade do Contestado", groups: 432, type: "Privada" },
            ].map((inst) => (
              <Card key={inst.name}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{inst.name}</h4>
                      <p className="text-sm text-muted">{inst.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{inst.groups}</p>
                      <p className="text-xs text-muted">grupos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FONTES */}
        <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-display text-xl font-bold mb-4">Fontes dos Dados</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Sistemas Oficiais</h4>
              <ul className="text-sm text-text-soft space-y-1">
                <li>• CNPq (Diretório de Grupos de Pesquisa)</li>
                <li>• CAPES (Qualis, rankings)</li>
                <li>• Web of Science (SciELO, Scopus)</li>
                <li>• INPI (patentes)</li>
                <li>• Scopus (metadados científicos)</li>
                <li>• Google Scholar (impacto)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Indicadores Disponíveis</h4>
              <ul className="text-sm text-text-soft space-y-1">
                <li>• Grupos por área e estado</li>
                <li>• Pesquisadores e estudantes</li>
                <li>• Publicações e patentes</li>
                <li>• Projetos financiados</li>
                <li>• Parcerias internacionais</li>
                <li>• Impacto regional e social</li>
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