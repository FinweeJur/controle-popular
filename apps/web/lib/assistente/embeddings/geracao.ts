/**
 * Geracao de resposta por LLM local via Ollama — a metade "responder" do
 * pipeline de RAG do chatbot (ver decisoes 2-4 de `docs/ESTADO.md`,
 * 22/08/2026).
 *
 * Diferente de `lib/chat-comum.ts`, que chama API remota (DeepSeek/Maritaca),
 * este modulo e o laboratorio local (L4 do plano): roda no home-pc, sem
 * credencial, e serve para provar o conceito e para fallback quando a API
 * publica nao responde.
 *
 * A resposta E obrigada a citar as fontes do contexto. O prompt inclui a
 * regra explicitamente, e o parse das citacoes extrai os trechos usados.
 */

import { OLLAMA_BASE_URL, OllamaIndisponivel, type OpcoesOllama } from "./ollama";

const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || "qwen2.5:7b-instruct-q4_K_M";

interface MensagemChat {
  role: "system" | "user" | "assistant";
  content: string;
}

interface RespostaChatOllama {
  message?: { content?: string };
  error?: string;
}

export interface FonteRag {
  indice: number;
  texto: string;
  score: number;
}

export interface RespostaRag {
  resposta: string;
  fontes: FonteRag[];
  modelo: string;
}

const TIMEOUT_MS_PADRAO = 60_000;

const SYSTEM_PROMPT_RAG = `Voce e um assistente de um portal de transparencia. Responda SOMENTE com base no contexto fornecido abaixo.

Regras rigidas:
- Nunca invente numeros, nomes, datas, valores ou dispositivos legais.
- Se o contexto nao tiver a resposta, diga que nao encontrou esse dado no portal.
- Cite a fonte no final da resposta, listando as fontes do contexto que voce usou.
- Nao de opiniao politica nem aconselhamento juridico. Nao acuse ninguem.
- A resposta deve ser curta, direta, em portugues do Brasil.`;

function montarPromptUsuario(pergunta: string, fontes: FonteRag[]): string {
  const contexto = fontes
    .map((f, i) => `[Fonte ${i + 1}] (relevancia: ${(f.score * 100).toFixed(1)}%)\n${f.texto}`)
    .join("\n\n");

  return `CONTEXTO (dados do portal):\n${contexto}\n\nPERGUNTA: ${pergunta}\n\nResponda com base apenas no contexto. Ao final, liste as fontes usadas.`;
}

async function chamarApiChat(
  mensagens: MensagemChat[],
  opcoes: OpcoesOllama
): Promise<string> {
  const baseUrl = opcoes.baseUrl ?? OLLAMA_BASE_URL;
  const modelo = opcoes.modelo ?? OLLAMA_CHAT_MODEL;
  const timeoutMs = opcoes.timeoutMs ?? TIMEOUT_MS_PADRAO;

  let resp: Response;
  try {
    resp = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelo,
        messages: mensagens,
        stream: false,
        options: { temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    const causa = e instanceof Error ? e.message : String(e);
    throw new OllamaIndisponivel(`Ollama nao respondeu em ${baseUrl} (${causa})`);
  }

  if (!resp.ok) {
    let corpo = "";
    try {
      corpo = await resp.text();
    } catch {
      // corpo ilegivel nao impede reportar o status
    }
    throw new OllamaIndisponivel(`Ollama respondeu HTTP ${resp.status} em ${baseUrl}/api/chat: ${corpo}`);
  }

  const dados = (await resp.json()) as RespostaChatOllama;
  if (dados.error) {
    throw new OllamaIndisponivel(`Ollama: ${dados.error}`);
  }
  const conteudo = dados.message?.content?.trim();
  if (!conteudo) {
    throw new OllamaIndisponivel("Ollama respondeu 200 sem conteudo em message.content");
  }
  return conteudo;
}

/**
 * Gera uma resposta a partir de uma pergunta e das fontes recuperadas por
 * similaridade. As fontes sao repassadas tal qual para o prompt — o modelo
 * nao tem acesso a nada fora delas.
 */
export async function gerarRespostaLocal(
  pergunta: string,
  fontes: FonteRag[],
  opcoes: OpcoesOllama = {}
): Promise<RespostaRag> {
  if (fontes.length === 0) {
    return {
      resposta: "Nao encontrei dados diretamente ligados a sua pergunta no acervo indexado.",
      fontes: [],
      modelo: opcoes.modelo ?? OLLAMA_CHAT_MODEL,
    };
  }

  const mensagens: MensagemChat[] = [
    { role: "system", content: SYSTEM_PROMPT_RAG },
    { role: "user", content: montarPromptUsuario(pergunta, fontes) },
  ];

  const resposta = await chamarApiChat(mensagens, opcoes);
  return {
    resposta,
    fontes,
    modelo: opcoes.modelo ?? OLLAMA_CHAT_MODEL,
  };
}
