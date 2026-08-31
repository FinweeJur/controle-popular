/**
 * Pipeline completo de RAG: pergunta -> busca por similaridade ->
 * geracao de resposta com citacao.
 *
 * Esta e a camada de orquestracao do chatbot. Reutiliza `demonstracao.ts`
 * (indice de exemplo sobre normas federais ambientais), `ollama.ts`
 * (vetorizacao), `similaridade.ts` (ranking) e `geracao.ts` (resposta por
 * LLM local ou API remota).
 *
 * O provedor de geracao e escolhido automaticamente por `geracao.ts`:
 * - API remota (DeepSeek/Maritaca/etc.) se `AI_API_KEY` estiver configurada.
 * - Ollama local como fallback.
 *
 * Quando o fallback e Ollama, a funcao verifica disponibilidade e retorna um
 * erro amigavel quando o servidor nao esta de pe.
 */

import { indexarDocumentoDeExemplo, buscarMaisSimilar, type ResultadoRankeado } from "./demonstracao";
import { gerarRespostaRag, type RespostaRag, type FonteRag } from "./geracao";
import { ollamaDisponivel, OllamaIndisponivel } from "./ollama";
import { temChaveRemota } from "./provedores";

export type { RespostaRag, FonteRag };

const TOP_K_PADRAO = 3;

interface OpcoesRag {
  topK?: number;
  modeloChat?: string;
  modeloEmbed?: string;
}

function converterFontes(resultados: ResultadoRankeado[]): FonteRag[] {
  return resultados.map((r) => ({ indice: r.indice, texto: r.texto, score: r.score }));
}

/**
 * Responde uma pergunta usando o documento de exemplo (normas federais
 * ambientais sobre a barragem de Fundao) como acervo.
 *
 * Este e o prototipo do degrau 3 do assistente: quando a pergunta nao e
 * coberta pelos degraus 0-2 (navegacao, busca, composicao deterministica),
 * o RAG tenta responder a partir de documentos indexados.
 */
export async function responderComRag(
  pergunta: string,
  opcoes: OpcoesRag = {}
): Promise<RespostaRag> {
  // Sem chave remota, precisamos do Ollama local para geracao e embeddings.
  if (!temChaveRemota() && !(await ollamaDisponivel())) {
    throw new OllamaIndisponivel("Ollama nao esta disponivel em http://172.18.176.1:11434");
  }

  const topK = opcoes.topK ?? TOP_K_PADRAO;
  const indice = await indexarDocumentoDeExemplo();
  const ranking = await buscarMaisSimilar(pergunta, indice);
  const melhores = ranking.slice(0, topK);
  const fontes = converterFontes(melhores);

  return gerarRespostaRag(pergunta, fontes, {
    modelo: opcoes.modeloChat,
  });
}
