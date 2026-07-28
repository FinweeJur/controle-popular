import Link from "@/lib/betim/link";
import { type LucideIcon } from "lucide-react";

export interface NavSubItem {
  href: string;
  nome: string;
  icon?: LucideIcon;
}

/**
 * Item de navegação com menu suspenso no hover (pedido do usuário
 * 2026-07-24: "que nem em dados que abre as subpáginas, acrescentar isso
 * pra prefeitura e câmara"). CSS puro (group-hover/group-focus-within),
 * sem "use client" — o Header segue Server Component. No mobile (sem
 * hover) o link principal continua funcionando; o `hidden`/`block`
 * (não `invisible`) remove o menu do layout de verdade quando fechado,
 * evitando o overflow horizontal já visto antes com `visibility:hidden`.
 */
export default function NavDropdown({
  label,
  href,
  itens,
  largura = "w-56",
}: {
  label: string;
  href: string;
  itens: NavSubItem[];
  largura?: string;
}) {
  return (
    <div className="group relative">
      <Link
        href={href}
        className="cp-link-underline text-text-soft transition-colors duration-150 hover:text-primary"
      >
        {label}
      </Link>
      <div
        className={`absolute top-full left-1/2 z-50 hidden ${largura} -translate-x-1/2 pt-3 group-hover:block group-focus-within:block`}
      >
        <ul className="max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-surface p-2 shadow-lg">
          {itens.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="group/item flex items-center gap-3 rounded-lg px-3 py-2 text-[.92em] font-medium text-text transition-colors duration-150 hover:bg-surface-2"
              >
                {p.icon ? (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-150 group-hover/item:scale-110">
                    <p.icon size={15} strokeWidth={2} aria-hidden="true" />
                  </span>
                ) : null}
                {p.nome}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
