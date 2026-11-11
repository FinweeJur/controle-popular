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
 * ═══ OLLAMA FORA + ORÇAMENTO DE TEMPO (10/11/2026) ═══
 *
 * `POST /api/chatbot` ficou mais de 44 s pendurado com `/api/saude` de pé
 * (medido duas vezes): o container do Azure não alcança o Ollama em
 * `172.18.176.1:11434`, e cada tentativa de vetorização/geração gastava
 * 30-60 s. Decisão:
 *
 * - O caminho do chatbot NÃO importa `ollama.ts`. Sem `EMBED_API_KEY` a
 *   busca do acervo degrada para LEXICAL (`soLexical`), que é CPU e custa
 *   milissegundos; a geração usa os provedores remotos de `provedores.ts`
 *   (GLM grátis -> Maritaca -> DeepSeek -> Ling).
 * - A recuperação tem orçamento próprio (`TIMEOUT_BUSCA_MS`); se estourar,
 *   o ranking é refeito só-lexical, sem rede.
 * - A geração tem timeout por provedor (`geracao.ts`, 15 s padrão,
 *   sobrescrevível) e o caminho inteiro tem teto (`ORCAMENTO_RAG_MS`). Se
 *   falhar ou estourar, a resposta é `responderSemModelo`: 200, ressalva,
 *   as fontes encontradas e a frase honesta de que o texto não foi gerado.
 *
 * O teto público do endpoint (`ORCAMENTO_CHATBOT_MS`) é aplicado de novo no
 * route — defesa em profundidade: nenhuma espera de rede passa de ~25 s.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { montarAcervo, frenteDaRota, type AcervoFonte } from "../acervo";
import { verificarCitacao, rotuloVerificacao } from "../verificador-citacao";
import { temChaveEmbed, vetorizarRemoto, vetorizarLoteRemoto, EMBED_MODEL_PADRAO } from "./remoto";
import { similaridadeCosseno, similaridadeLexical, tokensDe } from "./similaridade";
import { gerarRespostaRag, type RespostaRag, type FonteRag } from "./geracao";
import { buscarDocumentos, indiceDocumentosPronto, aquecerIndiceDocumentos } from "../documentos-rag/carregar";
import { urlDoTrecho } from "../documentos-rag/indice";
import type { ResultadoDocumento } from "../documentos-rag/tipos";

export type { RespostaRag, FonteRag };

/**
 * Teto do endpoint `/api/chatbot`, do começo ao JSON: ~25 s. Env
 * `CHATBOT_ORCAMENTO_MS` ajusta sem deploy (usada nos testes de degradação).
 */
export const ORCAMENTO_CHATBOT_MS = inteiroPositivo(process.env.CHATBOT_ORCAMENTO_MS, 25_000);
/** Teto interno do pipeline RAG — 4 s de folga para parse e serialização. */
const ORCAMENTO_RAG_MS = inteiroPositivo(process.env.RAG_ORCAMENTO_MS, 21_000);
/** Orçamento da recuperação (acervo + documentos): rede de embedding. */
const TIMEOUT_BUSCA_MS = 8_000;

/** Env numérica positiva; qualquer outro valor cai no padrão. */
function inteiroPositivo(bruto: string | undefined, padrao: number): number {
  const valor = Number(bruto);
  return Number.isFinite(valor) && valor >= 500 ? valor : padrao;
}

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
/**
 * Atraso do aquecimento do índice documental (44 MB, ~21 mil trechos) depois
 * do primeiro pedido. Medido em 10/11/2026: a construção custa dezenas de
 * segundos de CPU SÍNCRONA — tempo que nenhum timeout corta e que, no meio
 * de uma requisição, derrubava o orçamento de 25 s do chatbot. O chatbot
 * responde sem documentos até o índice estar quente; depois, cada consulta
 * custa ~200 ms.
 */
const AQUECIMENTO_DOCUMENTOS_MS = 60_000;

let aquecimentoAgendado = false;

/** Agenda o aquecimento UMA vez, longe do caminho da requisição. */
function agendarAquecimentoDocumentos(): void {
  if (aquecimentoAgendado) return;
  aquecimentoAgendado = true;
  const timer = setTimeout(() => aquecerIndiceDocumentos(), AQUECIMENTO_DOCUMENTOS_MS) as unknown as {
    unref?: () => void;
  };
  // Não segura o processo (testes e `next start` encerram normalmente).
  timer.unref?.();
}

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
  /** Timeout da GERAÇÃO, em ms, por provedor. Padrão de `geracao.ts` (15 s). */
  timeoutMs?: number;
  /** Teto de tempo do pipeline inteiro, em ms (padrão `ORCAMENTO_RAG_MS`). */
  orcamentoMs?: number;
  /** Teto da recuperação (embedding da pergunta + documentos). */
  timeoutBuscaMs?: number;
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

/** Vetores pré-calculados no build (`scripts/gerar-embeddings-acervo.mts`). */
const CAMINHO_EMBED = path.join(process.cwd(), "data", "acervo-embeddings.json");

/** Modelo de embedding em uso agora: remoto se há chave, senão Ollama. */
function modeloEmbedAtual(): string {
  if (temChaveEmbed()) return process.env.EMBED_MODEL || EMBED_MODEL_PADRAO;
  return process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
}

/**
 * Carrega os vetores do arquivo, se ele existir e for do MESMO modelo.
 * Modelo diferente = `null`, e a indexação volta a vetorizar: comparar vetores
 * de espaços diferentes daria similaridade sem sentido.
 */
function vetoresPrecalculados(fontes: AcervoFonte[], modelo: string): number[][] | null {
  if (!existsSync(CAMINHO_EMBED)) return null;
  try {
    const bruto = JSON.parse(readFileSync(CAMINHO_EMBED, "utf8")) as {
      modelo?: string;
      pecas?: Record<string, string>;
    };
    if (bruto.modelo !== modelo || !bruto.pecas) return null;
    const vetores: number[][] = [];
    for (const fonte of fontes) {
      const codificado = bruto.pecas[fonte.id];
      if (!codificado) return null;
      const bytes = Buffer.from(codificado, "base64");
      const vetor = new Array<number>(bytes.length);
      for (let i = 0; i < bytes.length; i += 1) vetor[i] = (bytes[i] - 128) / 127;
      vetores.push(vetor);
    }
    return vetores;
  } catch {
    return null;
  }
}

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
  indiceLexicalMemo = null;
}

/**
 * Vetoriza UM texto pela API remota (SiliconFlow). Sem `EMBED_API_KEY` não
 * existe vetorização no caminho do chatbot: o Ollama local saiu (o container
 * do Azure não o alcança) e a busca degrada para lexical.
 */
async function vetorizarTexto(texto: string, timeoutMs?: number): Promise<number[]> {
  if (!temChaveEmbed()) {
    throw new Error("Sem EMBED_API_KEY: busca do acervo em modo lexical");
  }
  return vetorizarRemoto(texto, { timeoutMs });
}

/** Mesma escolha para lote (indexação do acervo). */
async function vetorizarTextos(textos: string[], timeoutMs?: number): Promise<number[][]> {
  if (!temChaveEmbed()) {
    throw new Error("Sem EMBED_API_KEY: indexação vetorial indisponível");
  }
  return vetorizarLoteRemoto(textos, { timeoutMs });
}

async function indexarAcervo(): Promise<IndiceAcervo> {
  if (indiceEmMemoria) return indiceEmMemoria;
  const fontes = montarAcervo();
  const precalculado = vetoresPrecalculados(fontes, modeloEmbedAtual());
  if (precalculado) {
    indiceEmMemoria = { fontes, vetores: precalculado, pesoToken: construirPesoToken(fontes) };
    return indiceEmMemoria;
  }
  const textos = fontes.map((f) => f.texto);
  const vetores: number[][] = [];
  for (let i = 0; i < textos.length; i += LOTE_EMBED) {
    const lote = textos.slice(i, i + LOTE_EMBED);
    // ORDEM preservada por lote — contrato da API OpenAI-compat; concatenar
    // por lote mantém o índice alinhado às fontes.
    vetores.push(...(await vetorizarTextos(lote, TIMEOUT_INDEXACAO_MS)));
  }
  indiceEmMemoria = { fontes, vetores, pesoToken: construirPesoToken(fontes) };
  return indiceEmMemoria;
}

/** Índice só-lexical, em cache: `montarAcervo()` custa CPU e não muda entre
 *  requisições. É o caminho padrão quando não há `EMBED_API_KEY` e também o
 *  plano B quando a vetorização estoura o orçamento. */
let indiceLexicalMemo: IndiceAcervo | null = null;

function indiceLexical(): IndiceAcervo {
  if (indiceLexicalMemo) return indiceLexicalMemo;
  const fontes = montarAcervo();
  indiceLexicalMemo = {
    fontes,
    vetores: fontes.map(() => [] as number[]),
    pesoToken: construirPesoToken(fontes),
  };
  return indiceLexicalMemo;
}

/**
 * Índice para a busca: vetorial quando há `EMBED_API_KEY`, lexical em todo o
 * resto (sem chave, erro ou modelo que não bate). O score no modo lexical
 * usa só o Jaccard, na mesma escala 0–1, então o limiar de abstenção segue
 * valendo — nenhum dado é inventado, e o leitor vê as fontes mesmo assim.
 */
async function indiceOuLexical(): Promise<{ indice: IndiceAcervo; soLexical: boolean }> {
  if (indiceEmMemoria) return { indice: indiceEmMemoria, soLexical: false };
  if (!temChaveEmbed()) return { indice: indiceLexical(), soLexical: true };
  try {
    return { indice: await indexarAcervo(), soLexical: false };
  } catch {
    return { indice: indiceLexical(), soLexical: true };
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

/** Opções da busca no acervo. */
export interface OpcoesBusca {
  /** Timeout da vetorização da pergunta (rede). */
  timeoutVetorizacaoMs?: number;
  /** Força o ranking só-lexical — caminho de resgate quando o vetorial
   *  estourou o orçamento. Não toca a rede. */
  soLexical?: boolean;
}

/** Rankeia o acervo por cosseno ⊕ lexical (ou só lexical, sem embeddings),
 *  do mais para o menos parecido. Considera rota/página atual como boost de relevância. */
export async function buscarNoAcervo(
  pergunta: string,
  topK?: number,
  limiar?: number,
  pathname?: string,
  opcoesBusca: OpcoesBusca = {}
): Promise<{ melhores: ResultadoBusca[]; abstem: boolean }> {
  const base = opcoesBusca.soLexical
    ? { indice: indiceLexical(), soLexical: true }
    : await indiceOuLexical();
  const { indice } = base;
  let soLexical = base.soLexical;

  // Sem embeddings não há vetor da pergunta, e `similaridadeCosseno` com
  // vetores vazios seria ruído. Se a vetorização falhar ou estourar, a
  // busca CONTINUA em modo lexical — degradação, nunca erro para o leitor.
  let vetorPergunta: number[] = [];
  if (!soLexical) {
    try {
      vetorPergunta = await vetorizarTexto(pergunta, opcoesBusca.timeoutVetorizacaoMs);
    } catch {
      soLexical = true;
    }
  }
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

/** Prazo do orçamento estourado — distinto de falha do provedor de IA. */
export class PrazoEsgotado extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "PrazoEsgotado";
  }
}

/**
 * Corrida com prazo: resolve/rejeita com `promessa`, ou rejeita com
 * `PrazoEsgotado` quando `ms` vence. O timer é sempre limpo, e a rejeição
 * tardia da promessa original tem handler — não vira `unhandledRejection`.
 */
export function comPrazo<T>(promessa: Promise<T>, ms: number, rotulo = "operacao"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new PrazoEsgotado(`${rotulo} passou do prazo de ${Math.max(1, ms)} ms`)),
      Math.max(1, ms)
    );
    promessa.then(
      (valor) => {
        clearTimeout(timer);
        resolve(valor);
      },
      (erro) => {
        clearTimeout(timer);
        reject(erro);
      }
    );
  });
}

/**
 * Resposta honesta quando o modelo NÃO gerou o texto.
 *
 * Não afirma número, data nem conclusão: só diz o que aconteceu e devolve as
 * fontes que existirem, cada uma com título e link. `textoGeradoPorModelo:
 * false` é o campo que a UI (e a auditoria) usam para não anunciar "texto
 * gerado por IA" num texto que não foi.
 *
 * Exportada para teste — é o coração da degradação, não um detalhe do route.
 */
export function responderSemModelo(
  fontes: FonteRag[] = [],
  motivo = "geracao-indisponivel"
): RespostaRag {
  return {
    resposta:
      fontes.length > 0
        ? "Não consegui gerar o texto agora. As fontes que encontrei estão abaixo."
        : "Não consegui gerar o texto agora e não encontrei fonte no acervo para esta pergunta.",
    fontes,
    modelo: "sem-modelo",
    data: new Date().toISOString().slice(0, 10),
    ressalva: true,
    textoGeradoPorModelo: false,
    motivoDegradacao: motivo,
  };
}

/**
 * Responde uma pergunta sobre o acervo do portal. Quando a pergunta não é
 * coberta pelos degraus 0–2 (navegação, busca, composição determinística),
 * o RAG tenta responder a partir do acervo indexado — e abstém se não achar.
 *
 * NUNCA depende de Ollama: sem `EMBED_API_KEY` a busca é lexical; a geração
 * usa os provedores remotos (GLM grátis -> Maritaca -> DeepSeek -> Ling).
 *
 * Orçamento: `timeoutBuscaMs` para a recuperação e `orcamentoMs` para o
 * pipeline inteiro. Geração fora do ar ou prazo estourado devolve
 * `responderSemModelo(fontes)` — 200, com as fontes e a frase honesta — em
 * vez de erro. Só o caminho de busca nunca lança: qualquer falha vira
 * ranking lexical.
 */
export async function responderComRag(
  pergunta: string,
  opcoes: OpcoesRag = {}
): Promise<RespostaRag> {
  const inicio = Date.now();
  const orcamentoMs = opcoes.orcamentoMs ?? ORCAMENTO_RAG_MS;
  const restanteMs = () => Math.max(200, orcamentoMs - (Date.now() - inicio));

  const perguntaDocumentos = opcoes.perguntaBusca?.trim() || pergunta;
  const timeoutBusca = Math.min(opcoes.timeoutBuscaMs ?? TIMEOUT_BUSCA_MS, restanteMs());

  // Documentos só com o índice JÁ quente: construir do zero custa dezenas de
  // segundos de CPU síncrona (ver AQUECIMENTO_DOCUMENTOS_MS). Frio, o
  // chatbot responde com os cartões curados e agenda o aquecimento.
  const documentosProntos = indiceDocumentosPronto();
  if (!documentosProntos) agendarAquecimentoDocumentos();

  // 1. Recuperação com prazo. Se o caminho vetorial (ou o índice documental)
  //    estourar, o resgate é só-lexical: CPU pura, entrega fontes de verdade.
  let busca: Awaited<ReturnType<typeof buscarNoAcervo>> = { melhores: [], abstem: true };
  let documentos: ResultadoDocumento[] = [];
  try {
    const [acervo, docs] = await comPrazo(
      Promise.all([
        buscarNoAcervo(pergunta, opcoes.topK, opcoes.limiarAbstencao, opcoes.pathname, {
          timeoutVetorizacaoMs: timeoutBusca,
        }),
        documentosProntos
          ? buscarDocumentos(perguntaDocumentos, { limite: TOP_K_DOCUMENTOS }).catch(
              () => [] as ResultadoDocumento[]
            )
          : Promise.resolve([] as ResultadoDocumento[]),
      ]),
      timeoutBusca,
      "busca no acervo"
    );
    busca = acervo;
    documentos = docs;
  } catch (e) {
    console.warn(
      `[rag] busca estourou ${timeoutBusca} ms; seguindo só-lexical: ${e instanceof Error ? e.message : String(e)}`
    );
    try {
      busca = await buscarNoAcervo(
        pergunta,
        opcoes.topK,
        opcoes.limiarAbstencao,
        opcoes.pathname,
        { soLexical: true }
      );
    } catch {
      busca = { melhores: [], abstem: true };
    }
  }

  const fontesAcervo = busca.abstem
    ? []
    : busca.melhores.map((r, i) => converterFonte(r.fonte, r.score, i + 1));
  const documentosRelevantes = documentos.filter((d) => d.score >= 0.12);
  const fontesDocumentos = documentosRelevantes.map((d, i) =>
    converterDocumento(d, fontesAcervo.length + i + 1)
  );
  const fontes = [...fontesAcervo, ...fontesDocumentos].slice(0, MAX_FONTES);

  if (fontes.length === 0) {
    // Sem fonte, sem modelo: a resposta honesta sai instantânea e gratuita.
    return gerarRespostaRag(pergunta, [], { modelo: opcoes.modeloChat });
  }  // 2. Geração com prazo. Falha de provedor, falta de chave ou estouro do
  //    orçamento degradam com as fontes — nunca 500, nunca texto inventado.
  const timeoutGeracao = opcoes.timeoutMs;
  try {
    return await comPrazo(
      gerarComVerificacao(pergunta, fontes, opcoes.modeloChat, timeoutGeracao),
      restanteMs(),
      "geracao da resposta"
    );
  } catch (e) {
    console.warn(
      `[rag] sem modelo; devolvendo fontes: ${e instanceof Error ? e.message : String(e)}`
    );
    return responderSemModelo(
      fontes,
      e instanceof PrazoEsgotado ? "orcamento-esgotado" : "geracao-falhou"
    );
  }
}
