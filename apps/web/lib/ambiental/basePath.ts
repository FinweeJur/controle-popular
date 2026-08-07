/**
 * Deve casar com a pasta da zona em `app/ambiental/`.
 *
 * `next/link` e o router já prefixam a navegação interna sozinhos, mas
 * `fetch()` cru e `<a href>`/`<img src>` montados a partir de string
 * literal NÃO.
 *
 * ⚠️ ESTE É O TRAP Nº 1 DO SCAFFOLD DE ZONA NOVA, e já mordeu uma vez:
 * `lib/judiciario/basePath.ts` nasceu copiado do /congresso e ficou com
 * `"/congresso"` dentro, sem disparar nada até a Auth precisar montar um
 * `emailRedirectTo` meses depois. Por isso `scripts/paridade-ambiental.mts`
 * confere que toda URL emitida por esta zona começa com `/ambiental` —
 * a conferência é automática justamente porque a leitura humana não pega.
 */
export const BASE_PATH = "/ambiental";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
