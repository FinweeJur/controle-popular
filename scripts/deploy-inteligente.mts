#!/usr/bin/env node
/**
 * 🤖 Redeploy Inteligente — Controle Popular
 * 
 * Só faz build+restart quando necessário:
 * 1. Site offline (health check falha)
 * 2. Novos dados em apps/web/data (coleta noturna commitou algo)
 * 3. Force com --force
 * 
 * Uso (cron job matinal ~06h):
 *   node node_modules/tsx/dist/cli.mjs scripts/deploy-inteligente.mts
 *   node node_modules/tsx/dist/cli.mjs scripts/deploy-inteligente.mts --force
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";

const ROOT = process.cwd();
const SITE_URL = "https://controlepopular.com.br/";
const LOCAL_URL = "http://127.0.0.1:3000";
const TIMEOUT = 8000;

function checkSite(url: string): Promise<boolean> {
  const lib = url.startsWith("https") ? https : http;
  return new Promise((resolve) => {
    const req = lib.get(url, { timeout: TIMEOUT }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => { req.destroy(); resolve(false); });
  });
}

function dadosNovosDesdeUltimoCommit(): boolean {
  // Checa se apps/web/data foi alterado desde o HEAD anterior
  const r = spawnSync("git", ["diff", "--name-only", "HEAD~1", "HEAD", "--", "apps/web/data"], {
    cwd: ROOT,
    encoding: "utf-8",
  });
  return (r.stdout ?? "").trim().length > 0;
}

function dadosNovosNoWorkingDir(): boolean {
  const r = spawnSync("git", ["status", "--porcelain", "--", "apps/web/data"], {
    cwd: ROOT,
    encoding: "utf-8",
  });
  return (r.stdout ?? "").trim().length > 0;
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");

  console.log("🤖 Redeploy Inteligente — Avaliando necessidade...\n");

  if (force) {
    console.log("⚠️  --force ativado → deploy imediato");
    process.exit(0);
  }

  // 1. Verificar se site tá online
  console.log("1️⃣ Health check do site...");
  const siteOnline = await checkSite(SITE_URL);
  const localOnline = await checkSite(LOCAL_URL);
  console.log(`   Site (https): ${siteOnline ? "✅ ONLINE" : "🔴 OFFLINE"}`);
  console.log(`   Local (3000): ${localOnline ? "✅ ONLINE" : "🔴 OFFLINE"}`);

  if (!siteOnline && !localOnline) {
    console.log("\n🚨 Site OFFLINE — redeploy necessário!");
    process.exit(0); // 0 = "precisa buildar"
  }

  // 2. Verificar novos dados
  console.log("\n2️⃣ Checando novos dados em apps/web/data...");
  const novosDadosCommit = dadosNovosDesdeUltimoCommit();
  const novosDadosWorking = dadosNovosNoWorkingDir();
  console.log(`   Novos dados (último commit): ${novosDadosCommit ? "✅ SIM" : "❌ NÃO"}`);
  console.log(`   Novos dados (working dir): ${novosDadosWorking ? "⚠️  SIM (uncommitted)" : "❌ NÃO"}`);

  if (novosDadosCommit || novosDadosWorking) {
    console.log("\n📦 Novos dados detectados — redeploy recomendado!");
    process.exit(0);
  }

  // 3. Nada mudou
  console.log("\n✅ Site ONLINE + sem novos dados");
  console.log("💤 Pulando redeploy desnecessário");
  process.exit(1); // 1 = "não precisa buildar"
}

main().catch((err) => {
  console.error("❌ Erro no script:", err.message);
  process.exit(2);
});
