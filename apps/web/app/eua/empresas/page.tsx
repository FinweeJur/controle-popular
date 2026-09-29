import type { Metadata } from "next";
import Link from "next/link";
import { COBERTURA_EUA, obterEmpresasSecEua } from "@/lib/internacional/dados-eua";
import SubNavEua from "../components/SubNavEua";
import PainelEmpresasSec from "./PainelEmpresasSec";
import FooterGlobal from "@/app/components/FooterGlobal";

/**
 * @file apps/web/app/eua/empresas/page.tsx
 * @description Sub-rota temática dos Estados Unidos focada em Empresas e Fundos na SEC EDGAR.
 *
 * Papel no portal:
 * Mapeia 10 corporações e gestoras de fundos globais com participação no Brasil.
 * Audita seus registros na SEC EDGAR, relatórios 10-K/20-F e riscos declarados.
 *
 * Fontes oficiais:
 * - U.S. Securities and Exchange Commission (SEC EDGAR Submissions & Company Facts).
 * - Códigos CIK de 10 dígitos com links diretos oficiais para cada emissor.
 *
 * Decisões técnicas e restrições:
 * - Server Component com metadados para indexação e compartilhamento cívico.
 * - Importa dados compactados via `obterEmpresasSecEua()` e constantes de `COBERTURA_EUA`.
 * - Cumpre a regra de frases curtas de até 13 palavras na interface.
 */

export const metadata: Metadata = {
  title: "Empresas e Fundos dos EUA na SEC EDGAR | Controle Popular",
  description:
    "Radiografia de corporações industriais e gestoras de fundos globais registradas na SEC EDGAR com investimentos no Brasil (BlackRock, Vanguard, Alcoa, Vale ADR, Mosaic).",
};

export default function PaginaEmpresasEua() {
  const empresas = obterEmpresasSecEua();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* NAVEGAÇÃO BREADCRUMB */}
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-xs text-muted print:hidden"
      >
        <Link href="/" className="hover:underline">
          Início
        </Link>
        <span>/</span>
        <Link href="/eua" className="hover:underline">
          Estados Unidos (/eua)
        </Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Empresas & Fundos SEC</span>
      </nav>

      {/* NAVEGAÇÃO HORIZONTAL ENTRE SUB-ROTAS */}
      <SubNavEua rotaAtiva="empresas" />

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-sky-100 px-3 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
            SEC EDGAR Oficial
          </span>
          <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            Form 10-K & 20-F
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            CIK com 10 Dígitos
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            Fundos & Mineradoras Globais
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Empresas e Fundos dos EUA na SEC: Conexão com o Brasil
        </h1>
        <p className="mt-3 max-w-4xl text-base text-muted sm:text-lg">
          Balanços auditados, formulários anuais 10-K e 20-F e fatores de risco.
          Descubra quem financia, controla e lucra com recursos estratégicos brasileiros.
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <p className="mt-4 border-l-2 border-sky-600 pl-4 text-sm italic text-muted">
          &ldquo;Grandes fundos sediados em Nova York detêm parcelas decisivas da mineração brasileira.
          O controle social precisa auditar a SEC com o mesmo rigor do Diário Oficial.&rdquo;
        </p>
      </header>

      {/* CARTÕES DE TOPO COM AGREGADOS MEDIDOS (COBERTURA_EUA) */}
      <section
        className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 print:grid-cols-4"
        aria-label="Métricas de empresas SEC"
      >
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Corporações & Fundos</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            {COBERTURA_EUA.empresasSecCatalogadas}
          </div>
          <div className="mt-1 text-xs text-sky-600 dark:text-sky-400">
            Catalogados na SEC EDGAR
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Ativos sob Gestão</div>
          <div className="mt-1 font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 sm:text-3xl">
            $24.1 Tri
          </div>
          <div className="mt-1 text-xs text-muted">
            BlackRock, Vanguard e outros
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">CIK 10 Dígitos</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            100%
          </div>
          <div className="mt-1 text-xs text-muted">
            Links oficiais diretos
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Foco no Brasil</div>
          <div className="mt-1 font-mono text-2xl font-bold text-sky-600 dark:text-sky-400 sm:text-3xl">
            10 de 10
          </div>
          <div className="mt-1 text-xs text-muted">
            Mineração, energia e bancos
          </div>
        </div>
      </section>

      {/* MICRORESUMO CÍVICO CONTEXTUAL (AGENTS.md §8) */}
      <section
        aria-label="Microresumo cívico"
        className="mb-8 rounded-xl border border-sky-500/30 bg-sky-50/50 p-5 dark:bg-sky-950/20"
      >
        <h2 className="text-sm font-semibold text-sky-900 dark:text-sky-200">
          💡 Por que acompanhar os balanços na SEC dos Estados Unidos?
        </h2>
        <div className="mt-2 space-y-1.5 text-xs text-muted leading-relaxed">
          <p>• A SEC exige transparência estrita de riscos socioambientais e litígios judiciais.</p>
          <p>• Mineradoras que operam em Minas e na Amazônia reportam suas barragens em Nova York.</p>
          <p>• O CIK de dez dígitos permite auditar relatórios originais sem intermediários.</p>
          <p>• Investidores institucionais como BlackRock e Vanguard votam nas assembleias brasileiras.</p>
        </div>
      </section>

      {/* PAINEL INTERATIVO COM AS 6 QUALIDADES */}
      <main>
        <PainelEmpresasSec empresas={empresas} />
      </main>

      <FooterGlobal />
    </div>
  );
}
