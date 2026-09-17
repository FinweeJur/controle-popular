#!/usr/bin/env node
/**
 * scripts/passo-telegram.mts — relatório de etapa de trabalho, SÓ para o
 * dono (TELEGRAM_CHAT_ID de scripts/.env). Sem broadcast nos inscritos.
 *
 * Uso:
 *   npx tsx scripts/passo-telegram.mts "✅ etapa X concluída — próximo: Y"
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(RAIZ, "scripts", ".env");
if (fs.existsSync(envPath)) {
  for (const linha of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DONO = process.env.TELEGRAM_CHAT_ID;
const TEXTO = process.argv.slice(2).join(" ").trim();
if (!TOKEN || !DONO) { console.error("credenciais ausentes em scripts/.env"); process.exit(2); }
if (!TEXTO) { console.error('uso: npx tsx scripts/passo-telegram.mts "mensagem"'); process.exit(2); }

const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ chat_id: DONO, text: TEXTO }),
});
console.log(r.ok ? "📣 etapa reportada" : `falha HTTP ${r.status}`);
process.exit(r.ok ? 0 : 1);
