import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import ModelosClient from "./ModelosClient";

/**
 * Página `/modelos` — modelos prontos de requerimentos e comunicações.
 *
 * Papel: dar à pessoa o texto pronto para pedir informação (LAI), recorrer de
 * uma negativa, noticiar dano ambiental ao MP e pedir a tarifa social. Copiar
 * e baixar acontecem no aparelho; o portal não recebe o texto preenchido.
 *
 * Fonte dos modelos: os guias do blog do portal (LAI, Justiça e tarifa
 * social). A lógica e os textos moram em `lib/modelos/textos.ts`.
 */

export const metadata: Metadata = {
  title: "Modelos prontos para pedir informação e defender direitos | Controle Popular",
  description:
    "Textos prontos para copiar: pedido de acesso à informação (LAI), recurso de negativa, notícia de fato ao Ministério Público, tarifa social e compras públicas. Com base legal e canal oficial.",
};

export default function ModelosPage() {
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
        <span className="font-semibold text-foreground">Modelos prontos</span>
      </nav>

      <header className="mb-8 max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
          <span>Da leitura à ação</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Modelos prontos
        </h1>
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          Textos para copiar, preencher e protocolar. Cada modelo traz a base
          legal e o canal oficial. Você completa os campos entre colchetes e
          envia — o portal não recebe nada.
        </p>
      </header>

      <ModelosClient />

      <div className="mt-16">
        <FooterGlobal />
      </div>
    </main>
  );
}
