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
