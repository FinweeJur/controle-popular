/**
 * Slug de âncora do sumário de página (`IndicePagina`).
 *
 * Função PURA extraída do componente de cliente em 30/09/2026: o `vitest`
 * roda os testes de `lib/`, então aqui o slug é testável sem montar o
 * componente. A receita é a mesma da busca — sem acento, minúsculo,
 * não-alfanumérico vira hífen. Título só de símbolos cai em `secao-<idx>`,
 * porque âncora vazia quebraria o link `#`.
 */
export function slugDeTitulo(texto: string, idx: number): string {
  const limpo = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return limpo || `secao-${idx}`;
}

/**
 * Um item do sumário: âncora e título de um heading da página.
 *
 * `nivel` 2 = h2, 3 = h3 — o h3 recua no sumário do rodapé. Extraído do
 * componente `IndicePagina` em 13/10/2026 junto com `coletarSecoes`, porque
 * o widget lateral de Capítulos passou a consumir a MESMA coleta: dois
 * componentes precisavam dos mesmos ids, e id divergente virava link morto.
 */
export interface SecaoIndice {
  id: string;
  titulo: string;
  nivel: 2 | 3;
}

/**
 * Varre um container do DOM pelos headings h2/h3 e devolve os itens do
 * sumário, garantindo que cada heading tenha id de âncora.
 *
 * É a função compartilhada entre o sumário do rodapé (`IndicePagina`) e o
 * widget lateral de Capítulos (`CapitulosFlutuantes`): ambos chamam esta
 * função, então o slug gerado é idêntico nos dois lugares (quem chegar
 * primeiro grava o id; quem chegar depois reutiliza). Extraída para `lib/`
 * porque o vitest roda testes de `lib/` e DOM puro de componente não tem
 * teste (mesmo motivo da extração do `slugDeTitulo`, 30/09/2026).
 *
 * Regras: ignora headings dentro do próprio sumário ou de <header> inicial;
 * texto vazio não vira item; título só de símbolos cai no fallback
 * `secao-<idx>` do slug. O chamador observa os ids para scroll-spy.
 *
 * @param container nó raiz da varredura (normalmente `main`)
 * @returns itens em ordem de documento; o chamador decide o corte (ex.: só h2)
 */
export function coletarSecoes(container: ParentNode): SecaoIndice[] {
  const headings = Array.from(
    container.querySelectorAll("h2, h3")
  ) as HTMLElement[];

  const itens: SecaoIndice[] = [];

  headings.forEach((heading, idx) => {
    // Ignora headings do próprio índice ou modais
    if (heading.closest("[aria-label='Sumário desta página']")) return;
    if (heading.closest("header") && idx === 0) return;

    const texto = heading.textContent?.trim() || "";
    if (!texto) return;

    let id = heading.id;
    if (!id) {
      id = slugDeTitulo(texto, idx);
      heading.id = id;
    }

    itens.push({
      id,
      titulo: texto,
      nivel: heading.tagName.toLowerCase() === "h3" ? 3 : 2,
    });
  });

  return itens;
}
