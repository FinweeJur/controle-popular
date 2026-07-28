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
 *
 * BUG REAL, achado ao escrever a Auth (2026-07-25): este arquivo foi
 * copiado do /congresso no scaffold inicial (F0) e ficou com
 * `"/congresso"` em vez de `"/judiciario"` — nunca disparou porque
 * `withBasePath()` não tinha sido chamado em lugar nenhum até a Auth
 * precisar montar `emailRedirectTo`. Só não virou 404 em produção porque
 * ninguém usou a função ainda; é o tipo exato de bug latente que a nota
 * acima descreve, agora achado ANTES de sair do dev.
 */
export const BASE_PATH = "/judiciario";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
