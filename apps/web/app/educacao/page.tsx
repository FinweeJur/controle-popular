import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Sparkles,
  Building2,
  CheckCircle,
  Clock,
  ShieldCheck,
  FileText
} from "lucide-react";
import PainelEducacaoPeriodicos from "./PainelEducacaoPeriodicos";
import dadosEducacao from "@/data/educacao-periodicos.json";

/**
 * /educacao — Oportunidades de Publicação Acadêmica e Educação Superior Cívica
 *
 * Papel no portal:
 *   Democratizar o acesso à publicação acadêmica de qualidade, reunindo periódicos
 *   de submissão contínua (fluxo aberto) e revistas com chamadas cíclicas confirmadas
 *   (anuais, semestrais e quadrimestrais) de universidades públicas, institutos
 *   de pesquisa e órgãos governamentais do Brasil e de 141 países do mundo.
 *
 * As Oito Qualidades da Informação atendidas (QUALIDADES-DA-INFORMACAO.md):
 *   1. Linkável e Verificado à Fonte Oficial Direta (submissão e homepage oficial).
 *   2. Buscável e Filtrável (tempo real, tolerante a acentos e facetas reais).
 *   3. Classificável e Ordenável por Coluna (título, tempo de avaliação, país).
 *   4. Resumo e Cartões de Topo (números medidos derivados dos dados).
 *   5. Chatbot com Contexto Cívico (integração nativa com o Seu Nonô).
 *   6. Exportável Multi-formato (CSV com BOM UTF-8 e ponto-e-vírgula + @media print).
 *   7. Responsiva (390 px para celulares até 4K, sem rolagem lateral falsa).
 *   8. Rastreável no Tempo (data visível e derivada do arquivo gerado pelo coletor).
 */

export const metadata: Metadata = {
  title: "Educação Superior e Oportunidades de Publicação Acadêmica — Controle Popular",
  description:
    "Guia e catálogo completo de periódicos abertos de fluxo contínuo e chamadas cíclicas confirmadas (anuais, semestrais e trimestrais) de universidades públicas, institutos de pesquisa e órgãos de governo.",
};

const fmt = (n: number) => n.toLocaleString("pt-BR");

export default function PaginaEducacao() {
  const { metricas, amostra_educacao, atualizado_em } = dadosEducacao;
  const dataFormatada = atualizado_em.split("-").reverse().join("/");

  return (
    <main
      id="conteudo-principal"
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"
    >
      {/* Navegação estrutural */}
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-xs text-muted"
      >
        <Link href="/" className="hover:text-primary hover:underline">
          Início
        </Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Educação & Pesquisa</span>
      </nav>

      {/* Cabeçalho principal com rastreabilidade temporal (Qualidade 8) */}
      <header className="border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-2 text-xs text-primary font-semibold uppercase tracking-wider">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5" />
            Educação Aberta & Ciência Cívica
          </span>
          <span className="text-muted">•</span>
          <time dateTime={atualizado_em} className="text-muted">
            Dados verificados em {dataFormatada}
          </time>
        </div>

        <h1 className="mt-3 font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Oportunidades de Publicação Científica e Educação Superior
        </h1>

        <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed max-w-4xl">
          Catálogo auditado para pesquisadores, estudantes e cidadãos encontrarem onde
          publicar artigos acadêmicos sem cobrança de taxas. Reúne periódicos de <strong>submissão contínua</strong>
          (fluxo aberto o ano todo) e <strong>revistas cíclicas confirmadas</strong> (anuais, semestrais e trimestrais)
          de centros acadêmicos, institutos de pesquisa e órgãos governamentais de <strong>{fmt(metricas.total_paises)} países</strong>.
        </p>
      </header>

      {/* Cartões de Topo e Agregados Medidos (Qualidade 4) */}
      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase">
            <BookOpen className="w-4 h-4" />
            Total no Catálogo
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {fmt(metricas.total_periodicos)}
          </div>
          <p className="mt-1 text-xs text-muted">Revistas científicas auditadas</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase">
            <Sparkles className="w-4 h-4" />
            100% Gratuitas
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {metricas.porcentagem_diamond}%
          </div>
          <p className="mt-1 text-xs text-muted">{fmt(metricas.gratuitos_diamond)} títulos sem APC (Diamante)</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase">
            <Clock className="w-4 h-4" />
            Fluxo Contínuo
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {fmt(metricas.total_fluxo_continuo)}
          </div>
          <p className="mt-1 text-xs text-muted">Submissão aberta 365 dias/ano</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-semibold uppercase">
            <Calendar className="w-4 h-4" />
            Cíclicos Confirmados
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {fmt(metricas.total_ciclicos_confirmados)}
          </div>
          <p className="mt-1 text-xs text-muted">Edições regulares semestrais/anuais</p>
        </div>
      </section>

      {/* Explicação Didática: Como Escolher Onde Publicar */}
      <section className="mt-8 rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          Guia Cívico de Publicação Acadêmica: Contínuo vs Cíclico
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3 text-xs sm:text-sm text-muted leading-relaxed">
          <div className="p-4 rounded-2xl bg-surface-soft border border-border">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <span>⚡</span> Submissão Contínua (Fluxo Contínuo)
            </h3>
            <p className="mt-2">
              A revista não fecha prazos. Os autores submetem em qualquer época do ano e o artigo
              aprovado é publicado no ato, com paginação eletrônica única (e-location) e DOI próprio.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-soft border border-border">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <span>📅</span> Revistas Cíclicas Confirmadas
            </h3>
            <p className="mt-2">
              Revistas com fascículos periódicos previsíveis (semestrais, quadrimestrais ou anuais).
              São muito comuns em ciências humanas, sociais aplicadas e escolas de governo.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-soft border border-border">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <span>💎</span> Acesso Aberto Diamante (Sem APC)
            </h3>
            <p className="mt-2">
              Não cobra nada do autor para submeter e nada do leitor para ler. Mantidas por
              universidades públicas, institutos estatais de pesquisa e sociedades científicas sérias.
            </p>
          </div>
        </div>

        {/* Distribuição por periodicidade no acervo */}
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="font-bold text-foreground text-sm mb-3">
            Periodicidades Confirmadas no Diretório:
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {metricas.por_periodicidade.slice(0, 4).map((item) => {
              const per = String(item[0]);
              const qtd = Number(item[1]);
              return (
                <div key={per} className="p-3 rounded-xl bg-surface-soft border border-border flex flex-col justify-between">
                  <span className="font-semibold text-foreground">{per}</span>
                  <span className="text-primary font-bold text-sm mt-1">{fmt(qtd)} títulos</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Painel Interativo de Busca, Filtro, Ordenação e Exportação (Qualidades 1, 2, 3, 5, 6, 7) */}
      <PainelEducacaoPeriodicos
        amostra={amostra_educacao}
        atualizadoEm={atualizado_em}
      />

      {/* Rodapé institucional com link para os dados brutos */}
      <section className="mt-8 rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Soberania do Dado e Download Aberto
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted max-w-2xl">
              A base completa com mais de 23.500 títulos em SQLite (com FTS5) e CSV está disponível
              no repositório para universidades, centros de pós-graduação e pesquisadores independentes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/periodicos"
              className="px-4 py-2 rounded-xl bg-surface border border-border text-xs font-semibold text-foreground hover:bg-surface-hover hover:border-primary/40 transition-colors shadow-2xs"
            >
              Ver Portal Geral de Periódicos →
            </Link>
          </div>
        </div>
      </section>

      <FooterGlobal />
    </main>
  );
}
