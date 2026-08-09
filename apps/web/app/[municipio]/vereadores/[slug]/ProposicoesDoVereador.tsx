"use client";

import { useSearchParams } from "next/navigation";
import Link from "@/lib/betim/link";
import type { ProposicaoRow } from "@/lib/betim/vereadores";

/**
 * Proposições do vereador, com o filtro por tema movido do SERVIDOR para o
 * NAVEGADOR.
 *
 * ═══ POR QUE MUDOU ═══
 *
 * A página lia `?tema=` no servidor. Isso a tornava dinâmica (`ƒ` na tabela de
 * rotas), e dinâmica significa consultar o banco A CADA REQUISIÇÃO. No
 * Cloudflare o banco não é alcançável — a Neon está em 402 e o Postgres é o
 * desta casa —, então a página respondia **500 em produção**, medido em
 * 2026-08-09. Sem o `searchParams`, ela volta a ser pré-renderizada (`●`) e
 * passa a sair do build, sem tocar em banco nenhum na hora da visita.
 *
 * É o mesmo remédio já aplicado em `prefeitura/obras`, `coleta-lixo` e outras
 * cinco — ver `docs/deploy-github-pages.md` §3.
 *
 * ═══ TRAZER TUDO CUSTA QUANTO ═══
 *
 * O filtro por tema era SQL (`arrayContains`) com `limit 10`. Filtrar no
 * cliente exige o conjunto inteiro do vereador, senão o filtro operaria só
 * sobre as 10 primeiras e mentiria. Medido no acervo (2026-08-09):
 *
 *     máximo 329 proposições por vereador · média 119 · p95 305
 *     o maior vereador dá 200 kB de JSON
 *
 * 200 kB no pior caso é aceitável para deixar a página estática, e é o único
 * jeito de o filtro continuar dizendo a verdade.
 *
 * `rotulos*` chegam por prop, e não por import, porque `lib/betim/temas.ts` e
 * `lib/betim/vereadores.ts` importam as consultas de banco — trazê-los para cá
 * arrastaria código de servidor para o bundle do navegador.
 */
interface Props {
  rows: ProposicaoRow[];
  ok: boolean;
  slug: string;
  legislatura: string;
  rotulosTipo: Record<string, string>;
  rotulosTema: Record<string, string>;
}

function Conteudo({ rows, ok, slug, legislatura, rotulosTipo, rotulosTema, tema }: Props & { tema?: string }) {
  const visiveis = tema ? rows.filter((p) => (p.temas ?? []).includes(tema)) : rows;

  return (
    <div className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-text">
          Proposições apresentadas ({legislatura})
        </h2>
        {tema && (
          <Link
            href={`/vereadores/${slug}`}
            className="text-xs font-medium text-accent hover:underline"
          >
            ✕ tema: {rotulosTema[tema] ?? tema} — limpar
          </Link>
        )}
      </div>
      {!ok || visiveis.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
          {tema
            ? "Nenhuma proposição encontrada para esse tema."
            : "Nenhuma proposição encontrada para este vereador."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
          <ul className="divide-y divide-border bg-surface">
            {visiveis.map((p, i) => (
              <li key={i} className="p-4 text-sm">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {rotulosTipo[p.tipo] ?? p.tipo}
                  </span>
                  <span className="font-tabular text-text-soft">
                    Nº {p.numero}/{p.ano}
                  </span>
                  {p.situacao && <span className="text-text-soft">· {p.situacao}</span>}
                </div>
                <p className="text-text">{p.ementa}</p>
                {p.temas && p.temas.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1">
                    {p.temas.map((t) => (
                      <li
                        key={t}
                        className="rounded-full bg-surface-2 px-2 py-0.5 text-[.85em] font-medium text-text-soft"
                      >
                        {rotulosTema[t] ?? t}
                      </li>
                    ))}
                  </ul>
                )}
                {p.link_fonte && (
                  <a
                    href={p.link_fonte}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs font-medium text-accent hover:underline"
                  >
                    Ver fonte oficial ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Fallback do `<Suspense>`: a lista COMPLETA, sem ler a query.
 *
 * Tem de ser um componente que NÃO chama `useSearchParams()` — passar o mesmo
 * dos dois lados derruba o `next build` com "should be wrapped in a suspense
 * boundary", e só no build: em `next dev` não há pré-render e a página parece
 * perfeita.
 */
export function ProposicoesDoVereadorCompletas(props: Props) {
  return <Conteudo {...props} tema={undefined} />;
}

export default function ProposicoesDoVereador(props: Props) {
  const tema = useSearchParams().get("tema") ?? undefined;
  return <Conteudo {...props} tema={tema} />;
}
