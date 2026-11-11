/**
 * Geracao de resposta por LLM para o pipeline de RAG do chatbot.
 *
 * Escolhe automaticamente o provedor na cascata de `provedores.ts`:
 * GRATIS primeiro (GLM Flash), depois os pagos (Maritaca `sabiazinho-4`,
 * DeepSeek, Ling). Provedor sem chave sai da fila. Se nenhum estiver
 * configurado, lanca `IaIndisponivel` com mensagem clara.
 *
 * ═══ OLLAMA FORA (10/11/2026) ═══
 *
 * O fallback para Ollama local foi removido deste modulo. O container do
 * Azure nao alcanca `172.18.176.1:11434`; cada tentativa esperava 30-60 s e
 * `POST /api/chatbot` ficou mais de 44 s sem responder (medido em
 * 10/11/2026, duas vezes, com `/api/saude` respondendo em ~5 s). O Ollama
 * continua em `ollama.ts` para script de indexacao e laboratorio local, mas
 * nao e importado pelo caminho do chatbot — sem chave remota, a resposta e
 * a degradada honesta de `rag.ts` (`responderSemModelo`), com as fontes.
 *
 * Timeout: 15 s POR PROVEDOR por padrao (env `IA_TIMEOUT_GERACAO_MS`
 * sobrescreve; `opcoes.timeoutMs` sobrescreve por chamada). O teto total do
 * endpoint e do route (`ORCAMENTO_CHATBOT_MS` em `rag.ts`), nao daqui.
 *
 * A resposta E obrigada a citar as fontes do contexto. O prompt inclui a
 * regra explicitamente.
 */

import { listarProvedoresNaOrdem, IaIndisponivel, type ProvedorIa } from "./provedores";
import { sanitizarTextoParaContexto } from "../../seguranca/blindagem-prompt";

interface MensagemChat {
  role: "system" | "user" | "assistant";
  content: string;
}

interface RespostaChatApi {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

export interface FonteRag {
  indice: number;
  texto: string;
  score: number;
  /** Nome da página/fonte para a UI mostrar e para o prompt citar. */
  titulo?: string;
  /** URL da página para a citação [n] abrir/copiar. */
  url?: string;
  /** Rota do portal (mesma `url` quando a fonte é interna). */
  rota?: string;
  /** Página do PDF, quando a fonte é documental. */
  pagina?: number;
  /** Documento de origem, para diagnóstico e deduplicação. */
  documentoId?: string;
}

export interface RespostaRag {
  resposta: string;
  fontes: FonteRag[];
  modelo: string;
  /** Data ISO da geração — a ressalva de IA leva data (regra editorial). */
  data: string;
  /** Sempre `true`: toda resposta IA declara o uso de IA (decisão 4, 22/08). */
  ressalva: true;
  /** Resultado do verificador determinístico de citação (Fase 1). */
  verificacao?: "ok" | "parcial" | "falhou";
  /**
   * `false` quando o texto NAO saiu de um modelo — e a degradacao honesta
   * de `responderSemModelo` (geracao fora ou orcamento estourado). A UI usa
   * isto para nao anunciar "texto gerado por IA" num texto que nao foi.
   */
  textoGeradoPorModelo?: boolean;
  /** Marcador curto do motivo da degradacao, para diagnostico. */
  motivoDegradacao?: string;
}

/**
 * Timeout PADRAO por provedor, em ms. 15 s cabe no orcamento de ~25 s do
 * endpoint com uma tentativa util; env `IA_TIMEOUT_GERACAO_MS` sobrescreve
 * (valor invalido ou abaixo de 1 s e ignorado, para nao derrubar o servico
 * por env mal digitada).
 */
export const TIMEOUT_GERACAO_PADRAO_MS = (() => {
  const bruto = Number(process.env.IA_TIMEOUT_GERACAO_MS);
  return Number.isFinite(bruto) && bruto >= 1_000 ? bruto : 15_000;
})();

const SYSTEM_PROMPT_RAG = `Voce e o Seu Nono, assistente do portal Controle Popular (controlepopular.com.br), um portal civico independente de transparencia publica que republica dado oficial.

Regras rigidas:
- Responda SOMENTE com base no CONTEXTO fornecido abaixo. Nunca invente numeros, nomes, datas, valores ou dispositivos legais.
- Cite a fonte com marcador [n]: depois de cada afirmacao baseada numa fonte, escreva o numero dela entre colchetes. Ex.: "Betim gastou R$ 1,65 bilhao [1]".
- Os marcadores [n] referem-se a lista numerada de fontes do CONTEXTO. Use apenas numeros que existam na lista, e nao repita marcador sem base.
- Se o contexto nao tiver a resposta, diga que nao encontrou esse dado no portal e sugira a pagina de busca. Nao tente adivinhar.
- Nao de opiniao politica nem aconselhamento juridico. Nao acuse ninguem.
- Nao ponha dois dados lado a lado se a conclusao nao estiver na fonte: insinuacao e dano mesmo quando cada dado isolado esta certo.
- Quando usar um numero, diga de onde ele veio, com o marcador [n].
- Cada fonte traz o link oficial no contexto. Ao final, liste as fontes usadas com o link oficial; se houver pagina do PDF, informe a pagina.
- A resposta deve ser curta, direta, em portugues do Brasil.`;

/**
 * Monta o prompt do USUÁRIO (contexto + pergunta). Exportado para teste.
 *
 * O `texto` de cada fonte é higienizado por `sanitizarTextoParaContexto`
 * (blindagem de injeção INDIRETA) ANTES de entrar no prompt, mas isso é feito
 * só na CÓPIA que o modelo lê: o array `fontes` e o `FonteRag.texto` originais
 * ficam intactos, porque esse texto é o que o leitor vê na citação. Sanitizar
 * a fonte inteira apagaria o trecho citado de verdade — o oposto do que o
 * portal promete.
 */
export function montarPromptUsuario(
  pergunta: string,
  fontes: FonteRag[],
  instrucaoExtra?: string
): string {
  const contexto = fontes
    .map((f, i) => {
      const rotulo = f.titulo ? ` (${f.titulo})` : "";
      const trecho = sanitizarTextoParaContexto(f.texto);
      const link = f.url && /^https?:\/\//i.test(f.url) ? `\nURL oficial: ${f.url}` : "";
      const pagina = f.pagina ? `\nPagina: ${f.pagina}` : "";
      return `[Fonte ${i + 1}]${rotulo} (relevancia: ${(f.score * 100).toFixed(1)}%)${link}${pagina}\n${trecho}`;
    })
    .join("\n\n");

  const extra = instrucaoExtra ? `\n\nINSTRUCAO ADICIONAL: ${instrucaoExtra}` : "";
  return `CONTEXTO (dados do portal):\n${contexto}\n\nPERGUNTA: ${pergunta}\n\nResponda com base apenas no contexto. Use marcadores [n] para citar as fontes. Ao final, liste as fontes usadas com o link oficial.${extra}`;
}

function montarMensagens(
  pergunta: string,
  fontes: FonteRag[],
  instrucaoExtra?: string
): MensagemChat[] {
  return [
    { role: "system", content: SYSTEM_PROMPT_RAG },
    { role: "user", content: montarPromptUsuario(pergunta, fontes, instrucaoExtra) },
  ];
}

async function chamarProvedor(
  mensagens: MensagemChat[],
  provedor: ProvedorIa,
  timeoutMs: number
): Promise<string> {
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
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    const causa = e instanceof Error ? e.message : String(e);
    throw new Error(`${provedor.rotulo} não respondeu em ${baseUrl} (${causa})`);
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
 * Tenta os provedores remotos na ordem configurada (ativo -> cascata
 * gratis/pago). Devolve o texto e o ROTULO do provedor que respondeu, para
 * o `modelo` do RespostaRag mostrar quem de fato gerou.
 */
async function chamarApiRemota(
  mensagens: MensagemChat[],
  timeoutMs: number
): Promise<{ texto: string; rotulo: string }> {
  const provedores = listarProvedoresNaOrdem();
  if (provedores.length === 0) {
    throw new IaIndisponivel(
      "Nenhum provedor de IA configurado (ZAI_API_KEY/GLM_API_KEY, AI_API_KEY_MARITACA, AI_API_KEY_DEEPSEEK ou AI_API_KEY_LING)"
    );
  }

  const erros: string[] = [];
  for (const provedor of provedores) {
    try {
      const texto = await chamarProvedor(mensagens, provedor, timeoutMs);
      return { texto, rotulo: provedor.rotulo };
    } catch (e) {
      erros.push(e instanceof Error ? e.message : String(e));
    }
  }
  throw new Error(`Todos os provedores remotos falharam: ${erros.join(" | ")}`);
}

/** Data ISO da geração, para a ressalva de IA. */
function dataDeHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Resposta honesta quando o RAG não achou fonte — sem modelo, sem inventar. */
function respostaSemFontes(modelo: string): RespostaRag {
  return {
    resposta: "Nao encontrei dados diretamente ligados a sua pergunta no acervo indexado.",
    fontes: [],
    modelo,
    data: dataDeHoje(),
    ressalva: true,
    textoGeradoPorModelo: false,
    motivoDegradacao: "sem-fontes",
  };
}

export interface OpcoesGeracaoApi {
  /** Instrucao extra para a re-tentativa de citacao (verificador). */
  instrucaoExtra?: string;
  /** Timeout por provedor, em ms. Padrao: `TIMEOUT_GERACAO_PADRAO_MS`. */
  timeoutMs?: number;
}

/**
 * Gera uma resposta a partir de uma pergunta e das fontes recuperadas por
 * similaridade, usando os provedores remotos na cascata gratis -> pago.
 * Tenta o provedor ativo e, em falha, os demais.
 */
export async function gerarRespostaApi(
  pergunta: string,
  fontes: FonteRag[],
  opcoes: OpcoesGeracaoApi = {}
): Promise<RespostaRag> {
  if (fontes.length === 0) {
    return respostaSemFontes("sem-fontes");
  }

  const mensagens = montarMensagens(pergunta, fontes, opcoes.instrucaoExtra);
  const { texto, rotulo } = await chamarApiRemota(
    mensagens,
    opcoes.timeoutMs ?? TIMEOUT_GERACAO_PADRAO_MS
  );
  return {
    resposta: texto,
    fontes,
    modelo: rotulo,
    data: dataDeHoje(),
    ressalva: true,
    textoGeradoPorModelo: true,
  };
}

/**
 * Gera uma resposta a partir de uma pergunta e das fontes recuperadas por
 * similaridade, usando SEMPRE provedor remoto (nao ha mais fallback local).
 *
 * Sem nenhuma chave configurada lanca `IaIndisponivel` — o chamador decide
 * se degrada com `responderSemModelo` (rag) ou se responde erro.
 */
export async function gerarRespostaRag(
  pergunta: string,
  fontes: FonteRag[],
  opcoes: OpcoesGeracaoApi & { modelo?: string } = {}
): Promise<RespostaRag> {
  return gerarRespostaApi(pergunta, fontes, opcoes);
}
