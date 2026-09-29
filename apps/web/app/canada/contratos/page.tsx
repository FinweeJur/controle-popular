/**
 * @file apps/web/app/canada/contratos/page.tsx
 * @description Sub-rota de compras públicas federais, subsídios e financiamentos da EDC (/canada/contratos).
 *
 * Papel no portal:
 * Mapeia as contratações públicas federais do Canadá e fluxos financeiros transnacionais com o Brasil:
 * - Compras públicas e subsídios do portal Open Government Canada (CKAN).
 * - Financiamentos da Export Development Canada (EDC) para corporações operando no Brasil.
 * - Fluxos comerciais bilaterais consolidados pelo Statistics Canada (StatCan).
 * - Mapeamento societário internacional via GLEIF Legal Entity Identifier (LEI).
 *
 * Fontes oficiais:
 * - Open Government Canada CKAN (search.open.canada.ca/contracts e /grants).
 * - Export Development Canada (EDC Disclosure Portal).
 * - Statistics Canada (StatCan Canadian International Merchandise Trade).
 * - Global Legal Entity Identifier Foundation (GLEIF).
 *
 * Decisões técnicas:
 * - Server Component com pré-renderização estática.
 * - Utiliza a constante medida `COBERTURA_CANADA` para os cartões de topo.
 * - Frases de até 13 palavras nos textos de interface.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  COBERTURA_CANADA,
  obterContratosCanada,
} from "@/lib/internacional/dados-canada";
import PainelContratosCanada from "./PainelContratosCanada";
import NavegacaoAbasCanada from "../NavegacaoAbasCanada";
import FooterGlobal from "@/app/components/FooterGlobal";

export const metadata: Metadata = {
  title: "Contratos Federais no Canadá & Financiamentos EDC para o Brasil | Controle Popular",
  description:
    "Transparência de compras públicas do portal Open Government Canada (CKAN), subsídios e créditos à exportação concedidos pela estatal EDC para o Brasil.",
};

export default function PaginaContratosCanada() {
  const contratos = obterContratosCanada();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* NAVEGAÇÃO BREADCRUMB */}
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-xs text-muted"
      >
        <Link href="/" className="hover:underline">
          Início
        </Link>
        <span>/</span>
        <Link href="/canada" className="hover:underline">
          Canadá (/canada)
        </Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Compras & Financiamentos</span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            📄 Finanças & Contratos
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            Open Government CKAN
          </span>
          <span className="rounded-full bg-purple-100 px-3 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            EDC Créditos à Exportação
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Compras Públicas no Canadá e Financiamentos da EDC
        </h1>
        <p className="mt-2 max-w-4xl text-base text-muted sm:text-lg">
          Mapeamento de subsídios federais canadenses e créditos concedidos a empresas no Brasil.
        </p>
        <p className="mt-1 text-sm text-muted">
          Acompanhe transações comerciais e acordos financeiros entre o Canadá e o Brasil.
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <p className="mt-4 border-l-2 border-emerald-600 pl-4 text-sm italic text-muted">
          &ldquo;Grandes obras no Brasil contam com garantias e financiamentos de agências estatais
          canadenses. O dinheiro público precisa ser transparente.&rdquo;
        </p>
      </header>

      {/* ABAS TEMÁTICAS DO CANADÁ */}
      <NavegacaoAbasCanada abaAtiva="contratos" />

      {/* PAINEL INTERATIVO COM 6 QUALIDADES */}
      <main>
        <PainelContratosCanada
          contratos={contratos}
          cobertura={COBERTURA_CANADA}
        />
      </main>

      <FooterGlobal />
    </div>
  );
}
