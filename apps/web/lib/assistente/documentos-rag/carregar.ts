/**
 * Carregador do índice documental gerado fora do request.
 *
 * O JSON fica em `public/data/documentos-rag/trechos.json`; o arquivo é
 * derivado dos PDFs, não fonte. Se ele não existir, o RAG documental degrada
 * para vazio e o Seu Nonô continua respondendo com os cartões curados —
 * ausência de índice não pode derrubar o assistente.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { construirIndiceDocumentos, construirMapaDocumentos, consultarDocumentos } from "./indice";
import type { ConsultaDocumentos, IndiceDocumentos, MapaDocumentos, ResultadoDocumento, TrechoDocumento } from "./tipos";

const ARQUIVO = "trechos.json";

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
      // tenta o próximo caminho; no fim devolve null
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

/** Busca trechos; ausência de índice ou erro devolve lista vazia. */
export async function buscarDocumentos(
  pergunta: string,
  opcoes: Omit<ConsultaDocumentos, "texto"> = {}
): Promise<ResultadoDocumento[]> {
  const indice = await carregarIndiceDocumentos().catch(() => null);
  if (!indice) return [];
  return consultarDocumentos(indice, { ...opcoes, texto: pergunta });
}

/** Mapa de cobertura para diagnóstico e prompt; `null` sem índice. */
export async function mapaDocumentos(): Promise<MapaDocumentos | null> {
  const indice = await carregarIndiceDocumentos().catch(() => null);
  return indice ? construirMapaDocumentos(indice) : null;
}
