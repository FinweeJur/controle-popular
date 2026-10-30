/**
 * Cartão de destaque da subfrente de litígios transnacionais.
 *
 * Usado em /riodoce e /paraopeba logo abaixo do cabeçalho, para o leitor
 * que chega pelo caso no Brasil encontrar o desdobramento na Europa sem
 * rolar a página inteira. O botão aponta para a rota nova via `next/link`
 * (AGENTS.md §5.13); o título e o resumo curto cabem em 2 linhas no celular.
 */
import Link from "next/link";

export default function CartaoLitigiosTransnacionais() {
  return (
    <aside
      aria-labelledby="cartao-litigios-europa"
      className="my-6 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Frente transnacional
          </p>
          <h2
            id="cartao-litigios-europa"
            className="mt-1 font-display text-lg font-semibold leading-snug text-text"
          >
            Litígios de Mariana e Brumadinho na Europa
          </h2>
          <p className="mt-1 line-clamp-2 text-sm leading-snug text-text-soft">
            Ação contra a BHP no High Court de Londres e conexões holandesas,
            com número de processo, fase e fonte oficial.
          </p>
        </div>
        <Link
          href="/europa/litigios-transnacionais"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Ver litígios na Europa
        </Link>
      </div>
    </aside>
  );
}
