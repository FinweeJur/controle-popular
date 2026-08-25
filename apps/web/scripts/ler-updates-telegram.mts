/**
 * Lê as últimas mensagens recebidas pelo bot (@controlepopularbot).
 *   npx tsx scripts/ler-updates-telegram.mts [quantidade]
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const ENV_PATH = path.resolve(process.cwd(), "..", "..", "scripts", ".env");

function lerEnv(caminho: string): Record<string, string> {
  try {
    const saida: Record<string, string> = {};
    for (const linha of readFileSync(caminho, "utf8").split(/\r?\n/)) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(linha.trim());
      if (m && !linha.startsWith("#")) saida[m[1]] = m[2];
    }
    return saida;
  } catch {
    return {};
  }
}

const env = { ...lerEnv(ENV_PATH), ...process.env };
const TOKEN = env.TELEGRAM_BOT_TOKEN || "";
const QTD = Number(process.argv[2] ?? 5);

if (!TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN ausente");
  process.exit(1);
}

const resp = await fetch(
  `https://api.telegram.org/bot${TOKEN}/getUpdates?limit=${QTD}&offset=-${QTD}`
);
const dados = (await resp.json()) as {
  ok?: boolean;
  result?: { update_id: number; message?: { date: number; text?: string; chat?: { id?: number } } }[];
};

if (!dados.ok || !dados.result?.length) {
  console.log("(sem mensagens novas)");
  process.exit(0);
}

for (const u of dados.result) {
  const msg = u.message;
  const quando = msg?.date ? new Date(msg.date * 1000).toLocaleString("pt-BR") : "?";
  console.log(`#${u.update_id} ${quando} [chat ${msg?.chat?.id}] ${msg?.text ?? "(sem texto)"}`);
}
