/**
 * Deve casar com o segmento de rota `app/paraopeba/`.
 *
 * Mesmo arquivo de `lib/congresso/basePath.ts`, `lib/ambiental/basePath.ts` e
 * `lib/judiciario/basePath.ts` — quarta cópia da MESMA convenção, criada
 * junto com o primeiro `layout.tsx` desta zona (22/08/2026). `next/link` e o
 * router já prefixam a navegação interna sozinhos via `lib/paraopeba/link.tsx`,
 * mas `fetch()` cru e `<a href>`/`<img src>` montados a partir de string
 * literal não passam por lá — ver o comentário em `lib/judiciario/basePath.ts`
 * sobre o bug real que essa lacuna já causou numa zona irmã.
 *
 * Regra do repo: todo caminho client-side que não passa por next/link passa
 * por aqui.
 */
export const BASE_PATH = "/paraopeba";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
