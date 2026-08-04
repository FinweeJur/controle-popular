"use client";

import { useSearchParams } from "next/navigation";
import Link from "@/lib/congresso/link";
import {
  DESCRICAO_TIPO,
  ROTULO_TIPO,
  type BancadaComContagem,
  type TipoBancada,
} from "@/lib/congresso/bancadas";

/**
 * O filtro `?tipo=` saiu do servidor e veio para cá, junto com a navegação
 * (que depende dele para saber qual aba destacar).
 *
 * POR QUE: em `output: 'export'` não existe request no momento da geração,
 * então `searchParams` num Server Component é erro de build — o build
 * inteiro para (ver `docs/deploy-github-pages.md` §3).
 *
 * O recorte continua honesto porque `listarBancadasComContagem` nunca teve
 * LIMIT: filtrar no SQL só encurtava a mesma lista. O servidor passa a
 * mandar as 354 bancadas inteiras (número medido, ver
 * `lib/db/queries/congresso.ts`), e o navegador corta.
 *
 * `useSearchParams()` obriga um `<Suspense>` acima (quem chama põe). Sem ele
 * o Next tira a ROTA INTEIRA do pré-render e manda para o cliente — no alvo
 * estático isso é build quebrado, e no Cloudflare seria a página perdendo o
 * SSG sem ninguém notar.
 */

const ORDEM: TipoBancada[] = ["frente", "bloco", "federacao", "partido"];

export default function ListaBancadas({
  bancadas,
}: {
  bancadas: BancadaComContagem[] | null;
}) {
  const sp = useSearchParams();
  const tipoNaUrl = sp.get("tipo") ?? "";
  const filtro = (ORDEM as string[]).includes(tipoNaUrl)
    ? (tipoNaUrl as TipoBancada)
    : undefined;

  // Igualdade estrita, ao contrário de `ListaPostos`: `tipo` não vem da
  // fonte, é escrito pelo ETL a partir de um conjunto fechado de literais
  // (`etl/camara/bancadas.py`). A própria página já comparava assim em JS
  // para montar as seções, e o `eq()` do SQL fazia o mesmo.
  //
  // O recorte vem ANTES do teste de lista vazia porque era isso que o SQL
  // filtrado produzia: pedir um tipo que ainda não sincronizou dava zero
  // linha e caía na mensagem do ETL, não numa página em branco.
  const doFiltro =
    bancadas === null ? null : filtro ? bancadas.filter((b) => b.tipo === filtro) : bancadas;

  const tipos = filtro ? [filtro] : ORDEM;

  return (
    <>
      <nav className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/bancadas"
          className={`rounded-md border px-3 py-1 ${
            filtro ? "border-[var(--cp-border)]" : "border-[var(--cp-primary)]"
          }`}
        >
          Todas
        </Link>
        {ORDEM.map((t) => (
          <Link
            key={t}
            href={`/bancadas?tipo=${t}`}
            className={`rounded-md border px-3 py-1 ${
              filtro === t ? "border-[var(--cp-primary)]" : "border-[var(--cp-border)]"
            }`}
          >
            {ROTULO_TIPO[t]}
          </Link>
        ))}
      </nav>

      {doFiltro === null ? (
        <p className="rounded-lg border border-[var(--cp-border)] p-5 opacity-80">
          Fonte de dados não configurada.
        </p>
      ) : doFiltro.length === 0 ? (
        <p className="rounded-lg border border-[var(--cp-border)] p-5 opacity-80">
          Nenhuma bancada sincronizada ainda. Rode{" "}
          <code>python -m etl.camara.bancadas</code>.
        </p>
      ) : (
        tipos.map((tipo) => {
          const doTipo = doFiltro.filter((b) => b.tipo === tipo);
          if (doTipo.length === 0) return null;
          return (
            <section key={tipo} className="space-y-3">
              <h2 className="font-display text-2xl font-semibold">
                {ROTULO_TIPO[tipo]}s{" "}
                <span className="font-tabular text-base font-normal opacity-70">
                  ({doTipo.length})
                </span>
              </h2>
              <p className="max-w-3xl text-sm opacity-75">{DESCRICAO_TIPO[tipo]}</p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {doTipo.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/bancadas/${b.id}`}
                      className="block h-full rounded-lg border border-[var(--cp-border)] p-4 hover:border-[var(--cp-primary)]"
                    >
                      <p className="font-semibold">{b.nome}</p>
                      <p className="mt-1 text-sm opacity-70">
                        {b.membros > 0 ? (
                          <>
                            <span className="font-tabular">{b.membros}</span>{" "}
                            {b.membros === 1 ? "parlamentar" : "parlamentares"}
                          </>
                        ) : (
                          "composição não sincronizada"
                        )}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </>
  );
}
