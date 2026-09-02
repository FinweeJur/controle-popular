#!/usr/bin/env node
/**
 * scripts/falar-com-dono.mts — envia mensagem SÓ para o chat do dono
 * (TELEGRAM_CHAT_ID), com parse_mode HTML (negrito, itálico, código).
 *
 * Uso:
 *   npx tsx scripts/falar-com-dono.mts "texto com <b>negrito</b> e emoji"
 *
 * Lê TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID de scripts/.env.
 * Nunca imprime o token. Falha fechado se .env não existir.
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

async function main() {
  carregarEnv();
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const TEXTO = process.argv.slice(2).join(" ").trim();
  if (!TOKEN || !CHAT_ID) {
    console.error("TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID ausentes em scripts/.env");
    process.exit(2);
  }
  if (!TEXTO) {
    console.error('Uso: npx tsx scripts/falar-com-dono.mts "mensagem"');
    process.exit(2);
  }
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: TEXTO,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  if (!r.ok) {
    const corpo = await r.text();
    console.error(`HTTP ${r.status}: ${corpo.slice(0, 300)}`);
    process.exit(1);
  }
  console.log("✅ Mensagem enviada ao dono.");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
