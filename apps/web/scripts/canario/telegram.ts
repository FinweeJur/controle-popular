/**
 * Fonte única do canário Telegram: enviar mensagens e ler updates.
 *
 * Credenciais vêm de `scripts/.env` na raiz do repo (nunca versionado).
 * Variáveis de ambiente de mesmo nome sobrepõem o arquivo.
 *
 * Kill-switch: `CANARIO_OFF=1` desliga os envios (as chamadas retornam
 * { ok: false, desligado: true } sem tocar a rede) — para rodar builds em
 * máquina sem credencial ou silenciar o canal temporariamente.
 *
 * Anti-flood: envios são serializados com intervalo mínimo entre eles
 * (limites do Telegram: 1 msg/s por chat, 20/min). Mensagens são
 * truncadas em 4.000 caracteres.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

/** Raiz do repo a partir deste arquivo: scripts/canario/ -> scripts/ -> web -> apps -> raiz. */
const RAIZ = path.resolve(import.meta.dirname ?? process.cwd(), "..", "..", "..", "..");
const ENV_PATH = path.join(RAIZ, "scripts", ".env");

export interface ConfigCanario {
  token: string;
  chatId: string;
  desligado: boolean;
}

let configCache: ConfigCanario | null = null;

function lerEnvArquivo(): Record<string, string> {
  try {
    const saida: Record<string, string> = {};
    for (const linha of readFileSync(ENV_PATH, "utf8").split(/\r?\n/)) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(linha.trim());
      if (m && !linha.startsWith("#")) saida[m[1]] = m[2];
    }
    return saida;
  } catch {
    return {};
  }
}

export function lerConfigCanario(): ConfigCanario {
  if (configCache) return configCache;
  const env = { ...lerEnvArquivo(), ...process.env };
  configCache = {
    token: env.TELEGRAM_BOT_TOKEN || "",
    chatId: env.TELEGRAM_CHAT_ID || "",
    desligado: env.CANARIO_OFF === "1",
  };
  return configCache;
}

/** Testa se o par token+chat está completo. Motivo legível quando não está. */
export function configurado(): boolean {
  const c = lerConfigCanario();
  return Boolean(c.token && c.chatId);
}

const INTERVALO_MS = 1_150;
let fila: Promise<void> = Promise.resolve();

async function enviarImediato(texto: string): Promise<{ ok: boolean; erro?: string }> {
  const c = lerConfigCanario();
  if (c.desligado) return { ok: false, erro: "CANARIO_OFF=1" };
  if (!c.token || !c.chatId) return { ok: false, erro: "credenciais ausentes" };

  try {
    const resp = await fetch(`https://api.telegram.org/bot${c.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: c.chatId,
        text: texto.slice(0, 4_000),
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const dados = (await resp.json()) as { ok?: boolean; description?: string };
    if (!dados.ok) return { ok: false, erro: dados.description ?? `HTTP ${resp.status}` };
    return { ok: true };
  } catch (erro) {
    return { ok: false, erro: erro instanceof Error ? erro.message : String(erro) };
  }
}

/** Envia mensagem respeitando a fila anti-flood. Nunca lança — devolve status. */
export function enviarMensagem(texto: string): Promise<{ ok: boolean; erro?: string }> {
  const resultado = fila.then(() => enviarImediato(texto));
  fila = resultado.then(
    () => new Promise((r) => setTimeout(r, INTERVALO_MS)),
    () => new Promise((r) => setTimeout(r, INTERVALO_MS))
  );
  return resultado;
}

export interface UpdateTelegram {
  updateId: number;
  data?: Date;
  texto?: string;
  chatId?: number;
}

/** Lê as últimas mensagens recebidas pelo bot. */
export async function listarUpdates(qtd = 5): Promise<UpdateTelegram[]> {
  const c = lerConfigCanario();
  if (!c.token) return [];
  const resp = await fetch(
    `https://api.telegram.org/bot${c.token}/getUpdates?limit=${qtd}&offset=-${qtd}`,
    { signal: AbortSignal.timeout(15_000) }
  );
  const dados = (await resp.json()) as {
    result?: {
      update_id: number;
      message?: { date: number; text?: string; chat?: { id?: number } };
    }[];
  };
  return (dados.result ?? []).map((u) => ({
    updateId: u.update_id,
    data: u.message?.date ? new Date(u.message.date * 1000) : undefined,
    texto: u.message?.text,
    chatId: u.message?.chat?.id,
  }));
}
