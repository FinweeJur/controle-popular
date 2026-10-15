#!/usr/bin/env node
/**
 * scripts/notificar-whatsapp.mjs — Notificação para o WhatsApp via outbox.
 *
 * Escreve uma mensagem em logs/whatsapp-outbox.jsonl, que o bot Go
 * (bots/whatsapp/whatsapp-bot) pega e envia pelo WhatsApp.
 *
 * Mesmo padrão de scripts/notificar-telegram.mjs, mas sem API direta
 * (o WhatsApp exige a lib whatsmeow em Go).
 *
 * Uso:
 *   node scripts/notificar-whatsapp.mjs "Mensagem de teste"
 *   node scripts/notificar-whatsapp.mjs --grupo "1234567890-1234567890@g.us" "Mensagem"
 */
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..");
const OUTBOX = path.join(RAIZ, "logs", "whatsapp-outbox.jsonl");

const args = process.argv.slice(2);
let grupo = "";
let texto = "";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--grupo" && i + 1 < args.length) {
    grupo = args[++i];
  } else {
    texto += (texto ? " " : "") + args[i];
  }
}

if (!texto) {
  console.error("Uso: node scripts/notificar-whatsapp.mjs [--grupo JID] \"mensagem\"");
  process.exit(1);
}

const entry = {
  recebido_em: new Date().toISOString(),
  texto: texto,
  grupo: grupo,
};

const dir = path.dirname(OUTBOX);
fs.mkdirSync(dir, { recursive: true });
fs.appendFileSync(OUTBOX, JSON.stringify(entry) + "\n", "utf-8");
console.log(`✅ Mensagem escrita no outbox (${OUTBOX}). O bot Go enviará automaticamente.`);
