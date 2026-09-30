import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import MeusDadosClient from "./MeusDadosClient";

/**
 * Página `/meus-dados` — portabilidade e controle dos dados locais.
 *
 * Papel: baixar num JSON as cidades seguidas, a pasta de dossiê e os temas
 * acompanhados; importar noutro aparelho; e apagar tudo. Sem conta e sem
 * servidor. Lógica pura em `lib/portabilidade/dados-locais.ts`.
 */

export const metadata: Metadata = {
  title: "Meus dados — exportar, importar e apagar | Controle Popular",
  description:
    "Baixe num arquivo JSON suas cidades seguidas, sua pasta de dossiê e seus temas, leve para outro aparelho ou apague tudo. Sem cadastro: seus dados ficam no seu navegador.",
};

export default function MeusDadosPage() {
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
        <span className="font-semibold text-foreground">Meus dados</span>
      </nav>

      <header className="mb-8 max-w-2xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
          <span>Seus dados são seus</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Meus dados
        </h1>
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          Suas listas ficam no seu navegador, sem cadastro. Aqui você leva tudo
          para outro aparelho ou apaga de uma vez. Sem conta e sem servidor.
        </p>
      </header>

      <MeusDadosClient />

      <div className="mt-16">
        <FooterGlobal />
      </div>
    </main>
  );
}
