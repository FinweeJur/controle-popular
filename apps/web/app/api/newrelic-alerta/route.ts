import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

/**
 * Relé de alertas do New Relic para o Telegram — /api/newrelic-alerta
 *
 * O QUE E: o New Relic nao fala com o Telegram (o Telegram exige o token do
 * bot). Este endpoint recebe o POST do **Workflow** do New Relic (destino
 * "Webhook") e repassa a mensagem ao chat do dono, reusando o bot que ja
 * existe (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID).
 *
 * FLUXO: erro no portal -> New Relic (Workflow) -> POST aqui -> Telegram.
 *
 * AUTH: se `NEWRELIC_RELAY_SECRET` existir, o POST so passa com o header
 * `x-relay-secret` igual (comparacao em tempo constante). Sem o segredo, a
 * porta fica aberta e avisa no log UMA vez — mesmo compromisso da rota
 * /api/telegram (o dono configura o segredo quando quiser).
 *
 * NAO CONFUNDIR com o webhook do BOT publico (AGENTS §5.11): ali o Telegram
 * chama o portal; aqui o portal (a pedido do New Relic) ENVIA ao Telegram.
 *
 * `force-dynamic` + `runtime nodejs`: le env no runtime e trata POST; nada de
 * pre-render nem de Edge.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Compara o segredo em tempo constante (=== vaza por timing). */
function segredoConfere(header: string | null, secret: string): boolean {
  if (!header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Avisa UMA vez por processo que a porta esta sem autenticacao.
let avisouSemSegredo = false;

/** Extrai os campos que interessam de um payload de alerta do New Relic. */
function resumoAlerta(corpo: Record<string, unknown>): {
  titulo: string;
  estado: string;
  prioridade: string;
  politica: string;
  condicao: string;
  detalhes: string;
  url: string;
} {
  const s = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
  // O payload do Workflow varia; tentamos os nomes conhecidos e caimos no
  // generico. Nunca imprimimos o corpo cru inteiro (pode ter detalhe longo).
  return {
    titulo: s(corpo.title ?? corpo.conditionName ?? corpo.name ?? "Alerta do New Relic"),
    estado: s(corpo.state ?? corpo.eventType ?? corpo.currentState ?? ""),
    prioridade: s(corpo.priority ?? corpo.severity ?? ""),
    politica: s(corpo.policyName ?? corpo.policy ?? ""),
    condicao: s(corpo.conditionName ?? corpo.condition ?? ""),
    detalhes: s(corpo.details ?? corpo.description ?? corpo.message ?? "").slice(0, 600),
    url: s(corpo.issueUrl ?? corpo.url ?? corpo.incidentUrl ?? ""),
  };
}

/** Monta a mensagem HTML para o Telegram. */
function montarMensagem(a: ReturnType<typeof resumoAlerta>): string {
  const linhas = [`🚨 <b>New Relic</b> — ${a.titulo}`];
  const meta = [a.estado && `estado: ${a.estado}`, a.prioridade && `prioridade: ${a.prioridade}`]
    .filter(Boolean)
    .join(" · ");
  if (meta) linhas.push(meta);
  if (a.politica || a.condicao) {
    linhas.push([a.politica, a.condicao].filter(Boolean).join(" · "));
  }
  if (a.detalhes) linhas.push(a.detalhes);
  if (a.url) linhas.push(a.url);
  return linhas.join("\n");
}

export async function POST(req: Request) {
  const secret = process.env.NEWRELIC_RELAY_SECRET;
  if (secret) {
    if (!segredoConfere(req.headers.get("x-relay-secret"), secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } else if (!avisouSemSegredo) {
    avisouSemSegredo = true;
    console.warn(
      "[newrelic-relay] NEWRELIC_RELAY_SECRET ausente — endpoint sem autenticacao. " +
        "Defina o segredo e configure o header x-relay-secret no Workflow do New Relic.",
    );
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) {
    // Sem bot configurado, nao ha o que enviar — respondemos 200 para o New
    // Relic nao ficar retentando o webhook a toa.
    console.warn("[newrelic-relay] TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID ausentes");
    return NextResponse.json({ ok: false, motivo: "telegram-nao-configurado" });
  }

  const texto = montarMensagem(resumoAlerta(corpo));
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: texto, parse_mode: "HTML", disable_web_page_preview: false }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (erro) {
    return NextResponse.json(
      { ok: false, motivo: "falha-telegram", erro: erro instanceof Error ? erro.message : String(erro) },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    descricao: "Rele de alertas do New Relic para o Telegram — Controle Popular",
    autenticacao: process.env.NEWRELIC_RELAY_SECRET ? "x-relay-secret" : "aberta (defina NEWRELIC_RELAY_SECRET)",
    atualizado: new Date().toISOString(),
  });
}
