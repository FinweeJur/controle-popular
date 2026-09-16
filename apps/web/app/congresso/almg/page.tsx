import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Assembleia Legislativa de MG — Proposições Estaduais | Controle Popular",
  description:
    "Proposições legislativas de Minas Gerais com análise garantista de ampliação ou restrição de direitos fundamentais. Dados Abertos ALMG.",
};

const NAV = [
  { href: "/congresso/almg/proposicoes", label: "Proposições" },
];

export default function AlmgPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <nav aria-label="Navegação estrutural" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:underline">Início</Link>
        <span>/</span>
        <Link href="/congresso" className="hover:underline">Congresso</Link>
        <span>/</span>
        <span className="font-semibold text-foreground">ALMG</span>
      </nav>

      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
            Estado de MG
          </span>
          <span className="rounded-full bg-surface-2 border border-border px-3 py-0.5 text-xs text-muted">
            Dados Abertos ALMG
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Assembleia Legislativa de Minas Gerais
        </h1>
        <p className="mt-3 text-base text-muted sm:text-lg">
          Proposições legislativas estaduais com análise garantista de ampliação
          ou restrição de direitos fundamentais. Fonte: Dados Abertos ALMG
          (dadosabertos.almg.gov.br).
        </p>
      </header>

      <nav className="flex flex-wrap gap-3">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={`/congresso/almg${item.href}`}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {item.label} →
          </Link>
        ))}
      </nav>

      <section className="mt-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">Sobre a fonte</h2>
        <p className="mt-2 text-sm text-muted">
          A API de Dados Abertos da ALMG oferece dados estruturados sobre
          parlamentares, processo legislativo e orçamento da instituição.
          As proposições incluem ementa, indexação, situação de tramitação,
          autores e link para o texto completo.
        </p>
        <p className="mt-2 text-sm text-muted">
          A análise garantista aplicada é a mesma do Congresso federal:
          cada proposição é avaliada quanto ao impacto nos 24 direitos
          fundamentais da CF/88, com classificação garantista/reducionista
          e verificação de vícios constitucionais.
        </p>
        <a
          href="https://dadosabertos.almg.gov.br"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
        >
          Acessar Dados Abertos ALMG →
        </a>
      </section>
    </main>
  );
}
