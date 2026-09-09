/**
 * vigia-servidor.mts — o cão de guarda do `next start`.
 *
 * Roda a cada 5 minutos (tarefa agendada, ver `agendar-tarefas-windows.ps1`).
 * Os incidentes de 01/09 e 08/09/2026 foram iguais: o processo mais
 * importante do site morreu e NINGUÉM mediu — o dono descobriu vendo o site
 * em 502. Este script existe para que a próxima morte aconteça com:
 *   1. o site voltando sozinho em minutos (reinício via `publicarTunel`)
 *   2. o Telegram do dono sabendo antes dele
 *
 * Guardas (Google SRE cap. 22 — falha em cascata e orçamento de retry):
 *   - CAP de reinícios: máx. 3 por hora. Estourou → para de reiniciar e só
 *     avisa. Sem isso, um bug de boot vira o vigia reiniciando em loop —
 *     o vigia cascateado é pior que o servidor morto.
 *   - Orfanato: não toca se a porta 3000 estiver ocupada por não-node
 *     (`publicarTunel` recusa — é a trava certa).
 *
 * Heartbeat: grava `scripts/.heartbeat-vigia` a cada ciclo vivo, para a
 * rotina da madrugada (ou o dono via /status) conferir que ESTE processo
 * também está vivo.
 *
 * Uso: npx tsx scripts/vigia-servidor.mts [--nao-avisar]
 *   --nao-avisar: pula o Telegram (para o drill não spammar em treino)
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publicarTunel, portaResponde200, URL_SAUDE } from "./agent-tools/publicar-tunel.mts";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HEARTBEAT = path.join(RAIZ, "scripts", ".heartbeat-vigia");
const CONTADOR = path.join(RAIZ, "scripts", ".vigia-reinicios.json");
const HEARTBEAT_GATILHO = path.join(RAIZ, "scripts", ".heartbeat-gatilho");

/** Orçamento de reinícios (SRE cap. 22): janela de 1 h. */
const MAX_REINICIOS = 3;
const JANELA_MS = 60 * 60 * 1000;
/** Gatilho morto: 2 ciclos do long-poll (que espera até ~50 s cada). */
const GATILHO_STALE_MS = 20 * 60 * 1000;

function registrar(linha: string): void {
  console.log(`${new Date().toISOString()} ${linha}`);
}

function avisarTelegram(texto: string): void {
  const argv = process.argv.slice(2);
  if (argv.includes("--nao-avisar")) {
    registrar("(telegram suprimido por --nao-avisar)");
    return;
  }
  const r = spawnSync("npx", ["tsx", "scripts/falar-com-dono.mts", texto], {
    cwd: RAIZ, encoding: "utf8", timeout: 60_000, windowsHide: true, shell: true,
  });
  registrar(`telegram: rc=${r.status}`);
}

function contarReinicios(): number[] {
  try {
    const j = JSON.parse(fs.readFileSync(CONTADOR, "utf8")) as { carimbos: number[] };
    return Array.isArray(j.carimbos) ? j.carimbos : [];
  } catch {
    return [];
  }
}

function registrarReinicio(): number[] {
  const agora = Date.now();
  const carimbos = contarReinicios().filter((t) => agora - t < JANELA_MS);
  carimbos.push(agora);
  fs.writeFileSync(CONTADOR, JSON.stringify({ carimbos }, null, 2));
  return carimbos;
}

/** Heartbeat: o vigia prova que está vivo; e confere o gatilho remoto. */
function baterHeartbeat(): void {
  fs.writeFileSync(HEARTBEAT, new Date().toISOString());
  if (fs.existsSync(HEARTBEAT_GATILHO)) {
    const carimbo = fs.statSync(HEARTBEAT_GATILHO).mtimeMs;
    if (Date.now() - carimbo > GATILHO_STALE_MS) {
      registrar(`ATENÇÃO: gatilho remoto sem heartbeat há ${Math.round((Date.now() - carimbo) / 60000)} min`);
      avisarTelegram(`🚧 <b>Gatilho remoto morto?</b>\nSem heartbeat há ${Math.round((Date.now() - carimbo) / 60000)} minutos.\nOs comandos /status e /sincronizar não vão responder.`);
    }
  }
}

function principal(): void {
  baterHeartbeat();

  if (portaResponde200()) {
    // Silêncio no log é o estado bom — a cada 5 min, sem ruído.
    process.exit(0);
  }

  registrar(`⚠️ ${URL_SAUDE} não respondeu 200. Investigando antes de reiniciar...`);

  const carimbos = contarReinicios();
  const naJanela = carimbos.filter((t) => Date.now() - t < JANELA_MS);
  if (naJanela.length >= MAX_REINICIOS) {
    registrar(`⛔ cap de ${MAX_REINICIOS} reinícios/hora estourado (${naJanela.length} na janela). NÃO reinicio de novo.`);
    avisarTelegram(
      `⛔ <b>Vigia: cap de reinícios estourado</b>\n` +
      `O servidor da porta 3000 segue morto e ${naJanela.length} reinícios nesta hora não resolveram.\n` +
      `Suspeita de bug de boot — precisa de olho humano. Log: <code>logs/</code>`
    );
    process.exit(1);
  }

  registrar("reiniciando o servidor (mesma lógica da publicação)...");
  const ok = publicarTunel(registrar);
  registrarReinicio();
  if (ok) {
    avisarTelegram(
      `🟢 <b>Vigia: site restaurado sozinho</b>\n` +
      `O next start tinha morrido; reiniciei e a porta 3000 responde 200 de novo.\n` +
      `Reinícios nesta hora: ${naJanela.length + 1}/${MAX_REINICIOS}.`
    );
    process.exit(0);
  }
  avisarTelegram(
    `🔴 <b>Vigia: NÃO consegui restaurar o site</b>\n` +
    `A porta 3000 não subiu. Veja <code>logs/</code> — mitigação manual: <code>npm run start -- -p 3000</code> em <code>apps/web</code>.`
  );
  process.exit(1);
}

principal();
