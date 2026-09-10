#!/usr/bin/env node
/**
 * 🛡️ Vigia Servidor — verifica health do Controle Popular
 * 
 * Cuida do protocolo:
 * - curl HTTP health check (5s timeout)
 * - se erro, envia notificação Telegram
 * - output vazio = tudo OK (silent watchdog)
 */
import https from "node:https";

const HEALTH_URL = "https://controlepopular.com.br/api/health";
const TIMEOUT_MS = 5000;
const LOCAL_CHECK = true; // também verifica localhost:3000

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
  try {
    const res = await import("node:http").then(http => new Promise((resolve, reject) => {
      const req = http.get("http://127.0.0.1:3000", { timeout: 3000 }, (r) => resolve({ ok: r.statusCode === 200, status: r.statusCode }));
      req.on("error", reject);
      req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
    }));
    return res;
  } catch { return { ok: false, error: "next start offline" }; }
}

async function main() {
  const result = await checkHealth(HEALTH_URL);
  
  if (!result.ok) {
    if (LOCAL_CHECK) {
      const local = await checkLocal();
      if (local.ok) {
        console.log(`[${new Date().toISOString()}] ⚠️ site offline (localhost 3000 UP)`);
        // Telegram alert
        try {
          await import("child_process").then(cp => {
            const env = process.env.TELEGRAM_BOT_TOKEN;
            const chat = process.env.TELEGRAM_CHAT_ID;
            if (env && chat) {
              const msg = `⚠️ Controle Popular OFFLINE em ${new Date().toLocaleString('pt-BR')} -- localhost:3000 está UP, mas HTTPS falhou`;
              cp.execSync(`curl -s "https://api.telegram.org/bot${env}/sendMessage" -d chat_id="${chat}" -d text="${encodeURIComponent(msg)}"`);
            }
          });
        } catch {}
      }
    }
    console.log(`[${new Date().toISOString()}] 🔴 site OFFLINE (${result.status} ${result.error ?? ''})`);
  }
  // silent (empty stdout) = all good — watchdog pattern
}

main();
