#!/usr/bin/env tsx
/**
 * falar-com-dono.mts — envia mensagem do Hermes agente para o dono via Telegram.
 * Uso: npx tsx scripts/falar-com-dono.mts "<texto da resposta>"
 *
 * O Hermes agente responde ao usuário com a diretriz:
 *   ::reply_via script="scripts/falar-com-dono.mts" args="<texto>"
 * (ou similar, dependendo da configuração do cronjob local).
 *
 * Lê TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID de scripts/.env.
 * Nunca imprime o token.
 */
import { readFileSync } from "fs";

const envRaw = readFileSync("scripts/.env", "utf-8");
const cfg: Record<string, string> = {};
for (const line of envRaw.split("\n")) {
  const m = line.match(/^(\w+)=(.*)$/);
  if (m) cfg[m[1]] = m[2];
}

const token = cfg.TELEGRAM_BOT_TOKEN || "";
const chatId = cfg.TELEGRAM_CHAT_ID || "";
const text = process.argv[2] || "";

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN não definido em scripts/.env");
  process.exit(1);
}

if (!text) {
  console.error("Uso: npx tsx scripts/falar-com-dono.mts \"<texto>\"");
  process.exit(1);
}

const url = `https://api.telegram.org/bot${token}/sendMessage`;
const resp = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ chat_id: chatId, text }),
});

if (resp.ok) {
  console.log("✅ Enviado para Telegram");
} else {
  const body = await resp.text();
  console.error(`❌ HTTP ${resp.status}: ${body}`);
}