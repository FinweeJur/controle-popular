import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import GlossarioClient from "./GlossarioClient";

/**
 * Página `/glossario` — o "o que é isto" dos termos do portal.
 *
 * Papel: explicar em português comum o vocabulário técnico (licitação, TAC,
 * cota-parte do ICMS, barragem a montante...), com a fonte oficial ao lado.
 * Definições em `lib/glossario/termos.ts`, fonte única.
 */

export const metadata: Metadata = {
  title: "Glossário cívico — os termos do dinheiro público explicados | Controle Popular",
  description:
    "O que é licitação, empenho, TAC, LAI, cota-parte do ICMS, barragem a montante, condicionante e mais — em português comum, com a fonte oficial de cada termo.",
};

export default function GlossarioPage() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <nav aria-label="Caminho de navegação" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="transition-colors hover:text-foreground">
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-foreground">Glossário</span>
      </nav>

      <header className="mb-8 max-w-2xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
          <span>O que é isto?</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Glossário cívico
        </h1>
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          Os termos do dinheiro e do poder público explicados em português
          comum, cada um com a fonte oficial ao lado. Sem jargão e sem esconder
          a explicação.
        </p>
      </header>

      <GlossarioClient />

      <div className="mt-16">
        <FooterGlobal />
      </div>
    </main>
  );
}
