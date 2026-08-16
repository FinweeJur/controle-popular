import type { Metadata } from "next";
import { Rodape } from "@/app/congresso/alertas/FiltroRodapeVazio";
import { coberturaAnalise } from "@/lib/congresso/destaques";
import ListaBonsExemplos from "./ListaBonsExemplos";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/congresso/bons-exemplos", {
  title: "Bons exemplos — projetos que ampliam direitos — Controle Popular · Congresso",
  description:
    "Projetos de lei federais que ampliam direitos, com o dispositivo legal e o trecho que fundamentam cada classificação.",
});

/**
 * `/congresso/bons-exemplos` — página pesada (ver o porquê em
 * `dados/[arquivo]/route.ts`; `congresso/alertas`, com 20x menos linhas,
 * ficou no grupo "filtrar no cliente" com tudo embutido no HTML).
 *
 * `Rodape` importa direto de `FiltroRodapeVazio.tsx` (não mais de
 * `alertas/page.tsx`): esta página não usa mais `FiltroTema`/`Vazio` — o
 * filtro por tema e o estado vazio agora são resolvidos dentro de
 * `TabelaEstatica`/`ListaBonsExemplos.tsx`.
 */
// Sem `searchParams`, mas com `force-static` mesmo assim: sem ele
// `output: export` trata a rota como dinâmica e aborta com "missing
// generateStaticParams()" — mensagem que não descreve a causa real.
export const dynamic = "force-static";

export default async function BonsExemplos() {
  const cobertura = await coberturaAnalise();

  const prefixoExport = process.env.PAGES_BASE_PATH ?? "";
  const baseDados = `${prefixoExport}/congresso/bons-exemplos/dados`;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">
          Bons exemplos <span className="opacity-60">· projetos que ampliam direitos</span>
        </h1>
        <p className="max-w-3xl opacity-80">
          Nem todo monitoramento precisa ser denúncia. Estas são as proposições que{" "}
          <strong>ampliam</strong> direitos — úteis para apoiar publicamente, cobrar
          andamento de quem trava, e mostrar que a régua deste portal reconhece os dois
          lados com o mesmo critério.
        </p>
      </header>

      <ListaBonsExemplos base={baseDados} />

      <Rodape cobertura={cobertura} />
    </div>
  );
}
