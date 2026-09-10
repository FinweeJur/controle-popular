#!/usr/bin/env node
/**
 * 🛡️ Vigia Servidor — verifica health do Controle Popular
 *
 * Cuida do protocolo:
 * - HTTP health check (5s timeout)
 * - se erro, envia notificação Telegram via curl DETACHED (sem janela)
 * - stdout vazio = tudo OK (silent watchdog)
 *
 * Execução: node --input-type=module scripts/vigia-servidor.mts
 * Ou (recomendado): npx tsx scripts/vigia-servidor.mts
 */
import https from "node:https";
import http from "node:http";
import { spawn } from "node:child_process";

const HEALTH_URL = process.env.HEALTH_URL || "https://controlepopular.com.br/";
// Considera 200-302 como "online" (Cloudflare pode redirecionar)
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "-10017250703518";
const TIMEOUT_MS = 5000;
const LOCAL_CHECK = true;

async function checkHealth(url: string): Promise<{ ok: boolean; status: number; error?: string }> {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: TIMEOUT_MS }, (res) => {
      // 200-399 = online (Cloudflare redireciona, Next.js faz SSR redirect)
      const ok = res.statusCode >= 200 && res.statusCode < 400;
      resolve({ ok, status: res.statusCode ?? 0 });
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

function notifyTelegram(msg: string): void {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("⚠️  Credenciais Telegram ausentes");
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
    stdio: "ignore",
    detached: true,
    windowsHide: true,
  });
}

async function main() {
  const result = await checkHealth(HEALTH_URL);

  if (!result.ok) {
    const local = LOCAL_CHECK ? await checkLocal() : { ok: false };

    if (local.ok) {
      notifyTelegram(
        `⚠️ Controle Popular OFFLINE (HTTPS) — localhost:3000 UP. ` +
        `Cloudflare Tunnel caiu. ⏰ ${new Date().toLocaleString("pt-BR")}`
      );
    } else {
      notifyTelegram(
        `🔴 Controle Popular OFFLINE COMPLETO. ` +
        `Verificar home-pc (next start :3000). ⏰ ${new Date().toLocaleString("pt-BR")}`
      );
    }
    console.error(`[${new Date().toISOString()}] OFFLINE — status=${result.status} erro=${result.error ?? "n/a"}`);
  }
  // stdout vazio = tudo OK → silent watchdog
}

main();
