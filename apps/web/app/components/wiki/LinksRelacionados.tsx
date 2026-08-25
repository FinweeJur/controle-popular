import Link from "next/link";

/**
 * Lista de paginas relacionadas ao final de uma pagina de conteudo.
 *
 * Sugere o proximo passo ao leitor, com uma frase curta de continuidade.
 * Limitado a poucos itens para nao virar outro indice; acima de 5,
 * usar uma pagina de indice dedicada.
 */
export interface LinkRelacionado {
  href: string;
  titulo: string;
  descricao: string;
}

export default function LinksRelacionados({ links }: { links: LinkRelacionado[] }) {
  if (links.length === 0) return null;

  return (
    <section aria-label="Paginas relacionadas" className="mt-12 border-t border-border pt-6">
      <h2 className="font-display text-lg font-semibold">Paginas relacionadas</h2>
      <ul className="mt-3 space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="group block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <span className="font-display font-semibold text-primary group-hover:underline">
                {l.titulo}
              </span>
              <span className="mx-2 text-text-soft">—</span>
              <span className="text-[.95em] text-text-soft">{l.descricao}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
