import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import { BookOpen, Globe, CheckCircle, ShieldCheck, Sparkles, Layers, FileText, ArrowRight } from "lucide-react";
import PainelPeriodicos from "./PainelPeriodicos";
import dadosSumario from "@/data/periodicos-sumario.json";

/**
 * /periodicos — Sistematização Mundial de Periódicos Abertos de Submissão Contínua
 *
 * Papel no portal:
 *   Reunir, classificar e auditar revistas científicas de acesso aberto no mundo,
 *   priorizando periódicos 100% gratuitos (Diamond OA), com submissão em fluxo contínuo
 *   e registro persistente (DOI e ISSN). Inicia por Brasil e lusófonos e expande globalmente.
 *
 * De onde vêm os números:
 *   Calculados diretamente do banco de dados relacional oficial gerado a partir do DOAJ
 *   e coleções SciELO em `scripts/dados/periodicos/dados/sumario_global.json`.
 *
 * Regras respeitadas:
 *   - Regra 5.1: acervo enxuto com payload controlado (< 70 KB) no JSON estático.
 *   - Regra 5.9: comentário explicativo no cabeçalho com fonte oficial e motivo.
 *   - Regra 5.10: descrição sob o h1 com text-sm.
 *   - Regra 5.14: layout fluido adaptado a celulares de 390 px até telas 4K.
 *   - Regra 5.16: fonte mínima de 12 px em todo o texto de interface.
 */

export const metadata: Metadata = {
  title: "Periódicos Abertos de Submissão Contínua no Mundo — Controle Popular",
  description:
    "Catálogo auditado de periódicos científicos de acesso aberto com submissão em fluxo contínuo e publicação contínua em 141 países. Dados de tema, gratuidade (sem APC), DOI, prazos, formas de envio e idiomas.",
};

const fmt = (n: number) => n.toLocaleString("pt-BR");

export default function PaginaPeriodicos() {
  const { metricas, amostra_lusofona, amostra_global, atualizado_em } = dadosSumario;
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
        <Link href="/biblioteca" className="hover:text-primary hover:underline">
          Biblioteca & Pesquisa
        </Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Periódicos Contínuos</span>
      </nav>

      {/* Cabeçalho principal */}
      <header className="border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-2 text-xs text-primary font-semibold uppercase tracking-wider">
          <span className="px-2.5 py-1 rounded-full bg-primary/10">
            Acesso Aberto & Ciência Cívica
          </span>
          <span className="text-muted">•</span>
          <span className="text-muted">Atualizado em {dataFormatada}</span>
        </div>

        <h1 className="mt-3 font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Periódicos Científicos de Submissão Contínua
        </h1>

        <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed max-w-4xl">
          Diretório mundial sistematizado de revistas acadêmicas abertas que aceitam
          artigos o ano todo (fluxo contínuo) e publicam com registro DOI. Cobertura completa
          de <strong>{fmt(metricas.total_paises)} países</strong>, iniciando por Brasil e lusófonos,
          com destaque para revistas <strong>100% gratuitas (Acesso Aberto Diamante)</strong>.
        </p>
      </header>

      {/* Cartões de Métricas Globais */}
      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase">
            <BookOpen className="w-4 h-4" />
            Total no Mundo
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {fmt(metricas.total_periodicos)}
          </div>
          <p className="mt-1 text-xs text-muted">Revistas abertas catalogadas</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase">
            <Sparkles className="w-4 h-4" />
            Sem APC (Diamante)
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {metricas.porcentagem_diamond}%
          </div>
          <p className="mt-1 text-xs text-muted">{fmt(metricas.gratuitos_diamond)} periódicos 100% gratuitos</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase">
            <Globe className="w-4 h-4" />
            Países Cobertos
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {fmt(metricas.total_paises)}
          </div>
          <p className="mt-1 text-xs text-muted">Todos os continentes do globo</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase">
            <Layers className="w-4 h-4" />
            Plataforma OJS
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {fmt(metricas.plataforma_ojs)}
          </div>
          <p className="mt-1 text-xs text-muted">Submissão contínua em OJS/SEER</p>
        </div>
      </section>

      {/* Explicação de Submissão Contínua e Fluxo Contínuo */}
      <section className="mt-8 rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          O que é a Submissão Contínua e o Fluxo Contínuo?
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 text-xs sm:text-sm text-muted leading-relaxed">
          <div className="p-4 rounded-2xl bg-surface-soft border border-border">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <span>📅</span> Submissão Contínua (Rolling Submission)
            </h3>
            <p className="mt-2">
              Diferente de editais com prazo fixo, a revista mantém sua plataforma de submissão aberta
              <strong> 365 dias por ano</strong>. Autores podem submeter seus manuscritos em qualquer momento,
              sem esperar abertura de chamadas fechadas.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-soft border border-border">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <span>🚀</span> Publicação Contínua (Continuous Publishing)
            </h3>
            <p className="mt-2">
              Assim que o artigo é aprovado pela revisão por pares e diagramado, ele é publicado imediatamente
              com seu código DOI e paginação eletrônica em um volume anual contínuo, sem retenção em gaveta
              editorial.
            </p>
          </div>
        </div>

        {/* Fases Geográficas */}
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="font-bold text-foreground text-sm mb-3">
            Cobertura por Fases Geográficas no Acervo:
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {Object.entries(metricas.por_regiao).map(([reg, qtd]) => (
              <div key={reg} className="p-2.5 rounded-xl bg-surface-soft border border-border flex flex-col justify-between">
                <span className="font-semibold text-foreground">{reg}</span>
                <span className="text-primary font-bold text-sm mt-1">{fmt(Number(qtd))} títulos</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Painel Interativo de Busca e Filtragem */}
      <PainelPeriodicos
        amostraLusofona={amostra_lusofona}
        amostraGlobal={amostra_global}
      />

      {/* Como baixar a base completa */}
      <section className="mt-8 rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Download da Base Completa (Dados Abertos)
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted max-w-2xl">
              Pesquisadores e universidades podem baixar o banco relacional completo SQLite
              (com FTS5 para busca textual) ou arquivos CSV particionados por continente no repositório.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted">
              Local: <code className="px-2 py-1 rounded bg-surface border border-border text-foreground">scripts/dados/periodicos/dados/</code>
            </span>
          </div>
        </div>
      </section>

      <FooterGlobal />
    </main>
  );
}
