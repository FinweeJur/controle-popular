/**
 * @file apps/web/app/ambiental/conflitos-globais/page.tsx
 * @description Página do Observatório de Conflitos Socioambientais Globais do Controle Popular (ONSA).
 *
 * Papel no portal:
 * Publica o panorama de 55 casos emblemáticos de conflitos socioambientais mundiais,
 * correlacionando a extração predatória de recursos naturais (minério de ferro, ouro,
 * petróleo, lítio, bauxita, cobre, cobalto e agronegócio) com as violações sistemáticas
 * de direitos territoriais de povos originários, comunidades tradicionais e camponeses.
 *
 * Fontes oficiais mapeadas:
 * - EJAtlas (Atlas Global de Justiça Ambiental - ICTA/UAB)
 * - Global Witness (Relatórios oficiais de monitoramento de defensores da terra)
 * - Comissão Pastoral da Terra (CPT - Conflitos no Campo Brasil)
 * - Cortes Internacionais: Corte IDH, TJUE e Alta Corte de Justiça de Londres
 * - Relatorias de Direitos Humanos da ONU (ACNUDH e PNUMA)
 *
 * Decisões técnicas e conformidade:
 * - Cumpre a política de dados agregados nos cartões de topo via COBERTURA_CONFLITOS_GLOBAIS (AGENTS.md §5.1 e §8).
 * - Utiliza ResumoExpandivel abaixo do <h1> com tamanho mínimo >= text-sm (AGENTS.md §5.10).
 * - Integração cívica com PainelDialogo (Seu Nonô) e BotaoAlertaContextual.
 */

import Link from "next/link";
import {
  COBERTURA_CONFLITOS_GLOBAIS,
  obterConflitosGlobais,
  obterContinentesConflitos,
  obterPaisesConflitos,
  obterCommoditiesConflitos,
} from "@/lib/ambiente/dados-conflitos-globais";
import PainelConflitosGlobaisClient from "./PainelConflitosGlobaisClient";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import PainelDialogo from "@/app/components/PainelDialogo";
import BotaoAlertaContextual from "@/app/components/BotaoAlertaContextual";
import MeioAmbienteRelacionado from "@/app/components/MeioAmbienteRelacionado";
import { Globe2, ShieldAlert, Award, Compass } from "lucide-react";

export const metadata = {
  title: "Conflitos Socioambientais Globais — Atlas de Justiça e Litígios | ONSA",
  description:
    "Monitoramento de 55 casos emblemáticos de conflitos ecológicos globais nas Américas, África, Ásia, Europa e Oceania: mineração, petróleo, lítio, agronegócio e defesa de povos originários a partir do EJAtlas e cortes internacionais.",
};

export default function PaginaConflitosGlobais() {
  const conflitos = obterConflitosGlobais();
  const continentes = obterContinentesConflitos();
  const paises = obterPaisesConflitos();
  const commodities = obterCommoditiesConflitos();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Navegação Estrutural (Breadcrumb) */}
      <nav aria-label="Navegação estrutural" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:underline">
          Início
        </Link>
        <span>/</span>
        <Link href="/ambiental" className="hover:underline">
          ONSA
        </Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Conflitos Socioambientais Globais</span>
      </nav>

      {/* Cabeçalho da Página */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Atlas Global de Justiça Ambiental
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            Litígios Transnacionais
          </span>
          <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            Povos Originários &amp; Territórios
          </span>
          <span className="rounded-full bg-surface-2 border border-border px-3 py-0.5 text-xs text-muted">
            Américas · África · Ásia · Europa · Oceania
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
          Conflitos Socioambientais Globais
        </h1>

        {/* Resumo da Página com piso text-sm e controle expansível (Regra §5.10) */}
        <div className="mt-3 text-text-soft">
          <ResumoExpandivel
            texto="Acervo auditado e georreferenciado de casos emblemáticos de injustiça socioambiental e litígios transnacionais no mundo. De Mariana e Brumadinho no Brasil ao envenenamento petrolífero da Chevron no Equador e da Shell na Nigéria, passando pela resistência Sioux em Standing Rock e da etnia Dongria Kondh na Índia: documentos oficiais, dados de empresas rés, commodities envolvidas e o estado atual da mobilização jurídica e popular."
            className="text-base sm:text-lg text-muted"
          />
        </div>

        {/* Botão de Disparo / Alerta Contextual */}
        <div className="mt-4 flex flex-wrap gap-2">
          <BotaoAlertaContextual
            tipo="resumo_pagina"
            titulo="Conflitos Socioambientais Globais"
            orgaoTerritorio="Mundial / ONSA"
            identificador="ONSA / Controle Popular"
            link="https://controlepopular.com.br/ambiental/conflitos-globais"
            resumo={`${COBERTURA_CONFLITOS_GLOBAIS.totalConflitos} conflitos mapeados em ${COBERTURA_CONFLITOS_GLOBAIS.totalPaises} países a partir do EJAtlas, Global Witness e tribunais internacionais.`}
            rotulo="Disparar Dados de Conflitos no WhatsApp"
          />
        </div>
      </header>

      {/* Cartões de Topo com Agregados Medidos e Datados (Regra §8) */}
      <section
        aria-label="Indicadores gerais dos conflitos globais"
        className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
            <Globe2 className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Total de Casos</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">
            {COBERTURA_CONFLITOS_GLOBAIS.totalConflitos}
          </p>
          <p className="mt-1 text-xs text-muted">Auditados e geolocalizados</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
            <Compass className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span>Países Atingidos</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {COBERTURA_CONFLITOS_GLOBAIS.totalPaises}
          </p>
          <p className="mt-1 text-xs text-muted">Em 5 continentes</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
            <ShieldAlert className="h-4 w-4 text-amber-600" aria-hidden="true" />
            <span>Matérias-Primas</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold text-amber-600 dark:text-amber-400">
            {COBERTURA_CONFLITOS_GLOBAIS.principaisCommodities.length}+
          </p>
          <p className="mt-1 text-xs text-muted">Minérios, óleo, lítio e grãos</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
            <Award className="h-4 w-4 text-indigo-600" aria-hidden="true" />
            <span>Fontes Oficiais</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            100%
          </p>
          <p className="mt-1 text-xs text-muted">EJAtlas, Cortes e ONU</p>
        </div>
      </section>

      {/* Painel Interativo de Busca, Filtros, Gráficos e Exportação CSV */}
      <section className="mb-10">
        <PainelConflitosGlobaisClient
          conflitosIniciais={conflitos}
          continentes={continentes}
          paises={paises}
          commodities={commodities}
        />
      </section>

      {/* Assistente Cívico Seu Nonô / Alceu Dispor */}
      <section className="mb-12">
        <PainelDialogo
          origemRota="/ambiental/conflitos-globais"
          origemTitulo="Conflitos Socioambientais Globais"
        />
      </section>

      {/* Seção Editorial de Contexto: Impacto Social & Vida Real */}
      <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-sm mb-12">
        <span className="text-[0.75rem] font-bold uppercase tracking-wider text-primary">
          Impacto Social &amp; Vida Real
        </span>
        <h2 className="mt-1 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          Por que mapear o sofrimento socioambiental transnacional?
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed max-w-4xl">
          As mesmas corporações transnacionais que operam no Quadrilátero Ferrífero de Minas Gerais
          ou no Arco do Desmatamento da Amazônia repetem práticas idênticas de despossessão,
          contaminação de bacias hidrográficas e cooptação institucional na África, na Ásia e no
          sul global. Mapear esses casos fornece ferramentas jurídicas para os atingidos brasileiros
          (como nas ações da tragédia de Mariana julgadas na Alta Corte de Londres e da Braskem em
          Roterdã) e fortalece redes mundiais de solidariedade aos defensores da vida e da água.
        </p>
      </section>

      {/* Links Relacionados do Meio Ambiente */}
      <MeioAmbienteRelacionado />
    </div>
  );
}
