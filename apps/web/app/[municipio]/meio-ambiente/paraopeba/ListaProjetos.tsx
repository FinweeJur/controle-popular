"use client";

import Link from "@/lib/betim/link";
import type { IniciativaParaopeba } from "@/lib/betim/paraopeba";
import { formatCurrencyBRL } from "@/lib/betim/format";
import { useSearchParams } from "next/navigation";

/**
 * Os filtros `?status=` e `?ordem=` saíram do servidor e vieram para cá.
 *
 * POR QUE: em `output: 'export'` não existe request no momento da geração,
 * então `searchParams` num Server Component é erro de build — não é
 * degradação, o build inteiro para (ver `docs/deploy-github-pages.md` §3).
 *
 * Nenhum recorte muda de significado no caminho: `iniciativasParaopeba()`
 * não tem LIMIT nem WHERE de status — o servidor sempre entregou as
 * iniciativas TODAS do município, e o filtro/ordenação já eram JS dentro
 * desta página. A única coisa que mudou é onde esse JS roda.
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
interface ProjetosProps {
  iniciativas: IniciativaParaopeba[];
}

function ProjetosConteudo({
  iniciativas,
  statusFiltro,
  ordem,
}: ProjetosProps & { statusFiltro?: string; ordem?: string }) {
  // `?? undefined` (feito por quem chama) para o componente continuar vendo
  // exatamente o que `await searchParams` entregava: ausente é `undefined`, e
  // `?status=` vazio continua string vazia — as duas caem no ramo "sem filtro".

  // #7 do review: filtrar por status + ordenar por "falta mais pra
  // concluir". Dado já carregado — filtro/sort no componente. Padrão
  // é menos concluído primeiro (o que o usuário pediu).
  const statusesDisponiveis = [
    ...new Set(iniciativas.map((i) => i.status).filter((s): s is string => Boolean(s))),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));
  // Igualdade estrita de propósito: as opções do `<select>` são geradas a
  // partir dos próprios valores da coluna (`statusesDisponiveis`), então o
  // que o link carrega é sempre a grafia exata que veio da planilha da FGV.
  // Não é o caso da bandeira da ANP em `postos-combustivel`, onde a fonte
  // grafa o mesmo valor de dois jeitos e a comparação teve de ser frouxa.
  let lista = statusFiltro
    ? iniciativas.filter((i) => i.status === statusFiltro)
    : iniciativas;
  lista =
    ordem === "valor"
      ? [...lista].sort((a, b) => (b.valorTotal ?? 0) - (a.valorTotal ?? 0))
      : // menos concluído primeiro: percentual asc, sem % vai pro fim
        [...lista].sort(
          (a, b) => (a.percentualRealizado ?? 101) - (b.percentualRealizado ?? 101)
        );

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-text">
          Projetos ({lista.length}) — com link direto pra fonte
        </h2>
        <form method="GET" className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col">
            <label htmlFor="status" className="mb-1 text-xs font-medium text-text-soft">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={statusFiltro ?? ""}
              className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            >
              <option value="">Todos</option>
              {statusesDisponiveis.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="ordem" className="mb-1 text-xs font-medium text-text-soft">
              Ordenar por
            </label>
            <select
              id="ordem"
              name="ordem"
              defaultValue={ordem ?? "falta"}
              className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            >
              <option value="falta">Falta mais pra concluir</option>
              <option value="valor">Maior valor</option>
            </select>
          </div>
          <button
            type="submit"
            className="cursor-pointer rounded-lg border border-primary bg-primary px-4 py-1.5 text-sm font-semibold text-primary-ink"
          >
            Aplicar
          </button>
          {(statusFiltro || ordem) && (
            <Link
              href="/meio-ambiente/paraopeba"
              className="pb-1.5 text-sm text-text-soft hover:underline"
            >
              Limpar
            </Link>
          )}
        </form>
      </div>
      <ul className="flex flex-col gap-3">
        {lista.map((p) => (
          <li key={p.idFdi} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-display font-semibold text-text">{p.titulo}</p>
              {p.status && (
                <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
                  {p.status}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-text-soft">
              {p.areaTematica}
              {p.subAreaTematica && p.subAreaTematica !== "-" ? ` · ${p.subAreaTematica}` : ""}
              {p.municipiosEnvolvidos && p.municipiosEnvolvidos.includes(";")
                ? " · projeto compartilhado com outros municípios da bacia"
                : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
              {p.valorTotal != null && (
                <span className="font-tabular font-semibold text-text">
                  {formatCurrencyBRL(p.valorTotal)}
                </span>
              )}
              {p.percentualRealizado != null && (
                <span className="text-text-soft">{p.percentualRealizado.toFixed(0)}% executado</span>
              )}
              {/* O planejado é o que dá sentido ao executado: 77% pode ser
                  adiantado ou atrasado dependendo de quanto deveria estar
                  pronto. É a comparação para a qual a migration 0026 foi
                  escrita, e que nunca chegou a aparecer porque a coluna
                  não existia no banco. */}
              {p.percentualPlanejado != null && p.percentualRealizado != null && (
                <span
                  className={
                    p.percentualRealizado < p.percentualPlanejado
                      ? "font-semibold text-alert"
                      : "text-text-soft"
                  }
                >
                  {p.percentualRealizado < p.percentualPlanejado ? "atrasado — " : "em dia — "}
                  {p.percentualPlanejado.toFixed(0)}% planejado
                </span>
              )}
              {p.produtosPrevistos != null && p.produtosPrevistos > 0 && (
                <span className="text-text-soft">
                  {p.produtosEntregues ?? 0}/{p.produtosPrevistos} produtos entregues
                </span>
              )}
            </div>
            {p.percentualRealizado != null && (
              <div
                className="relative mt-2 h-2 overflow-hidden rounded-full bg-surface-2"
                title={
                  p.percentualPlanejado != null
                    ? `${p.percentualRealizado.toFixed(0)}% executado · ${p.percentualPlanejado.toFixed(0)}% planejado`
                    : `${p.percentualRealizado.toFixed(0)}% executado`
                }
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${Math.min(Math.max(p.percentualRealizado, 0), 100)}%` }}
                />
                {/* Marca do planejado sobre a barra — a mesma leitura do
                    gráfico da FGV, onde a linha preta é a meta. */}
                {p.percentualPlanejado != null && (
                  <span
                    aria-hidden
                    className="absolute inset-y-0 w-0.5 bg-text"
                    style={{ left: `${Math.min(Math.max(p.percentualPlanejado, 0), 100)}%` }}
                  />
                )}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {p.linkPublico && (
                <a
                  href={p.linkPublico}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-primary-ink"
                >
                  Página do projeto ↗
                </a>
              )}
              {p.linkTermoCompromisso && (
                <a
                  href={p.linkTermoCompromisso}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text"
                >
                  Termo de compromisso ↗
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** O fallback do `<Suspense>`: todas as iniciativas, sem ler a query. */
export function ListaProjetosCompleta(props: ProjetosProps) {
  return <ProjetosConteudo {...props} statusFiltro={undefined} ordem={undefined} />;
}

export default function ListaProjetos(props: ProjetosProps) {
  const searchParams = useSearchParams();
  return (
    <ProjetosConteudo
      {...props}
      statusFiltro={searchParams.get("status") ?? undefined}
      ordem={searchParams.get("ordem") ?? undefined}
    />
  );
}
