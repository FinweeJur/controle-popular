/**
 * @file apps/web/app/europa/page.tsx
 * @description Hub Europa e Conexões Transnacionais do Controle Popular (/europa).
 *
 * Papel no portal:
 * Centraliza e conecta os dados oficiais de responsabilização civil, litígios extraterritoriais,
 * devida diligência na cadeia de suprimentos e concessões públicas de corporações europeias no Brasil:
 * 1. REINO UNIDO: Julgamento de Mariana contra a BHP no High Court de Londres (£36 bi) e precedentes Vedanta e Okpabi.
 * 2. ALEMANHA: Lei de Devida Diligência (LkSG) no BAFA (soja, café, aço) e multinacionais BASF, Bayer, Thyssenkrupp.
 * 3. FRANÇA: Lei do Dever de Vigilância contra Casino (carne/desmatamento), BNP Paribas, TotalEnergies e Aperam no Jequitinhonha.
 * 4. HOLANDA: Tribunal de Roterdã no afundamento de Maceió pela Braskem e Rio Doce Claims; Porto de Roterdã e EUDR.
 * 5. ITÁLIA: Concessões de distribuição elétrica Enel SP e RJ, parques eólicos Enel Green Power e TIM Brasil.
 * 6. ESPANHA: Santander Brasil (financiamento agro), Telefónica/Vivo, Neoenergia/Iberdrola (Belo Monte) e Latibex.
 * 7. PORTUGAL: Concessões EDP Brasil, Galp no pré-sal de Santos e acordos de cooperação judiciária DCIAP/MPF.
 * 8. UNIÃO EUROPEIA: Regulamento Antidesmatamento (EUDR) e Diretiva de Devida Diligência Corporativa (CSDDD).
 *
 * Padrão das Seis Qualidades (AGENTS.md §8):
 * Links diretos para tribunais e órgãos, busca sem acento, ordenação bidirecional, cartões medidos,
 * assistente cívico Seu Nonô em frases de até 13 palavras e exportação CSV com BOM UTF-8.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  COBERTURA_EUROPA,
  obterDadosEuropa,
} from "@/lib/internacional/dados-europa";
import PainelEuropa from "./PainelEuropa";
import FooterGlobal from "@/app/components/FooterGlobal";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Europa & Conexões Transnacionais: Litígios, Devida Diligência & Concessões | Controle Popular",
  description:
    "Acervo de litígios internacionais e concessões europeias no Brasil: BHP Mariana no High Court de Londres (£36 bi), Braskem no Tribunal de Roterdã, BAFA LkSG na Alemanha, EUDR e multinacionais (Enel, Santander, EDP, Aperam).",
};

export default function PaginaHubEuropa() {
  const dados = obterDadosEuropa();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* NAVEGAÇÃO BREADCRUMB */}
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-xs text-text-soft"
      >
        <Link href="/" className="hover:underline hover:text-primary">
          Início
        </Link>
        <span>/</span>
        <Link href="/internacional" className="hover:underline hover:text-primary">
          Internacional
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">Europa & Transnacional (/europa)</span>
      </nav>

      {/* CABEÇALHO DO HUB EUROPA */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            🇪🇺 Hub Europa & Transnacional
          </span>
          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            🇬🇧 High Court Londres (£36 bi BHP)
          </span>
          <span className="rounded-full bg-red-500/10 border border-red-500/20 px-3 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
            🇳🇱 Rechtbank Rotterdam (Braskem & Samarco)
          </span>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            🇩🇪 BAFA Alemanha (LkSG Due Diligence)
          </span>
          <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
            🇫🇷 Devoir de Vigilance (Casino & Paris)
          </span>
          <span className="rounded-full bg-sky-500/10 border border-sky-500/20 px-3 py-0.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
            Regulamento UE Antidesmatamento (EUDR)
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Europa e Conexões Transnacionais com o Brasil
        </h1>
        <p className="mt-3 max-w-4xl text-base text-text-soft sm:text-lg leading-relaxed">
          Audite litígios de responsabilidade extraterritorial em cortes estrangeiras, regras de devida
          diligência em cadeias globais de suprimentos e concessões públicas essenciais operadas por gigantes
          europeias em território brasileiro.
        </p>
      </header>

      {/* LINKS DE ATALHO PARA OUTRAS ROTAS INTERNACIONAIS */}
      <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        <Link
          href="/internacional"
          className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface hover:border-primary/50 transition-colors group"
        >
          <div>
            <div className="text-xs font-bold text-text group-hover:text-primary">🌐 Hub Multilateral</div>
            <div className="text-[11px] text-text-soft">ONU, UNESCO, OMS, OMC e G20</div>
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
          href="/internacional/inteligencia"
          className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface hover:border-primary/50 transition-colors group"
        >
          <div>
            <div className="text-xs font-bold text-text group-hover:text-primary">🕵️ Central de Inteligência</div>
            <div className="text-[11px] text-text-soft">G20, Europa e Twelve Eyes</div>
          </div>
          <ArrowRight size={14} className="text-text-soft group-hover:text-primary" />
        </Link>
      </section>

      {/* PAINEL INTERATIVO COMPLETO DAS 6 QUALIDADES */}
      <main id="conteudo-principal">
        <PainelEuropa
          dadosIniciais={dados}
          coberturaEstatica={COBERTURA_EUROPA}
        />
      </main>

      {/* RODA PÉ GLOBAL */}
      <div className="mt-16">
        <FooterGlobal />
      </div>
    </div>
  );
}
