/**
 * rotina-ambiental.mts — orquestrador de coletas ambientais agendadas.
 *
 * Roda na máquina que publica (home-pc), via schtasks:
 *   npx tsx scripts/rotina-ambiental.mts --fonte sigmine
 *   npx tsx scripts/rotina-ambiental.mts --fonte todas
 *
 * Fases por fonte, falha ISOLADA: uma fonte que cai não derruba as outras.
 * Pipeline de cada fonte:
 *   1. coletor python (checkpoint próprio, --limit controlado)
 *   2. piso de sanidade: contagem < 70% da rodada anterior → ABORTA a fonte
 *      (cache anterior vale mais que acervo zumbi)
 *   3. varredura de dado pessoal é etapa do fluxo — hit descarta a rodada
 *   4. registro da rodada em scripts/.cache/ambiental/rodada-<fonte>-latest.json
 *
 * Telemetria: Telegram (scripts/.env), mesmo padrão do vigia.
 * Lock de concorrência: scripts/.cache/ambiental/.lock (mais de 2h = zumbi).
 *
 * Cadências (instalar-agendamento-ambiental.ps1):
 *   ibama-licen  semanal (qui 04h)   — 14 mil linhas, barato
 *   ibama-autos  mensal (dia 5 04h)  — ~2,4 M linhas
 *   ana          mensal (dia 10 04h) — ~751 mil registros
 *   sigmine      semanal (dom 03h)   — ANM atualiza diário; 46 MB full é caro
 *   estados      mensal (dia 15)     — entra quando coletores estaduais existirem
 *
 * SEM build/publish aqui — o build continua no rotina-local.mts numa janela
 * própria: dado coletado só entra no site na próxima build travada.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..");
const CACHE_DIR = join(RAIZ, "scripts", ".cache", "ambiental");
const LOCK = join(CACHE_DIR, ".lock");
const PYTHON = process.env.RADAR_PYTHON ?? "py";
const PYTHON_ARGS = process.env.RADAR_PYTHON ? [] : ["-3"];

/** Fonte → coletor + limite do --limit (0 = tudo). */
const FONTES = {
  "ibama-licen": { coletor: "coletar-ibama-licencas.py", saida: "ibama-licencas.json", limite: 5000 },
  "ibama-autos": { coletor: "coletar-ibama-autos.py", saida: "ibama-autos-infracao.json", limite: 5000 },
  ana: { coletor: "coletar-ana-outorgas.py", saida: "ana-outorgas.json", limite: 5000 },
  sigmine: { coletor: "coletar-sigmine-nacional.py", saida: "sigmine-nacional.json", limite: 2000 },
} as const;

type FonteNome = keyof typeof FONTES;
const PISO_RELATIVO = 0.7;
const LOCK_EXPIRA_MS = 2 * 60 * 60 * 1000;

function lerTelegram(): { token: string; chat: string } | null {
  const caminho = join(RAIZ, "scripts", ".env");
  if (!existsSync(caminho)) return null;
  const env = readFileSync(caminho, "utf-8");
  const token = env.match(/^TELEGRAM_BOT_TOKEN=(.+)$/m)?.[1]?.trim();
  const chat = env.match(/^TELEGRAM_CHAT_ID=(.+)$/m)?.[1]?.trim();
  if (!token || !chat) return null;
  return { token, chat };
}

async function notificar(texto: string): Promise<void> {
  const t = lerTelegram();
  if (!t) return;
  try {
    await fetch(`https://api.telegram.org/bot${t.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: t.chat, text: texto }),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    // Notificação falha em silêncio — a missão é coletar, não avisar.
  }
}

function contagem(arquivo: string): number {
  if (!existsSync(arquivo)) return 0;
  try {
    const d = JSON.parse(readFileSync(arquivo, "utf-8")) as {
      total?: number;
      resumo_por_uf?: { total?: number };
    };
    return d.total ?? d.resumo_por_uf?.total ?? 0;
  } catch {
    return 0;
  }
}

/** Rodada anterior persistida — base do piso de sanidade. */
function contagemAnterior(fonte: string): number {
  const arquivo = join(CACHE_DIR, `rodada-${fonte}-latest.json`);
  if (!existsSync(arquivo) || contagem(arquivo) >= 0) {
    const cache = contagemArquivoFonte(fonte);
    return cache;
  }
  return 0;
}

function contagemArquivoFonte(fonte: string): number {
  if (!existsSync(join(CACHE_DIR, `rodada-${fonte}-latest.json`))) return 0;
  try {
    return (JSON.parse(readFileSync(join(CACHE_DIR, `rodada-${fonte}-latest.json`), "utf-8")) as { linhas_depois?: number }).linhas_depois ?? 0;
  } catch {
    return 0;
  }
}

function registrarRodada(fonte: string, antes: number, depois: number): void {
  writeFileSync(
    join(CACHE_DIR, `rodada-${fonte}-latest.json`),
    JSON.stringify({ fonte, quando: new Date().toISOString(), linhas_antes: antes, linhas_depois: depois }, null, 2)
  );
}

// Uma fonte é uma invocação; o coletor se retoma por checkpoint próprio.
function coletarFonte(fonte: string): { ok: true } | { ok: false; motivo: string } {
  const conf = FONTES[fonte as FonteNome];
  const saida = join(RAIZ, "apps", "web", "data", conf.saida);
  const antes = contagemAnterior(fonte);

  const r = spawnSync(
    PYTHON,
    [...PYTHON_ARGS, join(RAIZ, "scripts", conf.coletor), "--limit", String(conf.limite)],
    { encoding: "utf-8", timeout: 60 * 60 * 1000, env: { ...process.env, PYTHONIOENCODING: "utf-8" } }
  );
  if (r.status !== 0) {
    return { ok: false, motivo: `coletor saiu ${r.status}: ${r.stderr?.slice(-400)}` };
  }

  const nAtual = contagem(saida);
  if (nAtual === 0) return { ok: false, motivo: "acervo resultou em 0 registros" };
  if (antes > 0 && nAtual < antes * PISO_RELATIVO) {
    return {
      ok: false,
      motivo: `contagem cedeu de ${antes} para ${nAtual} (<70%) — rodada descartada, cache anterior vale mais`,
    };
  }

  // Varredura de dado pessoal é etapa OBRIGATÓRIA, nunca manual.
  const scan = spawnSync(
    PYTHON,
    [...PYTHON_ARGS, join(RAIZ, "scripts", "checar-dado-pessoal-em-dado.py"), "--extra", saida],
    { encoding: "utf-8", timeout: 30 * 60 * 1000, env: { ...process.env, PYTHONIOENCODING: "utf-8" } }
  );
  if (scan.status !== 0) {
    return {
      ok: false,
      motivo: `dado pessoal detectado em ${fonte} — rodada DESCARTADA:\n${scan.stdout?.slice(-800)}`,
    };
  }

  registrarRodada(fonte, antes, nAtual);
  return { ok: true };
}

function pegarLock(): boolean {
  if (existsSync(LOCK)) {
    if (Date.now() - statSync(LOCK).mtimeMs > LOCK_EXPIRA_MS) {
      unlinkSync(LOCK); // rodada anterior morreu — lock zumbi são mais de 2h
    } else {
      return false;
    }
  }
  writeFileSync(LOCK, String(Date.now()));
  return true;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--fonte");
  const pedido = idx >= 0 ? args[idx + 1] : "todas";
  const pedidos: string[] = pedido === "todas" ? Object.keys(FONTES) : [pedido];
  if (pedidos.some((f) => !(f in FONTES))) {
    console.error("[rotina-ambiental] fonte desconhecida:", pedido, "| opções:", Object.keys(FONTES).join(", "), "| todas");
    process.exit(2);
  }
  mkdirSync(CACHE_DIR, { recursive: true });
  if (!pegarLock()) {
    await notificar("rotina-ambiental: rodada anterior ainda viva (lock ativo) — abortado");
    process.exit(3);
  }
  try {
    const falhas: string[] = [];
    for (const fonte of pedidos) {
      console.log(`[rotina-ambiental] ${fonte}: iniciando`);
      const r = coletarFonte(fonte);
      const linha = r.ok ? `✅ ${fonte}: coletada` : `⛔ ${fonte}: ${r.motivo}`;
      console.log(`[rotina-ambiental] ${linha}`);
      if (!r.ok) falhas.push(linha);
    }
    if (falhas.length > 0) {
      await notificar(`rotina-ambiental: ${falhas.length} fonte(s) falharam — ${falhas.join(" | ")}`);
      process.exit(1);
    }
  } finally {
    try { unlinkSync(LOCK); } catch { /* lock desaparece de qualquer jeito */ }
  }
}

await main();
