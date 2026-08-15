/**
 * Rotina local: ETL -> build -> deploy, na máquina de build.
 *
 * ═══ POR QUE ESTE ARQUIVO EXISTE ═══
 *
 * O site está no ar e correto, mas **só muda quando alguém roda o build aqui**.
 * Os 6 workflows de ETL seguem agendados no GitHub apontando para a Neon, que
 * não é mais o banco: eles acordam todo dia, falham (ou pior, gravam em lugar
 * nenhum) e ninguém lê o resultado. É a dívida silenciosa do §20.
 *
 * ═══ POR QUE LER OS WORKFLOWS EM VEZ DE COPIAR OS COMANDOS ═══
 *
 * São mais de cem invocações de módulo espalhadas por 6 arquivos, cada uma com
 * sua cadência e seus argumentos. Transcrevê-las para um script criaria uma
 * segunda lista que diverge da primeira no primeiro módulo novo — e a
 * divergência seria invisível: o ETL "rodaria", só que sem o coletor recente.
 *
 * Então o que muda ao sair do GitHub é só **o gatilho e o banco**. A lista de
 * módulos, a ordem e a cadência continuam sendo os arquivos em
 * `.github/workflows/` — que passam a ser lidos, não executados, lá.
 *
 * O preço é um mini-interpretador de `if:` do Actions. Ele é deliberadamente
 * burro e **recusa o que não entende** em vez de pular: um `if:` de formato
 * novo aborta a rotina com o texto da expressão. Pular seria o mesmo modo de
 * falha silenciosa que este arquivo existe para matar.
 *
 * ═══ O QUE ELE NUNCA FAZ ═══
 *
 * Publicar um site vazio. `getDb()` devolve `null` sem banco, as páginas saem
 * em branco e **o `next build` termina com exit 0** — o build verde é o modo
 * de falha, não o sinal de saúde. O sinal é a contagem de páginas: 21 = o
 * banco não foi lido. O deploy só acontece acima do piso.
 *
 * Uso:
 *   npx tsx scripts/rotina-local.mts                # ETL da cadência de hoje, build, deploy
 *   npx tsx scripts/rotina-local.mts --sem-deploy   # tudo menos publicar
 *   npx tsx scripts/rotina-local.mts --so-build     # pula o ETL
 *   npx tsx scripts/rotina-local.mts --listar       # só mostra o que rodaria
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

import { medirAssets, explicar } from "../apps/web/lib/deploy/tamanho-assets.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOWS = path.join(RAIZ, ".github", "workflows");
const WEB = path.join(RAIZ, "apps", "web");
const LOGS = path.join(RAIZ, "logs");

/**
 * Interpretador do radar de notícias.
 *
 * `py -3` e não `python`: o `python` do PATH desta máquina é o venv do
 * hermes-agent, e o dessa rotina roda pelo Agendador de Tarefas, cujo PATH é
 * outro — a mesma classe de armadilha que já fez os 25 passos de ETL rodarem
 * no bash do WSL (ver o bloco grande acima). O launcher `py` está em
 * `system32` e resolve o Python do sistema em qualquer PATH.
 *
 * O coletor só usa biblioteca padrão, então qualquer 3.x serve — nenhuma
 * instalação de pacote acontece aqui.
 */
const PYTHON = process.env.RADAR_PYTHON ?? "py";
const PYTHON_ARGS = process.env.RADAR_PYTHON ? [] : ["-3"];

// A ordem importa: Betim primeiro (é a cidade que já serve gente), e o
// congresso/judiciário por último porque são os mais lentos e os menos
// urgentes. É a mesma ordem de dependência que as cadências do GitHub
// escalonavam por dia da semana para não disputar o PNCP.
const ORDEM = [
  "etl-betim.yml",
  "etl-mg-interior.yml",
  "etl-cidades-novas.yml",
  "etl-congresso.yml",
  "etl-judiciario.yml",
];

// Piso de páginas abaixo do qual o deploy é abortado.
//
// 21 é o número medido de um build SEM banco (só as rotas que não consultam
// nada). 1.471 é o número com o banco local. O piso fica bem acima de 21 e
// bem abaixo de 1.471 de propósito: ele existe para pegar "o Postgres não
// subiu", não para vigiar crescimento de conteúdo.
const PISO_PAGINAS = 1000;

// Queda relativa que exige confirmação. O piso pega o desastre; isto pega a
// erosão — uma tabela que esvaziou derruba centenas de páginas sem chegar
// perto de 21.
const QUEDA_MAXIMA = 0.2;

const argv = process.argv.slice(2);

// ─── FLAG DESCONHECIDO ABORTA, NÃO É IGNORADO ────────────────────────────
//
// Escrito depois de digitar `--so-etl` (que não existia) e a rotina seguir
// alegremente para o build e o DEPLOY. Um `Set.has()` que não acha devolve
// `false`, e `false` aqui significa "pode publicar" — ou seja, o erro de
// digitação escolhia o comportamento mais perigoso disponível, em silêncio.
//
// Vale o mesmo princípio das outras travas deste arquivo: falhar alto é
// barato, falhar quieto custa um site publicado errado.
const BANDEIRAS = new Set([
  "--listar", "--so-build", "--so-etl", "--sem-deploy", "--forcar-deploy",
  "--dispatch", "--workflow", "--job",
]);
const COM_VALOR = new Set(["--workflow", "--job"]);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (COM_VALOR.has(argv[i - 1])) continue; // é o valor do anterior
  if (!BANDEIRAS.has(a)) {
    console.error(
      `argumento desconhecido: ${a}\n` +
        `conhecidos: ${[...BANDEIRAS].join(" ")}\n` +
        `(abortando de propósito — argumento errado ignorado já quase publicou sem querer)`
    );
    process.exit(2);
  }
}

const args = new Set(argv);
const SO_LISTAR = args.has("--listar");
const SO_BUILD = args.has("--so-build");
/** Coleta e para. Útil para encher uma cidade sem tocar no site. */
const SO_ETL = args.has("--so-etl");
const SEM_DEPLOY = args.has("--sem-deploy") || SO_ETL;
const FORCAR_DEPLOY = args.has("--forcar-deploy");

/**
 * `--dispatch` roda TODOS os passos do workflow, ignorando a cadência do dia.
 *
 * Não é atalho: é o `workflow_dispatch` do próprio GitHub, que o cabeçalho do
 * `etl-betim.yml` descreve como *"runs every step below regardless of
 * schedule, for manual backfills/testing"*. A rotina local reproduz a
 * semântica em vez de inventar uma.
 *
 * Existe porque a cadência resolve o dia a dia e não resolve o buraco: BH e
 * São Paulo estavam com ZERO linha em contratos, licitações, vereadores,
 * despesas, escolas e tudo o mais (medido em 2026-08-10). O ETL delas roda
 * terça e mensalmente; esperar a terça para descobrir se funciona é o tipo de
 * espera que não ensina nada.
 */
const DISPATCH = args.has("--dispatch");

/** `--workflow etl-cidades-novas.yml` limita a rodada a um arquivo. */
const SO_WORKFLOW = (() => {
  const i = argv.indexOf("--workflow");
  return i >= 0 ? argv[i + 1] : null;
})();

/**
 * `--job sao-paulo` limita a um job dentro do workflow.
 *
 * Existe porque `etl-cidades-novas.yml` tem dois jobs SEM `needs:` entre eles
 * — no GitHub, BH e São Paulo rodam em PARALELO. A rotina local executa em
 * sequência, e isso vira problema quando um passo é longo: em 2026-08-10 o
 * `etl.camaras.bh` sozinho levou mais de duas horas, e São Paulo, que estava
 * atrás dele na fila, não tinha começado.
 *
 * Rodar um job à parte não é desvio do workflow: é reproduzir o paralelismo
 * que ele já declara.
 */
const SO_JOB = (() => {
  const i = argv.indexOf("--job");
  return i >= 0 ? argv[i + 1] : null;
})();

// ───────────────────────────── registro em disco ─────────────────────────────

fs.mkdirSync(LOGS, { recursive: true });
// O PID entra no nome porque o carimbo até o SEGUNDO não é único: rodar
// `--listar` e a rodada de verdade em sequência produz dois processos no mesmo
// segundo, os dois abrem o mesmo arquivo em modo append e o log fica
// entrelaçado — descoberto assim, com a rodada de BH/SP escrevendo por cima do
// `--listar` que a precedeu. Log embaralhado é pior que log ausente: parece
// completo.
const carimbo = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const ARQUIVO_LOG = path.join(LOGS, `rotina-${carimbo}-${process.pid}.log`);
const fluxo = fs.createWriteStream(ARQUIVO_LOG, { flags: "a" });

function registrar(linha: string) {
  const hora = new Date().toISOString().slice(11, 19);
  const texto = `[${hora}] ${linha}`;
  console.log(texto);
  fluxo.write(texto + "\n");
}

// ───────────────────────────── o bash certo ─────────────────────────────

/**
 * Caminho absoluto do bash do Git — resolvido, nunca chamado por nome.
 *
 * ═══ O BUG QUE ISTO CONSERTA, E ELE ERA GRAVE ═══
 *
 * A primeira execução agendada (2026-08-10 06:00) falhou nos **25 de 25**
 * passos de ETL com `/bin/bash: line 1: python: command not found` — e mesmo
 * assim publicou, dizendo "publicado. 1471 páginas".
 *
 * A causa não é PATH: é que `spawn("bash")` procura o executável no PATH que
 * recebe, e o PATH do Agendador de Tarefas tem `C:\Windows\system32` e não tem
 * o Git. Em `system32` mora **`bash.exe` do WSL**. Ou seja: os passos rodavam
 * dentro do Linux do WSL, que não enxerga `C:\` (lá é `/mnt/c`) e não tem o
 * venv nem python. O prefixo `/bin/bash:` na mensagem era a pista — o Git Bash
 * diz `bash:`.
 *
 * Interativamente nunca aparecia, porque o PATH do meu shell acha o Git
 * primeiro. Era um erro que só existia no modo automático — exatamente o modo
 * que ninguém olha.
 *
 * Daí resolver o caminho a partir do `git`, e **recusar** `system32\bash.exe`
 * explicitamente. E daí a rotina abortar quando não encontra: rodar 25 passos
 * no interpretador errado é pior que não rodar.
 */
function acharBashDoGit(): string {
  const candidatos: string[] = [];

  // 1. A partir de onde o `git` está. É o caminho confiável: o bash mora em
  //    `<raiz>/bin/bash.exe`, e `git.exe` fica em `<raiz>/cmd`, `<raiz>/bin`
  //    ou `<raiz>/mingw64/bin`. Nesta máquina o Git está em
  //    `AppData\Local\hermes\git`, fora de qualquer lugar previsível — por
  //    isso adivinhar não serve.
  const ondeGit = spawnSync("where", ["git"], { encoding: "utf8", shell: true });
  for (const linha of (ondeGit.stdout ?? "").split(/\r?\n/)) {
    const exe = linha.trim();
    if (!exe.toLowerCase().endsWith("git.exe")) continue;
    let raiz = path.dirname(path.dirname(exe)); // .../cmd/git.exe -> raiz
    if (path.basename(raiz).toLowerCase() === "mingw64") raiz = path.dirname(raiz);
    candidatos.push(path.join(raiz, "bin", "bash.exe"));
  }

  // 2. Instalações padrão, para quando o `git` não estiver no PATH.
  for (const base of [process.env.ProgramFiles, process.env["ProgramFiles(x86)"],
                      path.join(process.env.LOCALAPPDATA ?? "", "Programs")]) {
    if (base) candidatos.push(path.join(base, "Git", "bin", "bash.exe"));
  }

  for (const c of candidatos) {
    // `system32\bash.exe` é o WSL. Nunca.
    if (/system32/i.test(c)) continue;
    if (fs.existsSync(c)) return c;
  }

  throw new Error(
    "não achei o bash do Git. Os blocos `run:` dos workflows são bash de verdade " +
      "(têm `for`, `$(date +%Y)` e `sleep`), e o `bash.exe` de C:\\Windows\\system32 é o " +
      "do WSL — ele não enxerga C:\\ nem o venv, e faria os 25 passos falharem em " +
      "silêncio.\nProcurei em:\n  " + candidatos.join("\n  ") +
      "\nInstale o Git for Windows ou ponha-o no PATH da tarefa agendada."
  );
}

const BASH = acharBashDoGit();

// ───────────────────────────── ambiente ─────────────────────────────

/** Lê um dotfile no formato KEY=VALUE. Não expande nada: o Next também não. */
function lerDotenv(arquivo: string): Record<string, string> {
  if (!fs.existsSync(arquivo)) return {};
  const saida: Record<string, string> = {};
  for (const linha of fs.readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(linha);
    if (!m || linha.trim().startsWith("#")) continue;
    saida[m[1]] = m[2].trim().replace(/^["'](.*)["']$/, "$1");
  }
  return saida;
}

/**
 * A regra que não se negocia (docs/worktrees.md): o banco é 127.0.0.1.
 *
 * Está em código e não em comentário porque já aconteceu — um build local
 * conectou na Neon e levou HTTP 402. Comentário não impede; abortar impede.
 */
function exigirBancoLocal(url: string | undefined, origem: string) {
  if (!url) throw new Error(`DATABASE_URL ausente em ${origem}`);
  const hospedeiro = new URL(url.replace(/^postgres(ql)?:/, "http:")).hostname;
  if (!["127.0.0.1", "localhost", "::1"].includes(hospedeiro)) {
    throw new Error(
      `${origem} aponta para "${hospedeiro}", não para o Postgres local. ` +
        `A rotina se recusa a rodar: foi assim que um build local bateu na Neon e levou 402.`
    );
  }
}

// ───────────────────────────── cron ─────────────────────────────

function campoBate(campo: string, valor: number): boolean {
  if (campo === "*") return true;
  return campo
    .split(",")
    .some((parte) => {
      const passo = parte.split("/");
      const alvo = passo[0];
      if (alvo === "*") return valor % Number(passo[1] ?? 1) === 0;
      if (alvo.includes("-")) {
        const [a, b] = alvo.split("-").map(Number);
        return valor >= a && valor <= b;
      }
      return Number(alvo) === valor;
    });
}

/**
 * O cron dispararia hoje?
 *
 * Hora e minuto são ignorados de propósito: a rotina roda uma vez por dia, e a
 * pergunta é "este passo entra na rodada de hoje", não "é 09:00 UTC agora".
 *
 * Dia-do-mês e dia-da-semana se combinam por OU quando ambos são restritos —
 * é a regra do cron, e não a intuição de E. Nenhum workflow daqui usa os dois
 * ao mesmo tempo, mas a regra fica certa para quando usar.
 */
function disparaHoje(cron: string, hoje: Date): boolean {
  const [, , dom, mes, dow] = cron.trim().split(/\s+/);
  if (!dom || !mes || !dow) throw new Error(`cron mal formado: "${cron}"`);
  const bateMes = campoBate(mes, hoje.getUTCMonth() + 1);
  if (!bateMes) return false;
  const domRestrito = dom !== "*";
  const dowRestrito = dow !== "*";
  const bateDom = campoBate(dom, hoje.getUTCDate());
  const bateDow = campoBate(dow, hoje.getUTCDay());
  if (domRestrito && dowRestrito) return bateDom || bateDow;
  if (domRestrito) return bateDom;
  if (dowRestrito) return bateDow;
  return true;
}

// ───────────────────────────── if: do Actions ─────────────────────────────

type Contexto = {
  schedule: string | null;
  event_name: string;
  matrix: Record<string, string>;
};

/**
 * Avalia UM comparativo. Reconhece só o que estes 6 workflows usam.
 *
 * O `throw` no final é a peça importante: um `if:` de formato novo aborta a
 * rotina em vez de virar `false`. Um passo que some sem avisar é exatamente o
 * tipo de erro que este projeto trata como pior que a falha ruidosa.
 */
function avaliarComparacao(expr: string, ctx: Contexto): boolean {
  const m = /^(.+?)\s*(==|!=)\s*(.+)$/.exec(expr.trim());
  if (!m) throw new Error(`comparação não reconhecida no if: ${expr}`);
  const [, esquerda, op, direitaBruta] = m;
  const direita = direitaBruta.trim().replace(/^'(.*)'$/, "$1");

  let valor: string;
  const alvo = esquerda.trim();
  if (alvo === "github.event_name") valor = ctx.event_name;
  else if (alvo === "github.event.schedule") valor = ctx.schedule ?? "";
  else if (alvo === "inputs.modulo") valor = ""; // rodada agendada nunca tem módulo
  else if (alvo.startsWith("matrix.")) valor = ctx.matrix[alvo.slice(7)] ?? "";
  else throw new Error(`operando desconhecido no if: "${alvo}" (expressão: ${expr})`);

  return op === "==" ? valor === direita : valor !== direita;
}

function avaliarSe(condicao: string | undefined, ctx: Contexto): boolean {
  if (condicao === undefined) return true;
  const limpo = String(condicao).replace(/^\$\{\{\s*/, "").replace(/\s*\}\}$/, "").trim();
  // `&&` liga mais forte que `||`, como em qualquer linguagem — separar por
  // `||` primeiro e por `&&` dentro de cada parte respeita a precedência.
  return limpo
    .split("||")
    .some((ou) => ou.split("&&").every((e) => avaliarComparacao(e, ctx)));
}

// ───────────────────────────── leitura dos workflows ─────────────────────────────

type Passo = {
  workflow: string;
  job: string;
  nome: string;
  comando: string;
  diretorio: string;
  env: Record<string, string>;
  tolerante: boolean;
};

function substituirMatriz(texto: string, matriz: Record<string, string>): string {
  return texto.replace(/\$\{\{\s*matrix\.([A-Za-z0-9_]+)\s*\}\}/g, (_, chave) => matriz[chave] ?? "");
}

/** Passos de infraestrutura do runner do GitHub: aqui não existem. */
function ehPreparoDoCI(passo: any): boolean {
  if (passo.uses) return true; // checkout, setup-python, setup-node, cache
  const run = String(passo.run ?? "");
  if (/^\s*(pip install|npm ci)\b/m.test(run) && run.trim().split("\n").length === 1) return true;
  // `playwright install --with-deps` instala pacote APT: é do runner Ubuntu e
  // nem existe no Windows. O navegador aqui é instalação de máquina, feita uma
  // vez (`playwright install chromium`), não passo de rotina diária.
  if (/^\s*playwright install\b/m.test(run)) return true;
  // Escrever credencial a partir de `secrets.` — local, ela já está no .env.
  if (/secrets\./.test(run)) return true;
  return false;
}

function lerWorkflow(arquivo: string, hoje: Date): Passo[] {
  const doc = parseYaml(fs.readFileSync(path.join(WORKFLOWS, arquivo), "utf8"));
  // `on` é lido como booleano `true` pelo YAML 1.1; a lib `yaml` usa 1.2 e
  // devolve a string, mas as duas chaves são conferidas para não depender disso.
  const gatilhos = doc.on ?? doc[true as unknown as string] ?? {};
  const crons: string[] = (gatilhos.schedule ?? []).map((s: any) => s.cron);
  const disparam = crons.filter((c) => disparaHoje(c, hoje));
  // Em `--dispatch` o cron não decide nada — é o mesmo que apertar "Run
  // workflow" no GitHub num dia qualquer.
  if (!DISPATCH && disparam.length === 0) return [];

  const envWorkflow: Record<string, string> = doc.env ?? {};
  const passos: Passo[] = [];

  for (const [nomeJob, job] of Object.entries<any>(doc.jobs ?? {})) {
    if (SO_JOB && nomeJob !== SO_JOB) continue;
    const matrizes: Record<string, string>[] = job.strategy?.matrix?.include ?? [{}];
    const dirPadrao = job.defaults?.run?.["working-directory"] ?? ".";

    for (const matriz of matrizes) {
      const envJob: Record<string, string> = Object.fromEntries(
        Object.entries<any>(job.env ?? {}).map(([k, v]) => [k, substituirMatriz(String(v), matriz)])
      );

      for (const passo of job.steps ?? []) {
        if (ehPreparoDoCI(passo)) continue;
        const ctx: Contexto = { schedule: null, event_name: "schedule", matrix: matriz as any };
        const roda = DISPATCH
          ? avaliarSe(passo.if, { ...ctx, event_name: "workflow_dispatch" })
          : disparam.some((cron) => avaliarSe(passo.if, { ...ctx, schedule: cron }));
        if (!roda) continue;

        const comando = substituirMatriz(String(passo.run ?? "").trim(), matriz);
        if (!comando) continue;
        if (comando.includes("${{")) {
          throw new Error(
            `${arquivo} / "${passo.name ?? "(sem nome)"}": sobrou expressão do Actions ` +
              `no comando, que a rotina local não sabe resolver:\n${comando}`
          );
        }

        passos.push({
          workflow: arquivo,
          job: nomeJob,
          nome: String(passo.name ?? comando.split("\n")[0]),
          comando,
          diretorio: passo["working-directory"] ?? dirPadrao,
          env: { ...envWorkflow, ...envJob },
          tolerante: passo["continue-on-error"] === true,
        });
      }
    }
  }
  return passos;
}

// ───────────────────────────── execução ─────────────────────────────

/**
 * Roda o bloco `run:` no bash do Git.
 *
 * Bash e não PowerShell porque os blocos são bash de verdade — têm `for`,
 * `$(date +%Y)` e `sleep`. Traduzi-los seria reescrever os workflows, que é
 * justamente o que este arquivo evita.
 *
 * O `python` do PATH é o do venv do diretório: nenhum módulo é instalado no
 * Python global (o pip global já quebrou o hermes-agent uma vez).
 */
function rodar(passo: Passo, ambiente: Record<string, string>): boolean {
  const dir = path.join(RAIZ, passo.diretorio);
  const scriptsVenv = path.join(dir, ".venv", "Scripts");
  const temVenv = fs.existsSync(scriptsVenv);
  if (passo.comando.includes("python") && !temVenv) {
    throw new Error(
      `${passo.diretorio} precisa de venv e não tem. Crie com:\n` +
        `  py -3.12 -m venv ${passo.diretorio}/.venv && ${passo.diretorio}/.venv/Scripts/python -m pip install -r ${passo.diretorio}/requirements.txt`
    );
  }

  const env = {
    ...process.env,
    ...ambiente,
    ...passo.env,
    PATH: (temVenv ? scriptsVenv + path.delimiter : "") + process.env.PATH,
  };
  // Valor que só o CI resolve (`${{ secrets.X }}`) é descartado: o local vem
  // do .env e não pode ser sobrescrito pelo texto cru do workflow.
  for (const [k, v] of Object.entries(env)) {
    if (typeof v === "string" && v.includes("${{")) delete (env as any)[k];
  }

  const r = spawnSync(BASH, ["-c", passo.comando], { cwd: dir, env, stdio: "pipe", encoding: "utf8" });
  const saida = ((r.stdout ?? "") + (r.stderr ?? "")).trimEnd();
  if (saida) fluxo.write(saida + "\n");
  if (r.error) registrar(`      spawn falhou: ${r.error.message} (${BASH})`);
  const ok = r.status === 0;
  if (!ok) {
    const ultimas = saida.split("\n").slice(-8).join("\n");
    registrar(`      falhou (código ${r.status})${passo.tolerante ? " — tolerado" : ""}`);
    if (ultimas) console.log(ultimas);
  }
  return ok;
}

// ───────────────────────────── build e deploy ─────────────────────────────

function contarPaginas(): number {
  const manifesto = path.join(WEB, ".next", "prerender-manifest.json");
  if (!fs.existsSync(manifesto)) throw new Error("build não gerou .next/prerender-manifest.json");
  return Object.keys(JSON.parse(fs.readFileSync(manifesto, "utf8")).routes ?? {}).length;
}

/**
 * `shell: true` não é preguiça: desde o Node 18.20/20.12 o `spawn` RECUSA
 * `.bat`/`.cmd` sem shell (correção do CVE-2024-27980), e `npm` no Windows é
 * `npm.cmd`. Sem isto o passo "falha" em zero segundo, com stdout vazio e
 * `status: null` — parece build quebrado e é spawn que nem começou.
 */
function npm(script: string): boolean {
  const r = spawnSync("npm", ["run", script], {
    cwd: WEB,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    env: process.env,
    shell: true,
  });
  const saida = ((r.stdout ?? "") + (r.stderr ?? "")).trimEnd();
  if (saida) fluxo.write(saida + "\n");
  if (r.error) registrar(`      spawn falhou: ${r.error.message}`);
  if (r.status !== 0) console.log(saida.split("\n").slice(-25).join("\n"));
  return r.status === 0;
}

const ARQUIVO_CONTAGEM = path.join(LOGS, "ultima-contagem.json");

function contagemAnterior(): number | null {
  if (!fs.existsSync(ARQUIVO_CONTAGEM)) return null;
  try {
    return JSON.parse(fs.readFileSync(ARQUIVO_CONTAGEM, "utf8")).paginas ?? null;
  } catch {
    return null;
  }
}

// ───────────────────────────── principal ─────────────────────────────

async function principal() {
  const hoje = new Date();
  registrar(`rotina local — ${hoje.toISOString()}`);
  registrar(`log: ${ARQUIVO_LOG}`);

  const envEtl = lerDotenv(path.join(RAIZ, "etl", "betim", ".env"));
  const envWeb = lerDotenv(path.join(WEB, ".env.local"));
  exigirBancoLocal(envEtl.DATABASE_URL, "etl/betim/.env");
  exigirBancoLocal(envWeb.DATABASE_URL, "apps/web/.env.local");
  registrar("banco: 127.0.0.1 nos dois .env — confirmado");

  // ── ETL ──────────────────────────────────────────────────────────
  let falhas = 0;
  if (!SO_BUILD) {
    const alvos = SO_WORKFLOW ? ORDEM.filter((w) => w === SO_WORKFLOW) : ORDEM;
    if (SO_WORKFLOW && alvos.length === 0) {
      throw new Error(`--workflow ${SO_WORKFLOW} não está em ORDEM. Conhecidos: ${ORDEM.join(", ")}`);
    }
    const passos = alvos.flatMap((w) => lerWorkflow(w, hoje));
    if (DISPATCH) registrar("--dispatch: cadência ignorada, rodando tudo (como workflow_dispatch)");
    registrar(`ETL: ${passos.length} passo(s) na cadência de hoje`);
    if (SO_LISTAR) {
      for (const p of passos) {
        registrar(`  ${p.workflow} / ${p.job} :: ${p.nome}`);
        for (const l of p.comando.split("\n")) registrar(`      $ ${l.trim()}`);
      }
      return;
    }
    for (const [i, p] of passos.entries()) {
      registrar(`  [${i + 1}/${passos.length}] ${p.workflow} :: ${p.nome}`);
      const ok = rodar(p, envEtl);
      if (!ok && !p.tolerante) falhas++;
    }
    registrar(falhas === 0 ? "ETL: todos os passos passaram" : `ETL: ${falhas} passo(s) falharam`);

    // ETL INTEIRO NO CHÃO É PROBLEMA DE AMBIENTE, NÃO DE DADO — E NÃO PUBLICA.
    //
    // Um passo que falha é rotina: a fonte caiu, a API mudou, o município não
    // publicou ainda. O banco segue com o dado de ontem e o build continua
    // válido, então publicar é o certo.
    //
    // TODOS falharem é outra coisa. Foi o que aconteceu na primeira execução
    // agendada (2026-08-10 06:00): 25 de 25 falharam porque o `bash` resolvido
    // era o do WSL, e a rotina publicou assim mesmo, escrevendo "publicado.
    // 1471 páginas". O código de saída 1 apareceu no Agendador, mas o site foi
    // republicado como se estivesse tudo bem — a rotina cometeu exatamente o
    // erro que ela existe para impedir.
    //
    // Zero de N passando não é o mundo mudando de uma vez: é a máquina errada,
    // o venv ausente, o interpretador trocado. Nesse caso não se constrói nada.
    if (passos.length > 0 && falhas === passos.length) {
      registrar(
        `ABORTADO: os ${passos.length} passos de ETL falharam, sem exceção. Isso é ambiente ` +
          `(bash, venv, credencial), não fonte de dado — fonte de dado não cai toda junta. ` +
          `Nada foi construído nem publicado. O motivo de cada passo está acima neste log.`
      );
      process.exitCode = 1;
      return;
    }
  }

  // ── build ────────────────────────────────────────────────────────
  if (SO_ETL) {
    registrar("--so-etl: coleta terminada, parando antes do build.");
    return;
  }

  // ── radar de notícias ────────────────────────────────────────────
  //
  // Roda ANTES do build, e é aqui e não numa tarefa agendada própria por um
  // motivo: o radar só chega ao site quando o site é reconstruído. Agendado à
  // parte, ele coletaria todo dia e ficaria esperando um build que talvez não
  // venha — e a tela mostraria notícia velha com data nova. Amarrado ao build,
  // nunca existe coleta que não foi publicada.
  //
  // Falha aqui NÃO aborta a publicação: três servidores de notícia de pé é
  // condição do radar, não do portal. O coletor também não sobrescreve o
  // arquivo bom quando volta vazio (ver scripts/coletar-noticias-paraopeba.py).
  registrar("radar: coletando notícias do Paraopeba");
  {
    const r = spawnSync(PYTHON, [...PYTHON_ARGS, path.join(RAIZ, "scripts", "coletar-noticias-paraopeba.py")], {
      cwd: RAIZ,
      encoding: "utf-8",
    });
    if (r.status === 0) {
      registrar("radar: coleta concluída");
    } else {
      registrar(
        `radar: coleta falhou (${r.status ?? "sem status"}) — seguindo assim mesmo, ` +
          `o site publica com o radar da coleta anterior.`
      );
    }
  }

  registrar("build: npm run build (apps/web)");
  if (!npm("build")) {
    registrar("ABORTADO: o build falhou. Nada foi publicado.");
    process.exitCode = 1;
    return;
  }

  const paginas = contarPaginas();
  const antes = contagemAnterior();
  registrar(`build: ${paginas} páginas pré-renderizadas${antes ? ` (última: ${antes})` : ""}`);

  // A trava que dá razão a este arquivo.
  if (paginas < PISO_PAGINAS) {
    registrar(
      `ABORTADO: ${paginas} páginas, abaixo do piso de ${PISO_PAGINAS}. ` +
        `Isto é build sem banco (21 é o número medido), não é o código. ` +
        `O deploy publicaria um site em branco por cima de um site correto.`
    );
    process.exitCode = 1;
    return;
  }
  if (antes && paginas < antes * (1 - QUEDA_MAXIMA) && !FORCAR_DEPLOY) {
    registrar(
      `ABORTADO: ${paginas} páginas contra ${antes} da última rodada — queda de ` +
        `${(((antes - paginas) / antes) * 100).toFixed(1)}%. Uma tabela pode ter esvaziado. ` +
        `Se a queda for esperada, rode de novo com --forcar-deploy.`
    );
    process.exitCode = 1;
    return;
  }

  /**
   * Terceira trava, irmã das duas de contagem acima — e a que faltava em
   * 15/08/2026.
   *
   * Naquele dia o build passou, as duas travas de contagem passaram, e o
   * `cf:deploy` morreu com "Asset too large: 35.5 MiB" **depois** de 6 a 7
   * minutos de build já gastos. Medir aqui custa milissegundos e dá o mesmo
   * veredito antes de pagar o deploy — é a regra do `preflight-deploy.mts`
   * ("nada que o job precise no fim pode ser descoberto no fim") aplicada ao
   * que só existe depois do build, e que por isso ele não podia medir.
   *
   * O limite é 20 MiB, não os 25 da Cloudflare: `sp/educacao` já estava em 21
   * MiB naquele mesmo build, publicando, e era o próximo a estourar sozinho na
   * ingestão seguinte. Ver `lib/deploy/tamanho-assets.ts`.
   *
   * `--forcar-deploy` atravessa o AVISO, nunca o teto: acima de 25 MiB o
   * deploy falha de qualquer jeito, e deixar passar trocaria um abort claro por
   * um erro da Cloudflare sete minutos depois.
   */
  const tamanho = medirAssets(path.join(WEB, ".open-next", "assets"));
  registrar(`assets: ${explicar(tamanho)}`);
  if (tamanho.estoura.length > 0) {
    registrar("ABORTADO: asset acima do teto da Cloudflare. O deploy falharia no fim.");
    process.exitCode = 1;
    return;
  }
  if (tamanho.emRisco.length > 0 && !FORCAR_DEPLOY) {
    registrar(
      "ABORTADO: asset perto do teto. Publica hoje e estoura na próxima ingestão — " +
        "conserte o payload ou rode com --forcar-deploy se a folga for aceitável."
    );
    process.exitCode = 1;
    return;
  }

  if (SEM_DEPLOY) {
    registrar("--sem-deploy: parando antes de publicar.");
    return;
  }

  // ── deploy ───────────────────────────────────────────────────────
  registrar("deploy: npm run cf:deploy");
  if (!npm("cf:deploy")) {
    registrar("ABORTADO: o deploy falhou. O site continua com a versão anterior.");
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(
    ARQUIVO_CONTAGEM,
    JSON.stringify({ paginas, publicado_em: new Date().toISOString(), falhas_etl: falhas }, null, 2)
  );
  registrar(`publicado. ${paginas} páginas.${falhas ? ` (${falhas} passo(s) de ETL falharam)` : ""}`);
  if (falhas) process.exitCode = 1;
}

principal().catch((e) => {
  registrar(`ERRO: ${e.message}`);
  process.exitCode = 1;
});
