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

import { montarAcervo, frenteDaRota, type AcervoFonte } from "../acervo";
import { verificarCitacao, rotuloVerificacao } from "../verificador-citacao";
import { vetorizar, vetorizarLote, ollamaDisponivel, OllamaIndisponivel } from "./ollama";
import { temChaveEmbed, vetorizarRemoto, vetorizarLoteRemoto } from "./remoto";
import { similaridadeCosseno, similaridadeLexical, tokensDe } from "./similaridade";
import { gerarRespostaRag, type RespostaRag, type FonteRag } from "./geracao";
import { temChaveRemota } from "./provedores";
import { buscarDocumentos } from "../documentos-rag/carregar";
import { urlDoTrecho } from "../documentos-rag/indice";
import type { ResultadoDocumento } from "../documentos-rag/tipos";

export type { RespostaRag, FonteRag };

const TOP_K_PADRAO = 3;
/** Abaixo disso o top-1 é ruído — abstém (regra "não sei honesto"). */
const LIMIAR_ABSTENCAO_PADRAO = 0.10;
/**
 * Piso de abstenção no modo SÓ-LEXICAL (sem embeddings): o ranking lexical é
 * mais cru e superestima pergunta fora do escopo por causa de palavra comum.
 * Medido no golden set (R4, 30/09/2026): perguntas fora do escopo param em
 * ~0,40 e as dentro do escopo ficam acima de ~0,50 — daí o piso em 0,45.
 */
const LIMIAR_ABSTENCAO_LEXICAL = 0.45;
/**
 * Bônus das fontes `macro:` — resumos curados do portal. Aplicado só quando a
 * cobertura lexical já é alta (>= 0,5), para a síntese vencer um documento
 * primário parecido sem promover cartão que não responde à pergunta.
 */
const BONUS_MACRO = 0.12;
const PESO_COSSENO = 0.6;
const PESO_LEXICAL = 0.4;
const MAX_TENTATIVAS = 2;
/** Trechos documentais entram depois dos cartões curados; o limite evita prompt gigante. */
const TOP_K_DOCUMENTOS = 3;
const MAX_FONTES = 6;

export interface OpcoesRag {
  topK?: number;
  modeloChat?: string;
  modeloEmbed?: string;
  limiarAbstencao?: number;
  /** Rota da página onde o usuário está (ex: /ambiental/licenciamento), para priorizar contexto. */
  pathname?: string;
  /** Título da página atual. */
  titulo?: string;
  /** Pergunta pura para buscar DOCUMENTOS. O cartão pode usar a pergunta
   *  enriquecida com repasses; o texto extra não deve diluir o retrieval. */
  perguntaBusca?: string;
  /** Timeout da GERAÇÃO, em ms — o padrão de `geracao.ts` é 60 s; suba para
   *  modelos 7B em máquina lenta (medido em 31/08: 3B passou de 60 s com o
   *  servidor carregado). */
  timeoutMs?: number;
}

interface IndiceAcervo {
  fontes: AcervoFonte[];
  vetores: number[][];
  /** Peso IDF de cada termo, calculado sobre o acervo. */
  pesoToken: (t: string) => number;
}

/**
 * Peso IDF por termo, sobre o acervo inteiro: termo que aparece em muitos
 * pedaços pesa menos, termo raro pesa mais. É o que impede uma pergunta fora
 * do escopo de pontuar alto por causa de uma palavra comum ("receita",
 * "cidade"). Calculado uma vez por índice.
 */
function construirPesoToken(fontes: AcervoFonte[]): (t: string) => number {
  const df = new Map<string, number>();
  for (const f of fontes) {
    const unicos = new Set(tokensDe(`${f.titulo} ${f.texto}`));
    for (const t of unicos) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const N = fontes.length || 1;
  const padrao = Math.log(1 + N);
  return (t: string) => (df.has(t) ? Math.log(1 + N / (1 + df.get(t)!)) : padrao);
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

/**
 * Vetoriza UM texto: API remota (SiliconFlow) se `EMBED_API_KEY` existir,
 * senão Ollama local. No Guara Starter o Ollama não cabe (256 MB de teto,
 * medido 23/09) — lá só o caminho remoto funciona; no home-pc o Ollama
 * continua de graça.
 */
async function vetorizarTexto(texto: string, timeoutMs?: number): Promise<number[]> {
  if (temChaveEmbed()) return vetorizarRemoto(texto, { timeoutMs });
  return vetorizar(texto, { timeoutMs });
}

/** Mesma escolha para lote (indexação do acervo). */
async function vetorizarTextos(textos: string[], timeoutMs?: number): Promise<number[][]> {
  if (temChaveEmbed()) return vetorizarLoteRemoto(textos, { timeoutMs });
  return vetorizarLote(textos, { timeoutMs });
}

async function indexarAcervo(): Promise<IndiceAcervo> {
  if (indiceEmMemoria) return indiceEmMemoria;
  const fontes = montarAcervo();
  const textos = fontes.map((f) => f.texto);
  const vetores: number[][] = [];
  for (let i = 0; i < textos.length; i += LOTE_EMBED) {
    const lote = textos.slice(i, i + LOTE_EMBED);
    // ORDEM preservada por lote — contrato do Ollama e da API OpenAI-compat;
    // concatenar por lote mantém o índice alinhado às fontes.
    vetores.push(...(await vetorizarTextos(lote, TIMEOUT_INDEXACAO_MS)));
  }
  indiceEmMemoria = { fontes, vetores, pesoToken: construirPesoToken(fontes) };
  return indiceEmMemoria;
}

/** Índice só-lexical: quando o Ollama (embeddings) está fora e há chave
 *  remota de geração, o RAG degrada em vez de faltar — ranqueia por
 *  similaridade lexical (Jaccard) e deixa o provedor remoto gerar. O
 *  cosseno entra valendo zero; o score híbrido despenca para o lexical.
 *  Pior que a busca vetorial, mas melhor do que devolver 503 com as
 *  chaves de geração vivas — e é transparente ao leitor (nenhum dado
 *  inventado: a abstenção continua valendo pelo mesmo limiar). */

async function indiceOuLexical(): Promise<{ indice: IndiceAcervo; soLexical: boolean }> {
  if (indiceEmMemoria) return { indice: indiceEmMemoria, soLexical: false };
  if (!temChaveEmbed() && !(await ollamaDisponivel())) {
    const fontes = montarAcervo();
    return {
      indice: { fontes, vetores: fontes.map(() => []), pesoToken: construirPesoToken(fontes) },
      soLexical: true,
    };
  }
  try {
    return { indice: await indexarAcervo(), soLexical: false };
  } catch {
    const fontes = montarAcervo();
    return {
      indice: { fontes, vetores: fontes.map(() => []), pesoToken: construirPesoToken(fontes) },
      soLexical: true,
    };
  }
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

/**
 * Bônus de síntese: as fontes `macro:` são os resumos curados do próprio
 * portal. Quando cobrem a pergunta, respondem melhor que um documento
 * primário isolado — sem isso, um acervo com muitas ementas parecidas
 * (caso do TJES sobre Mariana) enterra o resumo que o leitor procura.
 */
function comBonusMacro(lexical: number, idFonte: string): number {
  if (lexical < 0.5 || !idFonte.startsWith("macro:")) return lexical;
  return Math.min(1, lexical + BONUS_MACRO);
}

/** A fonte é a própria rota onde o leitor está (ou está dentro dela)? */
function mesmaRota(fonte: AcervoFonte, pathname: string | undefined): boolean {
  if (!pathname) return false;
  if (fonte.rota === pathname) return true;
  if (pathname === "/") return false;
  return fonte.rota.startsWith(pathname) || pathname.startsWith(fonte.rota);
}

/** A fonte pertence à frente da tela atual? */
function mesmaFrente(fonte: AcervoFonte, frenteRotaAtual: string): boolean {
  if (!frenteRotaAtual) return false;
  return (
    fonte.frente === frenteRotaAtual ||
    frenteDaRota(fonte.rota) === frenteRotaAtual
  );
}

/** Ajusta o lexical pela rota ou frente em que o leitor está. */
function comAfinidadeDeRota(
  lexical: number,
  fonte: AcervoFonte,
  pathname: string | undefined,
  frenteRotaAtual: string
): number {
  if (mesmaRota(fonte, pathname)) return Math.min(1.0, lexical + 0.15);
  if (mesmaFrente(fonte, frenteRotaAtual)) return Math.min(1.0, lexical + 0.08);
  return lexical;
}

/** Contexto comum da pontuação de cada fonte. */
interface ContextoPontuacao {
  pergunta: string;
  vetorPergunta: number[];
  pesoToken: (t: string) => number;
  soLexical: boolean;
  pathname?: string;
  frenteRotaAtual: string;
}

/** Pontua uma fonte: cosseno, lexical, bônus de síntese e afinidade de rota. */
function pontuarFonte(
  fonte: AcervoFonte,
  vetorFonte: number[],
  ctx: ContextoPontuacao
): ResultadoBusca {
  const cosseno = ctx.soLexical
    ? 0
    : similaridadeCosseno(ctx.vetorPergunta, vetorFonte);
  const bruto = similaridadeLexical(
    ctx.pergunta,
    `${fonte.titulo} ${fonte.texto}`,
    ctx.pesoToken
  );
  const lexical = comAfinidadeDeRota(
    comBonusMacro(bruto, fonte.id),
    fonte,
    ctx.pathname,
    ctx.frenteRotaAtual
  );
  // Só-lexical: score na MESMA escala do híbrido (0–1) para que o limiar de
  // abstenção continue significando o que sempre significou.
  const score = ctx.soLexical ? lexical : scoreHibrido(cosseno, lexical);
  return { fonte, cosseno, lexical, score };
}

/** Rankeia o acervo por cosseno ⊕ lexical (ou só lexical, sem embeddings),
 *  do mais para o menos parecido. Considera rota/página atual como boost de relevância. */
export async function buscarNoAcervo(
  pergunta: string,
  topK?: number,
  limiar?: number,
  pathname?: string
): Promise<{ melhores: ResultadoBusca[]; abstem: boolean }> {
  const { indice, soLexical } = await indiceOuLexical();
  // Só-lexical não chama `vetorizar`: sem provedor de embedding (Ollama ou
  // API remota) não há embedding da pergunta, e `similaridadeCosseno` com
  // vetores vazios seria ruído.
  const vetorPergunta = soLexical ? [] : await vetorizarTexto(pergunta);
  const frenteRotaAtual = pathname ? frenteDaRota(pathname) : "";

  const contexto: ContextoPontuacao = {
    pergunta,
    vetorPergunta,
    pesoToken: indice.pesoToken,
    soLexical,
    pathname,
    frenteRotaAtual,
  };

  const ranqueados: ResultadoBusca[] = indice.fontes
    .map((fonte, i) => pontuarFonte(fonte, indice.vetores[i], contexto))
    .sort((a, b) => b.score - a.score);

  const k = topK ?? TOP_K_PADRAO;
  const melhores = ranqueados.slice(0, k);
  const limiarReal = limiar ?? (soLexical ? LIMIAR_ABSTENCAO_LEXICAL : LIMIAR_ABSTENCAO_PADRAO);
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

/** Converte trecho de PDF em fonte citável, com página e link oficial. */
function converterDocumento(resultado: ResultadoDocumento, posicao: number): FonteRag {
  const trecho = resultado.trecho;
  return {
    indice: posicao,
    texto: trecho.texto,
    score: resultado.score,
    titulo: `Documento: ${trecho.titulo}`,
    url: urlDoTrecho(trecho),
    rota: urlDoTrecho(trecho),
    pagina: trecho.pagina > 0 ? trecho.pagina : undefined,
    documentoId: trecho.docId,
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
  // Sem chave de geração E sem embeddings remotos, precisamos do Ollama
  // local (geração + vetorização). Com chave remota de geração mas sem
  // Ollama nem `EMBED_API_KEY`, o índice degrada para lexical em vez de
  // 503 (ramo de `indiceOuLexical`).
  if (!temChaveRemota() && !temChaveEmbed() && !(await ollamaDisponivel())) {
    throw new OllamaIndisponivel("Ollama nao esta disponivel em http://172.18.176.1:11434");
  }

  const perguntaDocumentos = opcoes.perguntaBusca?.trim() || pergunta;
  const [{ melhores, abstem }, documentos] = await Promise.all([
    buscarNoAcervo(pergunta, opcoes.topK, opcoes.limiarAbstencao, opcoes.pathname),
    buscarDocumentos(perguntaDocumentos, { limite: TOP_K_DOCUMENTOS }).catch(() => []),
  ]);

  const fontesAcervo = abstem
    ? []
    : melhores.map((r, i) => converterFonte(r.fonte, r.score, i + 1));
  const documentosRelevantes = documentos.filter((d) => d.score >= 0.12);
  const fontesDocumentos = documentosRelevantes.map((d, i) =>
    converterDocumento(d, fontesAcervo.length + i + 1)
  );
  const fontes = [...fontesAcervo, ...fontesDocumentos].slice(0, MAX_FONTES);

  if (fontes.length === 0) {
    // Sem fonte, sem modelo: a resposta honesta sai instantânea e gratuita.
    return gerarRespostaRag(pergunta, [], { modelo: opcoes.modeloChat });
  }

  return gerarComVerificacao(pergunta, fontes, opcoes.modeloChat, opcoes.timeoutMs);
}
