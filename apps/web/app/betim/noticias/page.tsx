import Link from "@/lib/betim/link";
import { getNoticias, CATEGORIA_LABELS } from "@/lib/betim/noticias";
import { TEMA_LABELS } from "@/lib/betim/temas";
import { formatDateBR } from "@/lib/betim/format";

export const metadata = {
  title: "Notícias — Controle Popular Betim",
  description:
    "Achados de investigação, explicadores e notas do Controle Popular Betim — texto próprio, sem redação terceirizada.",
};

export default async function NoticiasPage() {
  const { rows, ok } = await getNoticias();

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">Notícias</h1>
      <p className="mt-2 max-w-[65ch] text-text-soft">
        Achados de investigação, explicadores sobre como ler os dados e
        notas curtas — escrito por quem mantém este site, direto do que
        já está sincronizado no portal. Quando um post traz repercussão
        de outro veículo (selo <strong className="font-semibold text-text">Repercussão</strong>),
        é resumo próprio com a fonte original sempre linkada — nunca
        cópia do texto de terceiro.
      </p>

      {!ok || rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-center text-sm text-text-soft">
          Nenhuma publicação ainda.
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {rows.map((n) => (
            <li key={n.slug}>
              <Link
                href={`/noticias/${n.slug}`}
                className="cp-card-hover block rounded-2xl border border-border bg-surface p-5 shadow-sm hover:border-primary"
              >
                <div className="flex flex-wrap items-center gap-2 text-[.85em] font-semibold tracking-wide uppercase">
                  <span
                    className={`rounded-full px-2.5 py-1 ${
                      n.categoria === "curadoria"
                        ? "bg-accent/15 text-accent"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {CATEGORIA_LABELS[n.categoria] ?? n.categoria}
                  </span>
                  {(n.temas ?? []).map((t) => (
                    <span key={t} className="rounded-full bg-surface-2 px-2.5 py-1 text-text-soft">
                      {TEMA_LABELS[t] ?? t}
                    </span>
                  ))}
                </div>
                <p className="mt-2 font-display text-lg font-semibold text-text">{n.titulo}</p>
                <p className="mt-1 text-sm text-text-soft">{n.resumo}</p>
                <p className="mt-2 text-xs text-text-soft">
                  {n.fonteExternaNome ? `Fonte original: ${n.fonteExternaNome}` : n.autor} ·{" "}
                  {formatDateBR(n.publicadoEm)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
