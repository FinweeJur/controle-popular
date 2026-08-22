/**
 * Cliente do endpoint de embedding do Ollama local — a metade "vetorizar"
 * do pipeline de RAG do chatbot (ver decisões 2-4 de `docs/ESTADO.md`,
 * 22/08/2026: o acervo por embedding cobre o que os graus determinísticos
 * do assistente não cobrirem).
 *
 * ═══ O QUE ISTO NÃO É ═══
 *
 * Isto NÃO chama Maritaca nem DeepSeek, e não tem chave de API — o Ollama
 * local não pede credencial nenhuma, é só um servidor HTTP em
 * `localhost:11434`. A GERAÇÃO de resposta (o "cérebro" das decisões do
 * dono) é outra peça, ainda sem credencial, e fica em `lib/chat-comum.ts`
 * (`AI_BASE_URL`/`AI_API_KEY`, hoje DeepSeek) — este módulo não a toca.
 *
 * ═══ POR QUE `nomic-embed-text` / 768 DIMENSÕES NÃO SÃO CONSTANTE MÁGICA ═══
 *
 * O modelo já está instalado e respondendo nesta máquina (medido em
 * 22/08/2026: `POST /api/embed` com `{"model":"nomic-embed-text","input":"..."}`
 * devolve vetor de 768 posições, ~5,5 s na primeira chamada — modelo frio,
 * o Ollama carrega os pesos na GPU/CPU sob demanda — e bem mais rápido nas
 * chamadas seguintes). A dimensão do vetor é o próprio modelo quem decide;
 * este módulo não valida "768" em lugar nenhum, porque trocar de modelo
 * (`OLLAMA_EMBED_MODEL`) muda a dimensão e não é bug.
 *
 * ═══ LOTE, NÃO SÓ UM POR VEZ ═══
 *
 * `/api/embed` aceita `input` como STRING ou como ARRAY de strings — testado
 * nesta máquina em 22/08/2026: array de 2 textos devolve `embeddings` com 2
 * vetores, na mesma ordem. `vetorizarLote` usa isso pra indexar N pedaços
 * de documento numa única ida à rede, em vez de N — importa quando o corpo
 * a indexar cresce; a pergunta do usuário continua indo sozinha por
 * `vetorizar`.
 */

// Exportada (não só `const` privada) para que os testes possam citar a URL
// REAL checada na mensagem de "pulando" em vez de cravar "localhost:11434"
// à mão — que ficaria mentindo se alguém rodar com `OLLAMA_BASE_URL`
// customizado (medido: aconteceu ao testar o próprio skip desta tarefa).
export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

/** Generoso de propósito: a primeira chamada mede ~5,5 s com o modelo frio
 *  (ver docstring do módulo); um timeout curto derrubaria exatamente a
 *  chamada que prova que o modelo está de pé. */
const TIMEOUT_MS_PADRAO = 30_000;

export interface OpcoesOllama {
  baseUrl?: string;
  modelo?: string;
  timeoutMs?: number;
}

/** Erro específico do Ollama — distinto de erro de rede genérico pela mesma
 *  razão de `IndiceIndisponivel` em `lib/assistente/documentos.ts`: quem
 *  pega este erro sabe que o servidor respondeu (ou recusou) e pode mostrar
 *  "Ollama não está respondendo em <url>" em vez de "erro de conexão". */
export class OllamaIndisponivel extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "OllamaIndisponivel";
  }
}

interface RespostaEmbedOllama {
  embeddings?: number[][];
  error?: string;
}

async function chamarApiEmbed(input: string | string[], opcoes: OpcoesOllama): Promise<number[][]> {
  const baseUrl = opcoes.baseUrl ?? OLLAMA_BASE_URL;
  const modelo = opcoes.modelo ?? OLLAMA_EMBED_MODEL;
  const timeoutMs = opcoes.timeoutMs ?? TIMEOUT_MS_PADRAO;

  let resp: Response;
  try {
    resp = await fetch(`${baseUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelo, input }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    // Cobre conexão recusada (Ollama não está de pé), DNS e timeout do
    // AbortSignal acima — todos chegam aqui como rejeição do `fetch`, nunca
    // como resposta HTTP, então não têm `status` pra checar.
    const causa = e instanceof Error ? e.message : String(e);
    throw new OllamaIndisponivel(`Ollama não respondeu em ${baseUrl} (${causa})`);
  }

  if (!resp.ok) {
    // "Nunca confie em status 200" vale o inverso também: um 404/500 aqui
    // já É o conteúdo (o Ollama devolve corpo de erro legível), não precisa
    // de tratamento especial além de propagar a mensagem.
    let corpo = "";
    try {
      corpo = await resp.text();
    } catch {
      // corpo ilegível não impede reportar o status
    }
    throw new OllamaIndisponivel(`Ollama respondeu HTTP ${resp.status} em ${baseUrl}/api/embed: ${corpo}`);
  }

  const dados = (await resp.json()) as RespostaEmbedOllama;
  if (dados.error) {
    throw new OllamaIndisponivel(`Ollama: ${dados.error}`);
  }
  if (!dados.embeddings || dados.embeddings.length === 0) {
    throw new OllamaIndisponivel("Ollama respondeu 200 sem nenhum vetor em `embeddings` — valide o CONTEÚDO, não só o status");
  }
  return dados.embeddings;
}

/** Vetoriza UM texto (tipicamente a pergunta do usuário). */
export async function vetorizar(texto: string, opcoes: OpcoesOllama = {}): Promise<number[]> {
  const [vetor] = await chamarApiEmbed(texto, opcoes);
  if (!vetor || vetor.length === 0) {
    throw new OllamaIndisponivel("Ollama devolveu um vetor vazio para o texto enviado");
  }
  return vetor;
}

/**
 * Vetoriza vários textos numa única chamada (tipicamente os pedaços de um
 * documento). A ordem do resultado é a MESMA ordem de `textos` — contrato
 * do próprio Ollama, confirmado nesta máquina (ver docstring do módulo).
 *
 * `[]` devolve `[]` sem chamar a rede — lote vazio não é erro, é "nada a
 * vetorizar".
 */
export async function vetorizarLote(textos: string[], opcoes: OpcoesOllama = {}): Promise<number[][]> {
  if (textos.length === 0) return [];
  const vetores = await chamarApiEmbed(textos, opcoes);
  if (vetores.length !== textos.length) {
    throw new OllamaIndisponivel(
      `Ollama devolveu ${vetores.length} vetor(es) para ${textos.length} texto(s) — contrato de ordem quebrado`
    );
  }
  return vetores;
}

/**
 * `true` se o Ollama respondeu (qualquer resposta HTTP, mesmo erro) dentro
 * de `timeoutMs`. Usada pra PULAR (não falhar) os testes que dependem de
 * rede real quando esta máquina não tem o servidor de pé — mesmo padrão de
 * `temPython()` em `lib/sem-dado-pessoal-no-repo.test.ts`, só que
 * assíncrona porque a checagem é de rede, não de processo local.
 */
export async function ollamaDisponivel(opcoes: OpcoesOllama = {}): Promise<boolean> {
  const baseUrl = opcoes.baseUrl ?? OLLAMA_BASE_URL;
  try {
    const resp = await fetch(`${baseUrl}/api/version`, { signal: AbortSignal.timeout(opcoes.timeoutMs ?? 2_000) });
    return resp.ok;
  } catch {
    return false;
  }
}
