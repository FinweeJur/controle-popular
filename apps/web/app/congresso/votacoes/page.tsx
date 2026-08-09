import type { Metadata } from "next";
import Link from "@/lib/congresso/link";
import DataCard from "@/app/congresso/components/DataCard";
import { listarVotacoes, POR_PAGINA_PADRAO, type LadoVoto } from "@/lib/congresso/votacoes";

export const metadata: Metadata = {
  title: "Votações — Controle Popular · Congresso",
  description: "Como cada parlamentar votou, votação por votação, na Câmara dos Deputados.",
};

const COR_LADO: Record<LadoVoto, string> = {
  sim: "var(--cp-accent)",
  nao: "var(--cp-alert)",
  abstencao: "var(--cp-text-soft)",
  outro: "var(--cp-text-soft)",
};

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { dateStyle: "medium" });
}

type Params = Promise<Record<string, string | undefined>>;

export default async function Votacoes({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const pagina = Number(sp.pagina ?? 1) || 1;

  const resultado = await listarVotacoes({
    q: sp.q,
    ano: sp.ano ? Number(sp.ano) : undefined,
    pagina,
  });

  const totalPaginas = resultado ? Math.ceil(resultado.total / POR_PAGINA_PADRAO) : 0;

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

      <form className="grid gap-3 rounded-lg border border-[var(--cp-border)] p-4 sm:grid-cols-4">
        <label className="sm:col-span-3">
          <span className="text-sm opacity-75">Busca na descrição</span>
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="ex.: reforma tributária, PEC 45"
            className="mt-1 w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
          />
        </label>
        <label>
          <span className="text-sm opacity-75">Ano</span>
          <input
            type="number"
            name="ano"
            defaultValue={sp.ano ?? ""}
            placeholder="2026"
            className="mt-1 w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
          />
        </label>
        <div className="sm:col-span-4">
          <button
            type="submit"
            className="rounded-md bg-[var(--cp-primary)] px-4 py-2 font-medium text-[var(--cp-primary-ink)]"
          >
            Filtrar
          </button>
          {sp.q || sp.ano ? (
            <Link href="/votacoes" className="ml-3 underline">
              limpar
            </Link>
          ) : null}
        </div>
      </form>

      {!resultado ? (
        <p className="rounded-lg border border-[var(--cp-border)] p-6 opacity-80">
          Fonte de dados não configurada.
        </p>
      ) : (
        <>
          <DataCard
            title="Votações encontradas"
            source={{
              label: "Câmara dos Deputados — Dados Abertos",
              url: "https://dadosabertos.camara.leg.br/",
            }}
          >
            <p className="font-tabular text-2xl font-bold">
              {resultado.total.toLocaleString("pt-BR")}
            </p>
          </DataCard>

          {resultado.itens.length === 0 ? (
            <p className="rounded-lg border border-[var(--cp-border)] p-6 opacity-80">
              {resultado.total === 0
                ? "Nenhuma votação sincronizada ainda."
                : "Nenhum resultado com estes filtros."}
            </p>
          ) : (
            <>
              <ul className="space-y-3">
                {resultado.itens.map((v) => (
                  <li key={v.id} className="rounded-lg border border-[var(--cp-border)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{v.descricao ?? "Descrição não registrada"}</p>
                      {v.aprovacao !== null && (
                        <span
                          className="rounded-md border px-2 py-0.5 text-xs font-medium"
                          style={{
                            borderColor: v.aprovacao ? "var(--cp-accent)" : "var(--cp-alert)",
                            color: v.aprovacao ? "var(--cp-accent)" : "var(--cp-alert)",
                          }}
                        >
                          {v.aprovacao ? "Aprovada" : "Rejeitada"}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs opacity-65">
                      {formatarData(v.data)}
                      {v.siglaOrgao ? ` · ${v.siglaOrgao}` : ""}
                    </p>

                    {v.votos.length > 0 && (
                      <details className="mt-3 rounded-md border border-[var(--cp-border)] px-3 py-2">
                        <summary className="cursor-pointer text-sm font-medium select-none">
                          Ver como cada parlamentar votou ({v.votos.length})
                        </summary>
                        <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                          {v.votos.map((voto) => (
                            <li
                              key={voto.parlamentarId}
                              className="flex items-center justify-between gap-2 text-sm"
                            >
                              <Link
                                href={`/parlamentares/${voto.parlamentarId}`}
                                className="truncate underline-offset-2 hover:underline"
                              >
                                {voto.nome}
                                {voto.partido ? (
                                  <span className="opacity-70">
                                    {" "}
                                    ({voto.partido}
                                    {voto.uf ? `/${voto.uf}` : ""})
                                  </span>
                                ) : null}
                              </Link>
                              <span
                                className="shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium"
                                style={{ borderColor: COR_LADO[voto.lado], color: COR_LADO[voto.lado] }}
                              >
                                {voto.voto}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </li>
                ))}
              </ul>

              {totalPaginas > 1 ? (
                <nav className="flex items-center gap-4">
                  {pagina > 1 ? (
                    <Link
                      href={{ pathname: "/votacoes", query: { ...sp, pagina: pagina - 1 } }}
                      className="underline"
                    >
                      ← anterior
                    </Link>
                  ) : null}
                  <span className="text-sm opacity-70">
                    página {pagina} de {totalPaginas}
                  </span>
                  {pagina < totalPaginas ? (
                    <Link
                      href={{ pathname: "/votacoes", query: { ...sp, pagina: pagina + 1 } }}
                      className="underline"
                    >
                      próxima →
                    </Link>
                  ) : null}
                </nav>
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  );
}
