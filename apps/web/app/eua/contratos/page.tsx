import type { Metadata } from "next";
import Link from "next/link";
import { COBERTURA_EUA, obterContratosEua } from "@/lib/internacional/dados-eua";
import SubNavEua from "../components/SubNavEua";
import PainelContratosEua from "./PainelContratosEua";
import FooterGlobal from "@/app/components/FooterGlobal";

/**
 * @file apps/web/app/eua/contratos/page.tsx
 * @description Sub-rota temática dos Estados Unidos focada em Compras Federais e Balança Comercial.
 *
 * Papel no portal:
 * Audita os contratos e compras públicas federais no USAspending.gov ($750B)
 * e o fluxo bilateral do comércio exterior no US Census Bureau CTY 3510 ($85.2B).
 *
 * Fontes oficiais:
 * - USAspending.gov (U.S. Department of the Treasury).
 * - U.S. Census Bureau (Foreign Trade Statistics CTY 3510 - Brazil).
 * - U.S. Department of Energy (DOE Loan Programs Office).
 *
 * Decisões técnicas e restrições:
 * - Server Component com metadados para auditoria pública de finanças transnacionais.
 * - Utiliza a constante literal `COBERTURA_EUA` para exibição rápida de cartões.
 * - Frases curtas de até 13 palavras na interface para leitura direta.
 */

export const metadata: Metadata = {
  title: "Compras Federais USAspending e Balança Comercial EUA-Brasil | Controle Popular",
  description:
    "Auditoria de compras federais dos EUA no USAspending.gov ($750B) e balança comercial bilateral com o Brasil no US Census Bureau CTY 3510 ($85.2B).",
};

export default function PaginaContratosEua() {
  const contratos = obterContratosEua();

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
        <span className="font-semibold text-foreground">Orçamento & Comércio</span>
      </nav>

      {/* NAVEGAÇÃO ENTRE SUB-ROTAS */}
      <SubNavEua rotaAtiva="contratos" />

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            USAspending.gov Oficial
          </span>
          <span className="rounded-full bg-sky-100 px-3 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
            US Census CTY 3510 (Brasil)
          </span>
          <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            DOE Loan Programs
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            Minerais Críticos & Lítio
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Compras Federais nos EUA e Comércio Exterior Bilateral
        </h1>
        <p className="mt-3 max-w-4xl text-base text-muted sm:text-lg">
          Auditoria de contratos públicos no USAspending e fluxo comercial
          entre os portos americanos e as cadeias produtivas do Brasil.
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <p className="mt-4 border-l-2 border-emerald-600 pl-4 text-sm italic text-muted">
          &ldquo;Seguir o dinheiro público é o mandamento central do controle cívico.
          Compras federais no exterior revelam alianças estratégicas e dependências comerciais.&rdquo;
        </p>
      </header>

      {/* CARTÕES DE TOPO COM AGREGADOS MEDIDOS (COBERTURA_EUA) */}
      <section
        className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 print:grid-cols-4"
        aria-label="Métricas financeiras"
      >
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Comércio EUA x Brasil</div>
          <div className="mt-1 font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 sm:text-3xl">
            $85.2 Bi
          </div>
          <div className="mt-1 text-xs text-muted">
            US Census Bureau CTY 3510
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Compras Federais</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            $750 Bi
          </div>
          <div className="mt-1 text-xs text-muted">
            USAspending.gov auditado
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Minerais Críticos (DOE)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-sky-600 dark:text-sky-400 sm:text-3xl">
            $2.8 Bi
          </div>
          <div className="mt-1 text-xs text-muted">
            Incentivos para lítio e baterias
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Transações Mapeadas</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            {COBERTURA_EUA.contratosEconomia}
          </div>
          <div className="mt-1 text-xs text-muted">
            Programas federais e censo
          </div>
        </div>
      </section>

      {/* MICRORESUMO CÍVICO CONTEXTUAL (AGENTS.md §8) */}
      <section
        aria-label="Microresumo cívico"
        className="mb-8 rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-5 dark:bg-emerald-950/20"
      >
        <h2 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
          💡 Por que cruzar contratos federais dos EUA com o Brasil?
        </h2>
        <div className="mt-2 space-y-1.5 text-xs text-muted leading-relaxed">
          <p>• O USAspending reúne todas as ordens de pagamento do governo federal norte-americano.</p>
          <p>• O código CTY 3510 do Censo detalha exportações de combustíveis e importações de minério.</p>
          <p>• Incentivos do DOE para baterias impactam diretamente o Vale do Jequitinhonha.</p>
          <p>• Permite auditar subsidiárias norte-americanas que prestam serviços para estatais brasileiras.</p>
        </div>
      </section>

      {/* PAINEL INTERATIVO COM AS 6 QUALIDADES */}
      <main>
        <PainelContratosEua contratos={contratos} />
      </main>

      <FooterGlobal />
    </div>
  );
}
