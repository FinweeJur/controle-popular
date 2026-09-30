import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import PastaClient from "./PastaClient";

/**
 * Página `/pasta` — o dossiê do leitor, montado página a página.
 *
 * Papel: reunir os itens que a pessoa adicionou (na paleta de comandos, Ctrl+K)
 * e exportar tudo junto em CSV ou impressão. A lista vive no `localStorage` —
 * sem cadastro e sem servidor. A lógica pura mora em `lib/pasta/itens.ts`.
 */

export const metadata: Metadata = {
  title: "Minha pasta de dossiê | Controle Popular",
  description:
    "Junta páginas, tabelas e leis do portal numa pasta e exporta tudo de uma vez em planilha ou impressão. Sem cadastro: a pasta fica no seu aparelho.",
};

export default function PastaPage() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <nav aria-label="Caminho de navegação" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="transition-colors hover:text-foreground">
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-foreground">Minha pasta</span>
      </nav>

      <header className="mb-8 max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
          <span>Dossiê sem cadastro</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Minha pasta de dossiê
        </h1>
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          Junte as páginas que você quer citar e exporte tudo junto no fim. A
          pasta fica no seu aparelho, sem cadastro e sem enviar nada. Cada item
          guarda o endereço da fonte — a pasta reúne, não copia.
        </p>
      </header>

      <PastaClient />

      <div className="mt-16">
        <FooterGlobal />
      </div>
    </main>
  );
}
