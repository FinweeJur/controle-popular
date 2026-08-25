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
    <nav aria-label="Sumario desta pagina" className="my-6 rounded-lg border border-border bg-surface p-4">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-text-soft">
        Nesta pagina
      </h2>
      <ol className="mt-2 space-y-1">
        {itens.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-[.95em] text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              {item.titulo}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
