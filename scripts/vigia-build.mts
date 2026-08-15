/**
 * vigia-build.mts — atende os pedidos de publicação feitos pelo painel.
 *
 *   npx tsx scripts/vigia-build.mts            # uma passada e sai
 *   npx tsx scripts/vigia-build.mts --laco     # fica em pé, checando
 *   npx tsx scripts/vigia-build.mts --intervalo 300
 *   npx tsx scripts/vigia-build.mts --seco     # não builda, só diz o que faria
 *
 * ═══ POR QUE PUXAR, E NÃO ESCUTAR ═══
 *
 * Este script roda na máquina de build (`home-pc`), que é a única com o
 * Postgres atual. Medido em 15/08/2026: ela responde `tailscale ping` em 4 ms,
 * e **nenhuma porta de serviço responde** — 22, 445, 3389 e 5432 fechadas. Dá
 * para falar com ela, não dá para mandar nela.
 *
 * Então o pedido chega pelo canal que já existe: o repositório. O painel grava
 * `apps/web/data/pedido-build.json`, commita e dá push; este script puxa, vê o
 * pedido novo e roda `scripts/rotina-local.mts`. Sem abrir porta, funcionando
 * atrás de NAT, e com trilha no git — quem pediu, quando, por quê.
 *
 * ═══ COMO ELE SABE QUE UM PEDIDO É NOVO ═══
 *
 * Compara `pedido-build.json` com `ultimo-build.json`, que ele mesmo grava
 * depois de rodar. Se o `em` do pedido for igual ao `pedidoAtendido` do último
 * build, não faz nada. Um contador ou um "já rodei hoje" erraria no dia em que
 * duas publicações fossem pedidas — e erraria para menos, que é o pior lado.
 *
 * ═══ O QUE ELE NUNCA FAZ ═══
 *
 * Não decide publicar sozinho: sem pedido, não roda. Não silencia falha — se a
 * rotina sair com código diferente de zero, grava isso no `ultimo-build.json`
 * para o painel mostrar, em vez de deixar o dono achando que publicou. E não
 * dá `--forcar-deploy`: as travas de piso de página e de queda relativa que a
 * rotina já tem existem justamente para o caso de o banco vir vazio.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PEDIDO = path.join(RAIZ, "apps", "web", "data", "pedido-build.json");
const ULTIMO = path.join(RAIZ, "apps", "web", "data", "ultimo-build.json");

const argv = process.argv.slice(2);
const BANDEIRAS = new Set(["--laco", "--intervalo", "--seco"]);
const COM_VALOR = new Set(["--intervalo"]);
for (let i = 0; i < argv.length; i++) {
  if (COM_VALOR.has(argv[i - 1])) continue;
  if (!BANDEIRAS.has(argv[i])) {
    console.error(
      `argumento desconhecido: ${argv[i]}\nconhecidos: ${[...BANDEIRAS].join(" ")}\n` +
        `(abortando de propósito — a rotina-local usa a mesma regra, pelo mesmo motivo)`
    );
    process.exit(2);
  }
}
const EM_LACO = argv.includes("--laco");
const SECO = argv.includes("--seco");
const INTERVALO_S = (() => {
  const i = argv.indexOf("--intervalo");
  const v = i >= 0 ? Number(argv[i + 1]) : NaN;
  return Number.isFinite(v) && v >= 30 ? v : 300;
})();

interface Pedido {
  solicitadoPor: string;
  motivo: string;
  em: string;
  edicoesPendentes: number;
  commitDoPedido: string;
}

interface UltimoBuild {
  pedidoAtendido: string | null;
  comecouEm: string;
  terminouEm: string;
  codigoDeSaida: number;
  publicou: boolean;
  commitBuildado: string;
  erro?: string;
}

function git(...args: string[]): string {
  return execFileSync("git", args, { cwd: RAIZ, encoding: "utf-8", timeout: 120_000 }).trim();
}

function lerJson<T>(arquivo: string): T | null {
  try {
    return JSON.parse(readFileSync(arquivo, "utf-8")) as T;
  } catch {
    return null;
  }
}

function log(msg: string): void {
  console.log(`[vigia ${new Date().toISOString()}] ${msg}`);
}

function umaPassada(): void {
  try {
    git("fetch", "--quiet", "origin");
    /**
     * `--ff-only`: se a máquina de build tiver commit local divergente, é
     * melhor parar e avisar do que criar merge automático no repositório que
     * publica o site.
     */
    git("merge", "--ff-only", "origin/main");
  } catch (e) {
    log(`não consegui atualizar do origin: ${(e as Error).message}`);
    return;
  }

  const pedido = lerJson<Pedido>(PEDIDO);
  if (!pedido) {
    log("nenhum pedido de build no repositório.");
    return;
  }

  const ultimo = lerJson<UltimoBuild>(ULTIMO);
  if (ultimo && ultimo.pedidoAtendido === pedido.em) {
    log(`pedido de ${pedido.em} já foi atendido; nada a fazer.`);
    return;
  }

  log(
    `pedido de ${pedido.solicitadoPor} (${pedido.motivo}) com ${pedido.edicoesPendentes} edição(ões).`
  );

  if (SECO) {
    log("--seco: pararia aqui e rodaria `npx tsx scripts/rotina-local.mts`.");
    return;
  }

  const comecouEm = new Date().toISOString();
  let codigoDeSaida = 0;
  let erro: string | undefined;
  try {
    execFileSync("npx", ["tsx", "scripts/rotina-local.mts"], {
      cwd: RAIZ,
      stdio: "inherit",
      // Build + deploy medidos entre 15 e 20 min; 60 dá folga sem travar para sempre.
      timeout: 60 * 60_000,
      shell: process.platform === "win32",
    });
  } catch (e) {
    const err = e as { status?: number; message: string };
    codigoDeSaida = typeof err.status === "number" ? err.status : 1;
    erro = err.message;
  }

  const resultado: UltimoBuild = {
    pedidoAtendido: pedido.em,
    comecouEm,
    terminouEm: new Date().toISOString(),
    codigoDeSaida,
    publicou: codigoDeSaida === 0,
    commitBuildado: git("rev-parse", "HEAD"),
    erro,
  };
  writeFileSync(ULTIMO, `${JSON.stringify(resultado, null, 2)}\n`, "utf-8");

  /**
   * Publica o resultado de volta. É o que faz o painel da OUTRA máquina saber
   * como terminou — sem isso, quem clicou em "publicar" ficaria sem resposta,
   * que é exatamente o que o botão existe para resolver.
   *
   * Commit por pathspec: `git commit` sem caminho leva tudo que estiver em
   * staging, inclusive o que a rotina de ETL acabou de mexer.
   */
  try {
    git(
      "commit",
      "--only",
      "apps/web/data/ultimo-build.json",
      "-m",
      `Vigia: build ${resultado.publicou ? "publicou" : `FALHOU (saida ${codigoDeSaida})`}\n\nAtendendo ao pedido de ${pedido.solicitadoPor} feito em ${pedido.em}.`
    );
    git("push", "origin", "HEAD:main");
  } catch (e) {
    log(`build terminou, mas não consegui publicar o resultado: ${(e as Error).message}`);
  }

  log(resultado.publicou ? "build concluído e publicado." : `build FALHOU (${codigoDeSaida}).`);
}

if (EM_LACO) {
  log(`em laço, checando a cada ${INTERVALO_S}s. Ctrl+C para sair.`);
  umaPassada();
  setInterval(umaPassada, INTERVALO_S * 1000);
} else {
  umaPassada();
}
