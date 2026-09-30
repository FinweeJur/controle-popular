import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import TemasClient from "./TemasClient";

/**
 * Página `/temas` — acompanhar temas do portal.
 *
 * Papel: guardar no aparelho os assuntos que o leitor quer acompanhar e
 * oferecer os canais de aviso (Telegram e e-mail). Sem cadastro; a lista fica
 * no `localStorage`. Lógica pura em `lib/temas/temas.ts`.
 */

export const metadata: Metadata = {
  title: "Acompanhar temas — guarde seus assuntos | Controle Popular",
  description:
    "Marque os temas do portal que você quer acompanhar (cidades, Congresso, Judiciário, meio ambiente, Paraopeba e mais). A lista fica no seu aparelho, sem cadastro, e você escolhe receber avisos pelo Telegram ou e-mail.",
};

export default function TemasPage() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <nav aria-label="Caminho de navegação" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="transition-colors hover:text-foreground">
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-foreground">Acompanhar temas</span>
      </nav>

      <header className="mb-8 max-w-2xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
          <span>Sem cadastro</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Acompanhar temas
        </h1>
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          Marque os assuntos que te interessam. A lista fica no seu aparelho e
          vira um atalho para voltar rápido. Para receber avisos de novidades,
          escolha o Telegram ou o e-mail.
        </p>
      </header>

      <TemasClient />

      <div className="mt-16">
        <FooterGlobal />
      </div>
    </main>
  );
}
