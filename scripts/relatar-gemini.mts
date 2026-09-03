#!/usr/bin/env node
/**
 * scripts/relatar-gemini.mts
 * Envia relatório de avanço do agente Gemini / Antigravity para o Telegram do dono.
 * Identifica explicitamente [Gemini] no cabeçalho e detalha o que avançou com emojis.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = path.join(RAIZ, "scripts", ".env");

function carregarEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

carregarEnv();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DONO = process.env.TELEGRAM_CHAT_ID;

if (!TOKEN || !DONO) {
  console.error("TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID ausentes em scripts/.env");
  process.exit(1);
}

const textoBruto = process.argv.slice(2).join(" ").trim();
const texto = textoBruto.replace(/<br\s*\/?>/gi, "\n");

async function enviar() {
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  
  // Tenta com HTML primeiro
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        chat_id: DONO,
        text: texto,
        parse_mode: "HTML",
      }),
    });

    if (res.ok) {
      console.log("✅ Relatório do Gemini enviado com sucesso para o Telegram!");
      return;
    }

    const erro = await res.text();
    // Se falhar por entidade HTML, tenta envio como texto simples
    if (erro.includes("can't parse entities")) {
      const textoSemHtml = texto.replace(/<[^>]*>/g, "");
      const res2 = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(12000),
        body: JSON.stringify({
          chat_id: DONO,
          text: textoSemHtml,
        }),
      });
      if (res2.ok) {
        console.log("✅ Relatório do Gemini enviado (fallback texto puro)!");
        return;
      }
    }
    console.error(`❌ Erro HTTP ${res.status}: ${erro}`);
    process.exit(1);
  } catch (e) {
    console.error("❌ Falha de conexão ou timeout:", (e as Error).message);
    process.exit(1);
  }
}

enviar();
