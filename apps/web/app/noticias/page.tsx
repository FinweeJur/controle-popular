import type { Metadata } from "next";
import Link from "next/link";
import { metadataEditavel } from "@/lib/edicoes";
import { listarNoticiasPortal } from "@/lib/noticias/portal";
import NoticiasClient from "./NoticiasClient";
import FooterGlobal from "@/app/components/FooterGlobal";

export const metadata: Metadata = metadataEditavel("/noticias", {
  title: "Notícias & Relatórios Técnicos — Controle Popular",
  description:
    "Acompanhamento analítico e descritivo de compras governamentais, orçamentos municipais, processos legislativos e dados socioambientais com fontes oficiais.",
  keywords: [
    "noticias-dados-publicos",
    "relatorios-tecnicos",
    "transparencia-fiscal",
    "pncp",
    "ibge",
    "datasus",
    "orcamento-publico",
    "cidades-estrategicas"
  ],
});

export default function NoticiasPage() {
  const noticias = listarNoticiasPortal();

  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
    >
      {/* BREADCRUMB */}
      <nav aria-label="Caminho de navegação" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-foreground transition-colors">
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-foreground">Notícias & Relatórios</span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-10 max-w-4xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <span>Jornalismo de Dados & Relatórios Técnicos</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Notícias & Estudos de Dados Públicos
        </h1>

        <p className="text-base text-muted leading-relaxed">
          Publicações técnicas e descritivas fundamentadas em bases de dados abertas do governo federal, tribunais, órgãos ambientais e prefeituras. Todos os números acompanham a identificação da fonte oficial e parâmetros para conferência.
        </p>

        {/* EPÍGRAFE POÉTICA */}
        <div className="rounded-xl border border-dashed border-primary/40 bg-surface-2/60 p-4 text-sm italic text-muted">
          <p>
            &ldquo;Ela deita sementes para morrerem ou brotarem. Ela semeia sonhos na esperança de ver germinar sobrevivência.&rdquo;
          </p>
          <p className="mt-1 text-xs not-italic font-medium text-foreground">
            — Itamar Vieira Junior, <em>Coração sem medo</em> (Todavia, 2025)
          </p>
        </div>
      </header>

      {/* CLIENTE INTERATIVO */}
      <NoticiasClient noticias={noticias} />

      {/* RODAPÉ GLOBAL */}
      <div className="mt-16">
        <FooterGlobal />
      </div>
    </main>
  );
}
