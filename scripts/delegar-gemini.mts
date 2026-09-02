#!/usr/bin/env node
/**
 * scripts/delegar-gemini.mts — envia uma mensagem de TRABALHO para a sessão
 * Gemini/Antigravity, no chat do dono, com o prefixo "/gemini" para rotear.
 *
 * O dono definiu (02/09/2026): mensagem começando com "/gemini" = só o
 * Gemini/Antigravity considera; "/jcode" = só o jcode (deepseek). Este script
 * usa o MESMO bot para postar no chat do dono com o prefixo /gemini, para
 * que a sessão Gemini que escuta o canal receba a tarefa delegada.
 *
 * Uso:
 *   npx tsx scripts/delegar-gemini.mts "texto da tarefa para o Gemini"
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
    console.error('Uso: npx tsx scripts/delegar-gemini.mts "tarefa"');
    process.exit(2);
  }
  const corpo = `/gemini ${TEXTO}\n\n(delegado pelo jcode via scripts/delegar-gemini.mts)`;
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text: corpo, disable_web_page_preview: true }),
  });
  if (!r.ok) {
    const corpoErro = await r.text();
    console.error(`HTTP ${r.status}: ${corpoErro.slice(0, 300)}`);
    process.exit(1);
  }
  console.log("✅ Tarefa delegada ao Gemini no chat do dono.");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
