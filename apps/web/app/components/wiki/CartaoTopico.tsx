import Link from "next/link";

/**
 * Card usado nos hubs de indice (/indice, /[municipio]/indice, /[zona]/indice).
 *
 * Cada card apresenta um topico, uma frase do que responde e um link
 * "veja +". O padrao e o mesmo do `OutrasFrentes.tsx`, mas sem depender
 * do tipo `Zona`.
 */
export interface Topico {
  href: string;
  titulo: string;
  descricao: string;
  cor?: string;
  badge?: string;
}

export default function CartaoTopico({ topico }: { topico: Topico }) {
  return (
    <Link
      href={topico.href}
      className="group flex flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      {topico.badge && (
        <span
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: topico.cor || "var(--cp-primary)" }}
        >
          {topico.badge}
        </span>
      )}
      <h3 className="mt-1.5 font-display text-lg font-semibold group-hover:text-primary">
        {topico.titulo}
      </h3>
      <p className="mt-2 flex-1 text-[.92em] text-text-soft">{topico.descricao}</p>
      <span className="mt-4 font-medium text-primary">veja +</span>
    </Link>
  );
}
