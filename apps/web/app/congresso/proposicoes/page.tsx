import type { Metadata } from "next";
import { listarTemas } from "@/lib/congresso/proposicoes";
import ListaProposicoes from "./ListaProposicoes";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/congresso/proposicoes", {
  title: "Proposições — Controle Popular · Congresso",
  description:
    "Busque projetos de lei federais por tema, palavra-chave e classificação de ampliação ou restrição de direitos.",
});

/**
 * `/congresso/proposicoes` — servidor não busca mais as proposições em si
 * (isso agora é o índice estático fatiado, ver `dados/[arquivo]/route.ts`):
 * só a lista de temas oficiais, para popular o `<select>`.
 */
// Sem `searchParams`, mas com `force-static` mesmo assim: sem ele
// `output: export` trata a rota como dinâmica e aborta com "missing
// generateStaticParams()" — mensagem que não descreve a causa real.
export const dynamic = "force-static";

export default async function Proposicoes() {
  const temas = await listarTemas();

  // `process.env.PAGES_BASE_PATH` é o mesmo sinal que `next.config.ts` usa
  // para saber se está exportando estático (`/controle-popular` num repo
  // comum, string vazia com domínio próprio, `undefined` no Cloudflare). O
  // `fetch()` cru de `TabelaEstatica` não passa por `next/link`, que é quem
  // normalmente prefixa isso sozinho — então precisa ir pronto aqui.
  const prefixoExport = process.env.PAGES_BASE_PATH ?? "";
  const baseDados = `${prefixoExport}/congresso/proposicoes/dados`;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Proposições</h1>
        <p className="opacity-80">
          Projetos de lei, PECs e medidas provisórias em tramitação, com a classificação
          de quais direitos cada um amplia ou restringe.
        </p>
      </header>

      <ListaProposicoes base={baseDados} temas={temas} />
    </div>
  );
}
