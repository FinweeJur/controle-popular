/**
 * Sumario interno de uma pagina de conteudo.
 *
 * Recebe a lista de secoes extraida dos h2 da pagina e renderiza ancora
 * para cada uma. Usado pelo padrao wiki: paginas longas ganham um indice
 * rapido no topo, antes do primeiro paragrafo.
 *
 * Acessibilidade:
 * - <nav> com aria-label proprio;
 * - links com texto igual ao titulo da secao (leitor de tela anuncia o destino);
 * - foco visivel herdado do design system.
 */
export interface ItemIndice {
  id: string;
  titulo: string;
}

export default function IndiceWiki({ itens }: { itens: ItemIndice[] }) {
  if (itens.length < 2) return null;

  return (
    <nav
      aria-label="Sumário desta página"
      className="my-8 rounded-2xl border border-border bg-surface-2/70 p-5 sm:p-6 shadow-sm backdrop-blur"
    >
      <h2 className="font-display text-xs font-semibold uppercase tracking-wider text-text-soft">
        Nesta página ({itens.length} seções)
      </h2>
      <ol className="mt-3 space-y-1.5 border-t border-border/80 pt-3">
        {itens.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="inline-block text-[.95em] text-primary hover:underline hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-focus transition-colors"
            >
              {item.titulo}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
