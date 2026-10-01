#!/usr/bin/env node
/**
 * Runner da FILA DISTRIBUÍDA — pega a próxima tarefa, reivindica, roda, conclui.
 *
 * Plano: `docs/planos/PLANO-ORQUESTRACAO-DISTRIBUIDA.md` (F3). A lógica pura do
 * "quem pega o quê" mora em `apps/web/lib/fila/fila.ts`; aqui só há disco, git
 * e execução de processo — a mesma separação do resto do repositório.
 *
 * ═══ O CLAIM É UM COMMIT ═══
 *
 * Reivindicar = gravar `claimPor`/`claimEm` no arquivo da fila e (com `--push`)
 * commitar e empurrar. Duas máquinas ligadas correm para o mesmo `push`: quem
 * chega primeiro vence, a outra leva non-fast-forward e pega a próxima — o git
 * é a trava, sem serviço de coordenação. É o mesmo desenho do gatilho remoto.
 *
 * ═══ SEGURO POR PADRÃO ═══
 *
 * Sem `--executar`, o script só MOSTRA o que faria (`dry-run`). Sem `--push`, o
 * claim fica local. O Agendador pode chamar isto à vontade sem que um agente
 * rode ou um commit saia sem alguém ter decidido.
 *
 * A mensagem de commit sai por ARQUIVO (`-F`), nunca `-m` (AGENTS § 5.6), com o
 * trailer de coautoria — e só o arquivo da fila entra no commit (pathspec).
 *
 * Uso:
 *   npx tsx scripts/automacao/rodar-fila.mts --maquina desktop-fefpddp
 *   npx tsx scripts/automacao/rodar-fila.mts --maquina home-pc --executar --push
 *   npx tsx scripts/automacao/rodar-fila.mts --fila docs/relatorios-automacao/fila-distribuida.json
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { hostname, tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  concluir,
  proximaTarefa,
  reivindicar,
  resumoFila,
  type Fila,
  type Maquina,
  type TipoTarefa,
} from "../../apps/web/lib/fila/fila";

const LOG = "[rodar-fila]";
const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(__dirname, "..", "..");
const FILA_PADRAO = resolve(RAIZ, "docs", "relatorios-automacao", "fila-distribuida.json");

/** Comando de cada tipo de tarefa. `null` = não é automático (precisa de sessão). */
const COMANDOS: Record<TipoTarefa, { cmd: string; args: string[] } | null> = {
  fonte: { cmd: "npx", args: ["tsx", "scripts/agent-tools/picoclaw-source-watcher.mts"] },
  pagina: { cmd: "npx", args: ["tsx", "scripts/agent-tools/argus-page-checker.mts"] },
  link: { cmd: "npx", args: ["tsx", "scripts/agent-tools/linkmender-checker.mts"] },
  dado: { cmd: "npx", args: ["tsx", "bots/fiscaliza-bases.mts"] },
  teste: { cmd: "npm", args: ["run", "test:lib", "-w", "@cp/web"] },
  security: { cmd: "npx", args: ["tsx", "scripts/agent-tools/hermes-security-auditor.mts"] },
  pr: { cmd: "npx", args: ["tsx", "scripts/agent-tools/bot-seguranca-merge.mts"] },
  indice: { cmd: "npm", args: ["run", "indice:busca", "-w", "@cp/web"] },
  rag: { cmd: "npx", args: ["tsx", "apps/web/scripts/exportar-finetuning.mts"] },
  build: { cmd: "npx", args: ["tsx", "scripts/rotina-local.mts", "--so-build"] },
  deploy: { cmd: "guara", args: ["deploy", "--project", "controle-popular"] },
  "code-review": null,
};

/** Qual máquina é esta? `--maquina` vence; senão, decide pelo hostname. */
function detectarMaquina(override?: string): Maquina {
  if (override === "home-pc" || override === "desktop-fefpddp") return override;
  return hostname().toUpperCase().includes("FEFPDDP") ? "desktop-fefpddp" : "home-pc";
}

function git(...args: string[]): number {
  return spawnSync("git", args, { cwd: RAIZ, stdio: "inherit" }).status ?? 1;
}

/** Commit só do arquivo da fila, mensagem por ARQUIVO (nunca `-m`, AGENTS § 5.6). */
function commitFila(caminho: string, titulo: string): void {
  // A mensagem vive no TEMP do sistema, fora do repo — não suja a árvore.
  const msg = resolve(tmpdir(), "cp-fila-commit-msg.txt");
  writeFileSync(
    msg,
    `${titulo}\n\n` +
      `Registro automatico da fila distribuida (scripts/automacao/rodar-fila.mts).\n\n` +
      `Co-Authored-By: DeepSeek V4.1 Flash <noreply@deepseek.com>\n` +
      `Co-Authored-By: opencode <noreply@opencode.ai>\n`,
    "utf-8"
  );
  git("add", caminho);
  git("commit", "--only", caminho, "-F", msg);
}

/**
 * Processos que indicam trabalho PESADO na máquina. Enquanto um deles roda,
 * o runner não pega tarefa quando `--somente-ocioso` está ligado: é a regra
 * "usar a ociosidade, nunca competir com build/deploy" (F4 do plano).
 * Best-effort: no Linux/mac a checagem não existe e o gate libera.
 */
const PESADOS = ["guara.exe", "next.exe", "guro.exe"];

function maquinaPareceOcupada(): boolean {
  if (process.platform !== "win32") return false;
  try {
    const out = spawnSync("tasklist", [], { encoding: "utf-8", timeout: 10_000 }).stdout ?? "";
    const minusculo = out.toLowerCase();
    return PESADOS.some((p) => minusculo.includes(p.toLowerCase()));
  } catch {
    return false;
  }
}

function lerFila(caminho: string): Fila {
  if (!existsSync(caminho)) return { geradoEm: new Date().toISOString(), tarefas: [] };
  return JSON.parse(readFileSync(caminho, "utf-8")) as Fila;
}

function gravarFila(caminho: string, fila: Fila): void {
  writeFileSync(caminho, JSON.stringify(fila, null, 2) + "\n", "utf-8");
}

function main(): void {
  const argv = process.argv.slice(2);
  const valor = (k: string) => {
    const i = argv.indexOf(k);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const executar = argv.includes("--executar");
  const push = argv.includes("--push");
  const somenteOcioso = argv.includes("--somente-ocioso");
  const caminho = valor("--fila") ? resolve(valor("--fila")!) : FILA_PADRAO;
  const maquina = detectarMaquina(valor("--maquina"));

  const fila = lerFila(caminho);
  const r = resumoFila(fila);
  console.log(`${LOG} máquina=${maquina} fila=${caminho}`);
  console.log(`${LOG} resumo: ${r.livre} livres, ${r.em_curso} em curso, ${r.feita} feitas, ${r.falhou} falharam`);

  // F4: não competir com build/deploy. Com `--somente-ocioso`, se há processo
  // pesado na máquina, é melhor esperar a próxima rodada do Agendador.
  if (somenteOcioso && maquinaPareceOcupada()) {
    console.log(`${LOG} máquina ocupada (build/deploy/next em execução) — cedo a vez.`);
    return;
  }

  const tarefa = proximaTarefa(fila, maquina);
  if (!tarefa) {
    console.log(`${LOG} nada para esta máquina agora.`);
    return;
  }
  const comando = COMANDOS[tarefa.tipo];
  if (!comando) {
    console.log(`${LOG} "${tarefa.tipo}" não é automático (precisa de sessão de agente) — pulando.`);
    return;
  }

  console.log(`${LOG} pegou ${tarefa.id} → ${comando.cmd} ${comando.args.join(" ")}`);
  if (!executar) {
    console.log(`${LOG} dry-run: nada foi reivindicado nem executado (use --executar).`);
    return;
  }

  const comClaim = reivindicar(fila, tarefa.id, maquina, new Date().toISOString());
  gravarFila(caminho, comClaim);
  if (push) {
    commitFila(caminho, `fila: ${maquina} reivindica ${tarefa.id}`);
    git("fetch", "origin");
    git("rebase", "origin/main");
    git("push", "origin", "HEAD:main");
  }

  const res = spawnSync(comando.cmd, comando.args, { cwd: RAIZ, stdio: "inherit", shell: true });
  const sucesso = res.status === 0;
  const resultado = `${comando.cmd} ${comando.args.join(" ")} → exit ${res.status ?? "?"}`;

  const final = concluir(lerFila(caminho), tarefa.id, sucesso ? "feita" : "falhou", resultado, new Date().toISOString());
  gravarFila(caminho, final);
  if (push) commitFila(caminho, `fila: ${tarefa.id} ${sucesso ? "feita" : "falhou"}`);

  console.log(`${LOG} ${tarefa.id} ${sucesso ? "✅ feita" : "⛔ falhou"}: ${resultado}`);
  process.exit(sucesso ? 0 : 1);
}

try {
  main();
} catch (e) {
  console.error(`${LOG} erro:`, e instanceof Error ? e.message : e);
  process.exit(1);
}
