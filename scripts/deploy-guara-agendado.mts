#!/usr/bin/env node
/**
 * scripts/deploy-guara-agendado.mts ??? deploy do Guara na cad??ncia do dono.
 *
 * Chama `guara deploy` s?? quando TUDO passa:
 *   1. h?? commit novo na origin/main que o Guara ainda n??o construiu
 *      (SHA difere do ??ltimo deployment);
 *   2. o ??ltimo deploy do Guara tem mais de N dias (padr??o 5 ??? pol??tica
 *      do dono, 19/09: plano Starter tem teto de 250 min de build/ciclo
 *      e um build gasta ~17 min);
 *   3. roda em Windows pelo Task Scheduler (tarefa
 *      `ControlePopular_DeployGuara`), na janela da madrugada.
 *
 * Reporta nada? Reporta tudo: cada parada tem motivo no Telegram e no
 * log ??? o sil??ncio aqui seria a pior forma de errar.
 *
 * Uso:
 *   npx tsx scripts/deploy-guara-agendado.mts             # janela di??ria
 *   npx tsx scripts/deploy-guara-agendado.mts --dias 5    # j?? com cad??ncia
 *   npx tsx scripts/deploy-guara-agendado.mts --so-verificar
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CARREGAR_ENV = path.join(RAIZ, "scripts", ".env");
const SERVICO = "controle-popular-web-0b4895";

const argv = process.argv.slice(2);
const argNum = (flag: string): number => {
  const i = argv.indexOf(flag);
  return i >= 0 ? Number(argv[i + 1]) : undefined as unknown as number;
};
const DIAS = argNum("--dias") ?? 5;
const SO_VERIFICAR = argv.includes("--so-verificar");

function carregarEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    for (const line of fs.readFileSync(CARREGAR_ENV, "utf-8").split(/\r?\n/)) {
      const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].trim();
    }
  } catch {}
  return env;
}
const ENVAR = carregarEnv();

/** guara vem do npm global (shim .cmd no Windows); gh e git são .exe. */
function executavel(nome: string): string {
  if (process.platform !== "win32") return nome;
  if (nome === "guara") return `${nome}.cmd`;
  return nome;
}
function tentativa(cmd: string, args: string[]): string {
  return execFileSync(executavel(cmd), args, {
    cwd: RAIZ,
    encoding: "utf-8",
    shell: process.platform === "win32" && cmd === "guara",
  }).trim();
}

async function telegram(texto: string): Promise<void> {
  const token = ENVAR["TELEGRAM_BOT_TOKEN"];
  const chat = ENVAR["TELEGRAM_CHAT_ID"];
  if (!token || !chat) {
    console.log("[telegram off] " + texto);
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: texto, disable_web_page_preview: true }),
    });
  } catch (e) {
    console.error("[telegram falhou]", (e as Error).message);
  }
}

interface Deployment {
  commit_sha?: string | null;
  status?: string;
  created_at?: string;
}

async function principal(): Promise<void> {
  const Motivos: string[] = [];

  // ?????? 1. Deploy mais recente do Guara ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  let ultimo: Deployment | undefined;
  try {
    const json = tentativa("guara", ["deployments", "list", "--json"]);
    const parsed = JSON.parse(json) as { data?: Deployment[] };
    ultimo = (parsed.data ?? []).find((d) =>
      ["healthy", "building", "failed", "rolled_back"].includes(d.status ?? ""),
    );
  } catch (e) {
    Motivos.push("guara deployments list falhou: " + (e as Error).message);
  }

  // ?????? 2. origin/main e commit-sha mais recente ???????????????????????????????????????????????????????????????????????????????????????
  let shaRemoto = "";
  let haCommitNovo = false;
  try {
    tentativa("git", ["fetch", "origin", "main"]);
    shaRemoto = tentativa("git", ["rev-parse", "origin/main"]).trim();
    const shaGuara = (ultimo?.commit_sha || "").trim();
    haCommitNovo = shaRemoto.length > 0 ? shaRemoto !== shaGuara : false;
    if (!haCommitNovo) Motivos.push("sem commit novo (Guara j?? em " + shaGuara.slice(0, 7) + ")");
  } catch (e) {
    Motivos.push("git falhou: " + (e as Error).message);
  }

  // ?????? 3. Cad??ncia de dias desde o ??ltimo deploy ????????????????????????????????????????????????????????????????????????????????????
  let cadenciaOk = false;
  if (ultimo?.created_at) {
    const dias = (Date.now() - Date.parse(ultimo.created_at)) / 86_400_000;
    if (dias >= DIAS) cadenciaOk = true;
    else Motivos.push(`cad??ncia: ??ltimo deploy h?? ${dias.toFixed(1)}d (m??nimo ${DIAS}d)`);
  } else {
    Motivos.push("sem deploy anterior conhecido");
  }

  // ?????? 4. CI verde no commit candidate (Testes e Valida????o de Privacidade) ?????????
  let ciOk = false;
  if (haCommitNovo) {
    try {
      const out = tentativa("gh", [
        "run", "list", "--commit", shaRemoto, "--limit", "10", "--json", "conclusion,workflowName",
      ]);
      const runs = JSON.parse(out) as Array<{ conclusion: string; workflowName: string }>;
      const testes = runs.filter(
        (r) => /test|gua.*ci|valida/i.test(r.workflowName) && r.conclusion === "success",
      );
      ciOk = testes.length > 0;
      if (!ciOk) Motivos.push("CI ainda sem sucesso em " + shaRemoto.slice(0, 7));
    } catch (e) {
      Motivos.push("gh run list falhou: " + (e as Error).message);
    }
  }

  // ?????? Resumo ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  const pronto = haCommitNovo && cadenciaOk && ciOk;
  const resumo =
    `deploy-guara ??? commit novo: ${haCommitNovo ? "sim" : "n??o"}; ` +
    `cad??ncia ${DIAS}d: ${cadenciaOk ? "ok" : "aguardando"}; CI verde: ${ciOk ? "sim" : "n??o"}`;

  if (SO_VERIFICAR) {
    console.log(resumo + (Motivos.length ? "\n??? " + Motivos.join("\n??? ") : ""));
    return;
  }
  if (!pronto) {
    await telegram(`???? Deploy Guara: N??O rodou ??? ${resumo}`);
    console.log(resumo);
    return;
  }

  console.log("disparando guara deploy???");
  try {
    tentativa("guara", ["deploy", "--service", SERVICO]);
    await telegram(`???? Deploy Guara disparado (${shaRemoto.slice(0, 7)}). ~17 min.`);
  } catch (e) {
    await telegram(`??? Deploy Guara FALHOU ao disparar: ${(e as Error).message.slice(0, 200)}`);
  }
}

principal().catch(async (e) => {
  console.error(e);
  await telegram("??? deploy-guara-agendado abortou: " + (e as Error).message.slice(0, 300));
  process.exit(1);
});
