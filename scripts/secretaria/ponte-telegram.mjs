#!/usr/bin/env node
/**
 * scripts/secretaria/ponte-telegram.mjs — comando e conversa pelo Telegram.
 *
 * Papel no projeto: o dono fala com os bots pelo Telegram e recebe resposta no
 * mesmo chat. Mesmo desenho da ponte do WhatsApp (grupos OpenSecretario e
 * Trenzim): mensagem entra, bot responde.
 *
 * Fonte das regras: AGENTS.md 5.8 (segredo nunca em log) e 5.15 (soberania).
 *
 * Decisoes tecnicas nao triviais:
 * - Long-poll com offset proprio em arquivo: nao conflita com outros ouvintes.
 * - So o chat do dono e atendido (allowlist por id). Mensagem de terceiro e
 *   ignorada em silencio.
 * - Roteamento: comando que comeca com "fin" vai para o bot Financas; o resto
 *   vai para a Secretaria.
 * - A resposta vem da ultima mensagem de texto do bot (kind "text"); o
 *   `run --wait turn` media timed-out mesmo com o turno concluido.
 * - O token nunca e impresso.
 *
 * Uso: node scripts/secretaria/ponte-telegram.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ENV = path.join(RAIZ, "scripts", ".env");
const OFFSET = path.join(RAIZ, "scripts", ".secretaria-telegram-offset");
const LOG = path.join(process.env.USERPROFILE || ".", ".config", "mausbot", "ponte-telegram.log");

const NODE24 = "C:\\Users\\teste\\AppData\\Local\\Temp\\opencode\\node24\\node-v24.22.0-win-x64\\node.exe";
const CLI = "C:\\nodejs\\node_modules\\openmausbot\\cli.js";
const TOKEN_OMB = "C:\\Users\\teste\\.openmausbot-token";

const BOTS = {
  secretaria: { nome: "Secretaria", id: "6f9f07b9-9e2f-4483-a1f7-d1c9e5b0465a" },
  financas: { nome: "Financas", id: "f9bf693a-de64-4d60-8f86-50cc5688acf2" },
};

function logar(texto) {
  try {
    fs.mkdirSync(path.dirname(LOG), { recursive: true });
    fs.appendFileSync(LOG, `${new Date().toISOString()} ${texto}\n`, "utf-8");
  } catch {
    /* log nao pode derrubar a ponte */
  }
}

function carregarEnv() {
  if (!fs.existsSync(ENV)) return {};
  const saida = {};
  for (const linha of fs.readFileSync(ENV, "utf-8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m) saida[m[1]] = m[2].trim();
  }
  return saida;
}

function lerOffset() {
  try {
    const n = Number(fs.readFileSync(OFFSET, "utf-8").trim());
    return Number.isFinite(n) ? n : undefined;
  } catch {
    return undefined;
  }
}

function gravarOffset(n) {
  fs.writeFileSync(OFFSET, String(n), "utf-8");
}

function rodarCli(args) {
  return new Promise((resolve) => {
    execFile(
      NODE24,
      [CLI, ...args, "--port", "8799", "--token-file", TOKEN_OMB, "--json"],
      { timeout: 120000, maxBuffer: 8 * 1024 * 1024 },
      (erro, stdout) => resolve(erro ? "" : stdout)
    );
  });
}

async function ultimoTexto(botId) {
  const bruto = await rodarCli(["messages", "--bot", botId, "--limit", "6"]);
  try {
    const dados = JSON.parse(bruto);
    const textos = (dados.messages || []).filter(
      (m) => m.role === "bot" && m.kind === "text" && m.text
    );
    return textos.length ? textos[textos.length - 1].text : "";
  } catch {
    return "";
  }
}

async function perguntar(botId, texto) {
  const antes = await ultimoTexto(botId);
  await rodarCli(["send", botId, texto]);
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const agora = await ultimoTexto(botId);
    if (agora && agora !== antes) return agora;
  }
  return "Nao consegui responder em 2 minutos. Tente de novo.";
}

function escolherBot(texto) {
  const t = (texto || "").trim().toLowerCase();
  if (t.startsWith("fin") || t.startsWith("/fin")) return BOTS.financas;
  return BOTS.secretaria;
}

async function enviar(token, chat, texto) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: texto }),
    signal: AbortSignal.timeout(20000),
  });
}

async function main() {
  const env = carregarEnv();
  const token = process.env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN;
  const dono = Number(env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID || 0);
  if (!token || !dono) {
    logar("sem TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID: ponte nao sobe");
    return;
  }
  logar("ponte do telegram no ar");
  let offset = lerOffset();

  for (;;) {
    try {
      const url = new URL(`https://api.telegram.org/bot${token}/getUpdates`);
      if (offset !== undefined) url.searchParams.set("offset", String(offset));
      url.searchParams.set("timeout", "50");
      const r = await fetch(url, { signal: AbortSignal.timeout(70000) });
      const dados = await r.json();
      for (const u of dados.result || []) {
        offset = u.update_id + 1;
        gravarOffset(offset);
        const msg = u.message;
        if (!msg || !msg.text) continue;
        if (Number(msg.chat.id) !== dono) {
          logar(`ignorado: chat ${msg.chat.id}`);
          continue;
        }
        const bot = escolherBot(msg.text);
        logar(`comando para ${bot.nome}: ${msg.text.slice(0, 60)}`);
        const resposta = await perguntar(bot.id, msg.text);
        await enviar(token, msg.chat.id, resposta);
        logar(`resposta enviada (${resposta.length} chars)`);
      }
    } catch (erro) {
      logar(`erro no long-poll: ${erro.message}`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

main();
