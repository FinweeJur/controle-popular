/**
 * @file apps/web/app/canada/ambiental/page.tsx
 * @description Sub-rota de meio ambiente, emissões NPRI e o desastre de Mount Polley (/canada/ambiental).
 *
 * Papel no portal:
 * Publica dados ecológicos e estudos geotécnicos do Canadá:
 * - Emissões industriais do National Pollutant Release Inventory (ECCC NPRI).
 * - Estudo comparativo de Mount Polley (BC, 2014) com Mariana e Brumadinho.
 * - Monitoramento por satélite de emissões (Climate TRACE v6/v7).
 * - Artigos abertos revisados por pares e datasets científicos (OpenAlex e Borealis).
 *
 * Fontes oficiais:
 * - Environment and Climate Change Canada (ECCC NPRI).
 * - BC Ministry of Energy and Mines (Painel Independente Mount Polley).
 * - Water Survey of Canada (WSC MSC GeoMet API).
 * - Climate TRACE & OpenAlex API.
 *
 * Decisões técnicas:
 * - Server Component com pré-renderização estática.
 * - Importa agregados da constante `COBERTURA_CANADA`.
 * - Frases curtas de até 13 palavras nos textos de interface.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  COBERTURA_CANADA,
  obterAmbientalCanada,
} from "@/lib/internacional/dados-canada";
import PainelAmbientalCanada from "./PainelAmbientalCanada";
import NavegacaoAbasCanada from "../NavegacaoAbasCanada";
import FooterGlobal from "@/app/components/FooterGlobal";

export const metadata: Metadata = {
  title: "Meio Ambiente Canadá: Emissões NPRI, Desastre de Mount Polley & Clima | Controle Popular",
  description:
    "Dados ambientais oficiais do Canadá: inventário de poluentes ECCC NPRI, estudo comparativo do colapso de Mount Polley (2014) versus Mariana e Brumadinho, e satélite Climate TRACE.",
};

export default function PaginaAmbientalCanada() {
  const ambiental = obterAmbientalCanada();

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
        <span className="font-semibold text-foreground">Meio Ambiente & Ciência</span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            🌊 Meio Ambiente & Clima
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            ECCC NPRI Poluentes
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            Mount Polley ↔ Mariana
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Meio Ambiente no Canadá: Emissões, Rejeitos e Lições Geotécnicas
        </h1>
        <p className="mt-2 max-w-4xl text-base text-muted sm:text-lg">
          Inventário de poluentes do ECCC, emissões industriais e o desastre de Mount Polley em 2014.
        </p>
        <p className="mt-1 text-sm text-muted">
          Compare as lições geotécnicas do Canadá com Mariana e Brumadinho em Minas Gerais.
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <p className="mt-4 border-l-2 border-emerald-600 pl-4 text-sm italic text-muted">
          &ldquo;O rompimento em Mount Polley antecipou em 15 meses o colapso de Fundão. As causas técnicas
          já estavam diagnosticadas.&rdquo;
        </p>
      </header>

      {/* ABAS TEMÁTICAS DO CANADÁ */}
      <NavegacaoAbasCanada abaAtiva="ambiental" />

      {/* PAINEL INTERATIVO COM 6 QUALIDADES */}
      <main>
        <PainelAmbientalCanada
          ambiental={ambiental}
          cobertura={COBERTURA_CANADA}
        />
      </main>

      <FooterGlobal />
    </div>
  );
}
