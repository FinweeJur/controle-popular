/**
 * IP do cliente a partir do cabeçalho que a PRÓPRIA Cloudflare seta na
 * borda, sobrescrevendo qualquer valor que a requisição tente forjar.
 *
 * `CF-Connecting-IP`, não `X-Forwarded-For`: o segundo é o padrão de facto
 * de proxy, mas nada impede o cliente de mandar o seu próprio antes de
 * chegar na borda — a Cloudflare o REPASSA (às vezes acrescenta), não o
 * substitui. `CF-Connecting-IP` só existe se a requisição realmente veio
 * pela borda da Cloudflare, que o cliente não alcança para sobrescrever.
 *
 * ⚠️ DUPLICADO DE PROPÓSITO: `lib/chat-comum.ts` está sendo corrigido para
 * o mesmo `CF-Connecting-IP` em paralelo, por outro agente, no mesmo
 * commit-window — editá-lo aqui colidiria. TODO depois do merge dos dois:
 * unificar esta função com a de lá num só lugar (ela hoje só existe em
 * `responderAssistente`, inline).
 */
export function ipDoCliente(request: Request): string {
  return request.headers.get("cf-connecting-ip") || "desconhecido";
}
