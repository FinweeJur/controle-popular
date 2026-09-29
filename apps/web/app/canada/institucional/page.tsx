/**
 * @file apps/web/app/canada/institucional/page.tsx
 * @description Sub-rota de cidades SGC, Parlamento, Suprema Corte CanLII e Ouvidoria CORE (/canada/institucional).
 *
 * Papel no portal:
 * Mapeia os eixos institucionais e canais cívicos do Canadá:
 * - Cidades minerárias e financeiras: Toronto (TSX), Sudbury (Vale) e Vancouver.
 * - Leis federais de transparência extrativa (ESTMA) e direitos indígenas (UNDRIP).
 * - Jurisprudência da Suprema Corte no CanLII (Nevsun v. Araya e Haida Nation).
 * - Perfil oficial das Primeiras Nações (CIRNAC/ISC) e reservas territoriais.
 * - Canais de ouvidoria e denúncia transnacional (CORE) e pedidos federais ATIP.
 *
 * Fontes oficiais:
 * - Statistics Canada (SGC Cidades e Províncias).
 * - Parliament of Canada / OpenParliament.ca (ESTMA e UNDRIP Act).
 * - Supreme Court of Canada via CanLII (2020 SCC 5 e 2004 SCC 73).
 * - CIRNAC / Crown-Indigenous Relations and Northern Affairs Canada.
 * - Office of the Canadian Ombudsperson for Responsible Enterprise (CORE).
 *
 * Decisões técnicas:
 * - Server Component com pré-renderização estática.
 * - Importa agregados da constante `COBERTURA_CANADA`.
 * - Frases de até 13 palavras nos textos de interface.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  COBERTURA_CANADA,
  obterInstitucionalCanada,
} from "@/lib/internacional/dados-canada";
import PainelInstitucionalCanada from "./PainelInstitucionalCanada";
import NavegacaoAbasCanada from "../NavegacaoAbasCanada";
import FooterGlobal from "@/app/components/FooterGlobal";

export const metadata: Metadata = {
  title: "Institucional Canadá: Cidades SGC, Parlamento, CanLII & Ouvidoria CORE | Controle Popular",
  description:
    "Cidades-polo (Toronto, Sudbury), jurisprudência da Suprema Corte no CanLII sobre mineração no exterior, Primeiras Nações e canais cívicos da Ouvidoria CORE e ATIP.",
};

export default function PaginaInstitucionalCanada() {
  const institucional = obterInstitucionalCanada();

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
        <span className="font-semibold text-foreground">Institucional & Direitos</span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            🏛️ Institucional & Justiça
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            Suprema Corte CanLII
          </span>
          <span className="rounded-full bg-purple-100 px-3 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            Ouvidoria CORE & ATIP
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Instituições Canadenses, Justiça e Direitos Territoriais
        </h1>
        <p className="mt-2 max-w-4xl text-base text-muted sm:text-lg">
          Mapeamento das cidades polo, decisões judiciais e ouvidoria federal de direitos humanos.
        </p>
        <p className="mt-1 text-sm text-muted">
          Saiba como comunidades brasileiras podem acionar a Ouvidoria CORE e consultar a Suprema Corte.
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <p className="mt-4 border-l-2 border-emerald-600 pl-4 text-sm italic text-muted">
          &ldquo;A decisão Nevsun consolidou que mineradoras canadenses respondem no Canadá por danos
          causados no exterior. A lei transcende fronteiras.&rdquo;
        </p>
      </header>

      {/* ABAS TEMÁTICAS DO CANADÁ */}
      <NavegacaoAbasCanada abaAtiva="institucional" />

      {/* PAINEL INTERATIVO COM 6 QUALIDADES */}
      <main>
        <PainelInstitucionalCanada
          institucional={institucional}
          cobertura={COBERTURA_CANADA}
        />
      </main>

      <FooterGlobal />
    </div>
  );
}
