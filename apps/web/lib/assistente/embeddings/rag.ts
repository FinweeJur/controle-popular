/**
 * Pipeline completo de RAG: pergunta -> busca por similaridade ->
 * geracao de resposta com citacao obrigatoria e verificacao deterministica.
 *
 * ═══ O QUE MUDOU (Fase 1 do PLANO-SEU-NONO-NOTEBOOKLM) ═══
 *
 * - O acervo agora é REAL: `montarAcervo()` (`lib/assistente/acervo.ts`)
 *   monta os pedaços a partir das respostas pré-curadas do Seu Nonô, das
 *   sugestões contextuais e dos resumos de páginas — cada pedaço com
 *   `rota`/`fonteUrl`. O corpus de demonstração (`demonstracao.ts`, 4
 *   normas da barragem de Fundão) virou fixture/teste, não o padrão.
 * - Ranking HÍBRIDO: cosseno (embedding) ⊕ lexical (Jaccard de tokens —
 *   o BM25-leve autocontido de `similaridade.ts`), porque o índice BM25 de
 *   verdade (`/busca-indice/**`) só existe quando o home-pc publica o
 *   build com Postgres.
 * - ABSTENÇÃO: top-1 abaixo do limiar devolve o "não encontrei no acervo"
 *   honesto, sem chamar o modelo — a regra do portal: modelo só embrulha,
 *   e fora do acervo a resposta é "não sei, e aqui está o que existe perto".
 * - VERIFICAÇÃO: `verificarCitacao()` confere os marcadores [n] e os
 *   números da resposta contra as fontes; marcador inválido dispara UMA
 *   re-tentativa com instrução mais estrita; o rótulo `verificacao`
 *   ("ok" | "parcial" | "falhou") viaja na resposta para a UI mostrar.
 *
 * O provedor de geracao é escolhido automaticamente por `geracao.ts`:
 * API remota (DeepSeek/Maritaca) se `AI_API_KEY_*` estiver configurada;
 * Ollama local como fallback. Quando o fallback é Ollama, a disponibilidade
 * é checada antes e o erro sai amigável quando o servidor não está de pé.
 */

import { montarAcervo, type AcervoFonte } from "../acervo";
import { verificarCitacao, rotuloVerificacao } from "../verificador-citacao";
import { vetorizar, vetorizarLote, ollamaDisponivel, OllamaIndisponivel } from "./ollama";
import { similaridadeCosseno, similaridadeLexical } from "./similaridade";
import { gerarRespostaRag, type RespostaRag, type FonteRag } from "./geracao";
import { temChaveRemota } from "./provedores";

export type { RespostaRag, FonteRag };

const TOP_K_PADRAO = 3;
/** Abaixo disso o top-1 é ruído — abstém (regra "não sei honesto"). */
const LIMIAR_ABSTENCAO_PADRAO = 0.15;
const PESO_COSSENO = 0.6;
const PESO_LEXICAL = 0.4;
const MAX_TENTATIVAS = 2;

interface OpcoesRag {
  topK?: number;
  modeloChat?: string;
  modeloEmbed?: string;
  limiarAbstencao?: number;
  /** Timeout da GERAÇÃO, em ms — o padrão de `geracao.ts` é 60 s; suba para
   *  modelos 7B em máquina lenta (medido em 31/08: 3B passou de 60 s com o
   *  servidor carregado). */
  timeoutMs?: number;
}

interface IndiceAcervo {
  fontes: AcervoFonte[];
  vetores: number[][];
}

/** Índice vetorial do acervo em memória — indexar custa rede; cache do módulo. */
let indiceEmMemoria: IndiceAcervo | null = null;

/** Tamanho de lote ao vetorizar o acervo: 120 textos de uma vez estourou o
 *  timeout de 30 s do Ollama (medido em 31/08); em lotes de 48 cada chamada
 *  cabe no tempo e o modelo vai esquentando. Número divisível, para o lote
 *  não sobrar quase vazio. */
const LOTE_EMBED = 48;
/** Timeout generoso de indexação: modelo frio + vários lotes. */
const TIMEOUT_INDEXACAO_MS = 180_000;

/** Só para teste: esquece o índice entre casos (mesmo padrão de documentos.ts). */
export function esquecerIndiceAcervo(): void {
  indiceEmMemoria = null;
}

async function indexarAcervo(): Promise<IndiceAcervo> {
  if (indiceEmMemoria) return indiceEmMemoria;
  const fontes = montarAcervo();
  const textos = fontes.map((f) => f.texto);
  const vetores: number[][] = [];
  for (let i = 0; i < textos.length; i += LOTE_EMBED) {
    const lote = textos.slice(i, i + LOTE_EMBED);
    // `vetorizarLote` mantém a ORDEM do array — contrato do próprio Ollama
    // (ver a docstring de `ollama.ts`); concatenar por lote preserva o índice.
    vetores.push(...(await vetorizarLote(lote, { timeoutMs: TIMEOUT_INDEXACAO_MS })));
  }
  indiceEmMemoria = { fontes, vetores };
  return indiceEmMemoria;
}

function scoreHibrido(cosseno: number, lexical: number): number {
  return PESO_COSSENO * cosseno + PESO_LEXICAL * lexical;
}

interface ResultadoBusca {
  fonte: AcervoFonte;
  cosseno: number;
  lexical: number;
  score: number;
}

/** Rankeia o acervo por cosseno ⊕ lexical, do mais para o menos parecido. */
export async function buscarNoAcervo(
  pergunta: string,
  topK?: number,
  limiar?: number
): Promise<{ melhores: ResultadoBusca[]; abstem: boolean }> {
  const indice = await indexarAcervo();
  const vetorPergunta = await vetorizar(pergunta);
  const ranqueados: ResultadoBusca[] = indice.fontes
    .map((fonte, i) => {
      const cosseno = similaridadeCosseno(vetorPergunta, indice.vetores[i]);
      const lexical = similaridadeLexical(pergunta, fonte.texto);
      return { fonte, cosseno, lexical, score: scoreHibrido(cosseno, lexical) };
    })
    .sort((a, b) => b.score - a.score);

  const k = topK ?? TOP_K_PADRAO;
  const melhores = ranqueados.slice(0, k);
  const limiarReal = limiar ?? LIMIAR_ABSTENCAO_PADRAO;
  const abstem = melhores.length === 0 || melhores[0].score < limiarReal;
  return { melhores, abstem };
}

function converterFonte(f: AcervoFonte, score: number, posicao: number): FonteRag {
  return {
    indice: posicao,
    texto: f.texto,
    score,
    titulo: f.titulo,
    url: f.fonteUrl,
    rota: f.rota,
  };
}

/**
 * Gera com verificação de citação: marcador [n] inválido dispara UMA
 * re-tentativa com instrução mais estrita (o verificador nunca é portão
 * duro para números — só para citação para lugar nenhum).
 */
async function gerarComVerificacao(
  pergunta: string,
  fontes: FonteRag[],
  modeloChat?: string,
  timeoutMs?: number
): Promise<RespostaRag> {
  const opcoesGeracao = { modelo: modeloChat, timeoutMs };
  let resposta = await gerarRespostaRag(pergunta, fontes, opcoesGeracao);

  for (let tentativa = 1; tentativa < MAX_TENTATIVAS; tentativa++) {
    const v = verificarCitacao(resposta.resposta, fontes, pergunta);
    if (v.ok) {
      resposta.verificacao = rotuloVerificacao(v);
      return resposta;
    }
    resposta = await gerarRespostaRag(pergunta, fontes, {
      ...opcoesGeracao,
      instrucaoExtra:
        "A resposta anterior citou marcadores [n] que nao existem na lista de fontes. " +
        "Use APENAS os numeros das fontes fornecidas no CONTEXTO, de 1 a " +
        `${fontes.length}, e cite cada afirmacao com o marcador correto.`,
    });
  }

  const v = verificarCitacao(resposta.resposta, fontes, pergunta);
  resposta.verificacao = rotuloVerificacao(v);
  return resposta;
}

/**
 * Responde uma pergunta sobre o acervo do portal. Quando a pergunta não é
 * coberta pelos degraus 0–2 (navegação, busca, composição determinística),
 * o RAG tenta responder a partir do acervo indexado — e abstém se não achar.
 */
export async function responderComRag(
  pergunta: string,
  opcoes: OpcoesRag = {}
): Promise<RespostaRag> {
  // Sem chave remota, precisamos do Ollama local para geracao e embeddings.
  if (!temChaveRemota() && !(await ollamaDisponivel())) {
    throw new OllamaIndisponivel("Ollama nao esta disponivel em http://172.18.176.1:11434");
  }

  const { melhores, abstem } = await buscarNoAcervo(
    pergunta,
    opcoes.topK,
    opcoes.limiarAbstencao
  );

  if (abstem) {
    // Sem fonte, sem modelo: a resposta honesta sai instantânea e gratuita.
    return gerarRespostaRag(pergunta, [], { modelo: opcoes.modeloChat });
  }

  const fontes = melhores.map((r, i) => converterFonte(r.fonte, r.score, i + 1));
  return gerarComVerificacao(pergunta, fontes, opcoes.modeloChat, opcoes.timeoutMs);
}
