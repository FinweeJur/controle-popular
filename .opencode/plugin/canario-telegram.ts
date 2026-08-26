/**
 * Canário Telegram ↔ opencode: notifica o dono sobre eventos da sessão.
 *
 * ═══ O QUE FAZ ═══
 * - Sessão com erro → alerta imediato (throttle 1/min).
 * - `permission.ask` → avisa qual ferramenta/argumentos o agente quer usar,
 *   para o dono acompanhar (ou aprovar na máquina) de longe.
 *
 * ═══ APROVAÇÃO REMOTA (OPT-IN, EXPERIMENTAL) ═══
 * Com `CANARIO_APROVACAO_REMOTA=1`, cada pedido é gravado em
 * `.opencode/canario/pending/<id>.json` e o dono pode responder pelo bot com
 * `/ok <id>` ou `/negar <id>` (o gatilho-remoto grava em `respostas.log`).
 * Este plugin faz polling do arquivo e tenta resolver o pedido pela API
 * disponível na versão corrente do opencode (`output.allow/deny/respond`).
 * Se a API mudar, cai em observe-only SEM quebrar o fluxo padrão.
 * Sem a variável, o hook apenas OBSERVA — nunca interfere.
 *
 * ═══ SEGURANÇA ═══
 * Envia somente para o chat allowlisted em `scripts/.env`. Nunca loga o
 * token. Kill-switch: `CANARIO_OFF=1`.
 *
 * ═══ ATIVAÇÃO ═══
 * Arquivo auto-descoberto pelo opencode (.opencode/plugin/). Requer
 * REINICIAR o opencode para carregar.
 */

import fs from "node:fs";
import path from "node:path";

interface PedidoPendente {
  id: string;
  resumo: string;
  ts: number;
}

const dirRaizProcurado = ((): string | null => {
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(dir, "scripts", ".env"))) return dir;
    const pai = path.dirname(dir);
    if (pai === dir) break;
    dir = pai;
  }
  return null;
})();

function lerEnvCanario(): Record<string, string> {
  if (!dirRaizProcurado) return {};
  try {
    const saida: Record<string, string> = {};
    const bruto = fs.readFileSync(path.join(dirRaizProcurado, "scripts", ".env"), "utf8");
    for (const linha of bruto.split(/\r?\n/)) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(linha.trim());
      if (m && !linha.startsWith("#")) saida[m[1]] = m[2];
    }
    return saida;
  } catch {
    return {};
  }
}

const ENV_CANARIO = lerEnvCanario();
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || ENV_CANARIO.TELEGRAM_BOT_TOKEN || "";
const CHAT = process.env.TELEGRAM_CHAT_ID || ENV_CANARIO.TELEGRAM_CHAT_ID || "";
const DESLIGADO = process.env.CANARIO_OFF === "1";
const APROVACAO_REMOTA = process.env.CANARIO_APROVACAO_REMOTA === "1";

let filaEnvio: Promise<void> = Promise.resolve();
let ultimoAlertaErro = 0;
const lidosRespostas = new Set<string>();

function enviar(texto: string): void {
  if (DESLIGADO || !TOKEN || !CHAT) return;
  filaEnvio = filaEnvio.then(async () => {
    try {
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT,
          text: String(texto).slice(0, 4_000),
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      /* canário nunca derruba a sessão por falha de rede */
    }
  });
}

function dirPonte(): string {
  const raiz = dirRaizProcurado ?? process.cwd();
  const dir = path.join(raiz, ".opencode", "canario");
  fs.mkdirSync(path.join(dir, "pending"), { recursive: true });
  return dir;
}

function gravarPendente(p: PedidoPendente): void {
  fs.writeFileSync(path.join(dirPonte(), "pending", `${p.id}.json`), JSON.stringify(p));
}

/** Lê linhas novas de respostas.log procurando /ok|/negar para o id. */
function respostaPara(id: string): "ok" | "negar" | null {
  const arquivo = path.join(dirPonte(), "respostas.log");
  if (!fs.existsSync(arquivo)) return null;
  for (const linha of fs.readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    if (!linha || lidosRespostas.has(linha)) continue;
    lidosRespostas.add(linha);
    if (linha.includes(`/ok ${id}`)) return "ok";
    if (linha.includes(`/negar ${id}`)) return "negar";
  }
  return null;
}

function esperarResposta(id: string, timeoutMs = 10 * 60_000): Promise<"ok" | "negar" | "timeout"> {
  return new Promise((resolve) => {
    const inicio = Date.now();
    const timer = setInterval(() => {
      const r = respostaPara(id);
      if (r === "ok" || r === "negar" || Date.now() - inicio > timeoutMs) {
        clearInterval(timer);
        resolve(r ?? "timeout");
      }
    }, 1_500);
  });
}

const plugin = async () => {
  if (!TOKEN || !CHAT || DESLIGADO) return {};

  return {
    event: async (evento: unknown) => {
      try {
        const tipo = (evento as { type?: string })?.type ?? "";
        if (/error/i.test(tipo) && Date.now() - ultimoAlertaErro > 60_000) {
          ultimoAlertaErro = Date.now();
          const payload = JSON.stringify(evento).slice(0, 400);
          enviar(`🔴 opencode: evento de erro (${tipo})\n${payload}`);
        }
      } catch {
        /* observador nunca lança */
      }
    },

    "permission.ask": async (entrada: unknown, saida: unknown) => {
      try {
        const e = entrada as { tool?: string; args?: unknown; id?: string };
        const ferramenta = e?.tool ?? "ferramenta?";
        const detalhe = JSON.stringify(e?.args ?? {}).slice(0, 160);
        const id = Math.random().toString(36).slice(2, 8);

        if (!APROVACAO_REMOTA) {
          enviar(`🔐 opencode pede permissão [${id}]: ${ferramenta}\n${detalhe}\n(aprovação remota desligada — aprove na máquina)`);
          return;
        }

        gravarPendente({ id, resumo: `${ferramenta} ${detalhe}`, ts: Date.now() });
        enviar(
          `🔐 opencode pede permissão.\n${ferramenta}\n${detalhe}\n\nResponda:\n/ok ${id}  ou  /negar ${id}`
        );

        const resposta = await esperarResposta(id);
        const s = saida as Record<string, unknown> | undefined;

        if (typeof s?.allow === "function") {
          (s.allow as (v: boolean) => void)(resposta === "ok");
        } else if (typeof s?.respond === "function") {
          (s.respond as (v: boolean) => void)(resposta === "ok");
        } else if (s && "status" in s) {
          s.status = resposta === "ok" ? "allow" : "deny";
        } else {
          enviar(`⚠️ API de permissão mudou — aprove localmente (pedido ${id}, resposta ${resposta} ignorada)`);
        }
      } catch (erro) {
        enviar(`⚠️ canário: falha ao tratar permission.ask (${String(erro).slice(0, 120)})`);
      }
    },
  };
};

export default plugin;
export { plugin as canarioTelegramPlugin };
