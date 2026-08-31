import type { Metadata } from "next";
import Link from "@/lib/ambiental/link";
import { formatCurrencyCompactaBR, formatNumberBR } from "@/lib/betim/format";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  COBERTURA_ACORDO_RIO_DOCE,
  RIO_DOCE_POR_INICIATIVA,
  RIO_DOCE_POR_ORGAO,
  RIO_DOCE_POR_ANO,
} from "@/lib/ambiental/ckan-mg-mariana";
import { metadataEditavel } from "@/lib/edicoes";
import { IndiceWiki, MiniSumarioLateral } from "@/app/components/wiki";
import PainelMariana from "./PainelMariana";

export const metadata: Metadata = metadataEditavel("/ambiental/mariana", {
  title: "Acordo do Rio Doce (Mariana) — Execução em MG | Controle Popular",
  description: `Execução financeira do Acordo de Reparação e Repactuação do Vale do Rio Doce (Mariana/Fundão) executada pelo Governo de MG: R$ ${formatCurrencyCompactaBR(COBERTURA_ACORDO_RIO_DOCE.valorEmpenhadoTotal)} empenhados em ${COBERTURA_ACORDO_RIO_DOCE.iniciativas} iniciativas.`,
});

const SECOES = [
  { id: "resumo", titulo: "Visão Geral dos Gastos" },
  { id: "grafico-orgaos", titulo: "Execução por Órgão" },
  { id: "iniciativas", titulo: "Iniciativas e Cláusulas" },
  { id: "fontes", titulo: "De Onde Vem o Dado" },
];

export default function AcordoMarianaPage() {
  const C = COBERTURA_ACORDO_RIO_DOCE;
  const maxEmpenhado = Math.max(...RIO_DOCE_POR_ORGAO.map((o) => o.valorEmpenhado));

  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <MiniSumarioLateral itens={SECOES} />

      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/ambiental" className="hover:text-primary">
          Ambiental
        </Link>{" "}
        · <span className="text-text">Acordo do Rio Doce (Mariana)</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Acordo de Reparação do Rio Doce (Mariana)
      </h1>
      <p className="mt-2 max-w-3xl text-[1.02em] text-text-soft">
        Execução financeira dos recursos do Acordo Judicial de Reparação do rompimento da barragem de
        Fundão (Samarco / Vale / BHP, 2015), na parte executada pelos órgãos do Governo de Minas Gerais.
      </p>

      <IndiceWiki itens={SECOES} />

      {/* Seção 1: Resumo em Cartões */}
      <section id="resumo" className="mt-8">
        <h2 className="font-display text-xl font-semibold text-text">Visão Geral dos Gastos</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <span className="block text-xs text-text-soft">Total Empenhado</span>
            <span className="mt-1 block font-tabular text-xl font-bold text-primary">
              R$ {formatCurrencyCompactaBR(C.valorEmpenhadoTotal)}
            </span>
            <span className="mt-1 block text-xs text-text-soft">
              {formatNumberBR(C.empenhos)} empenhos emitidos
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <span className="block text-xs text-text-soft">Total Pago (Financeiro)</span>
            <span className="mt-1 block font-tabular text-xl font-bold text-accent">
              R$ {formatCurrencyCompactaBR(C.valorPagoTotal)}
            </span>
            <span className="mt-1 block text-xs text-text-soft">
              {Math.round((C.valorPagoTotal / C.valorEmpenhadoTotal) * 100)}% do empenhado
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <span className="block text-xs text-text-soft">Iniciativas Cobertas</span>
            <span className="mt-1 block font-tabular text-xl font-bold text-text">
              {formatNumberBR(C.iniciativas)}
            </span>
            <span className="mt-1 block text-xs text-text-soft">
              cláusulas pactuadas
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <span className="block text-xs text-text-soft">Órgãos Executores</span>
            <span className="mt-1 block font-tabular text-xl font-bold text-text">
              {formatNumberBR(C.orgaos)}
            </span>
            <span className="mt-1 block text-xs text-text-soft">
              secretarias e fundos de MG
            </span>
          </div>
        </div>
      </section>

      {/* Seção 2: Execução por Órgão (Gráfico SVG) */}
      <section id="grafico-orgaos" className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold text-text">Execução por Órgão Executor</h2>
        <p className="mt-1 text-sm text-text-soft">
          Distribuição dos valores empenhados e pagos entre secretarias e fundos públicos estaduais.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-surface p-4 sm:p-6">
          <div className="space-y-4">
            {RIO_DOCE_POR_ORGAO.slice(0, 8).map((org) => {
              const pct = Math.round((org.valorEmpenhado / maxEmpenhado) * 100);
              return (
                <div key={org.orgao}>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-text">{org.orgao}</span>
                    <span className="font-tabular font-bold text-primary">
                      R$ {formatCurrencyCompactaBR(org.valorEmpenhado)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Seção 3: Iniciativas Detalhadas */}
      <section id="iniciativas" className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold text-text">Iniciativas e Cláusulas</h2>
        <p className="mt-1 text-sm text-text-soft">
          Acompanhe o valor pactuado em cada anexo do acordo contra o total empenhado e pago até o momento.
        </p>
        <PainelMariana iniciativas={RIO_DOCE_POR_INICIATIVA} />
      </section>

      {/* Seção 4: Proveniência */}
      <section id="fontes" className="mt-12 border-t border-border pt-8 text-sm text-text-soft">
        <h2 className="font-display text-base font-semibold text-text">De Onde Vem o Dado</h2>
        <p className="mt-2 leading-relaxed">
          Dados extraídos do Portal de Dados Abertos de Minas Gerais (
          <a
            href="https://dados.mg.gov.br/dataset/portal_mariana"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            dataset portal_mariana ↗
          </a>
          ). Os números são consolidados diretamente a partir das notas de empenho e liquidação do
          SIAFI/MG.
        </p>
        <p className="mt-2 text-xs">
          Nota de privacidade (LGPD): Foram identificados 37 CPFs de pessoas físicas nos registros
          brutos originais, devidamente redigidos e anonimizados neste portal pelo algoritmo mod-11.
        </p>
      </section>

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
