import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import { listarCidadesComparaveis } from "@/lib/comparador/projecao";
import RecapitularClient from "./RecapitularClient";

/**
 * Página `/recapitular` — cartão-resumo compartilhável de uma cidade.
 *
 * Papel: gerar um resumo curto, com fonte e data, para copiar e compartilhar.
 * Reusa a projeção de cidades do comparador. Sem cadastro; a escolha fica na
 * própria tela.
 */

export const metadata: Metadata = {
  title: "Recapitular uma cidade — números para compartilhar | Controle Popular",
  description:
    "Monte um resumo curto da sua cidade — população, PIB, repasses, saúde e escolas, com fonte e data — pronto para copiar e compartilhar no WhatsApp ou no e-mail.",
};

export default function RecapitularPage() {
  const { cidades, dataAcervo } = listarCidadesComparaveis();

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
        <Link href="/cidades" className="transition-colors hover:text-foreground">
          Cidades
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-foreground">Recapitular</span>
      </nav>

      <header className="mb-8 max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
          <span>Números para compartilhar</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Recapitular uma cidade
        </h1>
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          Escolha uma cidade e receba um resumo curto dos números principais,
          com a fonte e a data coladas. Copie e compartilhe — no WhatsApp, no
          e-mail ou impresso. Sem cadastro.
        </p>
      </header>

      <RecapitularClient cidades={cidades} dataAcervo={dataAcervo} />

      <div className="mt-16">
        <FooterGlobal />
      </div>
    </main>
  );
}
