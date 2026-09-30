import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ArvoreObsidianGrafo from "@/app/laboratorio/arvore/ArvoreObsidianGrafo";
import FooterGlobal from "@/app/components/FooterGlobal";

/**
 * Página `/grafo` — o mapa de conexões do portal, em primeiro plano.
 *
 * Papel: promover o grafo do Seu Nonô (a árvore de conexões que já vive no
 * laboratório) a uma PÁGINA navegável de verdade — cada nó é uma página ou
 * frente, e as arestas mostram como os eixos se cruzam. É a Camada 1 do plano
 * ("Achar"): o grafo deixa de ser enfeite e vira caminho para navegar.
 *
 * Reusa o componente do laboratório (`ArvoreObsidianGrafo`) — nada é
 * duplicado. A edificação e a correção do grafo ficam em
 * `lib/assistente/arvore-galhos.ts`.
 */

export const metadata: Metadata = {
  title: "Mapa de conexões — explore as ligações entre as páginas | Controle Popular",
  description:
    "Grafo interativo estilo Obsidian: veja como os eixos, as cidades, as instituições e os territórios do Controle Popular se conectam. Arraste, aplique zoom e navegue por cada nó.",
};

export default function GrafoPage() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <nav aria-label="Caminho de navegação" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="transition-colors hover:text-foreground">
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-foreground">Mapa de conexões</span>
      </nav>

      <header className="mb-8 max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
          <span>Grafo do conhecimento cívico</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Mapa de conexões
        </h1>
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          Cada ponto é uma página ou uma frente do portal; cada linha, uma
          ligação entre elas. Arraste os nós, aplique zoom e clique para
          navegar. É o jeito de achar o que você não sabia que existia.
        </p>
      </header>

      <Suspense fallback={<p className="text-sm text-muted">Carregando o mapa de conexões…</p>}>
        <ArvoreObsidianGrafo />
      </Suspense>

      <div className="mt-16">
        <FooterGlobal />
      </div>
    </main>
  );
}
