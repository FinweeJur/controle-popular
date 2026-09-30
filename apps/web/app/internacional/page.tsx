/**
 * @file apps/web/app/internacional/page.tsx
 * @description Hub Multilateral e Internacional do Controle Popular.
 *
 * Papel no portal:
 * Centraliza a comparabilidade cívica internacional do Brasil com potências do G8 e G20,
 * cruzando dados das grandes agências multilaterais (ONU/PNUD, UNESCO, OMS, OMC):
 * 1. Indicadores Sociais: IDH, Desigualdade de Renda (Gini), Gênero, Saúde e Educação.
 * 2. Comércio Internacional: Minério de ferro, lítio, bauxita, nióbio e petróleo bruto.
 * 3. Terra e Povos Originários: Reservas indígenas e salvaguardas socioambientais.
 *
 * Regras e decisões:
 * - Regra das Seis Qualidades (AGENTS.md §8): links diretos, filtros, ordenação e exportação CSV.
 * - BarraIdiomaTrilingue com suporte a Português, Inglês e Espanhol + sintetizador de voz (TTS).
 * - Totalmente responsivo para celulares (smartphones <= 640px) e adaptado aos 4 temas oficiais.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  COBERTURA_MULTILATERAL,
  obterIndicadoresSociais,
  obterComercioCommodities,
  obterTerritoriosGlobais,
} from "@/lib/internacional/dados-multilaterais";
import PainelMultilateral from "./PainelMultilateral";
import FooterGlobal from "@/app/components/FooterGlobal";
import { Globe, Users, ShieldAlert, Compass, ExternalLink, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Transparência Multilateral & Internacional: ONU, UNESCO, OMS, OMC, G8 e G20 | Controle Popular",
  description:
    "Portal cívico internacional comparando o Brasil com potências do G8 e G20: IDH e Gini da ONU/Banco Mundial, gastos em educação e saúde, comércio de minérios e direitos indígenas.",
};

export default function PaginaHubInternacional() {
  const indicadores = obterIndicadoresSociais();
  const comercio = obterComercioCommodities();
  const territorios = obterTerritoriosGlobais();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* BREADCRUMB */}
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-xs text-text-soft"
      >
        <Link href="/" className="hover:underline hover:text-primary">
          Início
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">Internacional & Multilateral</span>
      </nav>

      {/* CABEÇALHO DO HUB */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-semibold text-primary">
            🌐 Hub Multilateral
          </span>
          <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            ONU • PNUD • UNESCO
          </span>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            OMS • Saúde & Ambiente
          </span>
          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            OMC • Comércio de Minérios
          </span>
          <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
            G8 & G20 Transnacional
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Transparência Multilateral e o Brasil no Cenário Global
        </h1>
        <p className="mt-3 max-w-4xl text-base text-text-soft sm:text-lg">
          Audite como o Brasil se compara às maiores economias do planeta em desenvolvimento humano,
          desigualdade de renda, gastos em saúde e educação, rotas de minérios e direitos territoriais.
        </p>
      </header>

      {/* CARTÕES DE TOPO COM AGREGADOS MEDIDOS */}
      <section
        aria-label="Indicadores agregados de topo"
        className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Users size={14} className="text-primary" />
            <span>Países no Radar</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {COBERTURA_MULTILATERAL.totalPaisesMapeados} Nações
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Brasil + G8 e potências do G20.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Globe size={14} className="text-sky-600 dark:text-sky-400" />
            <span>Minérios Exportados</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {(COBERTURA_MULTILATERAL.volumeTotalMineraisToneladas / 1000000).toFixed(0)} Mi t/ano
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Ferro, Lítio, Bauxita e Nióbio.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Compass size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Territórios Originários</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {(COBERTURA_MULTILATERAL.areaTotalTerritoriosHectares / 1000000).toFixed(1)} Mi ha
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Funai (BR), BIA (EUA) e CIRNAC (CA).
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <ShieldAlert size={14} className="text-amber-600 dark:text-amber-400" />
            <span>Sobreposição Minerária</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {COBERTURA_MULTILATERAL.concessoesSobrepostasTotal} Títulos
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Processos em áreas sensíveis.
          </div>
        </div>
      </section>

      {/* LINKS DE ATALHO PARA HUBS ESPECÍFICOS */}
      <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        <Link
          href="/internacional/operacoes-militares"
          className="flex items-center justify-between p-3.5 rounded-xl border border-red-500/40 bg-red-500/10 hover:border-red-500 transition-colors group"
        >
          <div>
            <div className="text-xs font-bold text-text group-hover:text-primary">⚔️ Operações Militares & PMCs</div>
            <div className="text-[11px] text-text-soft">Intervenções, Golpes, Mercenários e Contratos</div>
          </div>
          <ArrowRight size={14} className="text-text-soft group-hover:text-primary" />
        </Link>
        <Link
          href="/internacional/desclassificados"
          className="flex items-center justify-between p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary transition-colors group"
        >
          <div>
            <div className="text-xs font-bold text-text group-hover:text-primary">🕵️ Arquivos Desclassificados</div>
            <div className="text-[11px] text-text-soft">Inteligência do G20 (CIA, FBI, SNI, MI5)</div>
          </div>
          <ArrowRight size={14} className="text-text-soft group-hover:text-primary" />
        </Link>
        <Link
          href="/consumo-corporativo"
          className="flex items-center justify-between p-3.5 rounded-xl border border-sky-500/40 bg-sky-500/10 hover:border-sky-500 transition-colors group"
        >
          <div>
            <div className="text-xs font-bold text-text group-hover:text-primary">💧⚡ Maiores Consumidores</div>
            <div className="text-[11px] text-text-soft">Top 50 MG e 20 países do G20 (Água/Luz)</div>
          </div>
          <ArrowRight size={14} className="text-text-soft group-hover:text-primary" />
        </Link>
        <Link
          href="/europa"
          className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface hover:border-primary/50 transition-colors group"
        >
          <div>
            <div className="text-xs font-bold text-text group-hover:text-primary">🇪🇺 Hub Europa</div>
            <div className="text-[11px] text-text-soft">Litígios BHP Mariana, Roterdã e BAFA</div>
          </div>
          <ArrowRight size={14} className="text-text-soft group-hover:text-primary" />
        </Link>
        <Link
          href="/canada"
          className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface hover:border-primary/50 transition-colors group"
        >
          <div>
            <div className="text-xs font-bold text-text group-hover:text-primary">🇨🇦 Hub Canadá</div>
            <div className="text-[11px] text-text-soft">12 mineradoras na Bolsa de Toronto TSX</div>
          </div>
          <ArrowRight size={14} className="text-text-soft group-hover:text-primary" />
        </Link>
        <Link
          href="/eua"
          className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface hover:border-primary/50 transition-colors group"
        >
          <div>
            <div className="text-xs font-bold text-text group-hover:text-primary">🇺🇸 Hub Estados Unidos</div>
            <div className="text-[11px] text-text-soft">SEC EDGAR, fundos e barragens do NID</div>
          </div>
          <ArrowRight size={14} className="text-text-soft group-hover:text-primary" />
        </Link>
        <Link
          href="/internacional/operacoes-militares/mapa"
          className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface hover:border-primary/50 transition-colors group"
        >
          <div>
            <div className="text-xs font-bold text-text group-hover:text-primary">🗺️ Mapa Mundial de Defesa</div>
            <div className="text-[11px] text-text-soft">Geolocalização de conflitos e bases</div>
          </div>
          <ArrowRight size={14} className="text-text-soft group-hover:text-primary" />
        </Link>
        <Link
          href="/laboratorio"
          className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface hover:border-primary/50 transition-colors group"
        >
          <div>
            <div className="text-xs font-bold text-text group-hover:text-primary">🔬 Laboratório de Dados</div>
            <div className="text-[11px] text-text-soft">Caderno Seu Nonô e gráficos interativos</div>
          </div>
          <ArrowRight size={14} className="text-text-soft group-hover:text-primary" />
        </Link>
      </section>

      {/* PAINEL MULTILATERAL INTERATIVO COM AS SEIS QUALIDADES */}
      <main id="conteudo-principal">
        <PainelMultilateral
          indicadores={indicadores}
          comercio={comercio}
          territorios={territorios}
        />
      </main>

      {/* RODA PÉ GLOBAL */}
      <div className="mt-16">
        <FooterGlobal />
      </div>
    </div>
  );
}
