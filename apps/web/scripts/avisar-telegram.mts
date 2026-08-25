/**
 * Envia mensagem para o canal do canário no Telegram (@controlepopularbot).
 * Lê TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID de scripts/.env (nunca versionados).
 *
 *   npx tsx scripts/avisar-telegram.mts "texto da mensagem"
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const ENV_PATH = path.resolve(process.cwd(), "..", "..", "scripts", ".env");

function lerEnv(caminho: string): Record<string, string> {
  try {
    const bruto = readFileSync(caminho, "utf8");
    const saida: Record<string, string> = {};
    for (const linha of bruto.split(/\r?\n/)) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(linha.trim());
      if (m && !linha.trim().startsWith("#")) saida[m[1]] = m[2];
    }
    return saida;
  } catch {
    return {};
  }
}

const env = { ...lerEnv(ENV_PATH), ...process.env };
const TOKEN = env.TELEGRAM_BOT_TOKEN || "";
const CHAT = env.TELEGRAM_CHAT_ID || "";
const MSG = process.argv.slice(2).join(" ") || "(sem mensagem)";

if (!TOKEN || !CHAT) {
  console.error("TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID ausentes em", ENV_PATH);
  process.exit(1);
}

const resp = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ chat_id: CHAT, text: MSG.slice(0, 4000), disable_web_page_preview: true }),
});

const dados = (await resp.json()) as { ok?: boolean; description?: string };
if (!dados.ok) {
  console.error("Telegram recusou:", dados.description);
  process.exit(1);
}
console.log("✓ enviado:", MSG.slice(0, 80));
