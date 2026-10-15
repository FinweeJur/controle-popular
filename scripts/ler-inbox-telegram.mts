import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(RAIZ, "scripts", ".env");

let token = "";
let chat = "";

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m) {
      if (m[1] === "TELEGRAM_BOT_TOKEN") token = m[2].trim().replace(/^['"]|['"]$/g, "");
      if (m[1] === "TELEGRAM_CHAT_ID") chat = m[2].trim().replace(/^['"]|['"]$/g, "");
    }
  }
}

/**
 * URL de webhook do portal — NUNCA apontar para dominio externo
 * (R1 do checar-webhook-telegram.py). O webhook só pode ser do
 * portal oficial ou da API do Telegram.
 */
const WEBHOOK_URL = "https://www.controlepopular.com.br/api/telegram";

/**
 * Timeout de getUpdates: 8s é curto o bastante para não bloquear o cron
 * e longo o bastante para capturar mensagens pendentes. Em caso de 409
 * (sessão concorrente de polling), aguarda e tenta novamente.
 */
const GETUPDATES_TIMEOUT_MS = 8000;
const MAX_TENTATIVAS = 3;

async function getUpdatesComRetry(token: string): Promise<{ ok: boolean; result: unknown[] }> {
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/getUpdates?offset=-20`,
        { signal: AbortSignal.timeout(GETUPDATES_TIMEOUT_MS) }
      );
      const json = await res.json() as { ok: boolean; result?: unknown[] };
      if (json.ok) return { ok: true, result: json.result ?? [] };
      // 409 Conflict = outra sessão de polling ativa — espera e retry
      if (res.status === 409 && tentativa < MAX_TENTATIVAS) {
        console.error(`⚠️ getUpdates 409 (sessão concorrente) — tentativa ${tentativa}/${MAX_TENTATIVAS}`);
        await new Promise(r => setTimeout(r, 3000 * tentativa));
        continue;
      }
      console.error(`❌ getUpdates HTTP ${res.status}:`, json);
      return { ok: false, result: [] };
    } catch (e) {
      if (tentativa < MAX_TENTATIVAS) {
        console.error(`⚠️ Erro de rede em getUpdates — tentativa ${tentativa}/${MAX_TENTATIVAS}`);
        await new Promise(r => setTimeout(r, 3000 * tentativa));
        continue;
      }
      console.error(`❌ getUpdates falhou após ${MAX_TENTATIVAS} tentativas:`, (e as Error).message);
      return { ok: false, result: [] };
    }
  }
  return { ok: false, result: [] };
}

async function main() {
  if (!token || !chat) {
    console.error("TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID ausentes em scripts/.env");
    process.exit(2);
  }

  console.log("1. Removendo webhook temporariamente...");
  const delRes = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
  const delJson = await delRes.json();
  console.log("Delete webhook:", JSON.stringify(delJson));

  console.log("2. Buscando updates recentes com getUpdates...");
  const { ok, result } = await getUpdatesComRetry(token);

  console.log("3. Restaurando webhook do portal...");
  const setRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      allowed_updates: ["message", "edited_message", "channel_post", "edited_channel_post"]
    })
  });
  const setJson = await setRes.json();
  console.log("Set webhook:", JSON.stringify(setJson));

  console.log("\n================ MENSAGENS RECEBIDAS ================");
  if (ok && Array.isArray(result)) {
    console.log(`Total de mensagens: ${result.length}`);
    let mensagens = 0;
    for (const item of result) {
      const msg = (item as { message?: { date?: number; from?: { first_name?: string; username?: string }; text?: string }; edited_message?: { date?: number; from?: { first_name?: string; username?: string }; text?: string }; channel_post?: { date?: number; from?: { first_name?: string; username?: string }; text?: string } }).message ||
        (item as { message?: unknown; edited_message?: { date?: number; from?: { first_name?: string; username?: string }; text?: string }; channel_post?: unknown }).edited_message ||
        (item as { message?: unknown; edited_message?: unknown; channel_post?: { date?: number; from?: { first_name?: string; username?: string }; text?: string } }).channel_post;
      if (msg) {
        const data = new Date((msg.date || 0) * 1000).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const de = msg.from?.first_name || msg.from?.username || "desconhecido";
        console.log(`\n[${data}] De: ${de} (id: ${(item as { update_id?: number }).update_id})`);
        console.log(`Texto: ${msg.text || "(sem texto)"}`);
        mensagens++;
      }
    }
    if (mensagens === 0 && ok) {
      console.log("(nenhuma mensagem nova)");
    }
  } else {
    console.log("getUpdates falhou — nenhuma mensagem recuperada");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("❌ Erro fatal:", e);
  process.exit(1);
});
