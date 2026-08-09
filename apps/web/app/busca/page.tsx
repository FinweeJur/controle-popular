import type { Metadata } from "next";
import { listarCidades } from "@/lib/db/queries/municipios";
import BuscaClient from "./BuscaClient";

/**
 * Busca unificada — tema + palavra-chave + território — agrupada pelas três
 * frentes do portal (Cidades/Congresso/Judiciário).
 *
 * ESTÁTICA desde 2026-08-09: a versão anterior lia `searchParams` no
 * servidor e chamava `ts_rank`/`websearch_to_tsquery` no Postgres a cada
 * request — o que é exatamente o padrão que dá 500 em produção sob
 * `output: 'export'` (não há request no momento da geração) e que, mesmo
 * fora do export, prendia `/busca` a estar sempre dinâmica. Agora o
 * servidor só pré-renderiza a casca (este arquivo) e um `"use client"`
 * (`BuscaClient.tsx`) carrega o índice fatiado gerado por
 * `scripts/gerar-indice-busca.mts` e busca no navegador — ver
 * `lib/busca/indice.ts` para o motor e o porquê ele não perde a
 * radicalização do `to_tsvector('portuguese')` mesmo sendo estático.
 *
 * FICA NA RAIZ, fora de `[municipio]`/`congresso`/`judiciario`: as três
 * frentes moram em zonas de rota separadas (ver `lib/zonas.ts`) e esta
 * página existe justamente para procurar ENTRE elas. Por isso todo link
 * dentro de `BuscaClient.tsx` é `<a>` cru com caminho absoluto — nunca o
 * `<Link>` de zona, que prefixaria com a zona ATUAL, que aqui nem existe
 * (mesma regra documentada em `lib/zonas.ts` e aplicada em `app/page.tsx`).
 *
 * TEMA e TERRITÓRIO só filtram Cidades: são os únicos dados que têm as duas
 * coisas com o MESMO vocabulário (os 13 slugs de `etl/temas.py`, e
 * `id_municipio`). O Congresso tem tema OFICIAL da própria Câmara dos
 * Deputados — vocabulário diferente — e é federal, sem território; o
 * Judiciário não produz legislação nenhuma.
 */

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Busca — Controle Popular",
  description:
    "Busque legislação por tema, palavra-chave e território nas três frentes do Controle Popular: Cidades, Congresso e Judiciário.",
};

export default async function BuscaPage() {
  // Não depende de `searchParams` — roda em build, uma vez, igual a
  // qualquer outra lista estática (`temas`/`cidades` são as mesmas 13/N
  // opções para todo mundo). Os filtros de verdade (q/tema/município) são
  // lidos no CLIENTE, de `window.location.search` — ver `BuscaClient.tsx`.
  const cidades = await listarCidades();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <nav className="mb-4 text-sm text-text-soft">
        <a href="/" className="hover:text-primary">
          Início
        </a>{" "}
        · <span className="text-text">Busca</span>
      </nav>

      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Busca</h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Leis, decretos, resoluções e projetos das câmaras municipais, proposições do
          Congresso Nacional e a composição dos tribunais — num lugar só, por tema,
          palavra-chave e cidade.
        </p>
      </header>

      <BuscaClient cidades={cidades} />
    </div>
  );
}
