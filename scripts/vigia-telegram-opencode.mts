/**
 * scripts/vigia-telegram-opencode.mts — Vigia contínuo de tarefas delegadas pelo OpenCode e Telegram.
 *
 * Papel no portal:
 *   Monitora o fluxo de comunicação entre agentes (OpenCode, Hermes, Claude, Gemini/Antigravity)
 *   e o chat oficial do dono (Artur) no Telegram. Detecta comandos direcionados ao Gemini
 *   (prefixos /gemini, @gemini ou tarefas na fila de agentes) e os registra para execução imediata.
 *
 * Fontes e integrações:
 *   - Telegram Bot API (chat_id oficial do Artur)
 *   - docs/planos/FILA-AGENTES.md (fila canônica assíncrona entre agentes)
 *   - .opencode/canario/comandos.json (fila de comandos ponte do OpenCode)
 *   - logs/telegram-inbox.jsonl (histórico persistente de mensagens do inbox)
 *
 * Decisões técnicas:
 *   - Para ler o Telegram sem derrubar o webhook externo (tele.goldenherd.com),
 *     aplica o ciclo atômico: deleteWebhook -> getUpdates -> setWebhook.
 *   - Mantém offset próprio em scripts/.vigia-telegram-offset para não conflitar com outros agentes.
 *   - Salva tarefas detectadas em logs/tarefas-delegadas-gemini.json com data e status.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = path.join(RAIZ, "scripts", ".env");
const OFFSET_PATH = path.join(RAIZ, "scripts", ".vigia-telegram-offset");
const INBOX_PATH = path.join(RAIZ, "logs", "telegram-inbox.jsonl");
const FILA_AGENTES_PATH = path.join(RAIZ, "docs", "planos", "FILA-AGENTES.md");
const OPENCODE_CMDS_PATH = path.join(RAIZ, ".opencode", "canario", "comandos.json");
const TAREFAS_GEMINI_PATH = path.join(RAIZ, "logs", "tarefas-delegadas-gemini.json");

const WEBHOOK_URL = "https://tele.goldenherd.com/tg/webhook/8679298724";

/** Estrutura de tarefa registrada para o Gemini */
export interface TarefaDelegada {
  id: string;
  origem: "telegram" | "fila_agentes" | "opencode_canario";
  autor: string;
  comando: string;
  timestamp: string;
  status: "pendente" | "em_andamento" | "concluida";
}

/** Carrega variáveis do arquivo scripts/.env sem poluir o console */
function carregarEnv(): { token: string; dono: string } {
  let token = "";
  let dono = "";
  if (fs.existsSync(ENV_PATH)) {
    for (const linha of fs.readFileSync(ENV_PATH, "utf-8").split(/\r?\n/)) {
      const m = linha.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
      if (m) {
        if (m[1] === "TELEGRAM_BOT_TOKEN") token = m[2].trim().replace(/^['"]|['"]$/g, "");
        if (m[1] === "TELEGRAM_CHAT_ID") dono = m[2].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  }
  return { token, dono };
}

/** Lê o último offset processado */
function lerOffset(): number | undefined {
  try {
    const val = Number(fs.readFileSync(OFFSET_PATH, "utf-8").trim());
    return Number.isFinite(val) ? val : undefined;
  } catch {
    return undefined;
  }
}

/** Grava o novo offset processado */
function gravarOffset(offset: number) {
  try {
    fs.writeFileSync(OFFSET_PATH, String(offset), "utf-8");
  } catch {}
}

/** Registra mensagem no log unificado de inbox */
function anexarInbox(registro: Record<string, unknown>) {
  try {
    fs.mkdirSync(path.dirname(INBOX_PATH), { recursive: true });
    fs.appendFileSync(INBOX_PATH, JSON.stringify(registro) + "\n", "utf-8");
  } catch {}
}

/** Salva tarefa na lista ativa de tarefas do Gemini */
export function salvarTarefaGemini(tarefa: TarefaDelegada) {
  try {
    fs.mkdirSync(path.dirname(TAREFAS_GEMINI_PATH), { recursive: true });
    let lista: TarefaDelegada[] = [];
    if (fs.existsSync(TAREFAS_GEMINI_PATH)) {
      try {
        lista = JSON.parse(fs.readFileSync(TAREFAS_GEMINI_PATH, "utf-8"));
      } catch {
        lista = [];
      }
    }
    const existe = lista.some((t) => t.id === tarefa.id);
    if (!existe) {
      lista.push(tarefa);
      fs.writeFileSync(TAREFAS_GEMINI_PATH, JSON.stringify(lista, null, 2), "utf-8");
      console.log(`🎯 [Vigia] Nova tarefa registrada para o Gemini: "${tarefa.comando.slice(0, 100)}"`);
    }
  } catch (err) {
    console.error("Erro ao salvar tarefa do Gemini:", err);
  }
}

/** Varre o arquivo FILA-AGENTES.md por itens abertos destinados ao Gemini */
export function verificarFilaAgentes(): TarefaDelegada[] {
  if (!fs.existsSync(FILA_AGENTES_PATH)) return [];
  const conteudo = fs.readFileSync(FILA_AGENTES_PATH, "utf-8");
  const tarefas: TarefaDelegada[] = [];

  // Padrão: ## [ABERTA] <id> — <titulo> ... Donatário: gemini
  const blocos = conteudo.split(/(?=##\s*\[ABERTA\])/gi);
  for (const bloco of blocos) {
    if (!bloco.toLowerCase().includes("[aberta]")) continue;
    const matchDonatario = bloco.match(/\*\*Donatário:\*\*\s*(gemini|antigravity|ambos)/i);
    if (matchDonatario) {
      const matchTitulo = bloco.match(/##\s*\[ABERTA\]\s*([^\n\r]+)/i);
      const titulo = matchTitulo ? matchTitulo[1].trim() : "Tarefa aberta";
      const id = "fila_" + titulo.replace(/\s+/g, "_").slice(0, 30);
      tarefas.push({
        id,
        origem: "fila_agentes",
        autor: "OpenCode/Fila",
        comando: titulo,
        timestamp: new Date().toISOString(),
        status: "pendente",
      });
    }
  }
  return tarefas;
}

/** Varre a fila comandos.json do OpenCode */
export function verificarComandosOpencode(): TarefaDelegada[] {
  if (!fs.existsSync(OPENCODE_CMDS_PATH)) return [];
  try {
    const raw = fs.readFileSync(OPENCODE_CMDS_PATH, "utf-8");
    const itens = JSON.parse(raw);
    const tarefas: TarefaDelegada[] = [];
    if (Array.isArray(itens)) {
      for (const item of itens) {
        if (item.status === "pendente" && item.mensagem) {
          const msg = String(item.mensagem).toLowerCase();
          if (msg.includes("gemini") || msg.includes("antigravity")) {
            tarefas.push({
              id: item.id || `opencode_${Date.now()}`,
              origem: "opencode_canario",
              autor: "OpenCode",
              comando: item.mensagem,
              timestamp: item.criadoEm || new Date().toISOString(),
              status: "pendente",
            });
          }
        }
      }
    }
    return tarefas;
  } catch {
    return [];
  }
}

/**
 * Consulta Telegram de forma atômica e segura.
 * Remove webhook temporariamente, lê updates pendentes, e restabelece o webhook.
 */
export async function verificarUpdatesTelegram(token: string, donoId: string): Promise<TarefaDelegada[]> {
  if (!token) return [];
  const novasTarefas: TarefaDelegada[] = [];
  let offset = lerOffset();

  try {
    // 1. Desconecta webhook temporariamente para permitir getUpdates
    await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, { signal: AbortSignal.timeout(6000) }).catch(() => {});

    // 2. Busca updates com timeout curto
    const url = offset !== undefined
      ? `https://api.telegram.org/bot${token}/getUpdates?offset=${offset + 1}&limit=20`
      : `https://api.telegram.org/bot${token}/getUpdates?limit=20`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const dados = (await res.json()) as {
      ok?: boolean;
      result?: Array<{
        update_id: number;
        message?: {
          date?: number;
          chat?: { id?: number };
          from?: { first_name?: string; username?: string };
          text?: string;
        };
      }>;
    };

    // 3. Restaura o webhook imediatamente
    await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        allowed_updates: ["message", "edited_message", "channel_post", "edited_channel_post"],
      }),
      signal: AbortSignal.timeout(6000),
    }).catch(() => {});

    // Processa os updates recebidos
    if (dados?.ok && Array.isArray(dados.result)) {
      let maior = offset ?? 0;
      for (const item of dados.result) {
        if (item.update_id > maior) maior = item.update_id;
        const msg = item.message;
        if (!msg?.text) continue;

        const chatId = msg.chat?.id ? String(msg.chat.id) : "";
        if (donoId && chatId !== donoId) continue;

        const autor = msg.from?.first_name || msg.from?.username || "Artur";
        const texto = msg.text.trim();
        const textoLower = texto.toLowerCase();

        // Anota no log do inbox
        anexarInbox({
          recebido_em: new Date().toISOString(),
          update_id: item.update_id,
          de: autor,
          texto,
        });

        // Checa se a mensagem é endereçada ao Gemini ou delegação
        if (
          textoLower.startsWith("/gemini") ||
          textoLower.includes("@gemini") ||
          textoLower.includes("para o gemini") ||
          textoLower.includes("pro gemini") ||
          textoLower.includes("delegar pro gemini") ||
          textoLower.includes("delegando pro gemini")
        ) {
          novasTarefas.push({
            id: `tg_${item.update_id}`,
            origem: "telegram",
            autor,
            comando: texto,
            timestamp: new Date().toISOString(),
            status: "pendente",
          });
        }
      }

      if (maior > (offset ?? 0)) {
        gravarOffset(maior);
      }
    }
  } catch (err) {
    // Em caso de falha temporária de rede, tenta garantir restauração do webhook
    try {
      await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          allowed_updates: ["message", "edited_message", "channel_post", "edited_channel_post"],
        }),
      });
    } catch {}
  }

  return novasTarefas;
}

/** Execução de uma rodada de verificação completa */
export async function rodarVigiaUmaVez(): Promise<{
  totalEncontradas: number;
  tarefas: TarefaDelegada[];
}> {
  const { token, dono } = carregarEnv();

  const tarefasFila = verificarFilaAgentes();
  const tarefasOpencode = verificarComandosOpencode();
  const tarefasTelegram = await verificarUpdatesTelegram(token, dono);

  const todas = [...tarefasFila, ...tarefasOpencode, ...tarefasTelegram];
  for (const t of todas) {
    salvarTarefaGemini(t);
  }

  return {
    totalEncontradas: todas.length,
    tarefas: todas,
  };
}

// Se executado diretamente pela CLI:
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  const isLoop = process.argv.includes("--loop");

  if (isLoop) {
    console.log("👁️ [Vigia Telegram & OpenCode] Iniciando monitoramento contínuo (intervalo: 30s)...");
    const INTERVALO_MS = 30_000;

    const rodarLoop = async () => {
      try {
        const { totalEncontradas, tarefas } = await rodarVigiaUmaVez();
        if (totalEncontradas > 0) {
          console.log(`[${new Date().toLocaleTimeString("pt-BR")}] 📋 ${totalEncontradas} tarefa(s) detectada(s).`);
        }
      } catch (err) {
        console.error("Erro na rodada do vigia:", err);
      }
      setTimeout(rodarLoop, INTERVALO_MS);
    };

    rodarLoop();
  } else {
    console.log("👁️ [Vigia Telegram & OpenCode] Iniciando auditoria de tarefas delegadas...");
    rodarVigiaUmaVez().then(({ totalEncontradas, tarefas }) => {
      console.log(`\n📋 Varredura concluída. Tarefas ativas/delegadas: ${totalEncontradas}`);
      for (const t of tarefas) {
        console.log(`   - [${t.origem.toUpperCase()}] (${t.autor}): ${t.comando.slice(0, 80)}`);
      }
      process.exit(0);
    }).catch((e) => {
      console.error("Erro no vigia:", e);
      process.exit(1);
    });
  }
}
