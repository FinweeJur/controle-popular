"use client";

import Link from "@/lib/betim/link";
import Moeda from "@/app/components/Moeda";
import type { ObraRow } from "@/lib/betim/obras";
import { useSearchParams } from "next/navigation";

/**
 * O filtro `?situacao=` saiu do servidor e veio para cá, junto com o
 * formulário e a lista — as três coisas que mudam com ele.
 *
 * POR QUE: em `output: 'export'` não existe request no momento da geração,
 * então `searchParams` num Server Component é erro de build — não é
 * degradação, o build inteiro para (ver `docs/deploy-github-pages.md` §3).
 *
 * O recorte não mudou de significado: `listarObras` NUNCA teve LIMIT nem
 * filtro no SQL — trazia a cidade inteira e o `getObras` cortava em JS. Os
 * cards de cima (total, valor, quantas têm valor) já eram calculados sobre o
 * conjunto completo, não sobre o recorte, e continuam no servidor. Ou seja: a
 * página sem filtro já embutia todas as obras no HTML antes desta mudança.
 *
 * `useSearchParams()` obriga um `<Suspense>` acima (quem chama põe). Sem ele
 * o Next tira a ROTA INTEIRA do pré-render e manda para o cliente — no alvo
 * estático isso é build quebrado, e no Cloudflare seria a página perdendo o
 * SSG sem ninguém notar.
 */
/**
 * ═══ POR QUE SÃO DOIS COMPONENTES ═══
 *
 * `useSearchParams()` exige um `<Suspense>` acima, e o `fallback` DELE não
 * pode chamar o mesmo hook — o fallback é justamente o que se renderiza sem
 * ele. Passar este componente nos dois lados derruba o `next build` com
 * "should be wrapped in a suspense boundary", e só lá: `next dev` não
 * pré-renderiza, então a página parece perfeita o desenvolvimento inteiro e
 * o `tsc` não tem como ver.
 *
 * O componente "Completa" sendo o fallback é também o que mantém o conteúdo
 * INTEIRO dentro do HTML estático — quem chega sem JavaScript ainda vê tudo.
 */
interface ObrasProps {
  obras: ObraRow[];
  situacoesDisponiveis: string[];
}

function ObrasConteudo({
  obras,
  situacoesDisponiveis,
  situacao,
}: ObrasProps & { situacao?: string }) {


  // Igualdade estrita de propósito, e é a MESMA de antes: este filtro já era
  // `===` em JS dentro de `getObras`, nunca um `=` no SQL. As opções do
  // `<select>` saem de `situacoesDisponiveis`, que é o conjunto de situações
  // distintas do próprio dado da cidade — não há grafia a reconciliar, e
  // afrouxar a comparação aqui juntaria variantes que a fonte publica (e a
  // tela lista) como situações separadas.
  const lista = situacao ? obras.filter((o) => o.situacao === situacao) : obras;

  return (
    <>
      <form method="GET" className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label htmlFor="situacao" className="mb-1 text-xs font-medium text-text-soft">
            Situação
          </label>
          <select
            id="situacao"
            name="situacao"
            defaultValue={situacao ?? ""}
            className="w-64 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Todas</option>
            {situacoesDisponiveis.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="cursor-pointer rounded-lg border border-primary bg-primary px-5 py-2 text-sm font-semibold text-primary-ink"
        >
          Filtrar
        </button>
        {situacao && (
          <Link href="/prefeitura/obras" className="pb-1.5 text-sm text-text-soft hover:underline">
            Limpar
          </Link>
        )}
      </form>

      <ul className="flex flex-col gap-3">
        {lista.map((o, i) => (
          <li key={i} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="max-w-2xl font-medium text-text">{o.nome}</p>
              {o.situacao && (
                <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
                  {o.situacao}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
              {o.valor != null && o.valor > 0 && (
                <span className="font-tabular font-semibold text-text">
                  <Moeda value={o.valor} />
                </span>
              )}
              {o.percentualExecucao != null && (
                <span className="text-text-soft">
                  {o.percentualExecucao.toFixed(0)}% executado
                </span>
              )}
            </div>
            {o.percentualExecucao != null && (
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2"
                title={`${o.percentualExecucao.toFixed(0)}% executado`}
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{
                    width: `${Math.min(Math.max(o.percentualExecucao, 0), 100)}%`,
                  }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

/** O fallback do `<Suspense>`: todas as obras, sem ler a query. */
export function ListaObrasCompleta(props: ObrasProps) {
  return <ObrasConteudo {...props} situacao={undefined} />;
}

export default function ListaObras(props: ObrasProps) {
  // `null` (parâmetro ausente) vira `undefined` para o resto do componente
  // continuar vendo o que `await searchParams` entregava.
  const situacao = useSearchParams().get("situacao") ?? undefined;
  return <ObrasConteudo {...props} situacao={situacao} />;
}
