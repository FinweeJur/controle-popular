#!/usr/bin/env node
/**
 * 🛡️ Vigia Servidor — Cão de guarda do next start e saúde do Controle Popular.
 *
 * Roda a cada 5 minutos (tarefa agendada ControlePopular_VigiaServidor_5min).
 * Protocolo de Auto-Recuperação (Google SRE cap. 22):
 * 1. Checa HTTPS (produção) e HTTP (localhost:3000).
 * 2. Se a porta 3000 caiu, tenta restaurar sozinho via publicarTunel().
 * 3. Orçamento de segurança: máx. 3 reinícios por hora para evitar loops.
 * 4. Notifica Telegram em incidentes e restaurações (silent watchdog quando 200).
 * 5. Registra telemetria contínua em docs/relatorios-automacao/vigia-servidor-status.json.
 */
import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { publicarTunel } from "./agent-tools/publicar-tunel.mts";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATUS_FILE = path.join(RAIZ, "docs", "relatorios-automacao", "vigia-servidor-status.json");
const HEARTBEAT_FILE = path.join(RAIZ, "scripts", ".heartbeat-vigia");
const REINICIOS_FILE = path.join(RAIZ, "scripts", ".vigia-reinicios.json");

const MAX_REINICIOS_HORA = 6;
const JANELA_HORA_MS = 60 * 60 * 1000;
const TIMEOUT_MS = 5000;

function carregarEnv() {
  const envPath = path.join(RAIZ, "scripts", ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "").replace(/\r$/, "");
    }
  }
}
carregarEnv();

const HEALTH_URL = process.env.HEALTH_URL || "https://controlepopular.com.br/";
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

async function checkHealth(url: string): Promise<{ ok: boolean; status: number; error?: string }> {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: TIMEOUT_MS }, (res) => {
      const ok = (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 400;
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
    console.error("⚠️ Credenciais Telegram ausentes em scripts/.env");
    return;
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  spawn("curl", [
    "-s",
    "--max-time", "15",
    url,
    "-d", `chat_id=${TELEGRAM_CHAT_ID}`,
    "-d", `text=${encodeURIComponent(msg)}`,
    "-d", "parse_mode=HTML",
  ], {
    stdio: "ignore",
    detached: true,
    windowsHide: true,
  });
}

function obterReiniciosRecentes(): number[] {
  try {
    if (!fs.existsSync(REINICIOS_FILE)) return [];
    const dados = JSON.parse(fs.readFileSync(REINICIOS_FILE, "utf-8"));
    const carimbos = Array.isArray(dados.carimbos) ? dados.carimbos : [];
    const agora = Date.now();
    return carimbos.filter((t: number) => typeof t === "number" && agora - t < JANELA_HORA_MS);
  } catch {
    return [];
  }
}

function registrarReinicio(): number {
  const recentes = obterReiniciosRecentes();
  const agora = Date.now();
  recentes.push(agora);
  try {
    fs.writeFileSync(REINICIOS_FILE, JSON.stringify({ carimbos: recentes }, null, 2), "utf-8");
  } catch {}
  return recentes.length;
}

async function main() {
  const inicio = Date.now();
  let result = await checkHealth(HEALTH_URL);
  const latenciaMs = Date.now() - inicio;

  let local = await checkLocal();

  // Se local está caído, tenta auto-recuperação imediata
  if (!local.ok) {
    const recentes = obterReiniciosRecentes();
    const horaAtual = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    if (recentes.length >= MAX_REINICIOS_HORA) {
      notifyTelegram(
        `⛔ <b>Vigia: Cap de reinícios estourado</b>\n` +
        `O servidor da porta 3000 continua inativo após ${recentes.length} tentativas na última hora.\n` +
        `Intervenção manual necessária (verifique <code>logs/</code>). ⏰ ${horaAtual}`
      );
      console.error(`[${new Date().toISOString()}] CAP ESTOURADO: ${recentes.length} reinícios/hora.`);
    } else {
      console.log(`[${new Date().toISOString()}] Servidor local offline. Tentando auto-recuperação (publicarTunel)...`);
      const subiu = publicarTunel((linha) => console.log(`[vigia] ${linha}`));
      const totalReinicios = registrarReinicio();

      if (subiu) {
        // Testa novamente local e produção
        local = await checkLocal();
        result = await checkHealth(HEALTH_URL);

        notifyTelegram(
          `🟢 <b>Vigia: site restaurado sozinho</b>\n` +
          `O processo do servidor local (porta 3000) tinha morrido.\n` +
          `Reiniciei automaticamente com sucesso!\n` +
          `• Produção: ${result.ok ? "Online (HTTP 200)" : `HTTP ${result.status}`}\n` +
          `• Reinícios nesta hora: ${totalReinicios}/${MAX_REINICIOS_HORA} ⏰ ${horaAtual}`
        );
        console.log(`[${new Date().toISOString()}] Site restaurado sozinho com sucesso.`);
      } else {
        notifyTelegram(
          `🔴 <b>Vigia: falha ao reiniciar o servidor</b>\n` +
          `A porta 3000 não subiu após tentativa de recuperação.\n` +
          `Se o build estiver ausente, rode: <code>npx tsx scripts/rotina-local.mts --so-build</code>. ⏰ ${horaAtual}`
        );
        console.error(`[${new Date().toISOString()}] Falha na auto-recuperação do servidor.`);
      }
    }
  } else if (!result.ok) {
    // Local está 200, mas a URL externa está com erro (problema no Cloudflare Tunnel)
    const horaAtual = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    notifyTelegram(
      `⚠️ <b>Controle Popular: falha externa (HTTPS)</b>\n` +
      `Localhost:3000 está UP (HTTP 200), mas ${HEALTH_URL} retornou HTTP ${result.status}.\n` +
      `Verifique o serviço do Cloudflare Tunnel. ⏰ ${horaAtual}`
    );
    console.error(`[${new Date().toISOString()}] Falha externa: status=${result.status}`);
  }

  // Persistir métricas de monitoramento
  try {
    fs.mkdirSync(path.dirname(STATUS_FILE), { recursive: true });
    const statusObj = {
      atualizadoEm: new Date().toISOString(),
      producaoUrl: HEALTH_URL,
      producaoOk: result.ok,
      producaoStatus: result.status,
      latenciaMs,
      localOk: local.ok,
      erro: result.error ?? null,
    };
    fs.writeFileSync(STATUS_FILE, JSON.stringify(statusObj, null, 2), "utf-8");
    fs.writeFileSync(HEARTBEAT_FILE, new Date().toISOString(), "utf-8");
  } catch {}

  // stdout vazio quando tudo ok (silent watchdog pattern)
  if (result.ok && local.ok) {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Erro no vigia-servidor:", err);
  process.exit(1);
});

