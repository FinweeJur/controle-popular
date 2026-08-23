/**
 * Pipeline completo de RAG local: pergunta -> busca por similaridade ->
 * geracao de resposta com citacao.
 *
 * Esta e a camada de orquestracao do laboratorio L4 do chatbot. Reutiliza
 * `demonstracao.ts` (indice de exemplo sobre normas federais ambientais),
 * `ollama.ts` (vetorizacao), `similaridade.ts` (ranking) e `geracao.ts`
 * (resposta por LLM local).
 *
 * Como tudo depende do Ollama local, a funcao publica verifica disponibilidade
 * e retorna um erro amigavel quando o servidor nao esta de pe — a mesma
 * disciplina de `ollamaDisponivel()`.
 */

import { indexarDocumentoDeExemplo, buscarMaisSimilar, type ResultadoRankeado } from "./demonstracao";
import { gerarRespostaLocal, type RespostaRag, type FonteRag } from "./geracao";
import { ollamaDisponivel, OllamaIndisponivel } from "./ollama";

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
 * o RAG local tenta responder a partir de documentos indexados.
 */
export async function responderComRag(
  pergunta: string,
  opcoes: OpcoesRag = {}
): Promise<RespostaRag> {
  if (!(await ollamaDisponivel())) {
    throw new OllamaIndisponivel("Ollama nao esta disponivel em http://localhost:11434");
  }

  const topK = opcoes.topK ?? TOP_K_PADRAO;
  const indice = await indexarDocumentoDeExemplo();
  const ranking = await buscarMaisSimilar(pergunta, indice);
  const melhores = ranking.slice(0, topK);
  const fontes = converterFontes(melhores);

  return gerarRespostaLocal(pergunta, fontes, {
    modelo: opcoes.modeloChat,
  });
}
