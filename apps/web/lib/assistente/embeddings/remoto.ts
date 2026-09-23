/**
 * Embeddings por API remota (SiliconFlow `BAAI/bge-m3`) — caminho alternativo
 * ao Ollama local para vetorizar o acervo do Seu Nonô.
 *
 * Por que existe: o plano Starter do Guara tem 256 MB de RAM por serviço no
 * pico (medido em 23/09/2026, docs guaracloud.com/en/docs/getting-started/
 * plans-pricing) — não cabe Ollama + nomic-embed-text (~300–500 MB). O
 * Ollama continua válido no home-pc (dev local, custo zero); no Guara a
 * vetorização vai por API.
 *
 * Maritaca/DeepSeek/Ling NÃO publicam endpoint de embeddings (medido em
 * 22/08 e reafirmado em 30/08, `provedores.ts`). O candidato gratuito é a
 * SiliconFlow com `BAAI/bge-m3` (OpenAI-compatible, 1024 dims, free tier
 * sem cartão) — documentado em `docs/planos/PLANO-SEU-NONO-NOTEBOOKLM.md`.
 *
 * Env (só o NOME vive no código; o valor fica no painel do Guara / .env.local):
 * - `EMBED_API_KEY`  — chave da SiliconFlow (ou outro endpoint OpenAI-compat)
 * - `EMBED_BASE_URL` — padrão `https://api.siliconflow.cn/v1`
 * - `EMBED_MODEL`    — padrão `BAAI/bge-m3`
 */

export const EMBED_BASE_URL_PADRAO = "https://api.siliconflow.cn/v1";
export const EMBED_MODEL_PADRAO = "BAAI/bge-m3";

const TIMEOUT_MS_PADRAO = 30_000;

export interface OpcoesEmbed {
  baseUrl?: string;
  modelo?: string;
  timeoutMs?: number;
}

/** Erro do embeddings remoto — mesmo nome de `OllamaIndisponivel` para o
 *  caller tratar "provedor de embedding indisponível" num único catch. */
export class EmbedIndisponivel extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "EmbedIndisponivel";
  }
}

/** Há chave de embeddings remota configurada? */
export function temChaveEmbed(): boolean {
  return (process.env.EMBED_API_KEY || "").trim().length > 0;
}

function resolvers(opcoes: OpcoesEmbed): { baseUrl: string; modelo: string; chave: string; timeoutMs: number } {
  return {
    baseUrl: (opcoes.baseUrl ?? process.env.EMBED_BASE_URL ?? EMBED_BASE_URL_PADRAO).replace(/\/$/, ""),
    modelo: opcoes.modelo ?? process.env.EMBED_MODEL ?? EMBED_MODEL_PADRAO,
    chave: (process.env.EMBED_API_KEY || "").trim(),
    timeoutMs: opcoes.timeoutMs ?? TIMEOUT_MS_PADRAO,
  };
}

interface RespostaEmbedApi {
  data?: { embedding?: number[] }[];
  error?: { message?: string };
}

async function chamarApiEmbed(input: string | string[], opcoes: OpcoesEmbed): Promise<number[][]> {
  const { baseUrl, modelo, chave, timeoutMs } = resolvers(opcoes);
  if (!chave) {
    throw new EmbedIndisponivel("EMBED_API_KEY vazia — configure a chave da SiliconFlow (ou outro endpoint OpenAI-compat)");
  }

  let resp: Response;
  try {
    resp = await fetch(`${baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chave}`,
      },
      body: JSON.stringify({ model: modelo, input }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    const causa = e instanceof Error ? e.message : String(e);
    throw new EmbedIndisponivel(`Embeddings remotos não responderam em ${baseUrl} (${causa})`);
  }

  const dados = (await resp.json().catch(() => ({}))) as RespostaEmbedApi;
  if (dados.error?.message) {
    throw new EmbedIndisponivel(`${modelo}: ${dados.error.message}`);
  }
  if (!resp.ok) {
    throw new EmbedIndisponivel(`Embeddings remotos responderam HTTP ${resp.status} em ${baseUrl}/embeddings`);
  }
  if (!dados.data || dados.data.length === 0) {
    throw new EmbedIndisponivel("API de embeddings respondeu 200 sem `data` — valide o CONTEÚDO, não só o status");
  }
  const vetores = dados.data.map((d) => d.embedding || []);
  if (vetores.some((v) => v.length === 0)) {
    throw new EmbedIndisponivel("API de embeddings devolveu vetor vazio em `data[].embedding`");
  }
  return vetores;
}

/** Vetoriza UM texto (tipicamente a pergunta do usuário). */
export async function vetorizarRemoto(texto: string, opcoes: OpcoesEmbed = {}): Promise<number[]> {
  const [vetor] = await chamarApiEmbed(texto, opcoes);
  if (!vetor || vetor.length === 0) {
    throw new EmbedIndisponivel("API de embeddings devolveu um vetor vazio");
  }
  return vetor;
}

/**
 * Vetoriza vários textos numa única chamada. A ordem do resultado é a MESMA
 * ordem de `textos` (contrato OpenAI-compatible, mesmo do Ollama).
 * `[]` devolve `[]` sem chamar a rede.
 */
export async function vetorizarLoteRemoto(textos: string[], opcoes: OpcoesEmbed = {}): Promise<number[][]> {
  if (textos.length === 0) return [];
  const vetores = await chamarApiEmbed(textos, opcoes);
  if (vetores.length !== textos.length) {
    throw new EmbedIndisponivel(
      `API devolveu ${vetores.length} vetor(es) para ${textos.length} texto(s) — contrato de ordem quebrado`
    );
  }
  return vetores;
}

/** `true` se a chave existe (não faz rede — o gate do RAG só precisa saber
 *  se há credencial; a primeira chamada real falhará com erro claro). */
export function embedRemotoConfigurado(): boolean {
  return temChaveEmbed();
}
