import type { Metadata } from "next";
import Link from "next/link";
import { COBERTURA_EUA, obterAmbientalEua } from "@/lib/internacional/dados-eua";
import SubNavEua from "../components/SubNavEua";
import PainelAmbientalEua from "./PainelAmbientalEua";
import FooterGlobal from "@/app/components/FooterGlobal";

/**
 * @file apps/web/app/eua/ambiental/page.tsx
 * @description Sub-rota temática dos Estados Unidos focada em Meio Ambiente, Barragens e Fiscalização.
 *
 * Papel no portal:
 * Apresenta o inventário nacional de barragens (NID/USACE), autos de infração da EPA ECHO,
 * áreas contaminadas Superfund (CERCLA) e estações hidrológicas do USGS.
 *
 * Fontes oficiais:
 * - National Inventory of Dams (USACE / FEMA) com 91.500 barragens e 15.600 High Hazard.
 * - U.S. Environmental Protection Agency (EPA ECHO e Superfund).
 * - U.S. Geological Survey (USGS Water Services).
 * - Climate TRACE (Coalizão de satélites para emissões de gases).
 *
 * Decisões técnicas e restrições:
 * - Server Component com metadados para auditoria pública e SEO.
 * - Cartões de topo utilizam a constante literal `COBERTURA_EUA` para performance.
 * - Frases curtas de até 13 palavras na interface para leitura acessível.
 */

export const metadata: Metadata = {
  title: "Meio Ambiente nos EUA: Barragens NID, EPA ECHO e Superfund | Controle Popular",
  description:
    "Inventário de 91k barragens do National Inventory of Dams (15.600 High Hazard), multas da EPA ECHO, áreas contaminadas Superfund CERCLA e emissões do Climate TRACE.",
};

export default function PaginaAmbientalEua() {
  const ambiental = obterAmbientalEua();

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
        <span className="font-semibold text-foreground">Barragens & Meio Ambiente</span>
      </nav>

      {/* NAVEGAÇÃO ENTRE SUB-ROTAS */}
      <SubNavEua rotaAtiva="ambiental" />

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            NID / USACE (91k Barragens)
          </span>
          <span className="rounded-full bg-red-100 px-3 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300">
            EPA ECHO (Multas Industriais)
          </span>
          <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            Superfund CERCLA (Áreas Tóxicas)
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            USGS Hidrologia & Climate TRACE
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Meio Ambiente nos EUA: Barragens, Multas e Superfund
        </h1>
        <p className="mt-3 max-w-4xl text-base text-muted sm:text-lg">
          Inventário de barragens de alto risco, histórico de multas da EPA e
          recuperação de bacias contaminadas com paralelos diretos para o Brasil.
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <p className="mt-4 border-l-2 border-amber-600 pl-4 text-sm italic text-muted">
          &ldquo;Classificar dano potencial não é prever rompimento. É medir a gravidade
          humana para planejar fiscalização rigorosa antes do desastre acontecer.&rdquo;
        </p>
      </header>

      {/* CARTÕES DE TOPO COM AGREGADOS MEDIDOS (COBERTURA_EUA) */}
      <section
        className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 print:grid-cols-4"
        aria-label="Métricas ambientais"
      >
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Barragens High Hazard (NID)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-red-600 dark:text-red-400 sm:text-3xl">
            {COBERTURA_EUA.barragensHighHazardNid.toLocaleString("pt-BR")}
          </div>
          <div className="mt-1 text-xs text-muted">
            DPA Alto nos 50 estados
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Áreas Superfund (CERCLA)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-amber-600 dark:text-amber-400 sm:text-3xl">
            1.340
          </div>
          <div className="mt-1 text-xs text-muted">
            Sítios na Lista Nacional (NPL)
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Multas EPA ECHO (Ano)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            $1.100 M
          </div>
          <div className="mt-1 text-xs text-muted">
            Sanções civis e criminais
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Estações de Rios (USGS)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-sky-600 dark:text-sky-400 sm:text-3xl">
            11.800
          </div>
          <div className="mt-1 text-xs text-muted">
            Telemetria em tempo real
          </div>
        </div>
      </section>

      {/* MICRORESUMO CÍVICO CONTEXTUAL (AGENTS.md §8) */}
      <section
        aria-label="Microresumo cívico"
        className="mb-8 rounded-xl border border-amber-500/30 bg-amber-50/50 p-5 dark:bg-amber-950/20"
      >
        <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          💡 O que aprendemos com a regulação ambiental dos Estados Unidos?
        </h2>
        <div className="mt-2 space-y-1.5 text-xs text-muted leading-relaxed">
          <p>• O NID separa DPA (Dano Potencial) de risco imediato de rompimento estrutural.</p>
          <p>• O programa Superfund obriga corporações poluidoras a pagarem pela reparação integral.</p>
          <p>• A plataforma EPA ECHO publica histórico detalhado de cada licença industrial.</p>
          <p>• A rede hidrológica do USGS fornece alertas de vazão abertos para pesquisadores.</p>
        </div>
      </section>

      {/* PAINEL INTERATIVO COM AS 6 QUALIDADES */}
      <main>
        <PainelAmbientalEua ambiental={ambiental} />
      </main>

      <FooterGlobal />
    </div>
  );
}
