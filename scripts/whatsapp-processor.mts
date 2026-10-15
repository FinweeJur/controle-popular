#!/usr/bin/env node
/**
 * scripts/whatsapp-processor.mts — Processador autônomo de mensagens WhatsApp.
 *
 * Lê novas mensagens de logs/whatsapp-inbox.jsonl, faz busca na internet
 * via DuckDuckGo e grava respostas em logs/whatsapp-outbox.jsonl.
 * O bot Go (bots/whatsapp/whatsapp-bot) envia as respostas pelo WhatsApp.
 *
 * Uso (loop autônomo):
 *   npx tsx scripts/whatsapp-processor.mts
 *
 * Uso (processa uma vez e sai):
 *   npx tsx scripts/whatsapp-processor.mts --once
 *
 * Env vars:
 *   WHATSAPP_PROCESSOR_OFFSET — path do arquivo de offset (default: bots/whatsapp/.whatsapp-processor-offset)
 */
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..");
const INBOX = path.join(RAIZ, "logs", "whatsapp-inbox.jsonl");
const OUTBOX = path.join(RAIZ, "logs", "whatsapp-outbox.jsonl");
const OFFSET_FILE = process.env.WHATSAPP_PROCESSOR_OFFSET ||
  path.join(RAIZ, "bots", "whatsapp", ".whatsapp-processor-offset");

/**
 * Busca na internet via DuckDuckGo HTML e retorna os top resultados.
 * Sem API key — usa a versão HTML do DuckDuckGo.
 */
async function buscarWeb(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://html.duckduckgo.com/html/?q=${encoded}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return `⚠️ Busca retornou erro HTTP ${res.status}`;
    }

    const html = await res.text();

    // Extrai resultados — DuckDuckGo HTML usa class="result__a" e "result__snippet"
    const tituloPattern = /class="result__a"[^>]*>([^<]+)/g;
    const snippetPattern = /class="result__snippet"[^>]*>([^<]+)/g;

    const titulos = [...html.matchAll(tituloPattern)].map(m =>
      m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
    );
    const snippets = [...html.matchAll(snippetPattern)].map(m =>
      m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim()
    );

    let resposta = `🔍 **Busca:** ${query}\n\n`;

    if (titulos.length === 0) {
      return `🔍 Busca: ${query}\n\nNenhum resultado encontrado no DuckDuckGo.`;
    }

    const max = Math.min(titulos.length, 3, snippets.length);
    for (let i = 0; i < max; i++) {
      resposta += `**${i + 1}.** ${titulos[i]}\n`;
      if (snippets[i]) {
        resposta += `   ${snippets[i]}\n\n`;
      }
    }

    return resposta.trim();
  } catch (e) {
    return `⚠️ Erro na busca: ${(e as Error).message}`;
  }
}

/**
 * Lê o offset atual do processor.
 */
function lerOffset() {
  try {
    const data = fs.readFileSync(OFFSET_FILE, "utf-8");
    const n = parseInt(data.trim(), 10);
    return isNaN(n) ? 0 : n;
  } catch {
    return 0;
  }
}

/**
 * Salva o offset atual.
 */
function gravarOffset(n) {
  const dir = path.dirname(OFFSET_FILE);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OFFSET_FILE, String(n), "utf-8");
}

/**
 * Escreve uma entrada no outbox.
 */
function escreverOutbox(texto, grupo) {
  const dir = path.dirname(OUTBOX);
  fs.mkdirSync(dir, { recursive: true });
  const entry = { texto, grupo: grupo || "" };
  fs.appendFileSync(OUTBOX, JSON.stringify(entry) + "\n", "utf-8");
}

/**
 * Processa novas mensagens da inbox.
 */
async function processarInbox() {
  if (!fs.existsSync(INBOX)) return 0;

  const offset = lerOffset();
  const lines = fs.readFileSync(INBOX, "utf-8")
    .split(/\r?\n/)
    .filter(Boolean);

  let novas = 0;
  for (let i = offset; i < lines.length; i++) {
    const line = lines[i];
    novas++;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    console.log(`📩 Processando: [${entry.de}] ${entry.texto?.slice(0, 80)}`);

    // Busca na internet
    const query = entry.texto || "";
    const resultado = await buscarWeb(query);

    // Escreve resposta no outbox
    escreverOutbox(resultado, entry.grupo);
    console.log(`📤 Resposta escrita no outbox para ${entry.grupo || "grupo default"}`);

    gravarOffset(i + 1);
  }

  return novas;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const once = args.includes("--once");

  console.log("🤖 WhatsApp Processor ativo");
  if (once) {
    console.log("   (modo --once: processa uma vez e sai)\n");
  } else {
    console.log("   (loop contínuo — Ctrl+C para parar)\n");
  }

  if (once) {
    const count = await processarInbox();
    console.log(`\n📦 Processadas ${count} nova(s) mensagem(ns).`);
    return;
  }

  // Loop contínuo
  const interval = 5000; // 5s entre checagens
  setInterval(async () => {
    try {
      await processarInbox();
    } catch (e) {
      console.error("❌ Erro no processamento:", (e as Error).message);
    }
  }, interval);
}

main().catch((e) => {
  console.error("Falha fatal:", e);
  process.exit(1);
});
