/**
 * sondar-pr-links.mts — degrau do revisor de PRs (workflow pr-revisor).
 *
 * Lê o `link-correcoes.json` da branch do PR, sonda só as urlNova que não
 * estão na `origin/main` (HEAD + GET-range, regra "200 e mente" de
 * criterios.ts) e aborta se alguma estiver morta.
 *
 * Não faz busca de substituto — o LinkMender PR já fez isso na abertura.
 * Aqui é o portão final: o link que vai entrar tem que estar vivo AGORA.
 *
 * User-Agent honesto, pausa 400ms, timeout 10s. Roda só na CI (rede real).
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validarCorrecoes } from "../../apps/web/lib/linkmender/correcoes.js";
import { sondar } from "../../apps/web/lib/linkmender/verificar.js";
import { USER_AGENT_LINKMENDER } from "../../apps/web/lib/linkmender/busca.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ARQUIVO_REL = "apps/web/data/link-correcoes.json";
const PAUSA_MS = 400;
const TIMEOUT_MS = 10000;

function gitShow(refEArquivo: string): string | null {
  try {
    return execFileSync("git", ["show", refEArquivo], {
      cwd: RAIZ,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
}

async function fetchComTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT_LINKMENDER,
        ...(init?.headers as Record<string, string> | undefined),
      },
    });
  } finally {
    clearTimeout(t);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main(): Promise<void> {
  console.log("🔗 [sondar-pr-links] Lendo camada da branch do PR...");

  const mainJson = gitShow(`origin/main:${ARQUIVO_REL}`);
  const caminhoAtual = path.join(RAIZ, ARQUIVO_REL);
  if (!existsSync(caminhoAtual)) {
    console.log("✓ [sondar-pr-links] Sem link-correcoes.json nesta branch — nada a sondar.");
    return;
  }

  const atual = validarCorrecoes(JSON.parse(readFileSync(caminhoAtual, "utf-8")));
  const doMain = mainJson
    ? (() => {
        try {
          return new Set(validarCorrecoes(JSON.parse(mainJson)).map((c) => c.urlVelha));
        } catch {
          return new Set<string>();
        }
      })()
    : new Set<string>();

  const novas = atual.filter((c) => !doMain.has(c.urlVelha));
  if (novas.length === 0) {
    console.log("✓ [sondar-pr-links] Nenhuma urlNova nova neste PR.");
    return;
  }

  console.log(`  ${novas.length} urlNova nova(s) para sondar (UA honesto, pausa ${PAUSA_MS}ms)`);

  const mortas: string[] = [];
  for (const [i, c] of novas.entries()) {
    let s;
    try {
      s = await sondar(c.urlNova, fetchComTimeout as typeof fetch);
    } catch (e) {
      console.error(`  [${i + 1}/${novas.length}] ✗ ${c.urlNova} — erro: ${(e as Error).message}`);
      mortas.push(`${c.urlNova} (erro de rede)`);
      continue;
    }
    const vivo =
      s.statusHttp !== null && s.statusHttp >= 200 && s.statusHttp < 400 && s.statusHttp !== 404 && s.statusHttp !== 410;
    // 200 que mente: se tem corpo e está classificado quebrado pelo conteúdo, reprova
    const mentiroso =
      s.statusHttp === 200 &&
      s.corpoInicial !== null &&
      /p[áa]gina n[ãa]o encontrada|page not found|404 not found|arquivo n[ãa]o encontrado/i.test(
        s.corpoInicial.slice(0, 2048)
      );

    if (!vivo || mentiroso) {
      console.error(
        `  [${i + 1}/${novas.length}] ✗ ${c.urlNova} → ${s.statusHttp}${mentiroso ? " (200 que mente)" : ""}`
      );
      mortas.push(`${c.urlNova} (status ${s.statusHttp}${mentiroso ? ", 200 que mente" : ""})`);
    } else {
      console.log(`  [${i + 1}/${novas.length}] ✓ ${c.urlNova} → ${s.statusHttp}`);
    }
    await sleep(PAUSA_MS);
  }

  if (mortas.length > 0) {
    console.error(`\n⛔ [sondar-pr-links] ${mortas.length} urlNova morta(s) no PR:`);
    for (const m of mortas) console.error(`  - ${m}`);
    process.exit(1);
  }

  console.log(`\n✓ [sondar-pr-links] Todas as ${novas.length} urlNova estão vivas.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
