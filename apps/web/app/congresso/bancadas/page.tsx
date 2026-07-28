import type { Metadata } from "next";
import Link from "@/lib/congresso/link";
import { listarBancadas, DESCRICAO_TIPO, ROTULO_TIPO, type TipoBancada } from "@/lib/congresso/bancadas";

export const metadata: Metadata = {
  title: "Bancadas — Controle Popular · Congresso",
  description:
    "Frentes parlamentares, blocos, federações e partidos na Câmara dos Deputados, com quantos deputados cada um reúne.",
};

export const revalidate = 900;

const ORDEM: TipoBancada[] = ["frente", "bloco", "federacao", "partido"];

type Params = Promise<Record<string, string | undefined>>;

export default async function Bancadas({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const filtro = (ORDEM as string[]).includes(sp.tipo ?? "")
    ? (sp.tipo as TipoBancada)
    : undefined;

  const bancadas = await listarBancadas(filtro);
  const tipos = filtro ? [filtro] : ORDEM;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Bancadas</h1>
        <p className="max-w-3xl opacity-80">
          Nem todo agrupamento que decide votação está no regimento. As{" "}
          <strong>frentes parlamentares</strong> são o que a imprensa chama de bancada
          ruralista, evangélica ou da segurança — não são órgãos oficiais, mas explicam por
          que parlamentares de partidos diferentes se movem juntos num tema.
        </p>
      </header>

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

      {bancadas === null ? (
        <p className="rounded-lg border border-[var(--cp-border)] p-5 opacity-80">
          Fonte de dados não configurada.
        </p>
      ) : bancadas.length === 0 ? (
        <p className="rounded-lg border border-[var(--cp-border)] p-5 opacity-80">
          Nenhuma bancada sincronizada ainda. Rode{" "}
          <code>python -m etl.camara.bancadas</code>.
        </p>
      ) : (
        tipos.map((tipo) => {
          const doTipo = bancadas.filter((b) => b.tipo === tipo);
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
    </div>
  );
}
