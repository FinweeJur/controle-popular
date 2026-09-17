import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..");
const envPath = join(RAIZ, "scripts", ".env");

export async function notificarTelegram(texto) {
  if (!existsSync(envPath)) {
    console.log("[Telegram] scripts/.env nao encontrado");
    return false;
  }
  const env = readFileSync(envPath, "utf-8");
  const token = env.match(/^TELEGRAM_BOT_TOKEN=(.+)$/m)?.[1]?.trim();
  const chat = env.match(/^TELEGRAM_CHAT_ID=(.+)$/m)?.[1]?.trim();
  if (!token || !chat) {
    console.log("[Telegram] TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID ausente");
    return false;
  }
  try {
    let res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: texto, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(15000),
    });
    let data = await res.json();
    if (!data.ok) {
      // Fallback para texto puro sem parse_mode
      res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text: texto.replace(/<[^>]*>/g, "") }),
        signal: AbortSignal.timeout(15000),
      });
      data = await res.json();
    }
    console.log(`[Telegram] Status: ${data.ok ? "enviado com sucesso" : "erro na API: " + JSON.stringify(data)}`);
    return data.ok;
  } catch (err) {
    console.error("[Telegram] Falha de conexao:", err.message);
    return false;
  }
}

// Execucao via CLI: node scripts/notificar-telegram.mjs "mensagem"
if (process.argv[1] && process.argv[1].endsWith("notificar-telegram.mjs")) {
  const msg = process.argv.slice(2).join(" ");
  if (msg) {
    await notificarTelegram(msg);
  }
}
