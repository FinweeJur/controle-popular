import Link from "next/link";
import {
  listarOrgaosInspecionados,
  obterEstatisticasJudiciario,
  obterDadosDefensoriaMG,
} from "@/lib/judiciario/inspecoes-defensoria";
import TabelaInspecoesClient from "./TabelaInspecoesClient";
import PainelDialogo from "@/app/components/PainelDialogo";
import BotaoAlertaContextual from "@/app/components/BotaoAlertaContextual";
import { Scale, Building, ShieldAlert, FileText } from "lucide-react";

export const metadata = {
  title: "Inspeções do CNJ e Cobertura da Defensoria Pública | Judiciário",
  description:
    "Transparência estrutural do sistema de justiça: 343 relatórios de inspeção da Corregedoria Nacional do CNJ sobre 33 tribunais e déficit de comarcas da Defensoria Pública.",
};

export default function PaginaInspecoesJudiciario() {
  const orgaos = listarOrgaosInspecionados();
  const totais = obterEstatisticasJudiciario();
  const defensoria = obterDadosDefensoriaMG();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* BREADCRUMB */}
      <nav aria-label="Navegação estrutural" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:underline">Início</Link>
        <span>/</span>
        <Link href="/judiciario" className="hover:underline">Judiciário</Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Inspeções do CNJ & Defensoria</span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
            Corregedoria Nacional (CNJ)
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Defensoria Pública (DPMG)
          </span>
          <span className="rounded-full bg-surface-2 border border-border px-3 py-0.5 text-xs text-muted">
            343 Relatórios Oficiais
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Transparência da Justiça Além do Dinheiro
        </h1>
        <p className="mt-3 text-base text-muted sm:text-lg">
          O que acontece dentro dos tribunais quando o CNJ fiscaliza: pautas de audiência
          atrasadas, prisões em flagrante sem audiência de custódia no prazo e o déficit de 59%
          das comarcas mineiras sem atendimento da Defensoria Pública.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <BotaoAlertaContextual
            tipo="resumo_pagina"
            titulo="Painel de Transparência da Justiça: Inspeções do CNJ e Déficit da Defensoria"
            orgaoTerritorio="Brasil / Minas Gerais"
            identificador="Corregedoria Nacional (CNJ) e DPMG"
            link="https://controlepopular.com.br/judiciario/inspecoes"
            resumo="343 relatórios de inspeção do CNJ sobre 33 tribunais e dados de 178 comarcas desassistidas pela Defensoria Pública em MG."
            rotulo="Disparar Dados da Justiça no WhatsApp"
          />
        </div>

        {/* EPÍGRAFE EDITORIAL */}
        <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-surface-2/60 p-4 text-sm italic text-muted">
          <p>
            &ldquo;Saber quem ocupa a cadeira do tribunal é importante; saber se o tribunal funciona para quem não tem dinheiro para pagar advogado particular é o que decide a justiça real.&rdquo;
          </p>
          <p className="mt-1 text-xs not-italic font-medium text-foreground">
            — Diretriz de Transparência Institucional (PLANO-TRANSPARENCIA-JUSTICA.md)
          </p>
        </div>
      </header>

      {/* CARTÕES DE TOPO */}
      <section aria-label="Indicadores estruturais do judiciário" className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Relatórios CNJ</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">
            {totais.total_relatorios_cnj}
          </p>
          <p className="mt-1 text-[11px] text-muted">2008 a 2026</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Órgãos Inspecionados</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">
            {totais.orgaos_correcionados}
          </p>
          <p className="mt-1 text-[11px] text-muted">27 TJs + TRFs + TRTs</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Déficit Defensoria MG</p>
          <p className="mt-1 font-display text-2xl font-bold text-rose-600 dark:text-rose-400">
            {totais.deficit_comarcas_mg_percentual}%
          </p>
          <p className="mt-1 text-[11px] text-muted">178 de 298 comarcas</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Achados TJMG 2026</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">
            {totais.achados_substantivos_tjmg_2026}
          </p>
          <p className="mt-1 text-[11px] text-muted">100 unidades analisadas</p>
        </div>
      </section>

      {/* TABELA CLIENTE COM FILTROS, GRÁFICO E CSV */}
      <section className="mb-10">
        <TabelaInspecoesClient
          orgaos={orgaos}
          evolucaoDefensoria={defensoria.evolucao_historica}
          comarcasDesassistidas={defensoria.comarcas_desassistidas_destaque}
        />
      </section>

      {/* SANFONA DE DIÁLOGO */}
      <section className="mb-8">
        <PainelDialogo
          titulo="Dúvidas sobre as Inspeções do CNJ e Defensoria"
          perguntas={[
            {
              id: "o-que-e-inspecao-cnj",
              pergunta: "O que é uma inspeção da Corregedoria Nacional de Justiça?",
              resposta:
                "É a fiscalização presencial realizada por ministros e juízes auxiliares do CNJ em todos os tribunais do país. Eles examinam prazos processuais, funcionamento das prisões, metas de julgamento e eventuais irregularidades disciplinares ou administrativas.",
            },
            {
              id: "por-que-deficit-defensoria",
              pergunta: "Por que a maioria das comarcas de MG não tem Defensoria Pública?",
              resposta:
                "Minas Gerais possui 298 comarcas judiciais, mas apenas 120 contam com atendimento fixo da Defensoria Pública do Estado. O ritmo histórico de expansão foi de 15 novas comarcas em 12 anos (2013–2025), o que deixa mais de 170 cidades do interior sem assistência jurídica integral gratuita.",
            },
          ]}
        />
      </section>
    </div>
  );
}
