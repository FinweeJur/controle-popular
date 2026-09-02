#!/usr/bin/env node
/**
 * scripts/ouvir-telegram-gemini.mts — Verifica mensagens do Telegram para o Gemini.
 *
 * Lê `logs/telegram-inbox.jsonl` procurando comandos com "/gemini" ou direcionados
 * ao Gemini/Antigravity, rastreia o que já foi lido em `scripts/.gemini-telegram-offset`
 * e opcionalmente consulta a API do Telegram se houver mensagens pendentes.
 *
 * Nunca expõe segredos. Fail-closed se .env não existir.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = path.join(RAIZ, "scripts", ".env");
const INBOX_PATH = path.join(RAIZ, "logs", "telegram-inbox.jsonl");
const GEMINI_OFFSET_PATH = path.join(RAIZ, "scripts", ".gemini-telegram-offset");

function carregarEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

function lerOffsetGemini(): number {
  try {
    if (fs.existsSync(GEMINI_OFFSET_PATH)) {
      return Number(fs.readFileSync(GEMINI_OFFSET_PATH, "utf-8").trim()) || 0;
    }
  } catch {}
  return 0;
}

function salvarOffsetGemini(n: number) {
  try {
    fs.writeFileSync(GEMINI_OFFSET_PATH, String(n), "utf-8");
  } catch {}
}

interface MensagemInbox {
  recebido_em: string;
  update_id: number;
  de: string;
  texto: string;
}

async function checarNovosUpdates(token: string, ultimoId: number): Promise<MensagemInbox[]> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offset: ultimoId > 0 ? ultimoId + 1 : undefined,
        limit: 10,
        timeout: 2,
        allowed_updates: ["message"],
      }),
    });
    if (!res.ok) return [];
    const dados = (await res.json()) as {
      ok: boolean;
      result?: Array<{
        update_id: number;
        message?: {
          date?: number;
          from?: { first_name?: string; username?: string };
          text?: string;
        };
      }>;
    };
    if (!dados.ok || !dados.result) return [];

    const novas: MensagemInbox[] = [];
    for (const u of dados.result) {
      if (u.message?.text) {
        const item: MensagemInbox = {
          recebido_em: new Date((u.message.date || Date.now() / 1000) * 1000).toISOString(),
          update_id: u.update_id,
          de: u.message.from?.first_name || u.message.from?.username || "Desconhecido",
          texto: u.message.text,
        };
        novas.push(item);
        // Anexa ao inbox local para histórico unificado
        fs.mkdirSync(path.dirname(INBOX_PATH), { recursive: true });
        fs.appendFileSync(INBOX_PATH, JSON.stringify(item) + "\n", "utf-8");
      }
    }
    return novas;
  } catch {
    return [];
  }
}

async function main() {
  carregarEnv();
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  let ultimoOffsetLido = lerOffsetGemini();

  // 1. Lê inbox local existente
  const todasMensagens: MensagemInbox[] = [];
  if (fs.existsSync(INBOX_PATH)) {
    const linhas = fs.readFileSync(INBOX_PATH, "utf-8").split(/\r?\n/).filter(Boolean);
    for (const l of linhas) {
      try {
        todasMensagens.push(JSON.parse(l));
      } catch {}
    }
  }

  let maiorUpdateId = todasMensagens.reduce((max, m) => Math.max(max, m.update_id || 0), 0);

  // 2. Se tiver token, confere se há mensagens mais recentes pendentes no Telegram
  if (TOKEN) {
    const novidades = await checarNovosUpdates(TOKEN, maiorUpdateId);
    todasMensagens.push(...novidades);
    for (const n of novidades) {
      maiorUpdateId = Math.max(maiorUpdateId, n.update_id);
    }
  }

  // 3. Filtra mensagens novas direcionadas ao Gemini
  const comandosGemini = todasMensagens.filter(
    (m) =>
      m.update_id > ultimoOffsetLido &&
      (m.texto.startsWith("/gemini") ||
        m.texto.toLowerCase().includes("@gemini") ||
        m.texto.toLowerCase().includes("para o gemini"))
  );

  if (comandosGemini.length === 0) {
    console.log(`🤖 [Gemini] Nenhuma mensagem nova pendente no Telegram (último update verificado: ${maiorUpdateId}).`);
    return;
  }

  console.log(`🤖 [Gemini] ${comandosGemini.length} novo(s) comando(s) recebido(s) via Telegram:\n`);
  for (const cmd of comandosGemini) {
    console.log(`────────────────────────────────────────`);
    console.log(`📅 Recebido em: ${cmd.recebido_em} (update_id: ${cmd.update_id})`);
    console.log(`👤 De: ${cmd.de}`);
    console.log(`💬 Texto:\n${cmd.texto}\n`);
    salvarOffsetGemini(cmd.update_id);
  }
}

main().catch(console.error);
