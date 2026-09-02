#!/usr/bin/env node
/**
 * scripts/enviar-doc-dono.mts — envia um ARQUIVO (documento) só para o chat
 * do dono via Telegram, com caption opcional em HTML.
 *
 * Uso:
 *   npx tsx scripts/enviar-doc-dono.mts <caminho-do-arquivo> ["caption"]
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
  const CAMINHO = process.argv[2];
  const CAPTION = process.argv.slice(3).join(" ").trim();
  if (!TOKEN || !CHAT_ID) {
    console.error("TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID ausentes em scripts/.env");
    process.exit(2);
  }
  if (!CAMINHO || !fs.existsSync(CAMINHO)) {
    console.error("Uso: npx tsx scripts/enviar-doc-dono.mts <arquivo> [caption]");
    process.exit(2);
  }
  const form = new FormData();
  form.append("chat_id", CHAT_ID);
  form.append("document", new Blob([fs.readFileSync(CAMINHO)]), path.basename(CAMINHO));
  if (CAPTION) form.append("caption", CAPTION);
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendDocument`, {
    method: "POST",
    body: form,
  });
  if (!r.ok) {
    const corpo = await r.text();
    console.error(`HTTP ${r.status}: ${corpo.slice(0, 300)}`);
    process.exit(1);
  }
  console.log("✅ Documento enviado ao dono.");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
