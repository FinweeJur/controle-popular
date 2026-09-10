#!/usr/bin/env node
/**
 * 🛡️ Vigia Servidor — verifica health do Controle Popular
 *
 * Cuida do protocolo:
 * - HTTP health check (5s timeout)
 * - se erro, envia notificação Telegram via curl DETACHED (sem janela)
 * - stdout vazio = tudo OK (silent watchdog)
 */
import https from "node:https";
import http from "node:http";
import { spawn } from "node:child_process";

// 🔧 Config: carregado do scripts/.env ou process.env
const HEALTH_URL = process.env.HEALTH_URL || "https://controlepopular.com.br/api/health";
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "-10017250703518";
const TIMEOUT_MS = 5000;
const LOCAL_CHECK = true;

async function checkHealth(url: string): Promise<{ ok: boolean; status: number; error?: string }> {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: TIMEOUT_MS }, (res) => {
      resolve({ ok: res.statusCode === 200, status: res.statusCode ?? 0 });
    });
    req.on("error", (err) => resolve({ ok: false, status: 0, error: err.message }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, status: 0, error: "timeout" }); });
  });
}

async function checkLocal(): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const req = http.get("http://127.0.0.1:3000", { timeout: 3000 }, (res) => {
      resolve({ ok: res.statusCode === 200, status: res.statusCode });
    });
    req.on("error", (err) => resolve({ ok: false, error: err.message }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
  });
}

/**
 * Envia mensagem via Telegram sem abrir janela no Windows.
 * Usa spawn com windowsHide + stdio:ignore + detached.
 */
function notifyTelegram(msg: string): void {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("⚠️  Credenciais Telegram ausentes (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)");
    return;
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  spawn("curl", [
    "-s",
    "--max-time", "10",
    url,
    "-d", `chat_id=${TELEGRAM_CHAT_ID}`,
    "-d", `text=${encodeURIComponent(msg)}`,
  ], {
    stdio: "ignore",        // não herda stdin/stdout/stderr
    detached: true,         // separa do processo pai
    windowsHide: true,      // ← chave: não abre janela no Windows
  });
}

async function main() {
  const result = await checkHealth(HEALTH_URL);

  if (!result.ok) {
    const local = LOCAL_CHECK ? await checkLocal() : { ok: false };

    if (local.ok) {
      // Site offline no ar (HTTPS falhou) mas localhost está UP → Cloudflare Tunnel caiu
      notifyTelegram(
        `⚠️ Controle Popular OFFLINE (HTTPS) — localhost:3000 UP. Cloudflare Tunnel/caiu. ` +
        `⏰ ${new Date().toLocaleString("pt-BR")}`
      );
    } else {
      // Tanto HTTPS quanto localhost falhando → next start caiu
      notifyTelegram(
        `🔴 Controle Popular OFFLINE COMPLETO — HTTPS e localhost:3000 caíram. ` +
        `Verificar home-pc (next start :3000). ⏰ ${new Date().toLocaleString("pt-BR")}`
      );
    }
    // stderr visível pra debugging do cron
    console.error(`[${new Date().toISOString()}] OFFLINE — status=${result.status} erro=${result.error ?? "n/a"}`);
  }
  // stdout vazio = tudo OK → watchdog silencioso
}

main();
