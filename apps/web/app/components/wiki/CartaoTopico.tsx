import Link from "next/link";
import type { ReactNode } from "react";

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
  icon?: ReactNode;
  novo?: boolean;
}

export default function CartaoTopico({ topico }: { topico: Topico }) {
  return (
    <Link
      href={topico.href}
      className="group relative flex flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-[var(--hover-clr,var(--cp-primary))] focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      style={{ "--hover-clr": topico.cor } as React.CSSProperties}
    >
      {topico.novo && (
        <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-[.65em] font-bold uppercase tracking-wider text-primary-ink">
          Novo
        </span>
      )}
      {topico.badge && (
        <span
          className="flex items-center gap-1.5 text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: topico.cor || "var(--cp-primary)" }}
        >
          {topico.icon}
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
