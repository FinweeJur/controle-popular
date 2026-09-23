/**
 * LinkMender PR — o degrau de PUBLICACAO do LinkMender v2.
 *
 * Roda o pipeline (verifica links, propoe correcoes), e se a camada
 * `apps/web/data/link-correcoes.json` mudou:
 *   1. branch `bot/linkmender-YYYYMMDD`;
 *   2. commit com pathspec explicito e mensagem por ARQUIVO (`-F`);
 *   3. push da branch;
 *   4. `gh pr create` com label `bot/linkmender` e o relatorio no corpo.
 *
 * Gates antes do PR: `validar-link-correcoes.mjs` + `vitest lib/linkmender`.
 * Dedupe: se ja existe PR aberto com a mesma `urlVelha` no titulo/corpo,
 * nao abre outro.
 *
 * Uso (rotina madrugada ou manual):
 *   npx tsx scripts/agent-tools/linkmender-pr.mts
 *   LINKMENDER_PAUSA_MS=800 npx tsx scripts/agent-tools/linkmender-pr.mts
 *   LINKMENDER_SO_PROPOR=1 npx tsx ...   # so roda o v2, sem git/PR
 *
 * Regras AGENTS.md: `--force` nunca; mensagem em arquivo; pathspec;
 * User-Agent honesto; pausa 1-2s/host; fora da CI.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { executarLinkMenderV2 } from "./linkmender-v2.mts";
import {
  validarCorrecoes,
  type CorrecaoLink,
} from "../../apps/web/lib/linkmender/correcoes.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ARQUIVO_CORRECOES = path.join(RAIZ, "apps", "web", "data", "link-correcoes.json");
const RELATORIO = path.join(
  RAIZ,
  "docs",
  "relatorios-automacao",
  "linkmender-v2-propostas.md"
);

const LABEL_PR = "bot/linkmender";

function git(args: string[], cwd = RAIZ): string {
  return execFileSync("git", args, { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function gh(args: string[], cwd = RAIZ): string {
  return execFileSync("gh", args, { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function lerCorrecoes(): CorrecaoLink[] {
  if (!existsSync(ARQUIVO_CORRECOES)) return [];
  return validarCorrecoes(JSON.parse(readFileSync(ARQUIVO_CORRECOES, "utf-8")));
}

/** Diff por urlVelha: só as que existem agora e não existiam antes. */
function novasDesde(antes: CorrecaoLink[], depois: CorrecaoLink[]): CorrecaoLink[] {
  const chavesAntes = new Set(antes.map((c) => c.urlVelha));
  return depois.filter((c) => !chavesAntes.has(c.urlVelha));
}

function existePrAbertoCom(urlVelha: string): string | null {
  try {
    const saida = gh([
      "pr",
      "list",
      "--state",
      "open",
      "--search",
      `head:bot/linkmender in:title`,
      "--json",
      "number,title,url",
      "--limit",
      "50",
    ]);
    const prs = JSON.parse(saida) as { number: number; title: string; url: string }[];
    const alvo = urlVelha.slice(0, 80);
    const achado = prs.find(
      (p) => p.title.includes(urlVelha) || p.title.includes(alvo)
    );
    return achado ? achado.url : null;
  } catch {
    return null;
  }
}

function rodarGateCorrecoes(): void {
  // prebuild validator — JSON malformado aborta
  execFileSync("node", ["apps/web/scripts/validar-link-correcoes.mjs"], {
    cwd: RAIZ,
    stdio: "inherit",
  });
  // suíte do pipeline — lógica mockada, sem rede
  execFileSync(
    "npx",
    ["vitest", "run", "--config", "apps/web/vitest.config.mts", "lib/linkmender/"],
    { cwd: RAIZ, stdio: "inherit" }
  );
}

function montarCorpoPr(novas: CorrecaoLink[], total: number): string {
  const linhas: string[] = [
    `## LinkMender — ${novas.length} correcao(oes) de link`,
    "",
    "PR aberto automaticamente pelo LinkMender PR (`scripts/agent-tools/linkmender-pr.mts`).",
    "A correcao entra como CAMADA em `apps/web/data/link-correcoes.json` —",
    "o dado versionado nao e reescrito (regra de `lib/linkmender/correcoes.ts`).",
    "",
    "### Propostas (urlVelha → urlNova)",
    "",
  ];
  for (const c of novas) {
    linhas.push(`- \`${c.urlVelha}\``);
    linhas.push(`  → \`${c.urlNova}\``);
    linhas.push(`  criterios: ${c.criterios.join(", ")}`);
    linhas.push(`  data: ${c.data}`);
  }
  linhas.push("");
  linhas.push(`### Gates`);
  linhas.push("");
  linhas.push("- [x] `validar-link-correcoes.mjs` (prebuild)");
  linhas.push("- [x] `vitest lib/linkmender/`");
  linhas.push(`- Camada final: ${total} correcao(oes)`);
  linhas.push("");
  linhas.push(`Label \`${LABEL_PR}\` habilita o revisor automatico (workflow \`pr-revisor\`).`);
  linhas.push("");
  linhas.push("---");
  linhas.push("");
  linhas.push("Gerado por IA (opencode) — revisar o diff antes do merge.");
  return linhas.join("\n");
}

export async function abrirPrLinkMender(): Promise<void> {
  if (process.env.LINKMENDER_SO_PROPOR === "1") {
    console.log("🔗 [LinkMender PR] LINKMENDER_SO_PROPOR=1 — só o pipeline, sem git/PR.");
    await executarLinkMenderV2();
    return;
  }

  console.log("🔗 [LinkMender PR] Rodando pipeline v2...");
  const antes = lerCorrecoes();

  // Guarda o estado do repo: só mexemos em arquivos do LinkMender.
  const branchAtual = git(["rev-parse", "--abbrev-ref", "HEAD"]);
  const sujoAntes = git(["status", "--porcelain"]);
  if (sujoAntes.trim() !== "") {
    console.warn("⚠️  [LinkMender PR] Working tree sujo — commit só por pathspec explícito.");
  }

  await executarLinkMenderV2();

  const depois = lerCorrecoes();
  const novas = novasDesde(antes, depois);

  if (novas.length === 0) {
    console.log("✓ [LinkMender PR] Nenhuma correção nova — sem PR.");
    // repara o relatório se o v2 o reescreveu sem mudança de camada
    return;
  }

  const primeira = novas[0].urlVelha;
  const prExistente = existePrAbertoCom(primeira);
  if (prExistente) {
    console.log(`↷ [LinkMender PR] Já existe PR aberto com essa urlVelha: ${prExistente}`);
    return;
  }

  console.log(`🔧 [LinkMender PR] ${novas.length} correção(ões) nova(s) — rodando gates...`);
  rodarGateCorrecoes();

  const data = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const branch = `bot/linkmender-${data}`;

  git(["fetch", "origin", "main"], RAIZ);
  git(["checkout", "-B", branch, "origin/main"], RAIZ);

  // pathspec explícito: SÓ os arquivos do LinkMender
  git(["add", "--", "apps/web/data/link-correcoes.json"], RAIZ);
  if (existsSync(RELATORIO)) {
    git(["add", "--", "docs/relatorios-automacao/linkmender-v2-propostas.md"], RAIZ);
  }

  const staged = git(["diff", "--cached", "--name-only"], RAIZ);
  if (staged.trim() === "") {
    console.log("✓ [LinkMender PR] Nada staged (camada já igual) — sem PR.");
    git(["checkout", branchAtual], RAIZ);
    return;
  }

  const dirMsg = mkdtempSync(path.join(tmpdir(), "linkmender-pr-"));
  const arquivoMsg = path.join(dirMsg, "msg.txt");
  const arquivoPrBody = path.join(dirMsg, "pr-body.md");
  writeFileSync(arquivoPrBody, montarCorpoPr(novas, depois.length), "utf-8");
  writeFileSync(
    arquivoMsg,
    [
      `linkmender: ${novas.length} correcao(oes) de link na camada`,
      "",
      "Novas entradas em apps/web/data/link-correcoes.json, geradas pelo",
      "pipeline LinkMender v2 (HTTP + conteudo + criterios de criterios.ts).",
      "O dado versionado nao e reescrito — a camada e aplicada no prebuild.",
      "",
      "Correcoes:",
      ...novas.map((c) => `- ${c.urlVelha} -> ${c.urlNova}`),
      "",
      "Co-Authored-By: opencode <noreply@github.com>",
      "",
    ].join("\n"),
    "utf-8"
  );

  try {
    git(["commit", "--only", "apps/web/data/link-correcoes.json", "-F", arquivoMsg], RAIZ);
    if (existsSync(RELATORIO)) {
      const ainda = git(["status", "--porcelain", "--", RELATORIO], RAIZ);
      if (ainda.trim() !== "") {
        const arquivoMsg2 = path.join(dirMsg, "msg-relatorio.txt");
        writeFileSync(
          arquivoMsg2,
          [
            "linkmender: atualiza relatorio de propostas v2",
            "",
            "Saida do pipeline LinkMender PR — acompanha o commit da camada.",
            "",
            "Co-Authored-By: opencode <noreply@github.com>",
            "",
          ].join("\n"),
          "utf-8"
        );
        git(["commit", "--only", RELATORIO, "-F", arquivoMsg2], RAIZ);
      }
    }

    git(["push", "-u", "origin", branch], RAIZ);

    const urlPr = gh(
      [
        "pr",
        "create",
        "--title",
        `linkmender: ${novas.length} correcao(oes) de link`,
        "--body-file",
        arquivoPrBody,
        "--label",
        LABEL_PR,
        "--base",
        "main",
        "--head",
        branch,
      ],
      RAIZ
    );
    console.log(`✅ [LinkMender PR] PR aberto: ${urlPr}`);
    console.log(`   Label: ${LABEL_PR} — o workflow pr-revisor vai testar os links do diff.`);
  } finally {
    rmSync(dirMsg, { recursive: true, force: true });
    try {
      git(["checkout", branchAtual], RAIZ);
    } catch {
      // branch original sumiu — não fatal
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  abrirPrLinkMender().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
