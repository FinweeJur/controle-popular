/**
 * Formata a resposta do Seu Nonô (RAG) para mensagem do Telegram.
 *
 * Papel no portal: o bot webhook (`app/api/telegram/route.din.ts`) agora
 * responde pergunta livre — o texto vem de `responderComRag` e aqui vira
 * HTML do Telegram com: corpo escapado, fontes numeradas `[n]` linkadas à
 * página do portal e a ressalva de IA com modelo e data (regra editorial
 * do AGENTS.md §7 — resumo de modelo é o portal afirmando).
 *
 * O teto de 4096 caracteres é duro: passar disso o Telegram REJEITA a
 * mensagem inteira, então o corte acontece no texto cru (antes do escape,
 * que infla `&` em `&amp;`) e tem uma última trava por fatia.
 */

import type { FonteRag, RespostaRag } from "@/lib/assistente/embeddings/geracao";

/** Limite rígido do sendMessage (UTF-16 code units bastam: corte aproximado). */
export const LIMITE_TELEGRAM = 4096;

const BASE_PORTAL = "https://www.controlepopular.com.br";

/** Escapa para `parse_mode: "HTML"` do Telegram. */
function esc(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** URL exibível de uma fonte: externa http(s) direta; interna vira rota do portal. */
function urlFonte(f: FonteRag): string {
  const bruta = f.url ?? f.rota ?? "";
  if (/^https?:\/\//i.test(bruta)) return bruta;
  return bruta.startsWith("/") ? BASE_PORTAL + bruta : BASE_PORTAL + "/" + bruta;
}

function blocoFontes(fontes: FonteRag[]): string {
  const uteis = (fontes ?? []).filter((f) => f.url || f.rota).slice(0, 5);
  if (uteis.length === 0) return "";
  return (
    "\n\n📚 Fontes:\n" +
    uteis
      .map((f) => `[${f.indice}] <a href="${esc(urlFonte(f)).replace(/"/g, "")}">${esc(f.titulo ?? urlFonte(f))}</a>`)
      .join("\n")
  );
}

/**
 * Resposta do RAG → texto HTML pronto para o sendMessage.
 * Ordem: corpo, fontes, ressalva de IA. Truncagem com corte no cru + trava final.
 */
export function formatarRespostaNono(
  r: Pick<RespostaRag, "resposta" | "fontes" | "modelo" | "data">,
  limite = LIMITE_TELEGRAM
): string {
  const rodape =
    `\n\n🤖 Resposta de IA (${esc(r.modelo)}, ${r.data.slice(0, 10)}). ` +
    `Conferi a fonte antes de decidir com o número.`;
  const fontes = blocoFontes(r.fontes);
  let corpo = (r.resposta ?? "").trim();
  let saida = esc(corpo) + fontes + rodape;
  if (saida.length > limite) {
    corpo = corpo.slice(0, Math.max(80, corpo.length - (saida.length - limite) - 16)) + "…";
    saida = esc(corpo) + fontes + rodape;
  }
  if (saida.length > limite) saida = saida.slice(0, limite);
  return saida;
}
