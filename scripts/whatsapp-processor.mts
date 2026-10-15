#!/usr/bin/env node
/**
 * scripts/whatsapp-processor.mts — Processador WhatsApp via Hermes Agent.
 *
 * Lê novas mensagens de logs/whatsapp-inbox.jsonl, envia para o Hermes Agent
 * (via proxy OpenAI-compatible ou CLI fallback), e grava resposta em outbox.
 *
 * Estratégia em cascata (lazy senior dev):
 *   1. Hermes Proxy API  (http://127.0.0.1:8645/v1/chat/completions) — rápido, HTTP persistente
 *   2. Hermes CLI        (hermes chat -q) — full agent + tools, mas mais lento
 *   3. Ollama API        (http://127.0.0.1:11434/api/chat) — fallback local, modelo sabia-finetuned
 *
 * Uso:
 *   npx tsx scripts/whatsapp-processor.mts          # loop 5s
 *   npx tsx scripts/whatsapp-processor.mts --once    # processa uma vez
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const RAIZ = path.resolve(import.meta.dirname, "..");
const INBOX = path.join(RAIZ, "logs", "whatsapp-inbox.jsonl");
const OUTBOX = path.join(RAIZ, "logs", "whatsapp-outbox.jsonl");
const OFFSET_FILE =
  process.env.WHATSAPP_PROCESSOR_OFFSET ||
  path.join(RAIZ, "bots", "whatsapp", ".whatsapp-processor-offset");

// Porta 8645 (hermes proxy start --provider nous --port 8645)
// Modelo FREE testado: upstage/solar-mini4:free ✅
// poolside/laguna-s-2.1:free: 429 (rate-limited)
// ponytail: o proxy verifica créditos na hora — models do Nous Free Account estão esgotados.
// Usar sempre o CLI como fallback primário, proxy como otimização quando houver crédito.
const HERMES_PROXY_URL = "http://127.0.0.1:8645/v1/chat/completions";
const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const HERMES_MODEL = "upstage/solar-mini4:free";
const OLLAMA_MODEL = "sabia-finetuned:latest";
const TMP_QUERY = path.join(RAIZ, "logs", ".whatsapp-query.json");

// ─── 1. Hermes Proxy API (OpenAI-compatible) ──────────────────────────────

function callHermesProxy(query: string): string | null {
  try {
    fs.writeFileSync(
      TMP_QUERY,
      JSON.stringify({
        model: HERMES_MODEL, // usa upstage/solar-mini4:free (grátis no Nous)
        messages: [{ role: "user", content: query }],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    );
    const curlPath = TMP_QUERY.replace(/\\/g, "/");
    const result = execSync(
      `curl -s --max-time 25 -X POST ${HERMES_PROXY_URL} ` +
        `-H "Content-Type: application/json" ` +
        `-d @${curlPath}`,
      { encoding: "utf-8", timeout: 30000, cwd: RAIZ, windowsHide: true },
    );
    const parsed = JSON.parse(result);
    const content = parsed.choices?.[0]?.message?.content?.trim();
    if (content && content.length > 2) return content;
    return null;
  } catch {
    return null;
  }
}

// ─── 2. Hermes CLI (full agent — tools, web search, etc.) ──────────────────

function callHermesCLI(query: string): string | null {
  try {
    const cmd = `hermes chat -q ${JSON.stringify(query)} -Q --max-turns 5 --source whatsapp`;
    const result = execSync(cmd, {
      encoding: "utf-8",
      timeout: 180000, // ponytail: 180s para web search — 120s era insuficiente
      cwd: RAIZ,
      windowsHide: true,
      env: { ...process.env, FORCE_COLOR: "0" },
    });
    const trimmed = result.trim();
    return trimmed.length > 2 ? trimmed : null;
  } catch (e: any) {
    const stdout = e.stdout?.toString().trim();
    if (stdout && stdout.length > 5) return stdout;
    return null;
  }
}

// ─── 3. Ollama fallback (local, rápido) ─────────────────────────────────────

function callOllamaFallback(query: string): string {
  try {
    fs.writeFileSync(
      TMP_QUERY,
      JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: "user", content: query }],
        stream: false,
        options: { temperature: 0.7, num_ctx: 4096 },
      }),
    );
    const curlPath = TMP_QUERY.replace(/\\/g, "/");
    const result = execSync(
      `curl -s --max-time 25 -X POST ${OLLAMA_URL} ` +
        `-H "Content-Type: application/json" ` +
        `-d @${curlPath}`,
      { encoding: "utf-8", timeout: 30000, cwd: RAIZ, windowsHide: true },
    );
    const parsed = JSON.parse(result);
    return parsed.message?.content?.trim() || "⚠️ Sem resposta do modelo.";
  } catch {
    return `⚠️ Hermes e Ollama indisponíveis. Tente novamente em instantes.`;
  }
}

// ─── Interface unificada ────────────────────────────────────────────────────

function callHermes(query: string): string {
  // ponytail: cascade reordenada — Proxy (3s) → Ollama (5s) → CLI (300s)
  // Evita o CLI como 2º passo: ele faz timeout de 120s em msgs complexas,
  // deixando o fallback Ollama sem tempo pra responder.

  // 1. Hermes Proxy API (rápido, LLM grátis: upstage/solar-mini4:free)
  const proxyResult = callHermesProxy(query);
  if (proxyResult) {
    console.log("   [via Hermes Proxy]");
    return proxyResult;
  }

  // 2. Ollama fallback (local, rápido)
  console.log("   [proxy offline — tentando Ollama...]");
  const ollamaResult = callOllamaFallback(query);
  if (ollamaResult && !ollamaResult.startsWith("⚠️")) {
    console.log("   [via Ollama]");
    return ollamaResult;
  }

  // 3. Hermes CLI (full agent — tools, web search — último recurso)
  console.log("   [fallback total — tentando CLI...]");
  const cliResult = callHermesCLI(query);
  if (cliResult) {
    console.log("   [via Hermes CLI]");
    return cliResult;
  }

  // 4. Erro genérico
  if (ollamaResult) return ollamaResult;
  return "⚠️ Hermes e Ollama indisponíveis. Tente novamente em instantes.";
}

// ─── Inbox / Outbox / Offset ────────────────────────────────────────────────

function lerOffset(): number {
  try {
    const data = fs.readFileSync(OFFSET_FILE, "utf-8");
    const n = parseInt(data.trim(), 10);
    return isNaN(n) ? 0 : n;
  } catch {
    return 0;
  }
}

function gravarOffset(n: number) {
  fs.mkdirSync(path.dirname(OFFSET_FILE), { recursive: true });
  fs.writeFileSync(OFFSET_FILE, String(n), "utf-8");
}

function escreverOutbox(texto: string, grupo: string) {
  fs.mkdirSync(path.dirname(OUTBOX), { recursive: true });
  const entry = { texto, grupo: grupo || "" };
  fs.appendFileSync(OUTBOX, JSON.stringify(entry) + "\n", "utf-8");
}

async function processarInbox(): Promise<number> {
  if (!fs.existsSync(INBOX)) return 0;

  const offset = lerOffset();
  const lines = fs
    .readFileSync(INBOX, "utf-8")
    .split(/\r?\n/)
    .filter(Boolean);

  let novas = 0;
  for (let i = offset; i < lines.length; i++) {
    const line = lines[i];
    novas++;

    let entry: any;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    const texto = entry.texto || "";
    if (!texto || texto === "[mensagem não-texto]") {
      console.log(`⏭️  [${entry.de}] mensagem não-texto`);
      gravarOffset(i + 1);
      continue;
    }

    console.log(`📩 [${entry.de}] ${texto.slice(0, 80)}`);
    const resultado = callHermes(texto);
    console.log(`   → ${resultado.slice(0, 80)}...`);

    escreverOutbox(resultado, entry.grupo || "");
    gravarOffset(i + 1);
  }

  return novas;
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const once = args.includes("--once");

  console.log("🤖 WhatsApp Processor (Hermes Agent)");
  console.log(`   ${HERMES_MODEL} (proxy) → CLI → ${OLLAMA_MODEL} (fallback)`);
  console.log(`   ${once ? "(modo --once)" : "(loop 5s)"}`);

  if (once) {
    const count = await processarInbox();
    console.log(`\n📦 ${count} mensagem(ns) processada(s).`);
    return;
  }

  await processarInbox();

  setInterval(async () => {
    try {
      await processarInbox();
    } catch (e) {
      console.error("❌ Erro:", (e as Error).message);
    }
  }, 5000);
}

main().catch((e) => {
  console.error("Falha fatal:", e);
  process.exit(1);
});
