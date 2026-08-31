/**
 * Geracao de resposta por LLM para o pipeline de RAG do chatbot.
 *
 * Escolhe automaticamente o provedor:
 * - Se houver chave remota configurada (`AI_API_KEY_DEEPSEEK` ou
 *   `AI_API_KEY_MARITACA`), chama a API do provedor ATIVO (escolhido no
 *   painel de edicao, `data/ia-config.json`); em falha, tenta o outro
 *   provedor como fallback automatico.
 * - Se nao houver nenhuma chave, cai para Ollama local (laboratorio L4).
 *
 * Ver decisoes 2-4 de `docs/ESTADO.md`, 22/08/2026, e o roteiro de
 * execucao de pendencias (docs/planos/ROTEIRO-EXECUCAO-PENDENCIAS.md).
 *
 * A resposta E obrigada a citar as fontes do contexto. O prompt inclui a
 * regra explicitamente.
 */

import { OLLAMA_BASE_URL, OllamaIndisponivel, type OpcoesOllama } from "./ollama";
import { listarProvedoresNaOrdem, temChaveRemota, type ProvedorIa } from "./provedores";

const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || "qwen2.5-coder:3b";

interface MensagemChat {
  role: "system" | "user" | "assistant";
  content: string;
}

interface RespostaChatOllama {
  message?: { content?: string };
  error?: string;
}

interface RespostaChatApi {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
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

function montarMensagens(pergunta: string, fontes: FonteRag[]): MensagemChat[] {
  return [
    { role: "system", content: SYSTEM_PROMPT_RAG },
    { role: "user", content: montarPromptUsuario(pergunta, fontes) },
  ];
}

async function chamarOllama(mensagens: MensagemChat[], opcoes: OpcoesOllama): Promise<string> {
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

async function chamarProvedor(mensagens: MensagemChat[], provedor: ProvedorIa): Promise<string> {
  const baseUrl = provedor.baseUrl.replace(/\/$/, "");

  let resp: Response;
  try {
    resp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provedor.apiKey}`,
      },
      body: JSON.stringify({
        model: provedor.modelo,
        messages: mensagens,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS_PADRAO),
    });
  } catch (e) {
    const causa = e instanceof Error ? e.message : String(e);
    throw new Error(`${provedor.rotulo} nao respondeu em ${baseUrl} (${causa})`);
  }

  const dados = (await resp.json()) as RespostaChatApi;
  if (dados.error?.message) {
    throw new Error(`${provedor.rotulo}: ${dados.error.message}`);
  }
  if (!resp.ok) {
    throw new Error(`${provedor.rotulo} respondeu HTTP ${resp.status} em ${baseUrl}/chat/completions`);
  }

  const conteudo = dados.choices?.[0]?.message?.content?.trim();
  if (!conteudo) {
    throw new Error(`${provedor.rotulo} respondeu 200 sem conteudo em choices[0].message.content`);
  }
  return conteudo;
}

/**
 * Tenta os provedores remotos na ordem configurada (ativo -> fallback).
 * Devolve o texto e o ROTULO do provedor que respondeu, para o `modelo`
 * do RespostaRag mostrar quem de fato gerou.
 */
async function chamarApiRemota(mensagens: MensagemChat[]): Promise<{ texto: string; rotulo: string }> {
  const provedores = listarProvedoresNaOrdem();
  if (provedores.length === 0) {
    throw new Error("Nenhum provedor remoto configurado (AI_API_KEY_DEEPSEEK / AI_API_KEY_MARITACA vazias)");
  }

  const erros: string[] = [];
  for (const provedor of provedores) {
    try {
      const texto = await chamarProvedor(mensagens, provedor);
      return { texto, rotulo: provedor.rotulo };
    } catch (e) {
      erros.push(e instanceof Error ? e.message : String(e));
    }
  }
  throw new Error(`Todos os provedores remotos falharam: ${erros.join(" | ")}`);
}

/**
 * Gera uma resposta a partir de uma pergunta e das fontes recuperadas por
 * similaridade, usando Ollama local.
 *
 * Mantida para chamadas explicitas ao laboratorio local.
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

  const mensagens = montarMensagens(pergunta, fontes);
  const resposta = await chamarOllama(mensagens, opcoes);
  return {
    resposta,
    fontes,
    modelo: opcoes.modelo ?? OLLAMA_CHAT_MODEL,
  };
}

/**
 * Gera uma resposta a partir de uma pergunta e das fontes recuperadas por
 * similaridade, usando API remota quando houver chave configurada.
 * Tenta o provedor ativo e, em falha, o fallback automatico.
 */
export async function gerarRespostaApi(pergunta: string, fontes: FonteRag[]): Promise<RespostaRag> {
  if (fontes.length === 0) {
    return {
      resposta: "Nao encontrei dados diretamente ligados a sua pergunta no acervo indexado.",
      fontes: [],
      modelo: "sem-fontes",
    };
  }

  const mensagens = montarMensagens(pergunta, fontes);
  const { texto, rotulo } = await chamarApiRemota(mensagens);
  return {
    resposta: texto,
    fontes,
    modelo: rotulo,
  };
}

/**
 * Gera uma resposta a partir de uma pergunta e das fontes recuperadas por
 * similaridade. Escolhe automaticamente o provedor:
 * - API remota (provedor ativo -> fallback) se alguma chave estiver
 *   configurada.
 * - Ollama local como fallback final.
 */
export async function gerarRespostaRag(
  pergunta: string,
  fontes: FonteRag[],
  opcoes: OpcoesOllama = {}
): Promise<RespostaRag> {
  if (temChaveRemota()) {
    return gerarRespostaApi(pergunta, fontes);
  }
  return gerarRespostaLocal(pergunta, fontes, opcoes);
}
