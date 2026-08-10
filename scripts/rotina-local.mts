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

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOWS = path.join(RAIZ, ".github", "workflows");
const WEB = path.join(RAIZ, "apps", "web");
const LOGS = path.join(RAIZ, "logs");

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

const args = new Set(process.argv.slice(2));
const SO_LISTAR = args.has("--listar");
const SO_BUILD = args.has("--so-build");
const SEM_DEPLOY = args.has("--sem-deploy");
const FORCAR_DEPLOY = args.has("--forcar-deploy");

// ───────────────────────────── registro em disco ─────────────────────────────

fs.mkdirSync(LOGS, { recursive: true });
const carimbo = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const ARQUIVO_LOG = path.join(LOGS, `rotina-${carimbo}.log`);
const fluxo = fs.createWriteStream(ARQUIVO_LOG, { flags: "a" });

function registrar(linha: string) {
  const hora = new Date().toISOString().slice(11, 19);
  const texto = `[${hora}] ${linha}`;
  console.log(texto);
  fluxo.write(texto + "\n");
}

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
  if (disparam.length === 0) return [];

  const envWorkflow: Record<string, string> = doc.env ?? {};
  const passos: Passo[] = [];

  for (const [nomeJob, job] of Object.entries<any>(doc.jobs ?? {})) {
    const matrizes: Record<string, string>[] = job.strategy?.matrix?.include ?? [{}];
    const dirPadrao = job.defaults?.run?.["working-directory"] ?? ".";

    for (const matriz of matrizes) {
      const envJob: Record<string, string> = Object.fromEntries(
        Object.entries<any>(job.env ?? {}).map(([k, v]) => [k, substituirMatriz(String(v), matriz)])
      );

      for (const passo of job.steps ?? []) {
        if (ehPreparoDoCI(passo)) continue;
        const ctx: Contexto = { schedule: null, event_name: "schedule", matrix: matriz as any };
        const roda = disparam.some((cron) => avaliarSe(passo.if, { ...ctx, schedule: cron }));
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

  const r = spawnSync("bash", ["-c", passo.comando], { cwd: dir, env, stdio: "pipe", encoding: "utf8" });
  const saida = ((r.stdout ?? "") + (r.stderr ?? "")).trimEnd();
  if (saida) fluxo.write(saida + "\n");
  if (r.error) registrar(`      spawn falhou: ${r.error.message} (bash do Git está no PATH?)`);
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
    const passos = ORDEM.flatMap((w) => lerWorkflow(w, hoje));
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
  }

  // ── build ────────────────────────────────────────────────────────
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
