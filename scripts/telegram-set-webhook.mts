#!/usr/bin/env node
/**
 * Conserta/registra o webhook do bot PÚBLICO do Telegram.
 *
 * ═══ O PROBLEMA QUE ISTO RESOLVE ═══
 *
 * O Telegram entrega as mensagens por **POST** na URL do webhook. A raiz do
 * domínio (`controlepopular.com.br`, sem www) **devolve 301** para o www — e o
 * Telegram **NÃO segue redirect** no webhook: cada update vira erro e o bot
 * fica mudo, sem responder `/menu` nem mostrar os botões. Medido em 30/09/2026:
 * `POST https://controlepopular.com.br/api/telegram` → 301.
 *
 * A cura é registrar o webhook no **www** (`https://www.controlepopular.com.br`),
 * que responde 200 direto.
 *
 * ═══ SEGREDO ═══
 *
 * Lê o token de `scripts/.env` em runtime (mesmo padrão do gatilho-remoto) e
 * NUNCA o imprime — a saída mostra só url, pendências e último erro. Se
 * `TELEGRAM_WEBHOOK_SECRET` estiver no `.env`, registra o `secret_token` junto
 * (o app confere o header `x-telegram-bot-api-secret-token`).
 *
 * Uso:
 *   npx tsx scripts/telegram-set-webhook.mts            # registra no www
 *   npx tsx scripts/telegram-set-webhook.mts --info     # só consulta
 *   npx tsx scripts/telegram-set-webhook.mts --delete    # remove o webhook
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const URL_WEBHOOK = "https://www.controlepopular.com.br/api/telegram";

function lerEnv(caminho: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fs.existsSync(caminho)) return out;
  for (const linha of fs.readFileSync(caminho, "utf-8").split("\n")) {
    const m = linha.match(/^([A-Z_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const ENV = lerEnv(path.join(RAIZ, "scripts", ".env"));
const TOKEN = ENV.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
const SECRET = ENV.TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET || "";

if (!TOKEN) {
  console.error("⛔ TELEGRAM_BOT_TOKEN ausente em scripts/.env — nada a fazer.");
  process.exit(1);
}

async function api(metodo: string, corpo?: Record<string, unknown>) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${metodo}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  return r.json() as Promise<{ ok: boolean; result?: unknown; description?: string }>;
}

async function principal() {
  const argv = process.argv.slice(2);

  if (argv.includes("--delete")) {
    const r = await api("deleteWebhook", { drop_pending_updates: false });
    console.log(r.ok ? "✅ webhook removido." : `⛔ falhou: ${r.description}`);
    return;
  }

  if (!argv.includes("--info")) {
    const r = await api("setWebhook", {
      url: URL_WEBHOOK,
      // Só manda o segredo se ele existir; sem ele o app fica aberto (avisa no log).
      ...(SECRET ? { secret_token: SECRET } : {}),
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    });
    console.log(r.ok ? `✅ webhook registrado em ${URL_WEBHOOK}` : `⛔ setWebhook falhou: ${r.description}`);
    if (!SECRET) console.log("ℹ️  sem TELEGRAM_WEBHOOK_SECRET no .env — webhook sem autenticação.");
  }

  const info = await api("getWebhookInfo");
  const w = (info.result ?? {}) as Record<string, unknown>;
  console.log("\n— getWebhookInfo —");
  console.log("url:", w.url);
  console.log("pending_update_count:", w.pending_update_count ?? 0);
  if (w.last_error_message) {
    const quando = w.last_error_date
      ? new Date(Number(w.last_error_date) * 1000).toISOString()
      : "?";
    console.log("último erro:", quando, "→", w.last_error_message);
  } else {
    console.log("último erro: nenhum");
  }
}

principal().catch((e) => {
  console.error("⛔ erro:", e instanceof Error ? e.message : e);
  process.exit(1);
});
