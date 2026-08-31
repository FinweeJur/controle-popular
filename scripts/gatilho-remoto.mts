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
        if (comando === "status") {
          await telegramApi("sendMessage", {
            chat_id: msg.chat.id,
            text: emAndamento ? "sincronizaÃ§Ã£o em andamento" : "ocioso, pronto para /sincronizar",
          });
          continue;
        }
        if (comando === "tunel") {
          let status = "desconhecido";
          try {
            const svc = execFileSync("sc.exe", ["query", "Cloudflared"], { encoding: "utf-8" });
            status = svc.includes("RUNNING") ? " rodando" : " parado";
          } catch { status = " nÃ£o encontrado"; }
          let nextStart = "parado";
          try {
            const ps = execFileSync("powershell", ["-Command", "Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -match 'next dev'} | Measure-Object | Select-Object -ExpandProperty Count"], { encoding: "utf-8" });
            nextStart = ps.trim() === "0" ? "parado" : " rodando";
          } catch { nextStart = "verificar manualmente"; }
          await telegramApi("sendMessage", {
            chat_id: msg.chat.id,
            text: `TÃºnel (Cloudflared):${status}\nNext dev (porta 3000):${nextStart}`,
          });
          continue;
        }
        if (comando === "reiniciar") {
          await telegramApi("sendMessage", {
            chat_id: msg.chat.id,
            text: "reiniciando next dev...",
          });
          try {
            execFileSync("powershell", ["-Command", "Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -match 'next dev'} | Stop-Process -Force"], { encoding: "utf-8" });
            execFileSync("powershell", ["-Command", "Start-Sleep -Seconds 2; Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d C:\\DevCoder\\controle-popular\\apps\\web && npx next dev -p 3000' -WindowStyle Hidden"], { encoding: "utf-8", timeout: 15000 });
            // Warmup em background: compila as 30 principais rotas
            setTimeout(() => {
              try {
                execFileSync("powershell", ["-Command", "Start-Sleep -Seconds 10; Start-Process -FilePath 'C:\\Users\\Home\\AppData\\Local\\hermes\\node\\node.exe' -ArgumentList 'C:\\DevCoder\\controle-popular\\node_modules\\tsx\\dist\\cli.mjs','C:\\DevCoder\\controle-popular\\scripts\\warmup-dev.mts','3000' -WindowStyle Hidden"], { encoding: "utf-8", timeout: 5000 });
              } catch { /* warmup é best-effort */ }
            }, 0);
            await telegramApi("sendMessage", {
              chat_id: msg.chat.id,
              text: "âœ… next dev reiniciado (porta 3000)",
            });
          } catch (e) {
            await telegramApi("sendMessage", {
              chat_id: msg.chat.id,
              text: `âŒ falha ao reiniciar: ${(e as Error).message.slice(0, 200)}`,
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
            "1. CORS no R2 (dashboard â†’ R2 â†’ucket â†’ CORS)",
            "2. Backfill completo: arquivar-fontes.mjs + enviar-fontes-r2.mjs",
            "3. Bucket R2 pÃºblico (jÃ¡ decidido)",
            "4. DiÃ¡rio oficial D0â€“D5 (migrations 0077/0079)",
            "5. LAI INCRA (prazo 28/08)",
          ];
          await telegramApi("sendMessage", {
            chat_id: msg.chat.id,
            text: `PrÃ³ximas pendÃªncias:\n\n${pendencias.join("\n")}`,
          });
          continue;
        }
        await telegramApi("sendMessage", {
          chat_id: msg.chat.id,
          text: "sincronizando e publicando â€” aviso quando terminar",
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
  try {
    const stdout = execFileSync(OPENCODE_BIN, ["run", mensagem, "--format", "json", "--auto"], {
      encoding: "utf-8",
      timeout: 120_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return extrairTextoOpencode(stdout);
  } catch (e) {
    const err = e as { stdout?: string; message?: string };
    if (err.stdout) {
      const texto = extrairTextoOpencode(err.stdout);
      if (texto) return texto;
    }
    throw new Error(`opencode: ${(err.message || "falha").slice(0, 200)}`);
  }
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
if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
  void loopTelegram();
  log("Telegram: long-poll iniciado.");
}
if (!(GATILHO_TOKEN && ip) && !(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID)) {
  log("NENHUM canal configurado â€” preencha scripts/.env (ver scripts/.env.exemplo) e reinicie.");
  process.exit(1);
}
