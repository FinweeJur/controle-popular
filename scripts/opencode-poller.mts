#!/usr/bin/env node
/**
 * scripts/opencode-poller.mts
 *
 * Polls .opencode/canario/comandos.json for pending commands from
 * the Telegram bot (gatilho-remoto). Runs opencode on each command
 * and writes the response back to the file.
 *
 * Usage: npx tsx scripts/opencode-poller.mts
 * Stop: Ctrl+C or kill the process
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUEUE_FILE = path.join(RAIZ, ".opencode", "canario", "comandos.json");
const OPENCODE_BIN = "C:/Users/Home/AppData/Local/hermes/node/node_modules/opencode-ai/bin/opencode.exe";

function log(msg: string) {
  console.log(`[${new Date().toLocaleTimeString("pt-BR")}] ${msg}`);
}

function lerQueue(): Array<{ id: string; mensagem: string; status: string; criadoEm: string; resposta?: string }> {
  try {
    if (!fs.existsSync(QUEUE_FILE)) return [];
    return JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function escreverQueue(queue: Array<{ id: string; mensagem: string; status: string; criadoEm: string; resposta?: string }>) {
  try {
    const dir = path.dirname(QUEUE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  } catch (e) {
    log(`Erro ao escrever queue: ${(e as Error).message}`);
  }
}

function processarComando(mensagem: string): string {
  try {
    const stdout = execFileSync(OPENCODE_BIN, ["run", mensagem, "--format", "json", "--auto"], {
      encoding: "utf-8",
      timeout: 120_000,
      maxBuffer: 10 * 1024 * 1024,
      cwd: RAIZ,
    });
    // Try to extract text from JSON response
    try {
      const parsed = JSON.parse(stdout);
      if (parsed.result?.text) return parsed.result.text;
      if (parsed.text) return parsed.text;
      if (parsed.result) return String(parsed.result);
    } catch {
      // Not JSON, return raw output
    }
    return stdout.trim().slice(0, 3000) || "Processado (sem saida)";
  } catch (e) {
    const err = e as { stdout?: string; message?: string };
    if (err.stdout) {
      try {
        const parsed = JSON.parse(err.stdout);
        if (parsed.result?.text) return parsed.result.text;
        if (parsed.text) return parsed.text;
      } catch {
        return err.stdout.trim().slice(0, 2000);
      }
    }
    return `Erro: ${(err.message || "desconhecido").slice(0, 200)}`;
  }
}

async function main() {
  log("opencode-poller iniciado. Monitorando comandos do Telegram...");
  log(`Queue: ${QUEUE_FILE}`);

  if (!fs.existsSync(path.dirname(QUEUE_FILE))) {
    fs.mkdirSync(path.dirname(QUEUE_FILE), { recursive: true });
  }

  for (;;) {
    const queue = lerQueue();
    const pendentes = queue.filter((q) => q.status === "pendente");

    for (const cmd of pendentes) {
      log(`Processando: [${cmd.id}] ${cmd.mensagem.slice(0, 80)}`);

      // Marca como processando
      cmd.status = "processando";
      escreverQueue(queue);

      // Processa
      const resposta = processarComando(cmd.mensagem);
      log(`Resposta: ${resposta.slice(0, 100)}...`);

      // Grava resposta
      cmd.status = "respondido";
      cmd.resposta = resposta;
      escreverQueue(queue);
    }

    // Dorme 3s entre ciclos
    await new Promise((r) => setTimeout(r, 3000));
  }
}

main().catch((err) => {
  console.error("opencode-poller falhou:", err);
  process.exit(1);
});
