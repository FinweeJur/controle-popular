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
 * Esta é a FONTE ÚNICA da ordem dos cabeçalhos. `lib/chat-comum.ts`
 * (`ipDoVisitante`) delega para cá, trocando só o sentinela de "sem cabeçalho"
 * para `"anon"` — a unificação que o TODO anterior pedia, feita em 30/09/2026.
 */
export function ipDoCliente(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const primeiro = forwarded.split(",")[0]?.trim();
    if (primeiro) return primeiro;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "desconhecido";
}
