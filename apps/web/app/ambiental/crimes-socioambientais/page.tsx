import Link from "next/link";
import {
  carregarBibliotecaDesastres,
} from "@/lib/ambiental/biblioteca-desastres";
import TabelaDesastresClient from "./TabelaDesastresClient";
import PainelDialogo from "@/app/components/PainelDialogo";
import BotaoAlertaContextual from "@/app/components/BotaoAlertaContextual";

export const metadata = {
  title: "Biblioteca Unificada de Crimes Socioambientais — Mariana & Brumadinho | ONSA",
  description:
    "Acervo integrado de documentos periciais, termos de ajustamento de conduta (TAC), relatórios de saúde da Fiocruz e planos comunitários das bacias do Rio Doce e Paraopeba.",
};

export default function PaginaCrimesSocioambientais() {
  const { documentos, totais, total_documentos } = carregarBibliotecaDesastres();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* BREADCRUMB */}
      <nav aria-label="Navegação estrutural" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:underline">Início</Link>
        <span>/</span>
        <Link href="/ambiental" className="hover:underline">ONSA</Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Biblioteca de Crimes Socioambientais</span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            Bacia do Paraopeba (Brumadinho)
          </span>
          <span className="rounded-full bg-cyan-100 px-3 py-0.5 text-xs font-semibold text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300">
            Bacia do Rio Doce (Mariana)
          </span>
          <span className="rounded-full bg-surface-2 border border-border px-3 py-0.5 text-xs text-muted">
            MG · ES · BA · BR
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Biblioteca Unificada dos Crimes de Barragens
        </h1>
        <p className="mt-3 text-base text-muted sm:text-lg">
          O acervo oficial que fundamenta a luta por reparação integral: decisões judiciais, laudos
          epidemiológicos da Fiocruz, auditorias da FGV, termos de ajustamento de conduta e planos
          das Assessorias Técnicas Independentes (ATIs).
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <BotaoAlertaContextual
            tipo="resumo_pagina"
            titulo="Biblioteca Unificada dos Desastres de Barragens (Mariana e Brumadinho)"
            orgaoTerritorio="Minas Gerais, Espírito Santo e Bahia"
            identificador="ONSA / Controle Popular"
            link="https://controlepopular.com.br/ambiental/crimes-socioambientais"
            resumo={`${total_documentos} laudos periciais, termos de ajustamento e estudos de saúde das bacias do Paraopeba e Rio Doce.`}
            rotulo="Disparar Acervo Documental no WhatsApp"
          />
        </div>

        {/* EPÍGRAFE EDITORIAL */}
        <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-surface-2/60 p-4 text-sm italic text-muted">
          <p>
            &ldquo;Memória não prescreve. Documentar o que a perícia mediu e o que a justiça homologou é a única garantia de que o dano não seja apagado pelo tempo.&rdquo;
          </p>
          <p className="mt-1 text-xs not-italic font-medium text-foreground">
            — Diretriz Editorial ONSA (PLANO-BIBLIOTECA-CRIMES-SOCIOAMBIENTAIS.md)
          </p>
        </div>
      </header>

      {/* CARTÕES DE TOPO */}
      <section aria-label="Indicadores da biblioteca" className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Total Acervo</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">
            {total_documentos}
          </p>
          <p className="mt-1 text-[11px] text-muted">Laudos, TACs e estudos</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Brumadinho (MG)</p>
          <p className="mt-1 font-display text-2xl font-bold text-amber-600">
            {totais.brumadinho_paraopeba}
          </p>
          <p className="mt-1 text-[11px] text-muted">Bacia do Paraopeba</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Mariana (MG/ES/BA)</p>
          <p className="mt-1 font-display text-2xl font-bold text-cyan-700 dark:text-cyan-400">
            {totais.mariana_rio_doce}
          </p>
          <p className="mt-1 text-[11px] text-muted">Bacia do Rio Doce</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Territórios</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">
            3 Estados
          </p>
          <p className="mt-1 text-[11px] text-muted">MG, ES e Sul da Bahia</p>
        </div>
      </section>

      {/* TABELA CLIENTE COM BUSCA, FILTROS, GRÁFICO E CSV */}
      <section className="mb-10">
        <TabelaDesastresClient
          documentos={documentos}
          total_documentos={total_documentos}
          totais={totais}
        />
      </section>

      {/* DIÁLOGO ENTRE FRENTES */}
      <PainelDialogo
        origemRota="/ambiental/crimes-socioambientais"
        origemTitulo="Biblioteca de Crimes Socioambientais"
      />

      {/* BLOCO: E NOSSO POVO? */}
      <section className="mt-14 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
        <span className="text-[0.75rem] font-bold uppercase tracking-wider text-primary">
          Impacto Social &amp; Vida Real
        </span>
        <h2 className="mt-1 font-display text-[1.6rem] font-semibold tracking-tight text-text">
          E nosso povo?
        </h2>
        <p className="mt-3 text-[0.95rem] text-text-soft leading-relaxed max-w-3xl">
          As comunidades atingidas pelas barragens do Rio Doce e do Paraopeba vivem os impactos
          diretos dos desastres ambientais sobre a saúde, a renda, a moradia e a cultura.
        </p>
      </section>
    </div>
  );
}
