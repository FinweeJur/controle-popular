import type { Metadata } from "next";
import ListaVotacoes from "./ListaVotacoes";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/congresso/votacoes", {
  title: "Votações — Controle Popular · Congresso",
  description: "Como cada parlamentar votou, votação por votação, na Câmara dos Deputados.",
});

/**
 * `/congresso/votacoes` — mesma conversão de `congresso/proposicoes`: o
 * servidor não busca mais as votações (isso virou índice estático fatiado,
 * ver `dados/[arquivo]/route.ts`), só monta o caminho base do índice.
 */
// Sem `searchParams`, mas com `force-static` mesmo assim: sem ele
// `output: export` trata a rota como dinâmica e aborta com "missing
// generateStaticParams()" — mensagem que não descreve a causa real.
export const dynamic = "force-static";

export default function Votacoes() {
  const prefixoExport = process.env.PAGES_BASE_PATH ?? "";
  const baseDados = `${prefixoExport}/congresso/votacoes/dados`;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Votações</h1>
        <p className="opacity-80">
          O placar de uma votação mostra quantos votaram Sim ou Não; aqui está
          o nome de cada parlamentar por trás desse número, votação por
          votação.
        </p>
      </header>

      {/* O `DataCard` original só existia pra dar nome+link à fonte junto
          da contagem; a contagem agora é da própria `TabelaEstatica`
          ("X de Y" perto da busca), mas o crédito não tem por que sumir. */}
      <p className="text-xs opacity-70">
        Fonte:{" "}
        <a
          href="https://dadosabertos.camara.leg.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Câmara dos Deputados — Dados Abertos ↗
        </a>
      </p>

      <ListaVotacoes base={baseDados} />
    </div>
  );
}
