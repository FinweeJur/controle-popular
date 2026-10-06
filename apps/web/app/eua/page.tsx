import type { Metadata } from "next";
import Link from "next/link";
import {
  COBERTURA_EUA,
  obterEmpresasSecEua,
  obterAmbientalEua,
  obterContratosEua,
  obterInstitucionalEua,
} from "@/lib/internacional/dados-eua";
import PainelEua from "./PainelEua";
import SubNavEua from "./components/SubNavEua";
import FooterGlobal from "@/app/components/FooterGlobal";

export const metadata: Metadata = {
  title: "Estados Unidos: SEC EDGAR, Fundos, Barragens NID & Comércio com o Brasil | Controle Popular",
  description:
    "Acervo oficial de transparência dos EUA e conexões com o Brasil: balanços na SEC EDGAR (BlackRock, Vanguard, Vale ADR), inventário de barragens NID (USACE), contratos federais no USAspending e ações judiciais em Nova York.",
};

export default function PaginaHubEua() {
  const empresas = obterEmpresasSecEua();
  const ambiental = obterAmbientalEua();
  const contratos = obterContratosEua();
  const institucional = obterInstitucionalEua();

  return (
      <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6">
      {/* NAVEGAÇÃO BREADCRUMB */}
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-xs text-muted"
      >
        <Link href="/" className="hover:underline">
          Início
        </Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Estados Unidos (/eua)</span>
      </nav>

      {/* NAVEGAÇÃO ENTRE SUB-ROTAS */}
      <SubNavEua rotaAtiva="geral" />

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-sky-100 px-3 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
            🇺🇸 Hub Estados Unidos
          </span>
          <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            SEC EDGAR (10-K & 20-F)
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            NID / USACE (91k Barragens)
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            USAspending & Comércio Bilateral
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Estados Unidos: Transparência Pública, Fundos Globais e Conexão Brasil
        </h1>
        <p className="mt-3 max-w-4xl text-base text-muted sm:text-lg">
          Radiografia de corporações industriais e gestoras de fundos globais com participação em empresas
          brasileiras registradas na SEC (BlackRock, Vanguard, Alcoa, Albemarle, Mosaic), além de inventário
          de barragens de alto risco (NID), compras públicas federais (USAspending.gov) e ações coletivas
          em cortes federais de Nova York sobre Brumadinho e Mariana.
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <p className="mt-4 border-l-2 border-sky-600 pl-4 text-sm italic text-muted">
          &ldquo;Grandes fundos sediados em Nova York detêm parcelas decisivas da mineração e da infraestrutura
          no Brasil. O controle social precisa enxergar os balanços na SEC com a mesma clareza com que
          olha para o Diário Oficial.&rdquo;
          — Princípio cívico de acompanhamento do poder econômico
        </p>
      </header>

      {/* CARTÕES DE TOPO COM AGREGADOS (COBERTURA_EUA) */}
      <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Métricas do acervo">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Corporações & Fundos SEC</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            {COBERTURA_EUA.empresasSecCatalogadas}
          </div>
          <div className="mt-1 text-xs text-sky-600 dark:text-sky-400">
            BlackRock, Vanguard, Alcoa, Vale ADR
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Barragens High Hazard (NID)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-alert sm:text-3xl">
            {COBERTURA_EUA.barragensHighHazardNid.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-muted">DPA Alto nos 50 estados</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Comércio EUA x Brasil</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            $85.2B
          </div>
          <div className="mt-1 text-xs text-muted">US Census Bureau (CTY 3510)</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Cidades-Polo & FIPS</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            {COBERTURA_EUA.cidadesPolo}
          </div>
          <div className="mt-1 text-xs text-muted">Nova York e Washington D.C.</div>
        </div>
      </section>

      {/* PAINEL INTERATIVO COM 6 QUALIDADES */}
      <main>
        <PainelEua
          empresas={empresas}
          ambiental={ambiental}
          contratos={contratos}
          institucional={institucional}
        />
      </main>

      <FooterGlobal />
    </div>
  );
}
