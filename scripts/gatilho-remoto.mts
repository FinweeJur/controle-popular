/**
 * Gatilho remoto: deixa o `desktop-fefpddp` (ou qualquer dispositivo do
 * tailnet) pedir "sincronize e publique" a este PC, sem SSH e sem sessão
 * interativa — por HTTP dentro do Tailscale ou por mensagem no bot do
 * Telegram que hoje só ENVIA alerta do canário (`.github/scripts/
 * canario_limites.py`).
 *
 * ═══ POR QUE NÃO É SSH DO TAILSCALE ═══
 *
 * `tailscale up --ssh` resolveria isto num comando, mas é mudança de
 * configuração de segurança da MÁQUINA (abre uma porta de entrada nova), e
 * essa decisão é de quem senta na frente dela — não de uma sessão de agente.
 * O comando certo, se um dia for essa a escolha, é:
 *
 *     tailscale set --ssh
 *
 * Este arquivo é o caminho que não pede essa decisão: um processo comum,
 * sem privilégio novo, escutando só onde o Tailscale já alcança.
 *
 * ═══ MODELO DE SEGURANÇA, CAMADA POR CAMADA ═══
 *
 * 1. **Bind no IP do Tailscale, nunca em `0.0.0.0`.** `tailscale ip -4`
 *    devolve o endereço `100.x.y.z` deste PC — só tráfego que já atravessou
 *    o WireGuard do tailnet chega aqui. Um dispositivo fora do tailnet não
 *    alcança este processo mesmo sabendo a porta.
 * 2. **Token próprio.** Nem `PAINEL_TOKEN` nem `ADMIN_TOKEN` — cada um já
 *    circula com um raio de vazamento diferente (ver
 *    `docs/PAINEL-EDICAO-COMO-USAR.md`), e reusar amplia o raio de todos.
 *    `GATILHO_TOKEN` vive só em `scripts/.env` (gitignored) e é comparado
 *    por hash com tempo constante — `crypto.timingSafeEqual`, não `===`.
 * 3. **Telegram: só o chat_id configurado.** Mensagem de qualquer outro
 *    chat é registrada e IGNORADA — achar o bot no Telegram não basta.
 * 4. **Fail-closed nos dois casos.** Sem `GATILHO_TOKEN`/`TELEGRAM_CHAT_ID`
 *    configurado, o respectivo canal simplesmente não sobe — nunca "libera
 *    tudo porque não configuraram".
 *
 * ═══ O QUE O GATILHO FAZ, E O QUE ELE DELEGA ═══
 *
 * Este arquivo só recebe o pedido e autentica. O trabalho de verdade —
 * git fetch/merge/push, guarda de dado pessoal, build, as travas de página e
 * de tamanho de asset, deploy — é `sincronizar-e-publicar.mts`, que já
 * recusa árvore suja, recusa merge com conflito e nunca força deploy. Este
 * gatilho não reimplementa nenhuma dessas decisões.
 *
 * Uso:
 *   npx tsx scripts/gatilho-remoto.mts
 *
 * Variáveis em `scripts/.env` (ver `scripts/.env.exemplo`):
 *   GATILHO_TOKEN=<valor aleatório>
 *   TELEGRAM_BOT_TOKEN=<o mesmo do canário>
 *   TELEGRAM_CHAT_ID=<o mesmo do canário>
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
const ARQUIVO_OFFSET = path.join(RAIZ, "scripts", ".gatilho-offset");
const ARQUIVO_LOG = path.join(LOGS, "gatilho-remoto.log");

fs.mkdirSync(LOGS, { recursive: true });

function log(msg: string) {
  const linha = `[${new Date().toISOString()}] ${msg}`;
  console.log(linha);
  fs.appendFileSync(ARQUIVO_LOG, linha + "\n");
}

// ─── Config: scripts/.env, parse manual (mesmo padrão de aplicar-migration-
// local.mts — sem dependência nova só para ler três variáveis). ───────────
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
const PORTA = Number(ENV.GATILHO_PORTA || 3029);

if (!GATILHO_TOKEN) log("AVISO: GATILHO_TOKEN ausente — o canal HTTP fica DESLIGADO.");
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID)
  log("AVISO: TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID ausente — o canal Telegram fica DESLIGADO.");

/** Um sync por vez — um segundo pedido durante um sync em andamento só avisa. */
let emAndamento = false;

async function rodarSync(origem: string): Promise<{ ok: boolean; resumo: string }> {
  if (emAndamento) {
    return { ok: false, resumo: "já há uma sincronização em andamento — aguarde." };
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
          ? `publicado. ${r.commitAntes?.slice(0, 7)} → ${r.commitDepois?.slice(0, 7)}`
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

// ─── Canal 1: HTTP dentro do tailnet ──────────────────────────────────────

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
      log(`HTTP: token inválido de ${req.socket.remoteAddress}`);
      res.writeHead(401).end();
      return;
    }
    if (emAndamento) {
      res.writeHead(409, { "content-type": "text/plain; charset=utf-8" }).end(
        "já há uma sincronização em andamento"
      );
      return;
    }
    res.writeHead(202, { "content-type": "text/plain; charset=utf-8" }).end(
      `iniciado — acompanhe em ${ARQUIVO_LOG}`
    );
    void rodarSync(`http:${req.socket.remoteAddress}`);
  });
  servidor.listen(PORTA, ip, () => {
    log(`HTTP escutando em http://${ip}:${PORTA}/sincronizar (só dentro do tailnet)`);
  });
  servidor.on("error", (e) => log(`HTTP falhou ao subir: ${(e as Error).message}`));
}

// ─── Canal 2: Telegram (long-poll, sem webhook — não precisa de porta   ───
// exposta nem de HTTPS público). ───────────────────────────────────────────

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

async function loopTelegram() {
  let offset = lerOffset();
  for (;;) {
    try {
      const resp = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates` +
          `?offset=${offset}&timeout=30&allowed_updates=["message"]`
      );
      const dados = (await resp.json()) as {
        ok: boolean;
        result: Array<{ update_id: number; message?: { chat: { id: number }; text?: string } }>;
      };
      if (!dados.ok) {
        log(`Telegram: getUpdates devolveu erro, esperando 10s`);
        await esperar(10_000);
        continue;
      }
      for (const upd of dados.result) {
        offset = upd.update_id + 1;
        gravarOffset(offset);
        const msg = upd.message;
        if (!msg?.text) continue;
        if (String(msg.chat.id) !== String(TELEGRAM_CHAT_ID)) {
          log(`Telegram: mensagem de chat_id não autorizado (${msg.chat.id}), ignorada`);
          continue;
        }
        // Ponte do plugin opencode (canario-telegram.ts): /ok <id> e
        // /negar <id> aprovam/negam pedidos de permissão remota. Grava na
        // fila de respostas que o plugin consulta; não passa pelo mapa de
        // COMANDOS de propósito.
        // Normalização: minúsculas, sem menção a @bot, espaços colapsados.
        // Motivo medido em 26/08: dono enviou /STATUS (caixa alta) e caiu no
        // "não reconhecido" — match exato era frágil demais.
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
            text: "Anotado — o plugin do opencode lê isso em segundos.",
          });
          continue;
        }
        // Comando = primeiro token ("/status pronto" casa /status); o resto
        // é argumento opcional que cada handler ignora ou usa.
        const comando = COMANDOS[textoNormalizado.split(" ")[0]];
        if (!comando) {
          await telegramApi("sendMessage", {
            chat_id: msg.chat.id,
            text: `Comando não reconhecido. Uso: /sincronizar, /status, /tunel, /reiniciar, /proximas`,
          });
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
          let status = "desconhecido";
          try {
            const svc = execFileSync("sc.exe", ["query", "Cloudflared"], { encoding: "utf-8" });
            status = svc.includes("RUNNING") ? " rodando" : " parado";
          } catch { status = " não encontrado"; }
          let nextStart = "parado";
          try {
            const ps = execFileSync("powershell", ["-Command", "Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -match 'next start'} | Measure-Object | Select-Object -ExpandProperty Count"], { encoding: "utf-8" });
            nextStart = ps.trim() === "0" ? "parado" : " rodando";
          } catch { nextStart = "verificar manualmente"; }
          await telegramApi("sendMessage", {
            chat_id: msg.chat.id,
            text: `Túnel (Cloudflared):${status}\nNext start (porta 3000):${nextStart}`,
          });
          continue;
        }
        if (comando === "reiniciar") {
          await telegramApi("sendMessage", {
            chat_id: msg.chat.id,
            text: "reiniciando next start...",
          });
          try {
            execFileSync("powershell", ["-Command", "Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -match 'next start'} | Stop-Process -Force"], { encoding: "utf-8" });
            execFileSync("powershell", ["-Command", "Start-Sleep -Seconds 2; Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d C:\\DevCoder\\controle-popular\\apps\\web && npx next start -p 3000' -WindowStyle Hidden"], { encoding: "utf-8", timeout: 15000 });
            await telegramApi("sendMessage", {
              chat_id: msg.chat.id,
              text: "✅ next start reiniciado (porta 3000)",
            });
          } catch (e) {
            await telegramApi("sendMessage", {
              chat_id: msg.chat.id,
              text: `❌ falha ao reiniciar: ${(e as Error).message.slice(0, 200)}`,
            });
          }
          continue;
        }
        if (comando === "code") {
          await telegramApi("sendMessage", {
            chat_id: msg.chat.id,
            text: await mensagemCode(),
            parse_mode: "Markdown",
          });
          continue;
        }
        if (comando === "andamento") {
          await telegramApi("sendMessage", {
            chat_id: msg.chat.id,
            text: await mensagemAndamento(),
            parse_mode: "Markdown",
          });
          continue;
        }
        if (comando === "proximas") {
          const pendencias = [
            "1. CORS no R2 (dashboard → R2 →ucket → CORS)",
            "2. Backfill completo: arquivar-fontes.mjs + enviar-fontes-r2.mjs",
            "3. Bucket R2 público (já decidido)",
            "4. Diário oficial D0–D5 (migrations 0077/0079)",
            "5. LAI INCRA (prazo 28/08)",
          ];
          await telegramApi("sendMessage", {
            chat_id: msg.chat.id,
            text: `Próximas pendências:\n\n${pendencias.join("\n")}`,
          });
          continue;
        }
        await telegramApi("sendMessage", {
          chat_id: msg.chat.id,
          text: "sincronizando e publicando — aviso quando terminar",
        });
        const { ok, resumo } = await rodarSync(`telegram:${msg.chat.id}`);
        await telegramApi("sendMessage", {
          chat_id: msg.chat.id,
          text: `${ok ? "✅" : "❌"} ${resumo}`,
        });
      }
    } catch (e) {
      log(`Telegram: loop falhou (${(e as Error).message}), esperando 10s`);
      await esperar(10_000);
    }
  }
}
async function esperar(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Status do projeto ao vivo (para /code e /andamento) ──────────────────

async function statusBanco(): Promise<string> {
  try {
    const { Client } = await import("pg");
    const c = new Client({ connectionString: ENV.DATABASE_URL.trim() });
    await c.connect();
    const a = await c.query("SELECT count(*) as n FROM atos_diario");
    const b = await c.query("SELECT count(*) as n FROM arquivo_fontes WHERE sha256 IS NOT NULL AND sha256 <> 'sem-conteudo'");
    const c2 = await c.query("SELECT count(*) as n FROM arquivo_fontes WHERE modo_armazenamento = 'r2'");
    await c.end();
    return `📄 atos_diario: ${a.rows[0].n}\n🗃️ fontes capturadas: ${b.rows[0].n}\n☁️ no R2: ${c2.rows[0].n}`;
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
    "🤖 */code — status do portal*",
    "",
    banco,
    r2,
    "",
    "Backfill PDFs: em andamento (resumível após dedup)",
    "Diário oficial: ✅ completo (16.601 atos)",
    "",
    "Próximo passo: upload R2 do restante + verificação do portal",
  ].join("\n");
}

async function mensagemAndamento(): Promise<string> {
  const etapa = [
    "1️⃣ Coletor SIGPub via requests — ✅ commitado",
    "2️⃣ Diário oficial (2020-01 a 2026-08) — ✅ 16.601 atos",
    "3️⃣ Backfill PDFs (1.427 fontes) — 🔄 rodando em 2º plano",
    "4️⃣ Upload R2 — 🔄 parcial (167+ objetos)",
    "5️⃣ Portal/túnel — ✅ rodando (verificar páginas)",
    "6️⃣ LAI INCRA (prazo 28/08) — ⏳ você",
  ];
  return ["📈 *Andamento do projeto*", "", ...etapa].join("\n");
}

// ─── Sobe os dois canais que tiverem config ───────────────────────────────

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
  log("GATILHO_TOKEN configurado mas `tailscale ip -4` falhou — canal HTTP não subiu.");
}
if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
  void loopTelegram();
  log("Telegram: long-poll iniciado.");
}
if (!(GATILHO_TOKEN && ip) && !(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID)) {
  log("NENHUM canal configurado — preencha scripts/.env (ver scripts/.env.exemplo) e reinicie.");
  process.exit(1);
}
