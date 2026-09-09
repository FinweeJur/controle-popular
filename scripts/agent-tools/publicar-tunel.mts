/**
 * publicar-tunel.mts — mata o `next start` velho da porta 3000, sobe o build
 * novo e confere HTTP 200 local. Só declara sucesso com o site respondendo —
 * metade da lição de 08/09: o servidor morreu e NINGUÉM mediu.
 *
 * Dois consumidores: `rotina-local.mts` (publica depois do build) e
 * `vigia-servidor.mts` (restaura o site quando ele morre fora de rodada).
 * Módulo próprio (e não função dentro da rotina) porque a rotina roda
 * `principal()` ao importar — importá-la por inteiro dispararia ETL.
 *
 * Mata só o processo que ESCUTA na porta, depois de conferir o nome (`node`),
 * nunca um nome genérico à mão — dev server de outra sessão não está na porta
 * e por isso não é afetado.
 */
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const WEB = path.join(RAIZ, "apps", "web");
const LOGS = path.join(RAIZ, "logs");

export const PORTA_TUNEL = 3000;
export const URL_SAUDE = `http://127.0.0.1:${PORTA_TUNEL}`;

type Registrar = (linha: string) => void;

/** Devolve o pid do processo escutando na porta, ou null. */
function pidDaPorta(porta: number): number | null {
  const r = spawnSync("powershell", [
    "-NoProfile", "-Command",
    `(Get-NetTCPConnection -LocalPort ${porta} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess`,
  ], { encoding: "utf8" });
  const texto = (r.stdout ?? "").trim();
  return texto && /^\d+$/.test(texto) ? Number(texto) : null;
}

/** Confere se a porta responde 200 (saúde). Custo: uma requisição local. */
export function portaResponde200(): boolean {
  const r = spawnSync("powershell", [
    "-NoProfile", "-Command",
    `try { (Invoke-WebRequest -Uri '${URL_SAUDE}' -UseBasicParsing -TimeoutSec 10).StatusCode } catch { '' }`,
  ], { encoding: "utf8" });
  return (r.stdout ?? "").trim() === "200";
}

export function publicarTunel(registrar: Registrar = (l) => console.log(l)): boolean {
  const pid = pidDaPorta(PORTA_TUNEL);
  if (pid) {
    const nome = spawnSync("powershell", [
      "-NoProfile", "-Command",
      `(Get-Process -Id ${pid} -ErrorAction SilentlyContinue).ProcessName`,
    ], { encoding: "utf8" }).stdout?.trim();
    if (nome !== "node") {
      registrar(`ABORTADO: porta ${PORTA_TUNEL} ocupada por ${nome ?? "desconhecido"} (pid ${pid}) e não é node. Resolva à mão.`);
      return false;
    }
    registrar(`servidor antigo: pid ${pid} (node, porta ${PORTA_TUNEL}) — derrubando`);
    spawnSync("powershell", ["-NoProfile", "-Command", `Stop-Process -Id ${pid} -Force`]);
    // A porta precisa soltar antes do novo subir, senão o `next start` novo
    // escolhe outra porta e o túnel passa a servir o site VELHO.
    spawnSync("powershell", [
      "-NoProfile", "-Command",
      `$fim = (Get-Date).AddSeconds(15); while ((Get-Date) -lt $fim) { if (-not (Get-NetTCPConnection -LocalPort ${PORTA_TUNEL} -State Listen -ErrorAction SilentlyContinue)) { exit 0 }; Start-Sleep -Milliseconds 500 }; exit 1`,
    ]);
  } else {
    registrar(`nenhum servidor na porta ${PORTA_TUNEL} (não era o esperado: o site estava fora?)`);
  }

  const logNovo = path.join(LOGS, `next-start-${new Date().toISOString().replace(/[:.]/g, "-")}.log`);
  // shell:true e o jeito que funciona no Windows: o Node cita a linha inteira
  // de uma vez (cmd /d /s /c "<tudo>"). Com spawn("cmd", [...args]) o cmd
  // recebe aspas aninhadas e quebra o parser — o primeiro drill de 09/09
  // pegou isso: servidor nao subia, log nem nascia, pid undefined.
  const filho = spawn(
    `npm run start -- -p ${PORTA_TUNEL} > "${logNovo}" 2>&1`,
    {
      cwd: WEB,
      shell: true,
      detached: true,
      stdio: "ignore",
      // Desacoplado de propósito: o servidor precisa sobreviver a esta rotina. A
      // janela do Windows pode fechar o pai no fim da tarefa agendada.
      windowsHide: true,
    }
  );
  filho.unref();
  registrar(`servidor novo subindo (pid ${filho.pid}, log: ${path.basename(logNovo)})`);

  // Saúde: 200 no próprio PC, com tentativas até o Next terminar de subir.
  const fim = Date.now() + 90_000;
  while (Date.now() < fim) {
    spawnSync("powershell", ["-NoProfile", "-Command", "Start-Sleep -Milliseconds 2000"]);
    if (portaResponde200()) {
      registrar(`saúde: HTTP 200 em ${URL_SAUDE} — túnel volta a servir o build novo.`);
      return true;
    }
  }
  registrar(`ABORTADO: ${URL_SAUDE} não respondeu 200 em 90 s. Veja o log do servidor. O túnel pode estar servindo 502.`);
  return false;
}

// CLI direto (runbook OPERACAO "site fora do ar"): npx tsx scripts/agent-tools/publicar-tunel.mts
// Importado por rotina-local.mts e vigia-servidor.mts NAO dispara isto �
// o guard abaixo so bate quando este arquivo e o script executado.
const executadoDireto = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (executadoDireto) {
  const ok = publicarTunel();
  process.exit(ok ? 0 : 1);
}
