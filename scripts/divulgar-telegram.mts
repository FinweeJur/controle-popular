#!/usr/bin/env node
/**
 * scripts/divulgar-telegram.mts — envia uma mensagem para TODOS os inscritos
 * do broadcast (scripts/inscritos.json) + o chat do dono.
 *
 * Decisão do dono (01/09/2026): inscrição pública via /comecar no privado do
 * bot; broadcast aberto só para quem está inscrito; comandos de edição só do
 * criador (ver gatilho-remoto.mts).
 *
 * Uso:
 *   npx tsx scripts/divulgar-telegram.mts "Sua mensagem de novidade"
 *
 * Lê TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID de scripts/.env.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARQUIVO_INSCRITOS = path.join(RAIZ, "scripts", "inscritos.json");

function carregarEnv() {
  const envPath = path.join(RAIZ, "scripts", ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
      const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  }
}
carregarEnv();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DONO = process.env.TELEGRAM_CHAT_ID;
const TEXTO = process.argv.slice(2).join(" ").trim();

async function enviar(chatId: number | string, text: string) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} para ${chatId}`);
}

async function main() {
  if (!TOKEN || !DONO) {
    console.error("TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID ausentes em scripts/.env");
    process.exit(2);
  }
  if (!TEXTO) {
    console.error('Uso: npx tsx scripts/divulgar-telegram.mts "mensagem"');
    process.exit(2);
  }
  const alvos = new Set<number>();
  try {
    const lidos = JSON.parse(fs.readFileSync(ARQUIVO_INSCRITOS, "utf-8")) as Array<{ chat_id: number }>;
    if (Array.isArray(lidos)) for (const i of lidos) alvos.add(i.chat_id);
  } catch {
    // lista vazia/inexistente — só o dono recebe
  }
  alvos.add(Number(DONO));

  let ok = 0;
  for (const id of alvos) {
    try {
      await enviar(id, TEXTO);
      ok++;
    } catch (e) {
      console.error("falha para", id, (e as Error).message);
    }
  }
  console.log(`📣 Broadcast: ${ok}/${alvos.size} entregue(s).`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
