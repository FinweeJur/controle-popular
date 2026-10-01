import type { Metadata } from "next";
import Link from "next/link";
import {
  COBERTURA_AMEACAS_AMERICAS,
  obterTodasAmeacas,
} from "@/lib/ambiente/dados-ameacas-americas";
import PainelAmeacasClient from "./PainelAmeacasClient";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import MeioAmbienteRelacionado from "@/app/components/MeioAmbienteRelacionado";

/**
 * @file apps/web/app/ambiental/ameacas-americas/page.tsx
 * @description Página SSR do Observatório de Ameaças Ambientais nas Américas.
 *
 * Papel no portal:
 * Publica o panorama unificado de 90 pontos críticos de pressão ecológica e territorial
 * no continente americano (Espécies, Rios, Serras e Comunidades Tradicionais).
 *
 * Fontes oficiais:
 * - ICMBio & MMA (Portaria MMA 148/2022 / Livro Vermelho da Fauna Brasileira)
 * - IUCN (Red List of Threatened Species 2024.2)
 * - ANA & IGAM (Conjuntura dos Recursos Hídricos e Monitoramento das Águas)
 * - FUNAI, Fundação Palmares & INCRA (Terras Indígenas e Quilombolas)
 * - US EPA, USGS, USFWS, Parks Canada e DFO (Bacias e Espécies da América do Norte)
 * - SEMARNAT/CONANP (México), OEFA (Peru), INDH (Chile)
 *
 * Decisões técnicas e conformidade (AGENTS.md):
 * - Regra §5.1: Agregados COBERTURA_AMEACAS_AMERICAS importados diretamente no SSR para
 *   alimentar os cartões de topo sem inflar o payload da página.
 * - Regra §5.10: Descrição sob o <h1> nunca menor que text-sm (14px) com controle
 *   ResumoExpandivel ("Ver + Texto") para leitura confortável sem empurrar a dobra.
 * - Regra §8: Padrão das Seis Qualidades cumprido integralmente (busca em tempo real,
 *   filtros multifacetados, ordenação por coluna, resumo em cartões e gráficos,
 *   assistente cívico Seu Nonô com orações curtas e exportação CSV/impressão).
 */

export const metadata: Metadata = {
  title: "Ameaças Ambientais nas Américas — Espécies, Rios, Serras e Povos | Controle Popular · ONSA",
  description:
    "Raio-x cívico de 90 ameaças socioambientais críticas nas Américas: 32 espécies da fauna, 16 bacias fluviais, 16 serras e 26 territórios tradicionais protegidos.",
};

export default function PaginaAmeacasAmericas() {
  const ameacas = obterTodasAmeacas();
  const c = COBERTURA_AMEACAS_AMERICAS;

  const textoDescricao =
    "O Observatório Nacional Socioambiental (ONSA) consolida o monitoramento cívico de 90 ameaças ambientais " +
    "e territoriais de alta gravidade em 11 países das Américas: 32 espécies da fauna silvestre em risco de extinção, " +
    "16 bacias fluviais vitais sob contaminação e estresse hídrico agudo, 16 serras e cordilheiras mineradas ou desmatadas, " +
    "e 26 territórios de povos indígenas, comunidades quilombolas e ribeirinhos que defendem a integridade da terra contra " +
    "vetores predatórios. Todos os dados são referenciados em atos de órgãos oficiais e relatórios científicos públicos.";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* BREADCRUMB ESTRUTURAL                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <nav aria-label="Navegação estrutural" className="flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:underline">
          Início
        </Link>
        <span>/</span>
        <Link href="/ambiental" className="hover:underline">
          ONSA
        </Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Ameaças nas Américas</span>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CABEÇALHO DA PÁGINA COM BADGES, TÍTULO E RESUMO EXPANSÍVEL (§5.10) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            Observatório Continental
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Biodiversidade & Direitos Territoriais
          </span>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted">
            Medição auditada em {c.dataMedicao}
          </span>
        </div>

        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
          Ameaças Ambientais nas Américas
        </h1>

        {/* Descrição com piso de 14px e controle Ver + Texto (Regra § 5.10) */}
        <div className="max-w-4xl text-text-soft">
          <ResumoExpandivel texto={textoDescricao} className="text-sm sm:text-base text-text-soft" />
        </div>

        {/* Epígrafe editorial autorizada */}
        <p className="border-l-2 border-primary/40 pl-4 text-xs italic text-muted">
          &ldquo;A terra não pertence ao homem; o homem pertence à terra. Todas as coisas estão ligadas como o sangue que une uma família.&rdquo;
          — Chefe Seattle (Suquamish/Duwamish), 1854
        </p>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CARTÕES DE TOPO COM AGREGADOS AUDITADOS (REGRA §8 QUALIDADE 4)      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section aria-label="Indicadores consolidados" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Total Ameaças
          </span>
          <p className="mt-1 font-display text-2xl sm:text-3xl font-bold text-foreground">
            {c.totalAmeacas}
          </p>
          <span className="block text-[11px] text-muted">Mapeadas em 11 países</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Espécies
            </span>
            <span className="text-lg">🐾</span>
          </div>
          <p className="mt-1 font-display text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {c.totalEspecies}
          </p>
          <span className="block text-[11px] text-muted">Fauna sob risco crítico</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Rios & Bacias
            </span>
            <span className="text-lg">🌊</span>
          </div>
          <p className="mt-1 font-display text-2xl sm:text-3xl font-bold text-sky-600 dark:text-sky-400">
            {c.totalRios}
          </p>
          <span className="block text-[11px] text-muted">Águas sob estresse e lama</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Serras & Cumes
            </span>
            <span className="text-lg">⛰️</span>
          </div>
          <p className="mt-1 font-display text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
            {c.totalSerras}
          </p>
          <span className="block text-[11px] text-muted">Cordilheiras e canga</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Comunidades
            </span>
            <span className="text-lg">🏹</span>
          </div>
          <p className="mt-1 font-display text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400">
            {c.totalComunidades}
          </p>
          <span className="block text-[11px] text-muted">Indígenas, quilombos e ribeirinhos</span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAINEL CLIENT COM AS SEIS QUALIDADES INTEGRADAS                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <main>
        <PainelAmeacasClient registrosIniciais={ameacas} />
      </main>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* NAVEGAÇÃO RELACIONADA DO OBSERVATÓRIO SOCIOAMBIENTAL               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <MeioAmbienteRelacionado />
    </div>
  );
}
