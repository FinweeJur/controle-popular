/**
 * Embeddings pré-calculados do índice documental do RAG.
 *
 * Por que existe (medido 01/11/2026): a busca documental era só lexical. No
 * gabarito de 30 perguntas, recall@3 ficou em 48,3% — pergunta reescrita com
 * sinônimo não achava o documento ("a quem recorrer" não casa com "Defensoria
 * Pública"). O acervo já usa vetor; o índice documental não usava.
 *
 * Formato: `{ modelo, dim, trechos: { id: base64(int8) } }`. Quantizar em int8
 * não muda o cosseno de forma relevante e reduz ~4x o arquivo. O cosseno é
 * invariante a escala, então `(byte-128)/127` basta — mesma decisão do
 * `acervo-embeddings.json`.
 *
 * Regra de segurança: se o `modelo` do arquivo não bate com o embedder em uso,
 * o arquivo é ignorado. Comparar vetores de espaços diferentes produz
 * similaridade falsa, e similaridade falsa vira citação errada.
 *
 * ═══ SEM OLLAMA (10/11/2026) ═══
 *
 * A pontuação semântica daqui também saiu do Ollama local: o container do
 * Azure não alcança `172.18.176.1:11434` e a espera de 20 s derrubava o
 * endpoint do chatbot. Sem `EMBED_API_KEY` não há vetor da consulta e a
 * busca documental cai no lexical — degradação, nunca erro. O arquivo de
 * vetores gerado no home-pc com `nomic-embed-text` só é usado quando o
 * modelo em uso coincide; com a API remota (bge-m3) ele é ignorado.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { temChaveEmbed, vetorizarRemoto, EMBED_MODEL_PADRAO } from "../embeddings/remoto";

const CAMINHO = path.join(process.cwd(), "data", "documentos-rag-embeddings.json");

/** Modelo de embedding em uso — `null` quando não há vetorização configurada. */
function modeloDeUso(): string | null {
  if (!temChaveEmbed()) return null;
  return process.env.EMBED_MODEL || EMBED_MODEL_PADRAO;
}

interface ArquivoEmbeddings {
  modelo: string;
  dim: number;
  trechos: Record<string, string>;
}

export interface IndiceVetorial {
  modelo: string;
  dim: number;
  vetores: Map<string, Int8Array>;
  normas: Map<string, number>;
}

let cache: IndiceVetorial | null = null;
let tentouCarregar = false;

function decodificar(base64: string): Int8Array {
  const bytes = Buffer.from(base64, "base64");
  const vetor = new Int8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) vetor[i] = bytes[i] - 128;
  return vetor;
}

function norma(vetor: Int8Array): number {
  let soma = 0;
  for (let i = 0; i < vetor.length; i += 1) {
    const valor = vetor[i] / 127;
    soma += valor * valor;
  }
  return Math.sqrt(soma);
}

/** Lê o arquivo uma vez por processo; `null` quando não existe ou não serve. */
export async function carregarIndiceVetorial(): Promise<IndiceVetorial | null> {
  if (tentouCarregar) return cache;
  tentouCarregar = true;
  const modelo = modeloDeUso();
  if (!modelo) return null;
  try {
    const bruto = JSON.parse(await readFile(CAMINHO, "utf8")) as ArquivoEmbeddings;
    if (!bruto?.trechos || bruto.modelo !== modelo) return null;
    const vetores = new Map<string, Int8Array>();
    const normas = new Map<string, number>();
    for (const [id, base64] of Object.entries(bruto.trechos)) {
      const vetor = decodificar(base64);
      vetores.set(id, vetor);
      normas.set(id, norma(vetor));
    }
    cache = { modelo: bruto.modelo, dim: bruto.dim, vetores, normas };
    return cache;
  } catch {
    return null;
  }
}

/** Cosseno entre a pergunta (float) e o trecho (int8). Devolve 0..1. */
export function similaridade(consulta: number[], vetor: Int8Array, normaVetor: number): number {
  if (vetor.length !== consulta.length || normaVetor === 0) return 0;
  let produto = 0;
  let normaConsulta = 0;
  for (let i = 0; i < consulta.length; i += 1) {
    const q = consulta[i];
    produto += q * (vetor[i] / 127);
    normaConsulta += q * q;
  }
  if (normaConsulta === 0) return 0;
  return produto / (Math.sqrt(normaConsulta) * normaVetor);
}

/**
 * Pontua TODOS os trechos indexados contra a pergunta.
 * Devolve `null` quando não há índice vetorial — quem chama cai no lexical.
 */
export async function pontuarSemantico(pergunta: string): Promise<Map<string, number> | null> {
  const indice = await carregarIndiceVetorial();
  if (!indice) return null;
  let consulta: number[];
  try {
    consulta = await vetorizarRemoto(pergunta, { modelo: indice.modelo, timeoutMs: 12_000 });
  } catch {
    return null;
  }
  const pontos = new Map<string, number>();
  for (const [id, vetor] of indice.vetores) {
    pontos.set(id, similaridade(consulta, vetor, indice.normas.get(id) ?? 0));
  }
  return pontos;
}
