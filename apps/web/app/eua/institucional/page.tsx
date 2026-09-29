import type { Metadata } from "next";
import Link from "next/link";
import { COBERTURA_EUA, obterInstitucionalEua } from "@/lib/internacional/dados-eua";
import SubNavEua from "../components/SubNavEua";
import PainelInstitucionalEua from "./PainelInstitucionalEua";
import FooterGlobal from "@/app/components/FooterGlobal";

/**
 * @file apps/web/app/eua/institucional/page.tsx
 * @description Sub-rota temática dos Estados Unidos focada em Instituições, Judiciário e LAI (FOIA).
 *
 * Papel no portal:
 * Mapeia as cidades-polo FIPS (NY e Washington D.C.), o Congresso dos EUA, o litígio civil
 * do caso Brumadinho na corte de NY (SDNY), reservas indígenas federais (BIA) e o guia FOIA.
 *
 * Fontes oficiais:
 * - NYC Open Data e Open Data DC.
 * - Congress.gov (119º Congresso dos EUA).
 * - CourtListener / SDNY (Ação de investidores contra a Vale S.A.).
 * - U.S. Bureau of Indian Affairs (BIA GIS).
 * - FOIA.gov (U.S. Department of Justice).
 *
 * Decisões técnicas e restrições:
 * - Server Component com metadados para auditoria pública de instituições transnacionais.
 * - Cartões de topo utilizam a constante literal `COBERTURA_EUA` para renderização veloz.
 * - Frases curtas de até 13 palavras na interface para máxima clareza e acessibilidade.
 */

export const metadata: Metadata = {
  title: "Institucional dos EUA: Cidades FIPS, Congresso, Corte de NY e FOIA | Controle Popular",
  description:
    "Estrutura institucional dos EUA: cidades-polo Nova York e Washington D.C., 119º Congresso, caso civil de Brumadinho na corte SDNY, reservas indígenas BIA e guia de pedido FOIA.",
};

export default function PaginaInstitucionalEua() {
  const institucional = obterInstitucionalEua();

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
        <span className="font-semibold text-foreground">Institucional & FOIA</span>
      </nav>

      {/* NAVEGAÇÃO ENTRE SUB-ROTAS */}
      <SubNavEua rotaAtiva="institucional" />

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-sky-100 px-3 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
            Cidades FIPS (NY e D.C.)
          </span>
          <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            Congresso dos EUA (535 Membros)
          </span>
          <span className="rounded-full bg-red-100 px-3 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300">
            Corte SDNY (Caso Brumadinho)
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            Terras Indígenas BIA
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            FOIA (20 Dias de Resposta)
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Institucional dos EUA: Cidades, Cortes, Terras e Acesso à Informação
        </h1>
        <p className="mt-3 max-w-4xl text-base text-muted sm:text-lg">
          Governança pública americana, processos judiciais de tragédias brasileiras em Nova York
          e guia de como solicitar documentos federais pelo FOIA.
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <p className="mt-4 border-l-2 border-indigo-600 pl-4 text-sm italic text-muted">
          &ldquo;A jurisdição dos tribunais de Nova York sobre crimes cometidos no Brasil
          mostra que a justiça não tem fronteiras quando envolve o mercado financeiro.&rdquo;
        </p>
      </header>

      {/* CARTÕES DE TOPO COM AGREGADOS MEDIDOS (COBERTURA_EUA) */}
      <section
        className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 print:grid-cols-4"
        aria-label="Métricas institucionais"
      >
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Cidades-Polo FIPS</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            {COBERTURA_EUA.cidadesPolo}
          </div>
          <div className="mt-1 text-xs text-sky-600 dark:text-sky-400">
            Nova York e Washington D.C.
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Acordo SDNY Brumadinho</div>
          <div className="mt-1 font-mono text-2xl font-bold text-red-600 dark:text-red-400 sm:text-3xl">
            $55.9 M
          </div>
          <div className="mt-1 text-xs text-muted">
            Indenização aos investidores
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Membros do Congresso</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            535
          </div>
          <div className="mt-1 text-xs text-muted">
            100 Senadores e 435 Deputados
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Terras Indígenas (BIA)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-amber-600 dark:text-amber-400 sm:text-3xl">
            56.2 M
          </div>
          <div className="mt-1 text-xs text-muted">
            Acres em 574 tribos
          </div>
        </div>
      </section>

      {/* MICRORESUMO CÍVICO CONTEXTUAL (AGENTS.md §8) */}
      <section
        aria-label="Microresumo cívico"
        className="mb-8 rounded-xl border border-indigo-500/30 bg-indigo-50/50 p-5 dark:bg-indigo-950/20"
      >
        <h2 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
          💡 Por que cidadãos brasileiros devem conhecer as instituições dos EUA?
        </h2>
        <div className="mt-2 space-y-1.5 text-xs text-muted leading-relaxed">
          <p>• A corte de Nova York (SDNY) puniu a omissão de risco de barragens pela Vale.</p>
          <p>• O Congresso americano aprova tarifas aduaneiras e sanções de produtos agrícolas.</p>
          <p>• O FOIA permite que qualquer brasileiro solicite relatórios oficiais ao governo americano.</p>
          <p>• As reservas do BIA mostram modelos jurídicos de autonomia territorial para povos originários.</p>
        </div>
      </section>

      {/* PAINEL INTERATIVO COM AS 6 QUALIDADES */}
      <main>
        <PainelInstitucionalEua institucional={institucional} />
      </main>

      <FooterGlobal />
    </div>
  );
}
