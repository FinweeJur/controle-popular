/**
 * Deve casar com `basePath` em next.config.ts.
 *
 * `next/link` e o router já prefixam a navegação interna sozinhos, mas
 * `fetch()` cru e `<a href>`/`<img src>` montados a partir de string
 * literal NÃO — no app irmão (/betim) isso foi um 404 silencioso real em
 * dois lugares diferentes (POST de formulário e link de export CSV), cada
 * um só descoberto em teste ponta a ponta no browser, porque nada quebra
 * em dev isolado.
 *
 * Regra do repo: todo caminho client-side que não passa por next/link
 * passa por aqui.
 */
export const BASE_PATH = "/congresso";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
