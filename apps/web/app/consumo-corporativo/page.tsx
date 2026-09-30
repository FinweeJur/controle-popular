/**
 * @file apps/web/app/consumo-corporativo/page.tsx
 * @description Página de servidor para o painel de Maiores Consumidores Corporativos
 * de Água, Energia, Combustível, Empregos e Capital (Minas Gerais + 20 países do G20).
 *
 * Papel no portal:
 * Exibe os cartões de topo medidos (COBERTURA_CONSUMIDORES_RECURSOS) e carrega
 * o painel interativo cliente sem serializar coleções pesadas via RSC flight.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  Droplets,
  Zap,
  Scale,
  Globe,
  Factory,
  Users,
} from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";
import { COBERTURA_CONSUMIDORES_RECURSOS } from "@/lib/recursos/dados-consumidores";
import PainelConsumoCorporativoClient from "./PainelConsumoCorporativoClient";

export const metadata: Metadata = {
  title:
    "Maiores Consumidores de Água, Energia, Combustível, Empregos e Capital (MG e G20) — Controle Popular",
  description:
    "Ranking auditável dos 50 maiores consumidores corporativos de água, energia elétrica, combustível, empregos formais e capital em Minas Gerais e nos 20 países do G20, com gráficos Donut, pegada hídrica e comparativo de tarifas empresa vs. cidadão.",
};

export default function ConsumoCorporativoPage() {
  const cob = COBERTURA_CONSUMIDORES_RECURSOS;

  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-6xl px-4 py-10 sm:py-14 sm:px-6 lg:px-8 space-y-10"
    >
      {/* Trilha de Navegação */}
      <nav aria-label="Trilha de navegação" className="text-xs text-muted">
        <Link href="/" className="hover:text-primary transition">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/internacional" className="hover:text-primary transition">
          Internacional & G20
        </Link>{" "}
        ·{" "}
        <span className="text-foreground font-semibold">
          Maiores Consumidores de Água, Energia, Combustível e Empregos
        </span>
      </nav>

      {/* Cabeçalho e Resumo da Página (Fonte mínima text-sm — Regra §5.10 AGENTS.md) */}
      <header className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Factory size={14} />
            <span>Top {cob.totalEmpresasMg} Minas Gerais</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-700 dark:text-sky-300">
            <Globe size={14} />
            <span>{cob.totalPaisesG20} Economias do G20</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
            <Scale size={14} />
            <span>Assimetria Tarifária: Empresa vs. Cidadão</span>
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Maiores Consumidores de Água, Energia, Combustível, Empregos e Capital
          </h1>
          <p className="text-sm sm:text-base text-muted leading-relaxed max-w-4xl">
            Sistematização pública das 50 maiores operações corporativas em Minas Gerais
            e do consumo setorial e empresarial nos 20 países do G20. Compare quanto as
            grandes mineradoras, siderúrgicas, refinarias e agroindústrias consomem em
            proporção à população, quantos empregos geram por litro de água e quanto
            pagam na tarifa bruta frente à conta residencial do cidadão.
          </p>
        </div>

        {/* 4 Cartões de Topo Medidos e Datados (Qualidade 4 — AGENTS.md §8) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-border/70">
          <div className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-sky-600 dark:text-sky-400">
              <span>💧 Água Outorgada Top 50 MG</span>
              <Droplets size={15} />
            </div>
            <div className="font-mono text-xl font-extrabold text-foreground">
              {(cob.somaAguaTop50MgM3Ano / 1_000_000_000).toLocaleString("pt-BR", {
                maximumFractionDigits: 2,
              })}{" "}
              bi m³/ano
            </div>
            <p className="text-xs text-muted">
              Equivale ao abastecimento de{" "}
              <strong className="text-foreground">
                {(cob.equivalenciaHumanaAguaTop50Mg / 1_000_000).toLocaleString("pt-BR", {
                  maximumFractionDigits: 1,
                })}{" "}
                milhões de habitantes
              </strong>{" "}
              ({cob.percentualAguaEstadoTop50}% de MG).
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-amber-600 dark:text-amber-400">
              <span>⚡ Carga Elétrica Top 50 MG</span>
              <Zap size={15} />
            </div>
            <div className="font-mono text-xl font-extrabold text-foreground">
              {(cob.somaEnergiaTop50MgMwhAno / 1_000_000).toLocaleString("pt-BR", {
                maximumFractionDigits: 1,
              })}{" "}
              TWh/ano
            </div>
            <p className="text-xs text-muted">
              Consumo equivalente a{" "}
              <strong className="text-foreground">
                {(cob.equivalenciaResidenciasEnergiaTop50Mg / 1_000_000).toLocaleString(
                  "pt-BR",
                  { maximumFractionDigits: 1 }
                )}{" "}
                milhões de residências
              </strong>{" "}
              ({cob.percentualEnergiaEstadoTop50}% de MG).
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-rose-600 dark:text-rose-400">
              <span>⚖️ Desigualdade Tarifária</span>
              <Scale size={15} />
            </div>
            <div className="font-mono text-xl font-extrabold text-foreground">
              {cob.fatorAssimetriaAguaMedioMg}× na Água · {cob.fatorAssimetriaEnergiaMedioMg}× na Luz
            </div>
            <p className="text-xs text-muted">
              O morador paga ~R$ 8,90/m³ (COPASA) e R$ 0,96/kWh (CEMIG) contra ~R$ 0,028/m³
              e R$ 0,21/kWh das megacargas.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
              <span>👥 Empregos & Escopo G20</span>
              <Users size={15} />
            </div>
            <div className="font-mono text-xl font-extrabold text-foreground">
              {cob.somaEmpregosTop50Mg.toLocaleString("pt-BR")} vagas diretas
            </div>
            <p className="text-xs text-muted">
              Apenas {cob.percentualEmpregosEstadoTop50}% dos empregos formais de MG,
              cruzados com {cob.totalPaisesG20} países do G20 ({cob.dataMedicao}).
            </p>
          </div>
        </div>
      </header>

      {/* Painel Cliente Interativo */}
      <PainelConsumoCorporativoClient />

      <FooterGlobal />
    </main>
  );
}
