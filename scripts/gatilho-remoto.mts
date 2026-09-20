/**
 * Gatilho remoto: deixa o `desktop-fefpddp` (ou qualquer dispositivo do
 * tailnet) pedir "sincronize e publique" a este PC, sem SSH e sem sessÃ£o
 * interativa â€” por HTTP dentro do Tailscale ou por mensagem no bot do
 * Telegram que hoje sÃ³ ENVIA alerta do canÃ¡rio (`.github/scripts/
 * canario_limites.py`).
 *
 * â•â•â• POR QUE NÃƒO Ã‰ SSH DO TAILSCALE â•â•â•
 *
 * `tailscale up --ssh` resolveria isto num comando, mas Ã© mudanÃ§a de
 * configuraÃ§Ã£o de seguranÃ§a da MÃQUINA (abre uma porta de entrada nova), e
 * essa decisÃ£o Ã© de quem senta na frente dela â€” nÃ£o de uma sessÃ£o de agente.
 * O comando certo, se um dia for essa a escolha, Ã©:
 *
 *     tailscale set --ssh
 *
 * Este arquivo Ã© o caminho que nÃ£o pede essa decisÃ£o: um processo comum,
 * sem privilÃ©gio novo, escutando sÃ³ onde o Tailscale jÃ¡ alcanÃ§a.
 *
 * â•â•â• MODELO DE SEGURANÃ‡A, CAMADA POR CAMADA â•â•â•
 *
 * 1. **Bind no IP do Tailscale, nunca em `0.0.0.0`.** `tailscale ip -4`
 *    devolve o endereÃ§o `100.x.y.z` deste PC â€” sÃ³ trÃ¡fego que jÃ¡ atravessou
 *    o WireGuard do tailnet chega aqui. Um dispositivo fora do tailnet nÃ£o
 *    alcanÃ§a este processo mesmo sabendo a porta.
 * 2. **Token prÃ³prio.** Nem `PAINEL_TOKEN` nem `ADMIN_TOKEN` â€” cada um jÃ¡
 *    circula com um raio de vazamento diferente (ver
 *    `docs/PAINEL-EDICAO-COMO-USAR.md`), e reusar amplia o raio de todos.
 *    `GATILHO_TOKEN` vive sÃ³ em `scripts/.env` (gitignored) e Ã© comparado
 *    por hash com tempo constante â€” `crypto.timingSafeEqual`, nÃ£o `===`.
 * 3. **Telegram: sÃ³ o chat_id configurado.** Mensagem de qualquer outro
 *    chat Ã© registrada e IGNORADA â€” achar o bot no Telegram nÃ£o basta.
 * 4. **Fail-closed nos dois casos.** Sem `GATILHO_TOKEN`/`TELEGRAM_CHAT_ID`
 *    configurado, o respectivo canal simplesmente nÃ£o sobe â€” nunca "libera
 *    tudo porque nÃ£o configuraram".
 *
 * â•â•â• O QUE O GATILHO FAZ, E O QUE ELE DELEGA â•â•â•
 *
 * Este arquivo sÃ³ recebe o pedido e autentica. O trabalho de verdade â€”
 * git fetch/merge/push, guarda de dado pessoal, build, as travas de pÃ¡gina e
 * de tamanho de asset, deploy â€” Ã© `sincronizar-e-publicar.mts`, que jÃ¡
 * recusa Ã¡rvore suja, recusa merge com conflito e nunca forÃ§a deploy. Este
 * gatilho nÃ£o reimplementa nenhuma dessas decisÃµes.
 *
 * Uso:
 *   npx tsx scripts/gatilho-remoto.mts
 *
 * VariÃ¡veis em `scripts/.env` (ver `scripts/.env.exemplo`):
 *   GATILHO_TOKEN=<valor aleatÃ³rio>
 *   TELEGRAM_BOT_TOKEN=<o mesmo do canÃ¡rio>
 *   TELEGRAM_CHAT_ID=<o mesmo do canÃ¡rio>
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { sincronizarEPublicar } from "./sincronizar-e-publicar.mts";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOGS = path.join(RAIZ, "logs");
const OPENCODE_BIN =
  "C:/Users/Home/AppData/Local/hermes/node/node_modules/opencode-ai/bin/opencode.exe";
const ARQUIVO_OFFSET = path.join(RAIZ, "scripts", ".gatilho-offset");
const HEARTBEAT = path.join(RAIZ, "scripts", ".heartbeat-gatilho");
const ARQUIVO_LOG = path.join(LOGS, "gatilho-remoto.log");

fs.mkdirSync(LOGS, { recursive: true });

function log(msg: string) {
  const linha = `[${new Date().toISOString()}] ${msg}`;
  console.log(linha);
  fs.appendFileSync(ARQUIVO_LOG, linha + "\n");
}

// â”€â”€â”€ Config: scripts/.env, parse manual (mesmo padrÃ£o de aplicar-migration-
// local.mts â€” sem dependÃªncia nova sÃ³ para ler trÃªs variÃ¡veis). â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function lerEnv(caminho: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  if (!fs.existsSync(caminho)) return out;
  for (const linha of fs.readFileSync(caminho, "utf-8").split("\n")) {
    const m = linha.match(/^([A-Z_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}
const ENV = await lerEnv(path.join(RAIZ, "scripts", ".env"));

const GATILHO_TOKEN = ENV.GATILHO_TOKEN || "";
const TELEGRAM_BOT_TOKEN = ENV.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = ENV.TELEGRAM_CHAT_ID || "";
const GATILHO_TELEGRAM_POLL = ENV.GATILHO_TELEGRAM_POLL === "true";
const PORTA = Number(ENV.GATILHO_PORTA || 3029);

if (!GATILHO_TOKEN) log("AVISO: GATILHO_TOKEN ausente â€” o canal HTTP fica DESLIGADO.");
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID)
  log("AVISO: TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID ausente â€” o canal Telegram fica DESLIGADO.");

/** Um sync por vez â€” um segundo pedido durante um sync em andamento sÃ³ avisa. */
let emAndamento = false;

async function rodarSync(origem: string): Promise<{ ok: boolean; resumo: string }> {
  if (emAndamento) {
    return { ok: false, resumo: "jÃ¡ hÃ¡ uma sincronizaÃ§Ã£o em andamento â€” aguarde." };
  }
  emAndamento = true;
  log(`sync iniciado (origem: ${origem})`);
  try {
    const r = sincronizarEPublicar();
    log(`sync terminou: etapa=${r.etapa} ok=${r.ok}`);
    const resumo =
      r.etapa === "sem-novidades"
        ? "sem novidades, nada publicado"
        : r.ok
          ? `publicado. ${r.commitAntes?.slice(0, 7)} â†’ ${r.commitDepois?.slice(0, 7)}`
          : `ABORTADO em "${r.etapa}": ${r.motivo.slice(0, 500)}`;
    return { ok: r.ok, resumo };
  } catch (e) {
    const msg = (e as Error).message;
    log(`sync explodiu: ${msg}`);
    return { ok: false, resumo: `erro inesperado: ${msg}` };
  } finally {
    emAndamento = false;
  }
}

// â”€â”€â”€ Canal 1: HTTP dentro do tailnet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function tokenBate(recebido: string): boolean {
  if (!GATILHO_TOKEN) return false;
  const a = createHash("sha256").update(recebido).digest();
  const b = createHash("sha256").update(GATILHO_TOKEN).digest();
  return timingSafeEqual(a, b);
}

function subirServidorHttp(ip: string) {
  const servidor = http.createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/sincronizar") {
      res.writeHead(404).end();
      return;
    }
    const auth = req.headers.authorization || "";
    const recebido = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!tokenBate(recebido)) {
      log(`HTTP: token invÃ¡lido de ${req.socket.remoteAddress}`);
      res.writeHead(401).end();
      return;
    }
    if (emAndamento) {
      res.writeHead(409, { "content-type": "text/plain; charset=utf-8" }).end(
        "jÃ¡ hÃ¡ uma sincronizaÃ§Ã£o em andamento"
      );
      return;
    }
    res.writeHead(202, { "content-type": "text/plain; charset=utf-8" }).end(
      `iniciado â€” acompanhe em ${ARQUIVO_LOG}`
    );
    void rodarSync(`http:${req.socket.remoteAddress}`);
  });
  servidor.listen(PORTA, ip, () => {
    log(`HTTP escutando em http://${ip}:${PORTA}/sincronizar (sÃ³ dentro do tailnet)`);
  });
  servidor.on("error", (e) => log(`HTTP falhou ao subir: ${(e as Error).message}`));
}

// â”€â”€â”€ Canal 2: Telegram (long-poll, sem webhook â€” nÃ£o precisa de porta   â”€â”€â”€
// exposta nem de HTTPS pÃºblico). â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const COMANDOS: Record<string, string> = {
  "/sincronizar": "sync",
  "/status": "status",
  "/tunel": "tunel",
  "/tunnel": "tunel",
  "/reiniciar": "reiniciar",
  "/restart": "reiniciar",
  "/proximas": "proximas",
  "/code": "code",
  "/andamento": "andamento",
  "/menu": "menu",
  "/sessao": "sessao",
  "/logs": "logs",
};

async function telegramApi(metodo: string, corpo: Record<string, unknown>) {
  const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${metodo}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });
  return r.json();
}

function lerOffset(): number {
  try {
    return Number(fs.readFileSync(ARQUIVO_OFFSET, "utf-8").trim()) || 0;
  } catch {
    return 0;
  }
}
function gravarOffset(n: number) {
  fs.writeFileSync(ARQUIVO_OFFSET, String(n));
}

// ── Handlers reutilizáveis (usados por comandos de texto E botões inline) ──

async function cmdMenu(chatId: string) {
  const texto =
    "📋 *Menu — Controle Popular*\n\n" +
    "📊 /status — Verifica se o servidor está ocioso ou sincronizando\n" +
    "🔍 /tunel — Mostra estado do Cloudflare Tunnel e do next start\n" +
    "🖥️ /sessao — Detalhes da sessão: PID, memória, uptime, reinícios\n" +
    "📋 /logs — Status de todos os bots: Farol, Radar, Escudo, Olho\n" +
    "🔄 /sincronizar — Git pull + build + deploy (publica alterações)\n" +
    "♻️ /reiniciar — Reinicia o servidor do zero (build completo)\n" +
    "🤖 /code — Status do portal: banco, R2, fontes capturadas\n" +
    "📋 /andamento — Lista do que já foi implementado\n" +
    "📌 /proximas — Pendências e próximos passos\n\n" +
    "Ou clique num botão abaixo 👇";

  const botoes = [
    [{ text: "📊 Status", callback_data: "cmd_status" }, { text: "🔍 Tunel", callback_data: "cmd_tunel" }],
    [{ text: "🖥️ Sessao", callback_data: "cmd_sessao" }, { text: "📋 Logs", callback_data: "cmd_logs" }],
    [{ text: "🔄 Sync", callback_data: "cmd_sincronizar" }, { text: "♻️ Reiniciar", callback_data: "cmd_reiniciar" }],
    [{ text: "🤖 Code", callback_data: "cmd_code" }, { text: "📋 Andamento", callback_data: "cmd_andamento" }],
    [{ text: "📌 Proximas", callback_data: "cmd_proximas" }],
  ];

  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: texto,
    parse_mode: "Markdown",
    reply_markup: JSON.stringify({ inline_keyboard: botoes }),
  });
}

async function cmdTunel(chatId: string) {
  let status = "desconhecido";
  try {
    const svc = execFileSync("sc.exe", ["query", "Cloudflared"], { encoding: "utf-8" });
    status = svc.includes("RUNNING") ? " rodando" : " parado";
  } catch { status = " nao encontrado"; }
  let nextStart = "parado";
  try {
    const ps = execFileSync("powershell", ["-Command", "Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -match 'next (dev|start)'} | Measure-Object | Select-Object -ExpandProperty Count"], { encoding: "utf-8" });
    nextStart = ps.trim() === "0" ? "parado" : " rodando";
  } catch { nextStart = "verificar manualmente"; }
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: `Tunel (Cloudflared):${status}\nNext (porta 3000):${nextStart}`,
  });
}

async function cmdSessao(chatId: string) {
  const linhas: string[] = ["🖥️ */sessao — estado da sessão*", ""];
  try {
    const ps = execFileSync("powershell", [
      "-NoProfile", "-Command",
      `Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -match 'next (dev|start)'} | Select-Object Id, WorkingSet64, StartTime | ConvertTo-Json -Compress`,
    ], { encoding: "utf-8" });
    const d = JSON.parse(ps.trim() || "null");
    if (d) {
      const p = Array.isArray(d) ? d[0] : d;
      const rss = Math.round((p.WorkingSet64 || 0) / 1024 / 1024);
      const uptime = p.StartTime ? Math.round((Date.now() - new Date(p.StartTime).getTime()) / 1000 / 60) : "?";
      linhas.push(`*PID:* ${p.Id}`, `*Memoria:* ${rss} MB`, `*Uptime:* ${uptime} min`);
    } else {
      linhas.push(`*Next start:* PARADO`);
    }
  } catch { linhas.push(`*Next start:* nao detectado`); }
  try {
    const port = execFileSync("powershell", [
      "-NoProfile", "-Command",
      `(Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess`,
    ], { encoding: "utf-8" }).trim();
    linhas.push(`*Porta 3000:* ${port ? `PID ${port}` : "livre"}`);
  } catch { linhas.push(`*Porta 3000:* verificar`); }
  try {
    const reinicios = JSON.parse(fs.readFileSync(path.join(RAIZ, "scripts", ".vigia-reinicios.json"), "utf-8"));
    const recentes = (reinicios.carimbos || []).filter((t: number) => Date.now() - t < 3600000);
    linhas.push(`*Reinicios (1h):* ${recentes.length}/6`);
  } catch { linhas.push(`*Reinicios (1h):* 0/6`); }
  try {
    const svc = execFileSync("sc.exe", ["query", "Cloudflared"], { encoding: "utf-8" });
    linhas.push(`*Cloudflared:* ${svc.includes("RUNNING") ? "OK" : "parado"}`);
  } catch { linhas.push(`*Cloudflared:* nao encontrado`); }
  try {
    const hb = fs.readFileSync(path.join(RAIZ, "scripts", ".heartbeat-vigia"), "utf-8").trim();
    const idade = Math.round((Date.now() - new Date(hb).getTime()) / 1000 / 60);
    linhas.push(`*Vigia heartbeat:* ${idade} min atras`);
  } catch { linhas.push(`*Vigia heartbeat:* sem dado`); }
  try {
    const up = execFileSync("powershell", [
      "-NoProfile", "-Command",
      `(Get-CimInstance Win32_OperatingSystem).LastBootUpTime`,
    ], { encoding: "utf-8" }).trim();
    const boot = new Date(up);
    const horas = Math.round((Date.now() - boot.getTime()) / 1000 / 60 / 60 * 10) / 10;
    linhas.push(`*Maquina:* ${horas}h desde ultimo boot`);
  } catch {}
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: linhas.join("\n"),
    parse_mode: "Markdown",
  });
}

async function cmdReiniciar(chatId: string) {
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: "reiniciando next start (build + start)...",
  });
  try {
    execFileSync("powershell", ["-Command", "Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -match 'next (dev|start)'} | Stop-Process -Force"], { encoding: "utf-8" });
    execFileSync("powershell", ["-Command", "Start-Sleep -Seconds 2; & 'C:\\Users\\Home\\AppData\\Local\\hermes\\node\\node.exe' 'C:\\DevCoder\\controle-popular\\node_modules\\next\\dist\\bin\\next' build --webpack"], { encoding: "utf-8", timeout: 900000, cwd: "C:\\DevCoder\\controle-popular\\apps\\web" });
    execFileSync("powershell", ["-Command", "Start-Process -FilePath 'C:\\Users\\Home\\AppData\\Local\\hermes\\node\\node.exe' -ArgumentList 'C:\\DevCoder\\controle-popular\\node_modules\\next\\dist\\bin\\next','start','-p','3000' -WorkingDirectory 'C:\\DevCoder\\controle-popular\\apps\\web' -WindowStyle Hidden"], { encoding: "utf-8", timeout: 15000 });
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: "✅ next start reiniciado (porta 3000)",
    });
  } catch (e) {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `❌ falha ao reiniciar: ${(e as Error).message.slice(0, 200)}`,
    });
  }
}

async function cmdSincronizar(chatId: string) {
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: "sincronizando e publicando — aviso quando terminar",
  });
  const { ok, resumo } = await rodarSync(`telegram:${chatId}`);
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: `${ok ? "✅" : "❌"} ${resumo}`,
  });
}

async function cmdCode(chatId: string) {
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: await mensagemCode(),
    parse_mode: "Markdown",
  });
}

async function cmdAndamento(chatId: string) {
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: await mensagemAndamento(),
    parse_mode: "Markdown",
  });
}

async function cmdProximas(chatId: string) {
  const pendencias = [
    "1. CORS no R2 (dashboard → R2 →ucket → CORS)",
    "2. Backfill completo: arquivar-fontes.mjs + enviar-fontes-r2.mjs",
    "3. Bucket R2 publico (ja decidido)",
    "4. Diario oficial D0–D5 (migrations 0077/0079)",
    "5. LAI INCRA (prazo 28/08)",
  ];
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: `Proximas pendencias:\n\n${pendencias.join("\n")}`,
  });
}

async function cmdLogs(chatId: string) {
  const linhas: string[] = ["📋 *Status dos Bots*\n"];

  // Farol (Vigia do Servidor)
  try {
    const vigia = JSON.parse(fs.readFileSync(path.join(RAIZ, "docs", "relatorios-automacao", "vigia-servidor-status.json"), "utf-8"));
    const idade = Math.round((Date.now() - new Date(vigia.atualizadoEm).getTime()) / 1000 / 60);
    linhas.push(`🗼 *Farol:* ${vigia.producaoOk ? "OK" : "FALHA"} (${idade}min atras)`);
    linhas.push(`   Producao: HTTP ${vigia.producaoStatus}, latencia ${vigia.latenciaMs}ms`);
  } catch { linhas.push(`🗼 *Farol:* sem dado`); }

  // Radar (Vigia de Fontes)
  try {
    const pico = JSON.parse(fs.readFileSync(path.join(RAIZ, "docs", "relatorios-automacao", "picoclaw-fontes-status.json"), "utf-8"));
    linhas.push(`📡 *Radar:* ${pico.online}/${pico.total} online (${pico.taxaDisponibilidade}%)`);
    if (pico.comFalha > 0) linhas.push(`   ⚠️ ${pico.comFalha} com falha`);
  } catch { linhas.push(`📡 *Radar:* sem dado`); }

  // Escudo (Seguranca)
  try {
    const hermes = JSON.parse(fs.readFileSync(path.join(RAIZ, "docs", "relatorios-automacao", "hermes-auditoria-seguranca.json"), "utf-8"));
    linhas.push(`🛡️ *Escudo:* ${hermes.aprovados} ok, ${hermes.alertas} alertas, ${hermes.falhas} falhas`);
  } catch { linhas.push(`🛡️ *Escudo:* sem dado`); }

  // Olho (Paginas)
  try {
    const argus = JSON.parse(fs.readFileSync(path.join(RAIZ, "docs", "relatorios-automacao", "argus-paginas-status.json"), "utf-8"));
    const total = argus.resultados?.length ?? 0;
    const falhas = argus.resultados?.filter((r: { ok: boolean }) => !r.ok).length ?? 0;
    linhas.push(`👁️ *Olho:* ${total - falhas}/${total} saudaveis`);
  } catch { linhas.push(`👁️ *Olho:* sem dado`); }

  // Painel heartbeat
  try {
    const hb = fs.readFileSync(path.join(RAIZ, "scripts", ".heartbeat-gatilho"), "utf-8").trim();
    const idade = Math.round((Date.now() - new Date(hb).getTime()) / 1000 / 60);
    linhas.push(`🎛️ *Painel:* ${idade < 10 ? "vivo" : `parado ha ${idade}min`}`);
  } catch { linhas.push(`🎛️ *Painel:* sem heartbeat`); }

  // Farol heartbeat
  try {
    const hb = fs.readFileSync(path.join(RAIZ, "scripts", ".heartbeat-vigia"), "utf-8").trim();
    const idade = Math.round((Date.now() - new Date(hb).getTime()) / 1000 / 60);
    linhas.push(`🗼 *Farol heartbeat:* ${idade}min atras`);
  } catch { linhas.push(`🗼 *Farol heartbeat:* sem dado`); }

  // Reinicios
  try {
    const reinicios = JSON.parse(fs.readFileSync(path.join(RAIZ, "scripts", ".vigia-reinicios.json"), "utf-8"));
    const recentes = (reinicios.carimbos || []).filter((t: number) => Date.now() - t < 3600000);
    linhas.push(`🔄 *Reinicios (1h):* ${recentes.length}/6`);
  } catch { linhas.push(`🔄 *Reinicios (1h):* 0/6`); }

  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: linhas.join("\n"),
    parse_mode: "Markdown",
  });
}

async function loopTelegram() {
  let offset = lerOffset();
  for (;;) {
    try {
      // Heartbeat: prova de vida por mtime (sem I/O de texto). O Farol
      // (scripts/vigia-servidor.mts) avisa o dono se este arquivo parar de
      // envelhecer — mesma lição do next start de 08/09: o processo silencioso
      // é o que morre sem ninguém ver.
      try {
        if (fs.existsSync(HEARTBEAT)) fs.utimesSync(HEARTBEAT, new Date(), new Date());
        else fs.writeFileSync(HEARTBEAT, new Date().toISOString());
      } catch { /* disco cheio é caso raro; o vigia denunciaria a idade do arquivo */ }
      const resp = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates` +
          `?offset=${offset}&timeout=30&allowed_updates=["message","callback_query"]`
      );
      const dados = (await resp.json()) as {
        ok: boolean;
        result: Array<{
          update_id: number;
          message?: { chat: { id: number }; text?: string };
          callback_query?: {
            id: string;
            data?: string;
            message?: { chat?: { id?: number }; text?: string };
          };
        }>;
      };
      if (!dados.ok) {
        log(`Telegram: getUpdates devolveu erro, esperando 10s`);
        await esperar(10_000);
        continue;
      }
      for (const upd of dados.result) {
        offset = upd.update_id + 1;
        gravarOffset(offset);

        // ── Callback query (clique em botão inline) ──────────────────────
        if (upd.callback_query) {
          const cq = upd.callback_query;
          const chatId = String(cq.message?.chat?.id ?? "");
          if (chatId !== String(TELEGRAM_CHAT_ID)) continue;
          const dadosBtn = (cq.data ?? "").trim().toLowerCase();
          log(`Telegram: callback data=${dadosBtn}`);
          const callbackMap: Record<string, () => Promise<unknown>> = {
            "cmd_status": () => telegramApi("sendMessage", { chat_id: chatId, text: emAndamento ? "sincronização em andamento" : "ocioso, pronto para /sincronizar" }),
            "cmd_tunel": () => cmdTunel(chatId),
            "cmd_sessao": () => cmdSessao(chatId),
            "cmd_reiniciar": () => cmdReiniciar(chatId),
            "cmd_sincronizar": () => cmdSincronizar(chatId),
            "cmd_code": () => cmdCode(chatId),
            "cmd_andamento": () => cmdAndamento(chatId),
            "cmd_proximas": () => cmdProximas(chatId),
            "cmd_logs": () => cmdLogs(chatId),
          };
          if (callbackMap[dadosBtn]) {
            await callbackMap[dadosBtn]();
          }
          await telegramApi("answerCallbackQuery", { callback_query_id: cq.id, show_alert: false }).catch(() => {});
          continue;
        }

        const msg = upd.message;
        if (!msg?.text) continue;
        if (String(msg.chat.id) !== String(TELEGRAM_CHAT_ID)) {
          log(`Telegram: mensagem de chat_id nÃ£o autorizado (${msg.chat.id}), ignorada`);
          continue;
        }
        // Ponte do plugin opencode (canario-telegram.ts): /ok <id> e
        // /negar <id> aprovam/negam pedidos de permissÃ£o remota. Grava na
        // fila de respostas que o plugin consulta; nÃ£o passa pelo mapa de
        // COMANDOS de propÃ³sito.
        // NormalizaÃ§Ã£o: minÃºsculas, sem menÃ§Ã£o a @bot, espaÃ§os colapsados.
        // Motivo medido em 26/08: dono enviou /STATUS (caixa alta) e caiu no
        // "nÃ£o reconhecido" â€” match exato era frÃ¡gil demais.
        const textoNormalizado = msg.text
          .trim()
          .toLowerCase()
          .replace(/@\w+/g, "")
          .replace(/\s+/g, " ");
        log(`Telegram: recebido ${JSON.stringify(msg.text)}`);
        const passthrough = /^\/(ok|negar) \S+/.exec(textoNormalizado);
        if (passthrough) {
          const dirPonte = path.join(RAIZ, ".opencode", "canario");
          fs.mkdirSync(dirPonte, { recursive: true });
          fs.appendFileSync(
            path.join(dirPonte, "respostas.log"),
            `${Date.now()}\t${msg.text.trim()}\n`
          );
          await telegramApi("sendMessage", {
            chat_id: msg.chat.id,
            text: "Anotado â€” o plugin do opencode lÃª isso em segundos.",
          });
          continue;
        }
        // Comando = primeiro token ("/status pronto" casa /status); o resto
        // Ã© argumento opcional que cada handler ignora ou usa.
        const comando = COMANDOS[textoNormalizado.split(" ")[0]];
        if (!comando) {
          await telegramApi("sendMessage", {
            chat_id: msg.chat.id,
            text: "ðŸ¤” Pensando...",
          });
          try {
            const resposta = await opencodeChat(msg.text);
            if (resposta.trim()) {
              await enviarChunks(String(msg.chat.id), resposta);
            } else {
              await telegramApi("sendMessage", {
                chat_id: msg.chat.id,
                text: "Sem resposta do modelo.",
              });
            }
          } catch (e) {
            await telegramApi("sendMessage", {
              chat_id: msg.chat.id,
              text: `Erro no opencode: ${(e as Error).message.slice(0, 200)}`,
            });
          }
          continue;
        }
        if (comando === "menu") {
          await cmdMenu(String(msg.chat.id));
          continue;
        }
        if (comando === "status") {
          await telegramApi("sendMessage", {
            chat_id: msg.chat.id,
            text: emAndamento ? "sincronização em andamento" : "ocioso, pronto para /sincronizar",
          });
          continue;
        }
        if (comando === "tunel") {
          await cmdTunel(String(msg.chat.id));
          continue;
        }
        if (comando === "reiniciar") {
          await cmdReiniciar(String(msg.chat.id));
          continue;
        }
        if (comando === "code") {
          await cmdCode(String(msg.chat.id));
          continue;
        }
        if (comando === "andamento") {
          await cmdAndamento(String(msg.chat.id));
          continue;
        }
        if (comando === "proximas") {
          await cmdProximas(String(msg.chat.id));
          continue;
        }
        if (comando === "sessao") {
          await cmdSessao(String(msg.chat.id));
          continue;
        }
        if (comando === "logs") {
          await cmdLogs(String(msg.chat.id));
          continue;
        }
        await telegramApi("sendMessage", {
          chat_id: msg.chat.id,
          text: "sincronizando e publicando — aviso quando terminar",
        });
        const { ok, resumo } = await rodarSync(`telegram:${msg.chat.id}`);
        await telegramApi("sendMessage", {
          chat_id: msg.chat.id,
          text: `${ok ? "âœ…" : "âŒ"} ${resumo}`,
        });
      }
    } catch (e) {
      log(`Telegram: loop falhou (${(e as Error).message}), esperando 10s`);
      await esperar(10_000);
    }
  }
}
async function enviarChunks(chatId: string, texto: string) {
  const MAX_TAM = 4000;
  for (let i = 0; i < texto.length; i += MAX_TAM) {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: texto.slice(i, i + MAX_TAM),
    });
    if (i + MAX_TAM < texto.length) await esperar(1_000);
  }
}

function extrairTextoOpencode(out: string): string {
  let resposta = "";
  for (const linha of out.split("\n")) {
    if (!linha.trim()) continue;
    try {
      const e = JSON.parse(linha);
      if (e.type === "text" && e.part?.text) resposta += e.part.text;
    } catch { /* ignora linhas nÃ£o-JSON */ }
  }
  return resposta;
}

async function opencodeChat(mensagem: string): Promise<string> {
  // Escreve o comando no queue para a sessao opencode atual processar
  const queueFile = path.join(RAIZ, ".opencode", "canario", "comandos.json");
  const id = `cmd_${Date.now()}`;
  const cmd = { id, mensagem, status: "pendente", criadoEm: new Date().toISOString() };

  try {
    const dir = path.dirname(queueFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    // Le queue existente ou cria nova
    let queue: Array<{ id: string; mensagem: string; status: string; criadoEm: string }> = [];
    if (fs.existsSync(queueFile)) {
      try { queue = JSON.parse(fs.readFileSync(queueFile, "utf-8")); } catch { queue = []; }
    }
    queue.push(cmd);
    fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2));
  } catch { /* ignora erro de escrita */ }

  // Espera a sessao opencode responder (max 90s)
  const inicio = Date.now();
  while (Date.now() - inicio < 90_000) {
    await esperar(2000);
    try {
      const queue = JSON.parse(fs.readFileSync(queueFile, "utf-8"));
      const item = queue.find((q: { id: string }) => q.id === id);
      if (item?.status === "respondido" && item.resposta) {
        // Limpa itens antigos (mantem ultimos 10)
        const limpa = queue.filter((q: { id: string }) => q.id !== id).slice(-10);
        fs.writeFileSync(queueFile, JSON.stringify(limpa, null, 2));
        return item.resposta;
      }
      if (item?.status === "erro") {
        const limpa = queue.filter((q: { id: string }) => q.id !== id).slice(-10);
        fs.writeFileSync(queueFile, JSON.stringify(limpa, null, 2));
        return `Erro: ${item.resposta || "desconhecido"}`;
      }
    } catch { /* arquivo pode estar sendo escrito */ }
  }
  return "Sessao opencode nao respondeu em 90s. Tente novamente.";
}

async function esperar(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// â”€â”€â”€ Status do projeto ao vivo (para /code e /andamento) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function statusBanco(): Promise<string> {
  try {
    const { Client } = await import("pg");
    const c = new Client({ connectionString: ENV.DATABASE_URL.trim() });
    await c.connect();
    const a = await c.query("SELECT count(*) as n FROM atos_diario");
    const b = await c.query("SELECT count(*) as n FROM arquivo_fontes WHERE sha256 IS NOT NULL AND sha256 <> 'sem-conteudo'");
    const c2 = await c.query("SELECT count(*) as n FROM arquivo_fontes WHERE modo_armazenamento = 'r2'");
    await c.end();
    return `ðŸ“„ atos_diario: ${a.rows[0].n}\nðŸ—ƒï¸ fontes capturadas: ${b.rows[0].n}\nâ˜ï¸ no R2: ${c2.rows[0].n}`;
  } catch (e) {
    return `banco: erro (${(e as Error).message.slice(0, 120)})`;
  }
}

async function statusR2(): Promise<string> {
  try {
    const { S3Client, ListObjectsV2Command } = await import("@aws-sdk/client-s3");
    const s3 = new S3Client({
      endpoint: ENV.R2_ENDPOINT,
      region: "auto",
      credentials: { accessKeyId: ENV.R2_ACCESS_KEY_ID, secretAccessKey: ENV.R2_SECRET_ACCESS_KEY },
    });
    let total = 0;
    let token: string | undefined;
    do {
      const r = await s3.send(new ListObjectsV2Command({ Bucket: ENV.R2_BUCKET_NAME, ContinuationToken: token }));
      total += r.KeyCount ?? 0;
      token = r.NextContinuationToken;
    } while (token);
    return `${total} objetos no bucket ${ENV.R2_BUCKET_NAME}`;
  } catch (e) {
    return `r2: erro (${(e as Error).message.slice(0, 120)})`;
  }
}

async function mensagemCode(): Promise<string> {
  const r2 = await statusR2();
  const banco = await statusBanco();
  return [
    "ðŸ¤– */code â€” status do portal*",
    "",
    banco,
    r2,
    "",
    "Backfill PDFs: em andamento (resumÃ­vel apÃ³s dedup)",
    "DiÃ¡rio oficial: âœ… completo (16.601 atos)",
    "",
    "PrÃ³ximo passo: upload R2 do restante + verificaÃ§Ã£o do portal",
  ].join("\n");
}

async function mensagemAndamento(): Promise<string> {
  const etapa = [
    "1ï¸âƒ£ Coletor SIGPub via requests â€” âœ… commitado",
    "2ï¸âƒ£ DiÃ¡rio oficial (2020-01 a 2026-08) â€” âœ… 16.601 atos",
    "3ï¸âƒ£ Backfill PDFs (1.427 fontes) â€” ðŸ”„ rodando em 2Âº plano",
    "4ï¸âƒ£ Upload R2 â€” ðŸ”„ parcial (167+ objetos)",
    "5ï¸âƒ£ Portal/tÃºnel â€” âœ… rodando (verificar pÃ¡ginas)",
    "6ï¸âƒ£ LAI INCRA (prazo 28/08) â€” â³ vocÃª",
  ];
  return ["ðŸ“ˆ *Andamento do projeto*", "", ...etapa].join("\n");
}

// â”€â”€â”€ Sobe os dois canais que tiverem config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function tailscaleIp(): string | null {
  try {
    return execFileSync("tailscale", ["ip", "-4"], { encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

const ip = tailscaleIp();
if (GATILHO_TOKEN && ip) {
  subirServidorHttp(ip);
} else if (GATILHO_TOKEN && !ip) {
  log("GATILHO_TOKEN configurado mas `tailscale ip -4` falhou â€” canal HTTP nÃ£o subiu.");
}
if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID && GATILHO_TELEGRAM_POLL) {
  void loopTelegram();
  log("Telegram: long-poll iniciado.");
} else if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
  log("Telegram: long-poll desativado por padrão (defina GATILHO_TELEGRAM_POLL=true para ativar) — evita conflito 409 com Hermes.");
}
if (!(GATILHO_TOKEN && ip) && !(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID && GATILHO_TELEGRAM_POLL)) {
  log("NENHUM canal ativo — preencha scripts/.env (ver scripts/.env.exemplo) e reinicie.");
  process.exit(1);
}
