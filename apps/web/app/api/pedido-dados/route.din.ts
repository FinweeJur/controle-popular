import type { NextRequest } from "next/server";
import { ipDoCliente } from "@/lib/rate-limit-ip";
import { limitarAltaFrequencia, respostaLimiteExcedido } from "@/lib/rate-limit";
import { carregarDatasetCsv } from "@/lib/email/datasets";
import { enviarEmail } from "@/lib/email/enviar-smtp";

/**
 * `/api/pedido-dados` — Tier 2 do plano de pedidos
 * (PLANO-NAVEGACAO-E-NOTIFICACOES.md).
 *
 * Etapa 1 (já no ar): valida o pedido e NOTIFICA o dono no Telegram.
 * Etapa 2 (01/09): quando o pedido é `tipo=csv` com `dataset` na allowlist
 * (`lib/email/datasets.ts`), monta o CSV na hora e ENVIA por e-mail ao
 * solicitante via SMTP (Umbler, STARTTLS — `lib/email/enviar-smtp.ts`).
 * Resumo/PDF seguem manuais (o dono responde anexando).
 *
 * Segurança:
 * - rate limit por IP; honeypot `website`; validação de e-mail;
 * - allowlist ESTRITA de datasets (nada de caminho arbitrário);
 * - o e-mail do solicitante não é armazenado (só viaja no SMTP);
 * - sem SMTP_PASS configurado, responde ok e cai no fluxo manual (Tier 0/1),
 *   ainda notificando o dono no Telegram.
 */
export const runtime = "nodejs";

const TIPOS_VALIDOS = new Set(["resumo", "csv", "pdf"]);
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function notificarDono(linhas: string[]) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: linhas.join("\n") }),
    });
  } catch {
    // Notificação perdida não vira erro para quem pediu.
  }
}

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
  const dataset = String(corpo.dataset ?? "").trim().slice(0, 80);

  if (!EMAIL_VALIDO.test(email) || !TIPOS_VALIDOS.has(tipo) || !pagina) {
    return Response.json({ ok: false, error: "campos inválidos" }, { status: 400 });
  }

  let enviado = false;
  if (tipo === "csv" && dataset) {
    const carregado = carregarDatasetCsv(dataset);
    const smtpPass = process.env.SMTP_PASS;
    if (carregado && smtpPass) {
      try {
        await enviarEmail({
          host: process.env.SMTP_HOST || "smtp.umbler.com",
          port: Number(process.env.SMTP_PORT || "587"),
          usuario: process.env.SMTP_USER || "contato@controlepopular.com.br",
          senha: smtpPass,
          de: process.env.SMTP_USER || "contato@controlepopular.com.br",
          para: email,
          assunto: `Dados solicitados — ${dataset} | Controle Popular`,
          texto:
            `Olá,\n\nSegue em anexo o dataset "${dataset}" em CSV, gerado a partir ` +
            `da página: ${pagina}\n\nEste envio é gratuito e usa dados públicos já ` +
            `publicados no portal (fonte ao lado de cada número).\n\nAbraço,\n` +
            `Controle Popular — contato@controlepopular.com.br`,
          anexos: [{ nome: carregado.nome, tipo: "text/csv", conteudo: carregado.csv }],
        });
        enviado = true;
      } catch {
        enviado = false;
      }
    }
  }

  await notificarDono([
    "📧 Pedido de dados",
    `Tipo: ${tipo}${dataset ? ` (dataset: ${dataset})` : ""}`,
    `Página: ${pagina}`,
    `E-mail: ${email}`,
    `Enviado automático: ${enviado ? "sim ✅" : "não (manual)"}`,
    `Mensagem: ${mensagem || "—"}`,
  ]);

  return Response.json({ ok: true, enviado });
}
