#!/usr/bin/env node
/**
 * Guara Shield Bot — monitora Trivy e alerta no Telegram
 *
 * Roda `guara services vulnerabilities --json`, filtra CRITICAL e HIGH,
 * compara com o relatório anterior e envia novos ao Telegram.
 *
 * Uso:
 *   npx tsx scripts/agent-tools/guara-shield-bot.mts
 *   npx tsx scripts/agent-tools/guara-shield-bot.mts --once   # sem loop
 *
 * Lê TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID de scripts/.env.
 * Relatório e histórico ficam em docs/relatorios-automacao/.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ENV_PATH = path.join(RAIZ, "scripts", ".env");
const RELATORIO_DIR = path.join(RAIZ, "docs", "relatorios-automacao");
const HISTORICO_PATH = path.join(RELATORIO_DIR, "guara-shield-historico.json");
const ULTIMO_RELATORIO_PATH = path.join(RELATORIO_DIR, "guara-shield-relatorio.json");

const INTERVALO_MS = 30 * 60 * 1000; // 30 minutos
const SEVERIDADES_FILTRADAS = ["CRITICAL", "HIGH"] as const;

/* ── Env ─────────────────────────────────────────────────────── */

function carregarEnv() {
  if (!existsSync(ENV_PATH)) return;
  for (const line of readFileSync(ENV_PATH, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

/* ── Telegram ────────────────────────────────────────────────── */

async function enviarTelegram(texto: string) {
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  if (!TOKEN || !CHAT_ID) {
    console.error("TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID ausentes em scripts/.env");
    return false;
  }
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: texto,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  if (!r.ok) {
    const corpo = await r.text();
    console.error(`Telegram HTTP ${r.status}: ${corpo.slice(0, 200)}`);
    return false;
  }
  return true;
}

/* ── Trivy scan ──────────────────────────────────────────────── */

interface TrivyVuln {
  VulnerabilityID: string;
  PkgName: string;
  InstalledVersion: string;
  FixedVersion?: string;
  Severity: string;
  Title?: string;
  CVSS?: Record<string, { V3Score?: number }>;
  PrimaryURL?: string;
}

interface TrivyResult {
  Target: string;
  Vulnerabilities?: TrivyVuln[];
}

interface TrivyOutput {
  Results?: TrivyResult[];
}

function executarScan(): TrivyOutput | null {
  console.log("🔍 Executando guara services vulnerabilities --json ...");
  const r = spawnSync("guara", ["services", "vulnerabilities", "--json"], {
    cwd: RAIZ,
    encoding: "utf-8",
    timeout: 120_000,
  });
  if (r.status !== 0) {
    console.error(`Scan falhou (exit ${r.status}): ${(r.stderr || "").slice(0, 300)}`);
    return null;
  }
  try {
    return JSON.parse(r.stdout) as TrivyOutput;
  } catch {
    console.error("Falha ao parsear JSON do Trivy");
    return null;
  }
}

/* ── Filtrar vulns CRITICAL/HIGH ─────────────────────────────── */

function extrairVulnsFiltradas(output: TrivyOutput): TrivyVuln[] {
  const vulns: TrivyVuln[] = [];
  for (const result of output.Results ?? []) {
    for (const v of result.Vulnerabilities ?? []) {
      if (SEVERIDADES_FILTRADAS.includes(v.Severity as typeof SEVERIDADES_FILTRADAS[number])) {
        vulns.push(v);
      }
    }
  }
  return vulns;
}

/* ── Histórico ───────────────────────────────────────────────── */

interface Historico {
  reportados: Record<string, string>; // vulnId → ISO timestamp
}

function carregarHistorico(): Historico {
  if (existsSync(HISTORICO_PATH)) {
    try {
      return JSON.parse(readFileSync(HISTORICO_PATH, "utf-8")) as Historico;
    } catch { /* ignora corrompido */ }
  }
  return { reportados: {} };
}

function salvarHistorico(h: Historico) {
  mkdirSync(path.dirname(HISTORICO_PATH), { recursive: true });
  writeFileSync(HISTORICO_PATH, JSON.stringify(h, null, 2), "utf-8");
}

/* ── Formatação ──────────────────────────────────────────────── */

function cvssScore(v: TrivyVuln): string {
  if (!v.CVSS) return "?";
  // pega V3Score de qualquer provider disponível
  for (const provider of Object.values(v.CVSS)) {
    if (provider?.V3Score !== undefined) return provider.V3Score.toFixed(1);
  }
  return "?";
}

function formatarMensagem(vulns: TrivyVuln[]): string {
  const criticas = vulns.filter((v) => v.Severity === "CRITICAL");
  const altas = vulns.filter((v) => v.Severity === "HIGH");

  const linhas: string[] = [];
  linhas.push(`🛡️ <b>Guara Shield — ${vulns.length} vulnerabilidade(s) nova(s)</b>`);
  if (criticas.length) linhas.push(`🔴 CRITICAL: ${criticas.length}`);
  if (altas.length) linhas.push(`🟠 HIGH: ${altas.length}`);
  linhas.push("");

  for (const v of vulns) {
    const icone = v.Severity === "CRITICAL" ? "🔴" : "🟠";
    const fix = v.FixedVersion ? `→ ${v.FixedVersion}` : "⚠️ sem fix";
    linhas.push(`${icone} <b>${v.VulnerabilityID}</b> (${v.PkgName})`);
    linhas.push(`   CVSS: ${cvssScore(v)} | ${fix}`);
    if (v.Title) linhas.push(`   ${v.Title.slice(0, 100)}`);
    if (v.PrimaryURL) linhas.push(`   <a href="${v.PrimaryURL}">ver detalhes</a>`);
    linhas.push("");
  }

  linhas.push(`⏰ ${new Date().toISOString().replace("T", " ").slice(0, 19)}Z`);
  return linhas.join("\n");
}

/* ── Ciclo principal ─────────────────────────────────────────── */

async function executarCiclo(): Promise<boolean> {
  const output = executarScan();
  if (!output) {
    console.error("Scan retornou null, pulando ciclo.");
    return false;
  }

  const vulnsFiltradas = extrairVulnsFiltradas(output);
  console.log(`Encontradas ${vulnsFiltradas.length} vulns CRITICAL/HIGH`);

  const historico = carregarHistorico();
  const novas = vulnsFiltradas.filter((v) => !historico.reportados[v.VulnerabilityID]);

  if (novas.length === 0) {
    console.log("Nenhuma vulnerabilidade nova. Nada a enviar.");
  } else {
    const msg = formatarMensagem(novas);
    const enviado = await enviarTelegram(msg);
    if (enviado) {
      const agora = new Date().toISOString();
      for (const v of novas) {
        historico.reportados[v.VulnerabilityID] = agora;
      }
      console.log(`✅ ${novas.length} vulnerabilidade(s) enviada(s) ao Telegram.`);
    }
  }

  // Limpar do histórico vulns que não existem mais (resolvidas)
  const idsAtuais = new Set(vulnsFiltradas.map((v) => v.VulnerabilityID));
  for (const id of Object.keys(historico.reportados)) {
    if (!idsAtuais.has(id)) {
      delete historico.reportados[id];
      console.log(`🧹 Removido ${id} do histórico (resolvido).`);
    }
  }

  salvarHistorico(historico);

  // Salvar relatório do ciclo
  const relatorio = {
    geradoEm: new Date().toISOString(),
    agente: "Guara Shield Bot",
    totalScan: (output.Results ?? []).reduce(
      (acc, r) => acc + (r.Vulnerabilities?.length ?? 0), 0
    ),
    filtradas: vulnsFiltradas.length,
    novasEnviadas: novas.length,
    novas: novas.map((v) => ({
      id: v.VulnerabilityID,
      pkg: v.PkgName,
      severity: v.Severity,
      cvss: cvssScore(v),
      fix: v.FixedVersion ?? "nenhum",
    })),
  };
  mkdirSync(path.dirname(ULTIMO_RELATORIO_PATH), { recursive: true });
  writeFileSync(ULTIMO_RELATORIO_PATH, JSON.stringify(relatorio, null, 2), "utf-8");

  return novas.length > 0;
}

/* ── Entry ───────────────────────────────────────────────────── */

async function main() {
  carregarEnv();
  const once = process.argv.includes("--once");

  console.log("🛡️  Guara Shield Bot iniciado.");
  if (once) {
    await executarCiclo();
    return;
  }

  console.log(`⏰ Intervalo: ${INTERVALO_MS / 60_000} minutos. Ctrl+C para sair.`);
  for (;;) {
    await executarCiclo();
    await new Promise((r) => setTimeout(r, INTERVALO_MS));
  }
}

main().catch((e) => {
  console.error("❌ Erro fatal:", e);
  process.exit(1);
});
