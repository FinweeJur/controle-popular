"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "@/lib/congresso/link";
import { withBasePath } from "@/lib/congresso/basePath";
import { ROTULO_CASA, type ParlamentarResumo } from "@/lib/congresso/parlamentares";

/**
 * O filtro (`?casa=&partido=&uf=`) saiu do servidor e veio para cá, junto
 * com a navegação — mesmo motivo de `ListaBancadas`.
 *
 * POR QUE: em `output: 'export'` não existe request no momento da geração,
 * então `searchParams` num Server Component é erro de build — o build
 * inteiro para (ver `docs/deploy-github-pages.md` §3).
 *
 * O recorte continua honesto porque `listarParlamentares` nunca teve LIMIT:
 * filtrar no SQL só encurtaria a mesma lista. O servidor manda todo mundo
 * (~512, mesma ordem de grandeza das 354 bancadas), e o navegador corta.
 *
 * `useSearchParams()` obriga um `<Suspense>` acima (quem chama põe). Sem ele
 * o Next tira a rota inteira do pré-render — no alvo estático isso é build
 * quebrado, e no Cloudflare seria a página perdendo o SSG sem ninguém notar.
 *
 * Navegação é por `router.push`, não `<Link href="?...">`, porque cada
 * troca de filtro combina os 3 parâmetros — e `router.push` não passa pelo
 * `<Link>` da zona, então o caminho precisa de `withBasePath` manual (regra
 * documentada em `lib/congresso/basePath.ts`).
 */

interface ListaProps {
  parlamentares: ParlamentarResumo[] | null;
}

interface Filtro {
  casa: string;
  partido: string;
  uf: string;
}

const FILTRO_VAZIO: Filtro = { casa: "", partido: "", uf: "" };

function ParlamentaresConteudo({ parlamentares, filtro }: ListaProps & { filtro: Filtro }) {
  const router = useRouter();

  const { casas, partidos, ufs } = useMemo(() => {
    const casas = new Set<string>();
    const partidos = new Set<string>();
    const ufs = new Set<string>();
    for (const p of parlamentares ?? []) {
      casas.add(p.casa_id);
      if (p.partido) partidos.add(p.partido);
      if (p.uf) ufs.add(p.uf);
    }
    return {
      casas: [...casas].sort(),
      partidos: [...partidos].sort((a, b) => a.localeCompare(b, "pt-BR")),
      ufs: [...ufs].sort((a, b) => a.localeCompare(b, "pt-BR")),
    };
  }, [parlamentares]);

  const filtrados = (parlamentares ?? []).filter(
    (p) =>
      (!filtro.casa || p.casa_id === filtro.casa) &&
      (!filtro.partido || p.partido === filtro.partido) &&
      (!filtro.uf || p.uf === filtro.uf)
  );

  function atualizarFiltro(mudanca: Partial<Filtro>) {
    const proximo = { ...filtro, ...mudanca };
    const params = new URLSearchParams();
    if (proximo.casa) params.set("casa", proximo.casa);
    if (proximo.partido) params.set("partido", proximo.partido);
    if (proximo.uf) params.set("uf", proximo.uf);
    const qs = params.toString();
    router.push(withBasePath(`/parlamentares${qs ? `?${qs}` : ""}`));
  }

  const temFiltro = Boolean(filtro.casa || filtro.partido || filtro.uf);

  return (
    <>
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-[var(--cp-border)] p-4 text-sm">
        <label>
          <span className="block opacity-75">Casa</span>
          <select
            value={filtro.casa}
            onChange={(e) => atualizarFiltro({ casa: e.target.value })}
            className="mt-1 rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
          >
            <option value="">Todas</option>
            {casas.map((c) => (
              <option key={c} value={c}>
                {ROTULO_CASA[c] ?? c}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="block opacity-75">Partido</span>
          <select
            value={filtro.partido}
            onChange={(e) => atualizarFiltro({ partido: e.target.value })}
            className="mt-1 rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
          >
            <option value="">Todos</option>
            {partidos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="block opacity-75">UF</span>
          <select
            value={filtro.uf}
            onChange={(e) => atualizarFiltro({ uf: e.target.value })}
            className="mt-1 rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
          >
            <option value="">Todas</option>
            {ufs.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>

        {temFiltro ? (
          <Link href="/parlamentares" className="pb-2 underline">
            limpar
          </Link>
        ) : null}
      </div>

      {parlamentares === null ? (
        <p className="rounded-lg border border-[var(--cp-border)] p-5 opacity-80">
          Fonte de dados não configurada.
        </p>
      ) : parlamentares.length === 0 ? (
        <p className="rounded-lg border border-[var(--cp-border)] p-5 opacity-80">
          Nenhum parlamentar sincronizado ainda. Rode{" "}
          <code>python -m etl.camara.parlamentares</code>.
        </p>
      ) : filtrados.length === 0 ? (
        <p className="rounded-lg border border-[var(--cp-border)] p-5 opacity-80">
          Nenhum parlamentar com estes filtros.
        </p>
      ) : (
        <>
          <p className="text-sm opacity-70">
            <span className="font-tabular">{filtrados.length}</span>{" "}
            {filtrados.length === 1 ? "parlamentar" : "parlamentares"}
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/parlamentares/${p.id}`}
                  className="flex h-full items-center gap-3 rounded-lg border border-[var(--cp-border)] p-3 hover:border-[var(--cp-primary)]"
                >
                  {p.url_foto ? (
                    <img
                      src={p.url_foto}
                      alt=""
                      width={36}
                      height={48}
                      className="h-12 w-9 shrink-0 rounded object-cover"
                    />
                  ) : null}
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {p.nome_eleitoral ?? p.nome}
                    </span>
                    <span className="block text-sm opacity-70">
                      {p.partido ?? "—"}
                      {p.uf ? `/${p.uf}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

/** O fallback do `<Suspense>`: todos os parlamentares, sem ler a query. */
export function ListaParlamentaresCompleta(props: ListaProps) {
  return <ParlamentaresConteudo {...props} filtro={FILTRO_VAZIO} />;
}

export default function ListaParlamentares(props: ListaProps) {
  const sp = useSearchParams();
  return (
    <ParlamentaresConteudo
      {...props}
      filtro={{
        casa: sp.get("casa") ?? "",
        partido: sp.get("partido") ?? "",
        uf: sp.get("uf") ?? "",
      }}
    />
  );
}
