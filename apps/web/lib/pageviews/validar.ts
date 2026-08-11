/**
 * Validação do `path` recebido por `POST /api/pageview`.
 *
 * Não é rate-limit nem bloqueio de bot — é contador aproximado de página
 * cívica, não métrica de faturamento (ver comentário da migration
 * `0059_page_views.sql`). O objetivo aqui é só recusar o óbvio: alguém
 * gravando uma URL externa (`https://...`) ou uma string gigante na chave
 * primária da tabela.
 */
const PATH_MAX_LEN = 300;

export function pathValido(path: unknown): path is string {
  return (
    typeof path === "string" &&
    path.length > 0 &&
    path.length <= PATH_MAX_LEN &&
    path.startsWith("/") &&
    // "//host/..." é URL absoluta disfarçada (protocol-relative).
    !path.startsWith("//") &&
    !/\s/.test(path) &&
    !path.includes("://")
  );
}
