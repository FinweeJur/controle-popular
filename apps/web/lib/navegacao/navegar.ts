/**
 * @file navegar.ts
 * @description Navegação interna por código, sem recarregar o documento.
 *
 * POR QUE EXISTE (dono, 18/11/2026): quatro atalhos internos — busca do topo,
 * sugestões da busca, Seu Nonô e o pet — navegavam com `window.location`. Isso
 * troca o documento inteiro e mata o `<audio>` do rádio e o estado do pet, que
 * vivem no layout raiz (regra 5.13).
 *
 * COMO FUNCIONA: quem navega dispara `cp:navegar`; o `InterceptadorLinks`,
 * que já tem o router do Next e mora no layout raiz, recebe e faz o
 * `router.push`. Assim nenhum componente precisa montar o próprio `useRouter`
 * só para empurrar uma rota — e a navegação continua client-side.
 *
 * Rota externa NÃO passa aqui: `http(s)://` abre em aba nova no próprio
 * chamador. Este canal é só para caminho interno do portal.
 */

/** Evento que entrega o caminho ao interceptor do layout raiz. */
export const EVENTO_NAVEGAR = "cp:navegar";

/**
 * Pede ao layout raiz que navegue para `href` sem recarregar a página.
 * Sem efeito no servidor e quando o interceptor não está montado.
 */
export function navegarInterno(href: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENTO_NAVEGAR, { detail: { href } }));
}
