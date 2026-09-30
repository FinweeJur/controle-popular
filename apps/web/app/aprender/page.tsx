import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import AprenderClient from "./AprenderClient";

/**
 * Página `/aprender` — micro-lições cívicas com pergunta de fixação.
 *
 * Papel: ensinar o vocabulário básico (LAI, licitação, barragem, CadÚnico,
 * ICMS...) para o dado público virar ação. Cada lição traz a fonte oficial.
 * Conteúdo em `lib/aprender/licoes.ts`; a interação roda no aparelho.
 */

export const metadata: Metadata = {
  title: "Aprender — micro-lições de cidadania e dinheiro público | Controle Popular",
  description:
    "Lições curtas e claras sobre como funciona o dinheiro público: LAI, licitação, PNCP, barragem a montante, ICMS, CAR, CadÚnico e código IBGE. Cada uma com a fonte oficial.",
};

export default function AprenderPage() {
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
        <span className="font-semibold text-foreground">Aprender</span>
      </nav>

      <header className="mb-8 max-w-2xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
          <span>Cidadania em 2 minutos</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Aprender
        </h1>
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          Lições curtas sobre como o dinheiro e o poder público funcionam. Leia,
          responda uma pergunta e veja a fonte oficial. Sem nota e sem pressa.
        </p>
      </header>

      <AprenderClient />

      <div className="mt-16">
        <FooterGlobal />
      </div>
    </main>
  );
}
