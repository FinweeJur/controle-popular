import type { NextRequest } from "next/server";
import { ipDoCliente } from "@/lib/rate-limit-ip";
import { limitarAltaFrequencia, respostaLimiteExcedido } from "@/lib/rate-limit";

/**
 * `/api/pedido-dados` — Tier 2, etapa 1 do plano de pedidos
 * (PLANO-NAVEGACAO-E-NOTIFICACOES.md).
 *
 * Recebe o pedido do formulário (nome, e-mail, página, tipo, mensagem),
 * valida e NOTIFICA o dono no Telegram na hora — o envio do arquivo segue
 * manual (Tier 0/1) até a etapa 2 (anexo automático via SMTP, a decidir).
 *
 * Segurança:
 * - rate limit por IP (mesma régua do /api/pageview);
 * - honeypot: campo `website` preenchido = bot, responde ok e descarta;
 * - validação de e-mail (regex simples) e tipo ∈ {resumo, csv, pdf};
 * - o e-mail do solicitante NÃO é armazenado — só vai para o Telegram do
 *   dono (canal privado) e some da memória do processo;
 * - sem token/chat configurado, responde ok mesmo assim (o pedido cai no
 *   canal de contato por e-mail, que é o fluxo Tier 0).
 */
export const runtime = "nodejs";

const TIPOS_VALIDOS = new Set(["resumo", "csv", "pdf"]);
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const { permitido, retryAfter } = await limitarAltaFrequencia(ipDoCliente(request));
  if (!permitido) return respostaLimiteExcedido(retryAfter);

  let corpo: Record<string, unknown>;
  try {
    corpo = await request.json();
  } catch {
    return Response.json({ ok: false, error: "json inválido" }, { status: 400 });
  }

  // Honeypot: robô preenche `website`; responde ok (não dá pista) e descarta.
  if (typeof corpo.website === "string" && corpo.website.length > 0) {
    return Response.json({ ok: true });
  }

  const email = String(corpo.email ?? "").trim().slice(0, 200);
  const tipo = String(corpo.tipo ?? "").trim().toLowerCase();
  const pagina = String(corpo.pagina ?? "").trim().slice(0, 300);
  const mensagem = String(corpo.mensagem ?? "").trim().slice(0, 800);

  if (!EMAIL_VALIDO.test(email) || !TIPOS_VALIDOS.has(tipo) || !pagina) {
    return Response.json({ ok: false, error: "campos inválidos" }, { status: 400 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (token && chat) {
    const texto = [
      "📧 Pedido de dados",
      `Tipo: ${tipo}`,
      `Página: ${pagina}`,
      `E-mail: ${email}`,
      `Mensagem: ${mensagem || "—"}`,
    ].join("\n");
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text: texto }),
      });
    } catch {
      // Notificação perdida não vira erro para quem pediu.
    }
  }

  return Response.json({ ok: true });
}
