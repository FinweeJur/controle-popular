import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import AberturaHero from "@/app/components/abertura/AberturaHero";
import BorderGlow from "@/app/components/react-bits/BorderGlow";
import Magnet from "@/app/components/react-bits/Magnet";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import ComparadorIndicadores from "./ComparadorIndicadores";

/**
 * `/direitos-comparados/indicadores` — comparador de indicadores fundamentais entre estados.
 *
 * ═══ O QUE É ═══
 *
 * Interface comparativa que permite selecionar estados e comparar indicadores 
 * de direitos fundamentais across multiple dimensions: saúde, educação, trabalho,
 * justiça e desenvolvimento social.
 *
 * ═══ INDICADORES ═══
 *
 * - Desenvolvimento: IDH, renda, desigualdade
 * - Educação: IDEB, matrículas, rede escolar
 * - Saúde: leitos, estabelecimentos, cobertura
 * - Trabalho: formalização, emprego, renda
 * - Justiça: varas, defensorias, acesso
 * - Finanças: repasses, gastos, arrecadação
 */

export const metadata: Metadata = {
  title: "Comparador de Indicadores — Direitos fundamentais entre estados | Controle Popular",
  description:
    "Compare indicadores de direitos fundamentais entre estados brasileiros. IDH, educação, saúde, justiça, trabalho e finanças com dados oficiais.",
};

export default function IndicadoresComparadosPage() {
  return (
    <>
      <AberturaHero paginaId="direitos-comparados-indicadores" titulo="Comparador de Indicadores" />
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
          · <span className="text-text">Comparador de Indicadores</span>
        </nav>

        <header className="mt-4 space-y-4">
          <p
            className="text-[.82em] font-semibold uppercase tracking-wide"
            style={{ color: "var(--cp-alert)" }}
          >
            Indicadores Fundamentais
          </p>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Comparador de Indicadores</h2>
          <p className="max-w-2xl text-[1.05em] text-text-soft">
            Selecione estados e compare indicadores de direitos fundamentais across multiple dimensions.
            Dados atualizados com fontes oficiais do IBGE, MEC, MS, CNJ e outros órgãos governamentais.
          </p>
        </header>

        {/* SELETORES DE ESTADOS */}
        <section className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Estados para Comparação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Estado 1 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado 1</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>Minas Gerais</option>
                    <option>São Paulo</option>
                    <option>Rio de Janeiro</option>
                    <option>Bahia</option>
                    <option>Pernambuco</option>
                  </select>
                </div>

                {/* Trocar estados */}
                <div className="flex items-end">
                  <button className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-muted transition-colors hover:text-primary">
                    ⇅
                  </button>
                </div>

                {/* Estado 2 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado 2</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>São Paulo</option>
                    <option>Minas Gerais</option>
                    <option>Rio de Janeiro</option>
                    <option>Bahia</option>
                    <option>Pernambuco</option>
                  </select>
                </div>
              </div>

              {/* Adicionar mais estados */}
              <div className="mt-4 flex gap-2">
                <button className="flex-1 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/10">
                  + Adicionar Estado
                </button>
                <button className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90">
                  Comparar Agora
                </button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* DIMENSÕES DE DIREITOS */}
        <section className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Dimensões de Direitos</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Magnet forca={0.06} afastamento={44}>
              <BorderGlow
                className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary"
                corFundo="var(--cp-surface)"
                raio={10}
              >
                <h4 className="font-semibold mb-2">📊 Desenvolvimento Humano</h4>
                <ul className="text-sm text-text-soft space-y-1">
                  <li>• IDH geral</li>
                  <li>• IDH renda</li>
                  <li>• IDH educação</li>
                  <li>• IDH longevidade</li>
                  <li>• Gini coeficiente</li>
                  <li>• PIB per capita</li>
                </ul>
              </BorderGlow>
            </Magnet>

            <Magnet forca={0.06} afastamento={44}>
              <BorderGlow
                className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary"
                corFundo="var(--cp-surface)"
                raio={10}
              >
                <h4 className="font-semibold mb-2">🎓 Educação</h4>
                <ul className="text-sm text-text-soft space-y-1">
                  <li>• IDEB ensino fundamental</li>
                  <li>• IDEB ensino médio</li>
                  <li>• Matrículas rede pública</li>
                  <li>• Docentes por aluno</li>
                  <li>• Escolas por 10 mil hab.</li>
                  <li>• Taxa de conclusão</li>
                </ul>
              </BorderGlow>
            </Magnet>

            <Magnet forca={0.06} afastamento={44}>
              <BorderGlow
                className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary"
                corFundo="var(--cp-surface)"
                raio={10}
              >
                <h4 className="font-semibold mb-2">🏥 Saúde</h4>
                <ul className="text-sm text-text-soft space-y-1">
                  <li>• Leitos hospitalares</li>
                  <li>• Estabelecimentos SUS</li>
                  <li>• Médicos por 10 mil hab.</li>
                  <li>• Enfermeiros por 10 mil hab.</li>
                  <li>• Cobertura vacinal</li>
                  <li>• Mortalidade infantil</li>
                </ul>
              </BorderGlow>
            </Magnet>

            <Magnet forca={0.06} afastamento={44}>
              <BorderGlow
                className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary"
                corFundo="var(--cp-surface)"
                raio={10}
              >
                <h4 className="font-semibold mb-2">⚖️ Justiça</h4>
                <ul className="text-sm text-text-soft space-y-1">
                  <li>• Varas judiciais</li>
                  <li>• Defensorias públicas</li>
                  <li>• Delegacias especializadas</li>
                  <li>• Juízes por 100 mil hab.</li>
                  <li>• Acesso à justiça</li>
                  <li>• Processos por vara</li>
                </ul>
              </BorderGlow>
            </Magnet>

            <Magnet forca={0.06} afastamento={44}>
              <BorderGlow
                className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary"
                corFundo="var(--cp-surface)"
                raio={10}
              >
                <h4 className="font-semibold mb-2">💼 Trabalho</h4>
                <ul className="text-sm text-text-soft space-y-1">
                  <li>• Formalização CAGED</li>
                  <li>• Emprego formal</li>
                  <li>• Renda média</li>
                  <li>• Desemprego</li>
                  <li>• Informalidade</li>
                  <li>• Microcrédito</li>
                </ul>
              </BorderGlow>
            </Magnet>

            <Magnet forca={0.06} afastamento={44}>
              <BorderGlow
                className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary"
                corFundo="var(--cp-surface)"
                raio={10}
              >
                <h4 className="font-semibold mb-2">💰 Finanças Públicas</h4>
                <ul className="text-sm text-text-soft space-y-1">
                  <li>• Repasses federais</li>
                  <li>• Gastos saúde</li>
                  <li>• Gastos educação</li>
                  <li>• Arrecadação ICMS</li>
                  <li>• Dívida pública</li>
                  <li>• Transferências municipais</li>
                </ul>
              </BorderGlow>
            </Magnet>
          </div>
        </section>

        {/* ÁREA DE COMPARAÇÃO */}
        <section className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Comparador de Indicadores</CardTitle>
            </CardHeader>
            <CardContent>
              <ComparadorIndicadores />
            </CardContent>
          </Card>
        </section>

        {/* FONTES */}
        <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-display text-xl font-bold mb-4">Fontes dos Dados</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Órgãos Governamentais</h4>
              <ul className="text-sm text-text-soft space-y-1">
                <li>• IBGE (Cidades, IDH, contas nacionais)</li>
                <li>• INEP (IDEB, Censo Escolar)</li>
                <li>• MS (CNES, SIH, SIM)</li>
                <li>• CNJ (Justiça em Números)</li>
                <li>• TSE (eleições, financiamento)</li>
                <li>• MEC (estatísticas educacionais)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Atualização</h4>
              <ul className="text-sm text-text-soft space-y-1">
                <li>• Educação: 2023 (IDEB 2022)</li>
                <li>• Saúde: 2023 (CNES 2023)</li>
                <li>• IDH: 2021 (estimativas 2022)</li>
                <li>• Finanças: 2023 (Portal Transparência)</li>
                <li>• Justica: 2023 (CNJ 2023)</li>
                <li>• Trabalho: 2023 (CAGED 2023)</li>
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