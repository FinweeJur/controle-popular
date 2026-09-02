#!/usr/bin/env node
/**
 * scripts/escuta-telegram.mts — ouvinte contínuo do chat do dono.
 *
 * Roda em long-poll durante a sessão, grava mensagens novas do dono em
 * logs/telegram-inbox.jsonl e manda um "recebido" imediato. Não imprime
 * token. Mantém offset próprio em scripts/.jcode-telegram-offset para não
 * conflitar com o .gatilho-offset do bot de comandos.
 *
 * Uso:
 *   npx tsx scripts/escuta-telegram.mts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = path.join(RAIZ, "scripts", ".env");
const OFFSET_PATH = path.join(RAIZ, "scripts", ".jcode-telegram-offset");
const INBOX_PATH = path.join(RAIZ, "logs", "telegram-inbox.jsonl");

function carregarEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

function lerOffset(): number | undefined {
  try {
    const n = Number(fs.readFileSync(OFFSET_PATH, "utf-8").trim());
    return Number.isFinite(n) ? n : undefined;
  } catch {
    return undefined;
  }
}

function gravarOffset(n: number) {
  fs.writeFileSync(OFFSET_PATH, String(n), "utf-8");
}

function anexarInbox(linha: string) {
  fs.mkdirSync(path.dirname(INBOX_PATH), { recursive: true });
  fs.appendFileSync(INBOX_PATH, linha + "\n", "utf-8");
}

async function api(metodo: string, corpo: Record<string, unknown>, token: string) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${metodo}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });
  return { ok: r.ok, status: r.status, json: (await r.json()) as Record<string, unknown> };
}

async function main() {
  carregarEnv();
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const DONO = process.env.TELEGRAM_CHAT_ID;
  if (!TOKEN || !DONO) {
    console.error("TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID ausentes em scripts/.env");
    process.exit(2);
  }
  let offset = lerOffset();
  console.log("👂 Escuta Telegram iniciada. Offset inicial:", offset ?? "(nenhum)");
  let desdeUltimoBatimento = Date.now();
  const BATIMENTO_MS = 20_000; // a cada ~20s, respira para o watchdog

  // Loop infinito: getUpdates curto, grava, agradece.
  // Retorna ao loop mesmo em erro de rede (backoff pequeno).
  for (;;) {
    try {
      // Batimento cardíaco: avisa que segue vivo sem floodar.
      if (Date.now() - desdeUltimoBatimento >= BATIMENTO_MS) {
        console.log("💓 escuta-telegram: vivo, aguardando mensagens");
        desdeUltimoBatimento = Date.now();
      }
      const corpo: Record<string, unknown> = {
        timeout: 25,
        limit: 20,
        allowed_updates: ["message"],
      };
      if (offset !== undefined) corpo.offset = offset + 1;
      const res = await api("getUpdates", corpo, TOKEN);
      if (!res.ok) {
        console.error(`⚠️ getUpdates HTTP ${res.status} — aguardando 5s`);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      const result = (res.json.result ?? []) as Array<{
        update_id: number;
        message?: {
          date?: number;
          chat?: { id?: number; first_name?: string; username?: string };
          from?: { first_name?: string; username?: string; is_bot?: boolean };
          text?: string;
        };
      }>;
      let maior = offset ?? 0;
      for (const up of result) {
        if (up.update_id > maior) maior = up.update_id;
        const msg = up.message;
        if (!msg || !msg.text) continue;
        const chat = msg.chat?.id !== undefined ? String(msg.chat.id) : "?";
        if (chat !== String(DONO)) continue;
        const de = msg.from?.first_name ?? msg.from?.username ?? "dono";
        const quando = new Date().toISOString();
        const registro = {
          recebido_em: quando,
          update_id: up.update_id,
          de,
          texto: msg.text.slice(0, 3000),
        };
        anexarInbox(JSON.stringify(registro));
        console.log(`📩 [${quando}] ${de}: ${msg.text.slice(0, 200)}`);
        // Aviso imediato, resposta elaborada vem depois pelo agente.
        await api("sendMessage", {
          chat_id: DONO,
          text: "✅ Recebi, Artur! Anotei aqui e já te respondo. 📋",
          disable_web_page_preview: true,
        }, TOKEN);
      }
      if (maior > (offset ?? 0)) {
        offset = maior;
        gravarOffset(maior);
      }
    } catch (e) {
      console.error("❌ Erro no loop:", (e as Error).message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
