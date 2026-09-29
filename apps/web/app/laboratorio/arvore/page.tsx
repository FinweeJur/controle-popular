import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ArvoreObsidianGrafo from "./ArvoreObsidianGrafo";

export const metadata: Metadata = {
  title: "Árvore de Conexões Cívicas — Laboratório de Dados",
  description:
    "Visualização interativa em grafo estilo Obsidian: explore as relações entre os 4 eixos temáticos, 199 cidades, instituições e territórios do Controle Popular.",
};

export default function ArvoreGrafoPage() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-6xl px-4 py-12 sm:py-16"
    >
      <nav className="mb-6 text-sm text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/laboratorio" className="hover:text-primary">
          Laboratório
        </Link>{" "}
        · <span className="text-text">Árvore de Conexões</span>
      </nav>

      <header className="mb-8 space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
            🌳 Rede de Conhecimento Cívico
          </span>
          <span className="text-xs text-text-soft">Estilo Obsidian Graph</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
          Árvore de Conexões do Portal
        </h1>
        <p className="max-w-3xl text-sm text-text-soft leading-relaxed">
          Cada ponto representa uma página ou frente de monitoramento do Controle Popular.
          As linhas mostram como os 4 Grandes Eixos Temáticos se cruzam: orçamentos, barragens,
          compras públicas, direitos e bacias hidrográficas. Arraste os nós, aplique zoom e inspecione
          as relações.
        </p>
      </header>

      <Suspense fallback={<p className="text-sm text-text-soft">Carregando árvore de conexões...</p>}>
        <ArvoreObsidianGrafo />
      </Suspense>
    </main>
  );
}
