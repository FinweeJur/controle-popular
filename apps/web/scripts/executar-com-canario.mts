/**
 * Executa um comando longo com canário: avisa início no Telegram, grava o
 * log em %TEMP%\canario\, e reporta fim/falha com duração + cauda do log.
 *
 *   npx tsx scripts/executar-com-canario.mts "<comando>" [--limite-min 30]
 *
 * O comando roda via cmd.exe (mesma semântica de quem cola no terminal).
 * Bloqueia até terminar — quem orquestra (gatilho, sessão IA) decide se
 * espera ou spawna. Em falha, a cauda do log vai na mensagem para diagnóstico
 * imediato sem abrir a máquina. Sem credencial Telegram o comando RODA igual
 * (canário mudo), e o log fica em disco.
 */
import { spawn } from "node:child_process";
import { closeSync, mkdirSync, openSync, readFileSync } from "node:fs";
import path from "node:path";
import { enviarMensagem, configurado } from "./canario/telegram";

const args = process.argv.slice(2);
const idxLimite = args.indexOf("--limite-min");
const LIMITE_MIN = idxLimite !== -1 ? Number(args[idxLimite + 1] ?? 30) : 30;
const resto =
  idxLimite === -1 ? args : args.filter((a, i) => i !== idxLimite && i !== idxLimite + 1);
const comando = resto.join(" ").trim();

if (!comando) {
  console.error('uso: executar-com-canario.mts "<cmd>" [--limite-min 30]');
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
const dirLog = path.join(process.env.TEMP ?? ".", "canario");
mkdirSync(dirLog, { recursive: true });
const logPath = path.join(dirLog, `${stamp}.log`);

function cauda(linhas = 15): string {
  try {
    const partes = readFileSync(logPath, "utf8").split(/\r?\n/).filter(Boolean);
    return partes.slice(-linhas).join("\n").slice(0, 3_000);
  } catch {
    return "(log vazio ou ilegível)";
  }
}

async function main(): Promise<number> {
  const inicio = Date.now();
  await enviarMensagem(`▶️ exec: ${comando}\n(log: ${logPath})`);

  const fd = openSync(logPath, "a");
  const filho = spawn("cmd.exe", ["/c", comando], {
    cwd: process.cwd(),
    stdio: ["ignore", fd, fd],
  });

  const timer = setTimeout(() => {
    void enviarMensagem(`⏱️ TIMEOUT (${LIMITE_MIN} min): matando processo.\n${comando}`);
    filho.kill();
  }, LIMITE_MIN * 60_000);

  const codigo = await new Promise<number>((resolve) => {
    filho.on("exit", (c) => resolve(c ?? 1));
    filho.on("error", () => resolve(1));
  });
  clearTimeout(timer);
  closeSync(fd);

  const duracaoMin = ((Date.now() - inicio) / 60_000).toFixed(1);
  const rotulo = codigo === 0 ? "✅ OK" : `❌ FALHOU (exit ${codigo})`;
  await enviarMensagem(
    `${rotulo} em ${duracaoMin} min: ${comando}\n--- cauda do log ---\n${cauda()}`
  );
  return codigo;
}

if (!configurado()) console.error("[canario] TELEGRAM ausente: rodando sem avisos.");
process.exitCode = await main();
