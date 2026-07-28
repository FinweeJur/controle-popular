/**
 * Cliente LLM do lado do app — SERVIDOR APENAS.
 *
 * Espelha as mesmas variáveis de ambiente do lado Python (`etl/llm/`), que
 * por sua vez delega para a lib compartilhada `llm-br`. Aqui só existe o
 * que o app precisa em tempo de requisição: revisar o texto de um ofício.
 * Análise de proposição continua sendo fila no ETL — não se põe um modelo
 * local de 8B no caminho de uma requisição HTTP.
 *
 * Nunca importar de client component: usa `LLM_API_KEY`.
 */

export interface OpcoesLLM {
  system?: string;
  temperatura?: number;
  timeoutMs?: number;
}

export class LLMIndisponivel extends Error {}

function config() {
  return {
    provider: (process.env.LLM_PROVIDER || "ollama").toLowerCase(),
    modelo: process.env.LLM_MODEL || "llama3.1:8b-instruct-q4_K_M",
    baseUrl: process.env.LLM_BASE_URL || "http://localhost:11434",
    apiKey: process.env.LLM_API_KEY || "",
  };
}

export function identificacaoModelo(): string {
  const c = config();
  return `${c.provider}:${c.modelo}`;
}

export async function gerarTexto(prompt: string, opcoes: OpcoesLLM = {}): Promise<string> {
  const c = config();
  const { system = "", temperatura = 0.2, timeoutMs = 120_000 } = opcoes;

  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), timeoutMs);

  try {
    if (c.provider === "ollama") {
      const resp = await fetch(`${c.baseUrl.replace(/\/$/, "")}/api/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: c.modelo,
          prompt,
          system: system || undefined,
          stream: false,
          options: { temperature: temperatura },
        }),
        signal: controle.signal,
      });
      if (!resp.ok) throw new LLMIndisponivel(`Ollama respondeu ${resp.status}`);
      const dados = (await resp.json()) as { response?: string };
      return (dados.response ?? "").trim();
    }

    if (c.provider === "anthropic") {
      const resp = await fetch(`${c.baseUrl.replace(/\/$/, "")}/v1/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": c.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: c.modelo,
          max_tokens: 4096,
          temperature: temperatura,
          system: system || undefined,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: controle.signal,
      });
      if (!resp.ok) throw new LLMIndisponivel(`Anthropic respondeu ${resp.status}`);
      const dados = (await resp.json()) as { content?: { text?: string }[] };
      return (dados.content ?? []).map((b) => b.text ?? "").join("").trim();
    }

    // deepseek, maritaca e qualquer /v1/chat/completions
    const resp = await fetch(`${c.baseUrl.replace(/\/$/, "")}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${c.apiKey}`,
      },
      body: JSON.stringify({
        model: c.modelo,
        temperature: temperatura,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: prompt },
        ],
      }),
      signal: controle.signal,
    });
    if (!resp.ok) throw new LLMIndisponivel(`Provedor respondeu ${resp.status}`);
    const dados = (await resp.json()) as { choices?: { message?: { content?: string } }[] };
    return (dados.choices?.[0]?.message?.content ?? "").trim();
  } catch (e) {
    if (e instanceof LLMIndisponivel) throw e;
    throw new LLMIndisponivel(
      e instanceof Error ? e.message : "falha ao falar com o provedor de LLM"
    );
  } finally {
    clearTimeout(timer);
  }
}
