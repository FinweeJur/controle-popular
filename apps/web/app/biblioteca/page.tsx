import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Sparkles, GraduationCap, ShieldCheck } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  listarDocumentosUnificados,
  METRICAS_BIBLIOTECA,
} from "@/lib/biblioteca/unificada";
import BibliotecaGeralClient from "./BibliotecaGeralClient";

export const metadata: Metadata = {
  title: "Biblioteca Geral e Acervo Acadêmico — Controle Popular",
  description:
    "Acervo unificado de documentos públicos, relatórios corporativos ESG, atas de órgãos de justiça dos 27 estados e produção acadêmica (artigos SciELO, teses de doutorado e dissertações) sobre Vale, Sigma Lithium, consulta prévia, barragens e transparência.",
};

export default function BibliotecaGeralPage() {
  const documentos = listarDocumentosUnificados();

  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-6xl px-4 py-10 sm:py-14 sm:px-6 lg:px-8 space-y-10"
    >
      {/* ═══ NAVEGAÇÃO E BREADCRUMB ═══ */}
      <nav aria-label="Trilha de navegação" className="text-xs text-muted">
        <Link href="/" className="hover:text-primary transition">
          Início
        </Link>{" "}
        · <span className="text-foreground font-semibold">Biblioteca Geral & Pesquisa Acadêmica</span>
      </nav>

      {/* ═══ CABEÇALHO DA BIBLIOTECA ═══ */}
      <header className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary flex items-center gap-1.5">
              <BookOpen size={14} />
              <span>Acervo Unificado Nacional</span>
            </span>
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <GraduationCap size={14} />
              <span>Ciência & Pesquisa Cívica</span>
            </span>
          </div>

          <Link
            href="/assistente?pergunta=O que o Controle Popular tem de documentos e teses acadêmicas na Biblioteca Geral?"
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary hover:border-primary hover:bg-primary/5 transition shadow-2xs"
          >
            <Sparkles size={14} />
            <span>Consultar Seu Nonô</span>
          </Link>
        </div>

        <div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Biblioteca Geral & Acervo Acadêmico
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted leading-relaxed max-w-4xl">
            Repositório cívico consolidado reunindo documentos oficiais, relatórios corporativos ESG,
            prestação de contas das 91 instituições de justiça dos 27 estados e o catálogo de pesquisas
            acadêmicas (artigos SciELO, teses de doutorado e dissertações da UFMG, UFV, UnB, Fiocruz, USP e IPEA)
            sobre grandes empreendimentos, direitos territoriais e fiscalização de recursos públicos.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/70 text-xs">
          <div>
            <span className="text-muted block">Documentos Catalogados:</span>
            <span className="font-mono font-bold text-foreground">
              {METRICAS_BIBLIOTECA.totalDocumentos} itens
            </span>
          </div>
          <div>
            <span className="text-muted block">Abrangência Federativa:</span>
            <span className="font-semibold text-foreground">27 Estados + Federal</span>
          </div>
          <div>
            <span className="text-muted block">Pesquisa Científica:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              SciELO, Repositórios Federais & IPEA
            </span>
          </div>
          <div>
            <span className="text-muted block">Padrão de Integridade:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              100% Fontes Oficiais & Auditadas
            </span>
          </div>
        </div>
      </header>

      {/* ═══ COMPONENTE INTERATIVO (REQUISITO DAS 5 COISAS DO AGENTS.MD) ═══ */}
      <BibliotecaGeralClient
        documentos={documentos}
        metricas={METRICAS_BIBLIOTECA}
      />

      <FooterGlobal />
    </main>
  );
}
