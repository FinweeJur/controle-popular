#!/usr/bin/env node
/**
 * scripts/ler-mensagens-dono.mts — lê mensagens do chat do dono via
 * long-poll getUpdates, sem imprimir o token.
 *
 * Uso:
 *   npx tsx scripts/ler-mensagens-dono.mts [quantidade] [--offset N]
 *
 * Se --offset for passado, usa N como ponto de partida (e confirma os
 * updates lidos). Sem --offset, apenas espelha a fila sem confirmar.
 *
 * Lê TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID de scripts/.env.
 * Nunca imprime o token. Fail-closed se .env não existir.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = path.join(RAIZ, "scripts", ".env");

function carregarEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

function esc(html: string): string {
  return html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function main() {
  carregarEnv();
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  if (!TOKEN || !CHAT_ID) {
    console.error("TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID ausentes em scripts/.env");
    process.exit(2);
  }
  const args = process.argv.slice(2);
  const limite = Number(args[0] ?? "10");
  const idxOffset = args.indexOf("--offset");
  const offset = idxOffset >= 0 ? Number(args[idxOffset + 1]) : undefined;

  const corpo: Record<string, unknown> = {
    timeout: 5,
    limit: limite,
    allowed_updates: ["message"],
  };
  if (offset !== undefined) corpo.offset = offset;

  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });
  if (!r.ok) {
    console.error(`HTTP ${r.status}`);
    process.exit(1);
  }
  const dados = (await r.json()) as {
    ok: boolean;
    result: Array<{
      update_id: number;
      message?: {
        message_id?: number;
        date?: number;
        chat?: { id?: number; first_name?: string; username?: string };
        from?: { first_name?: string; username?: string; is_bot?: boolean };
        text?: string;
      };
    }>;
  };
  if (!dados.ok) {
    console.error("Telegram respondeu not ok");
    process.exit(1);
  }
  const donoId = String(CHAT_ID);
  let achou = 0;
  for (const up of dados.result) {
    const msg = up.message;
    if (!msg) continue;
    const chat = msg.chat?.id !== undefined ? String(msg.chat.id) : "?";
    const de = msg.from?.first_name ?? msg.from?.username ?? "?";
    const bot = msg.from?.is_bot ? " (bot)" : "";
    const quando = msg.date ? new Date(msg.date * 1000).toISOString() : "?";
    const texto = msg.text !== undefined ? esc(msg.text.slice(0, 2000)) : "(sem texto)";
    console.log(`\n[update ${up.update_id}] chat=${chat} de=${de}${bot} data=${quando}`);
    if (chat === donoId) {
      achou++;
      console.log(`>>> DONO: ${texto}`);
    } else {
      console.log(`    (outro chat): ${texto}`);
    }
  }
  console.log(`\nTotal: ${dados.result.length} update(s), ${achou} do dono.`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
