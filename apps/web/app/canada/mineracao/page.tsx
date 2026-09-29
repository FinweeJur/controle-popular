/**
 * @file apps/web/app/canada/mineracao/page.tsx
 * @description Sub-rota temática de mineradoras canadenses da Bolsa de Toronto operando no Brasil (/canada/mineracao).
 *
 * Papel no portal:
 * Mapeia as corporações listadas na TSX e TSX-V com direitos minerários ativos na ANM,
 * barragens de rejeitos no SIGBM e projetos de extração mineral (ouro, lítio, cobre, níquel).
 *
 * Fontes oficiais:
 * - Bolsa de Toronto (TSX / TSX Venture Exchange) e relatórios SEDAR+.
 * - SEC EDGAR (Balanços e formulários 20-F e 10-K).
 * - Agência Nacional de Mineração (ANM — Cadastro Mineiro e SIGBM).
 *
 * Decisões técnicas:
 * - Server Component com pré-renderização estática dos dados descompactados.
 * - Utiliza a constante medida `COBERTURA_CANADA` para os agregados de topo.
 * - Textos formulados em frases diretas de até 13 palavras.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  COBERTURA_CANADA,
  obterMineradorasCanada,
} from "@/lib/internacional/dados-canada";
import PainelMineracaoCanada from "./PainelMineracaoCanada";
import NavegacaoAbasCanada from "../NavegacaoAbasCanada";
import FooterGlobal from "@/app/components/FooterGlobal";

export const metadata: Metadata = {
  title: "Mineradoras Canadenses no Brasil (TSX/TSX-V) & Barragens ANM | Controle Popular",
  description:
    "Mapeamento de 12 mineradoras listadas na Bolsa de Toronto (TSX) operando no Brasil: Sigma Lithium, Vale Base Metals, Belo Sun, Ero, Equinox, Aura e Lundin Mining.",
};

export default function PaginaMineracaoCanada() {
  const mineradoras = obterMineradorasCanada();

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
        <span className="font-semibold text-foreground">Mineração TSX</span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            ⛏️ Mineração Transnacional
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            TSX / TSX-V Toronto
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            ANM & SIGBM
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Mineradoras Canadenses da TSX Operando no Brasil
        </h1>
        <p className="mt-2 max-w-4xl text-base text-muted sm:text-lg">
          Cruzamento entre empresas listadas na Bolsa de Toronto e direitos minerários na ANM.
        </p>
        <p className="mt-1 text-sm text-muted">
          Acompanhe processos de lavra, barragens de rejeitos e relatórios SEDAR+.
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <p className="mt-4 border-l-2 border-emerald-600 pl-4 text-sm italic text-muted">
          &ldquo;As decisões sobre o Jequitinhonha ou o Xingu ocorrem em Toronto e Vancouver. O controle
          social não pode parar nas fronteiras.&rdquo;
        </p>
      </header>

      {/* ABAS TEMÁTICAS DO CANADÁ */}
      <NavegacaoAbasCanada abaAtiva="mineracao" />

      {/* PAINEL INTERATIVO COM 6 QUALIDADES */}
      <main>
        <PainelMineracaoCanada
          mineradoras={mineradoras}
          cobertura={COBERTURA_CANADA}
        />
      </main>

      <FooterGlobal />
    </div>
  );
}
