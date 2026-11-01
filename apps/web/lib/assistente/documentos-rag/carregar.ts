/**
 * Carregador do Ã­ndice documental gerado fora do request.
 *
 * O JSON fica em `public/data/documentos-rag/trechos.json`; o arquivo Ã©
 * derivado dos PDFs, nÃ£o fonte. Se ele nÃ£o existir, o RAG documental degrada
 * para vazio e o Seu NonÃ´ continua respondendo com os cartÃµes curados â€”
 * ausÃªncia de Ã­ndice nÃ£o pode derrubar o assistente.
 *
 * Busca hÃ­brida (01/11/2026): o lÃ©xico sozinho dava recall@3 de 48,3% no
 * gabarito de 30 perguntas â€” pergunta reescrita nÃ£o achava o documento.
 * Agora a nota final Ã© `0,7 Ã— cosseno + 0,3 Ã— lÃ©xico normalizado`. Se o
 * arquivo de embeddings faltar (ou o modelo nÃ£o bater), volta ao lÃ©xico puro
 * sem quebrar: degradaÃ§Ã£o, nÃ£o erro.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import {
  construirIndiceDocumentos,
  construirMapaDocumentos,
  consultarDocumentos,
  passaFiltros,
  pontuarTrechos,
} from "./indice";
import { pontuarSemantico } from "./embeddings";
import type { ConsultaDocumentos, IndiceDocumentos, MapaDocumentos, ResultadoDocumento, TrechoDocumento } from "./tipos";

const ARQUIVO = "trechos.json";
const PESO_VETOR = 0.7;
const PESO_LEXICO = 0.3;
const MAX_POR_DOCUMENTO = 2;

interface ArquivoTrechos {
  geradoEm?: string;
  totalDocumentos?: number;
  totalTrechos?: number;
  trechos?: TrechoDocumento[];
}

let cache: IndiceDocumentos | null | undefined;
let emVoo: Promise<IndiceDocumentos | null> | null = null;

function caminhosPossiveis(): string[] {
  return [
    path.join(process.cwd(), "public", "data", "documentos-rag", ARQUIVO),
    path.join(process.cwd(), "apps", "web", "public", "data", "documentos-rag", ARQUIVO),
  ];
}

function lerArquivo(): IndiceDocumentos | null {
  for (const caminho of caminhosPossiveis()) {
    try {
      const bruto = JSON.parse(readFileSync(caminho, "utf-8")) as ArquivoTrechos;
      const trechos = Array.isArray(bruto.trechos) ? bruto.trechos : [];
      return construirIndiceDocumentos(trechos);
    } catch {
      // tenta o prÃ³ximo caminho; no fim devolve null
    }
  }
  return null;
}

export async function carregarIndiceDocumentos(): Promise<IndiceDocumentos | null> {
  if (cache !== undefined) return cache;
  if (emVoo) return emVoo;
  emVoo = Promise.resolve(lerArquivo()).then((indice) => {
    cache = indice;
    return indice;
  });
  return emVoo;
}

interface Mistura {
  indice: IndiceDocumentos;
  opcoes: Omit<ConsultaDocumentos, "texto">;
  lexico: Map<string, number>;
  vetor: Map<string, number>;
  limite: number;
}

function notaDoTrecho(trecho: TrechoDocumento, m: Mistura, maiorLexico: number): ResultadoDocumento | null {
  if (!passaFiltros(trecho, { ...m.opcoes, texto: "" })) return null;
  const cosseno = Math.max(0, m.vetor.get(trecho.id) ?? 0);
  const lexical = (m.lexico.get(trecho.id) ?? 0) / maiorLexico;
  const score = PESO_VETOR * cosseno + PESO_LEXICO * lexical;
  if (score <= 0) return null;
  return { trecho, score, motivos: [cosseno >= lexical ? "vetor" : "lexico"] };
}

/** Máximo de 2 trechos por documento: um PDF de 200 páginas não pode ocupar tudo. */
function limitarPorDocumento(candidatos: ResultadoDocumento[], limite: number): ResultadoDocumento[] {
  const porDocumento = new Map<string, number>();
  const selecionados: ResultadoDocumento[] = [];
  for (const candidato of candidatos) {
    const usados = porDocumento.get(candidato.trecho.docId) ?? 0;
    if (usados >= MAX_POR_DOCUMENTO) continue;
    porDocumento.set(candidato.trecho.docId, usados + 1);
    selecionados.push({ ...candidato, score: Number(candidato.score.toFixed(4)) });
    if (selecionados.length >= limite) break;
  }
  return selecionados;
}

function misturar(m: Mistura): ResultadoDocumento[] {
  const maiorLexico = Math.max(1, ...m.lexico.values());
  const candidatos = m.indice.trechos
    .map((trecho) => notaDoTrecho(trecho, m, maiorLexico))
    .filter((c): c is ResultadoDocumento => c !== null)
    .sort((a, b) => b.score - a.score);
  return limitarPorDocumento(candidatos, m.limite);
}

/**
 * Busca trechos; ausÃªncia de Ã­ndice ou erro devolve lista vazia.
 * Com embeddings disponÃ­veis, usa hÃ­brido; sem eles, cai no lÃ©xico.
 */
export async function buscarDocumentos(
  pergunta: string,
  opcoes: Omit<ConsultaDocumentos, "texto"> = {}
): Promise<ResultadoDocumento[]> {
  const indice = await carregarIndiceDocumentos().catch(() => null);
  if (!indice) return [];
  const limite = Math.max(1, Math.min(20, opcoes.limite ?? 6));
  const vetor = await pontuarSemantico(pergunta).catch(() => null);
  if (!vetor) return consultarDocumentos(indice, { ...opcoes, texto: pergunta, limite });
  const lexico = pontuarTrechos(indice, pergunta);
  return misturar({ indice, opcoes, lexico, vetor, limite });
}

/** Mapa de cobertura para diagnÃ³stico e prompt; `null` sem Ã­ndice. */
export async function mapaDocumentos(): Promise<MapaDocumentos | null> {
  const indice = await carregarIndiceDocumentos().catch(() => null);
  return indice ? construirMapaDocumentos(indice) : null;
}
