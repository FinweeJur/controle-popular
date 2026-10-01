#!/usr/bin/env node
/**
 * Conserta/registra o webhook do bot PÚBLICO do Telegram.
 *
 * ═══ O PROBLEMA QUE ISTO RESOLVE ═══
 *
 * O Telegram entrega as mensagens por **POST** na URL do webhook. A raiz do
 * domínio (`controlepopular.com.br`, sem www) **devolve 301** para o www — e o
 * Telegram **NÃO segue redirect** no webhook: cada update vira erro e o bot
 * fica mudo, sem responder `/menu` nem mostrar os botões. Medido em 30/09/2026:
 * `POST https://controlepopular.com.br/api/telegram` → 301.
 *
 * A cura é registrar o webhook no **www** (`https://www.controlepopular.com.br`),
 * que responde 200 direto.
 *
 * ═══ SEGREDO ═══
 *
 * Lê o token de `scripts/.env` em runtime (mesmo padrão do gatilho-remoto) e
 * NUNCA o imprime — a saída mostra só url, pendências e último erro. Se
 * `TELEGRAM_WEBHOOK_SECRET` estiver no `.env`, registra o `secret_token` junto
 * (o app confere o header `x-telegram-bot-api-secret-token`).
 *
 * ═══ MENU DE COMANDOS (setMyCommands) ═══
 *
 * Registrar o webhook entrega as MENSAGENS; não entrega o MENU. A lista que
 * o Telegram mostra quando o usuário digita "/" vive numa chamada separada
 * (`setMyCommands`) e mediu VAZIA em 01/10/2026 — o menu nunca foi registrado.
 * Este script registra os dois: webhook em www + lista de comandos igual à
 * que `app/api/telegram/route.ts` responde. A lista mora AQUI e na rota;
 * mudou um comando, muda nos dois lugares (são 12, sem mecanismo de espelho).
 *
 * ═══ O ENDEREÇO ERRADO QUE ISTO DESFAZ ═══
 *
 * Medido em 01/10/2026: o webhook do bot apontava para
 * `https://tele.goldenherd.com/tg/webhook/8679298724` — um endereço externo,
 * fora do projeto, que aceita as mensagens em silêncio (pending 0, erro
 * nenhum). A única citação no repo é o `vigia-telegram-opencode.mts`
 * (commit `6d224a45`, 25/09/2026, sessão Antigravity), que o chama de
 * "webhook externo" e o RESTAURA a cada ciclo. O dono não configurou esse
 * endereço. Enquanto ele estiver ativo, o /menu do portal não recebe nada e
 * mensagem de usuário vai para fora. Este script devolve a entrega ao www;
 * se algum fluxo externo depender do goldenherd, ele vai re-tomar o webhook
 * na próxima vez que rodar — e aí o sintoma (bot mudo para o portal) volta.
 *
 * Uso:
 *   npx tsx scripts/telegram-set-webhook.mts            # registra no www
 *   npx tsx scripts/telegram-set-webhook.mts --info     # só consulta
 *   npx tsx scripts/telegram-set-webhook.mts --delete    # remove o webhook
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const URL_WEBHOOK = "https://www.controlepopular.com.br/api/telegram";

/**
 * Menu de comandos exibido pelo Telegram. Sem barra inicial (formato da API:
 * `setMyCommands` recebe o comando NU, a barra é da conversa). As descrições
 * são o que o usuário lê no autocomplete — frase direta, sem jargão.
 */
const COMANDOS = [
  { command: "menu", description: "Abre o menu com todas as frentes do portal" },
  { command: "ambiental", description: "Licenciamento, barragens, COPAM e crimes socioambientais" },
  { command: "cidades", description: "Ranking e busca de municípios brasileiros" },
  { command: "congresso", description: "Proposições, orçamento e Lei Rouanet" },
  { command: "judiciario", description: "Decisões e processos de tribunais" },
  { command: "internacional", description: "ONU, UNESCO, OMS, OMC, EUA e Canadá" },
  { command: "assembleias", description: "As 27 assembleias legislativas estaduais" },
  { command: "mineracao", description: "Cavas por satélite e processos minerários" },
  { command: "laboratorio", description: "Caderno cívico e grafo de conexões" },
  { command: "terra", description: "Cidades estratégicas, terras, serras e rios" },
  { command: "estado", description: "Orçamento, contratos e transparência" },
  { command: "direitos", description: "Saúde, educação, trabalho, moradia e justiça" },
] as const;

/**
 * Lê KEY=VALUE de um .env. Tolera BOM e CRLF de propósito.
 *
 * Medido em 01/10/2026: uma linha acrescentada ao `scripts/.env` pelo
 * PowerShell entrou com CRLF (o arquivo usa LF). O regex termina em `$`, e em
 * JavaScript `$` sem a flag `m` NÃO casa antes do `\r` — a chave recém-escrita
 * ficou invisível, o script anunciou "sem segredo no .env" e registrou o
 * webhook SEM `secret_token`. Com o segredo já no ambiente dos contêineres,
 * isso deixou o bot mudo nos dois sentidos até o arquivo ser normalizado. O
 * `\uFEFF` é o mesmo estrago pelo começo: Notepad e `Set-Content -Encoding
 * UTF8` do PowerShell 5.1 gravam BOM, e a PRIMEIRA chave do arquivo some.
 */
function lerEnv(caminho: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fs.existsSync(caminho)) return out;
  for (const linha of fs.readFileSync(caminho, "utf-8").split(/\r?\n/)) {
    const m = linha.replace(/^\uFEFF/, "").match(/^([A-Z_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const ENV = lerEnv(path.join(RAIZ, "scripts", ".env"));
const TOKEN = ENV.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
const SECRET = ENV.TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET || "";

if (!TOKEN) {
  console.error("⛔ TELEGRAM_BOT_TOKEN ausente em scripts/.env — nada a fazer.");
  process.exit(1);
}

/**
 * Uma chamada à API do Telegram, com nova tentativa.
 *
 * Por que tentar de novo: medido em 01/10/2026 nesta máquina, a conexão com
 * api.telegram.org sofre `ECONNRESET` intermitente — numa sequência de
 * chamadas, uma cai (visto alternando entre setWebhook e setMyCommands).
 * Sem nova tentativa, o script morre no meio e deixa o webhook num estado
 * pela metade; com 4 tentativas espaçadas, o registro sai inteiro.
 */
async function api(metodo: string, corpo?: Record<string, unknown>) {
  let ultimoErro: unknown;
  for (let tent = 1; tent <= 4; tent++) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${metodo}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: corpo ? JSON.stringify(corpo) : undefined,
      });
      return r.json() as Promise<{ ok: boolean; result?: unknown; description?: string }>;
    } catch (e) {
      ultimoErro = e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw ultimoErro instanceof Error
    ? ultimoErro
    : new Error(String(ultimoErro ?? `fetch de ${metodo} falhou`));
}

async function principal() {
  const argv = process.argv.slice(2);

  if (argv.includes("--delete")) {
    const r = await api("deleteWebhook", { drop_pending_updates: false });
    console.log(r.ok ? "✅ webhook removido." : `⛔ falhou: ${r.description}`);
    return;
  }

  if (!argv.includes("--info")) {
    const r = await api("setWebhook", {
      url: URL_WEBHOOK,
      // Só manda o segredo se ele existir; sem ele o app fica aberto (avisa no log).
      ...(SECRET ? { secret_token: SECRET } : {}),
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    });
    console.log(r.ok ? `✅ webhook registrado em ${URL_WEBHOOK}` : `⛔ setWebhook falhou: ${r.description}`);
    if (!SECRET) console.log("ℹ️  sem TELEGRAM_WEBHOOK_SECRET no .env — webhook sem autenticação.");

    // O webhook entrega as mensagens; o menu é OUTRA chamada. Sem este
    // registro o usuário digita "/" e o Telegram não lista comando nenhum
    // (medido vazio em 01/10/2026).
    const c = await api("setMyCommands", { commands: COMANDOS });
    console.log(
      c.ok
        ? `✅ menu de comandos registrado (${COMANDOS.length} comandos)`
        : `⛔ setMyCommands falhou: ${c.description}`,
    );
  }

  const info = await api("getWebhookInfo");
  const w = (info.result ?? {}) as Record<string, unknown>;
  console.log("\n— getWebhookInfo —");
  console.log("url:", w.url);
  console.log("pending_update_count:", w.pending_update_count ?? 0);
  if (w.last_error_message) {
    const quando = w.last_error_date
      ? new Date(Number(w.last_error_date) * 1000).toISOString()
      : "?";
    console.log("último erro:", quando, "→", w.last_error_message);
  } else {
    console.log("último erro: nenhum");
  }

  // O menu que o usuário vê ao digitar "/" — estado real, não suposição.
  const cmds = await api("getMyCommands");
  const lista = (cmds.result ?? []) as Array<{ command: string }>;
  console.log(`menu de comandos: ${lista.length} registrado(s)`);
}

principal().catch((e) => {
  console.error("⛔ erro:", e instanceof Error ? e.message : e);
  process.exit(1);
});
