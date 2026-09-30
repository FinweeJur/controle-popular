import type { Metadata } from "next";
import Link from "next/link";

/**
 * Página `/offline` — o "casco" mostrado quando não há rede.
 *
 * Papel: dar uma tela honesta quando a conexão falha (o service worker cai
 * para cá). Não promete dado novo: diz que está sem rede e aponta de volta.
 */

export const metadata: Metadata = {
  title: "Sem conexão — Controle Popular",
  description: "Você está sem internet. Reconecte para ver os dados atualizados do portal.",
};

export default function OfflinePage() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center"
    >
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
        Você está sem internet
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted">
        O portal precisa de conexão para mostrar o dado atualizado — número
        velho é dano. Reconecte e tente de novo.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Tentar de novo
      </Link>
    </main>
  );
}
