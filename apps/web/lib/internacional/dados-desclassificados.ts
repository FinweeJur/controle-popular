/**
 * @file apps/web/lib/internacional/dados-desclassificados.ts
 * @description Modulo de consulta, decodificacao e agregacao do acervo de documentos desclassificados do G20.
 *
 * Papel no portal:
 * Centraliza os relatorios oficiais desclassificados de orgaos de inteligencia das potencias do G20
 * (CIA, FBI, SNI, ABIN, MI5, CSIS, BND, DGSE, ASIO, SIDE, KGB) que impactam o Brasil e a America Latina.
 * Fornece metadados arquivisticos, busca facetada, resumo civico e agregados de topo medidos.
 *
 * Fontes oficiais:
 * - CIA FOIA Electronic Reading Room (CREST - EUA)
 * - Arquivo Nacional do Brasil (Fundo SNI / DSI / CSN - SIAN)
 * - The National Archives Kew (MI5 / Joint Intelligence Committee - Reino Unido)
 * - Library and Archives Canada (CSIS ATIP summaries - Canada)
 * - Stasi-Unterlagen-Archiv / Bundesarchiv (Alemanha)
 * - Service Historique de la Defense / France Archives (Franca)
 * - Archivio Centrale dello Stato (Declassifica Renzi/Draghi - Italia)
 * - National Archives of Australia (RecordSearch ASIO - Australia)
 * - Archivo Nacional de la Memoria / MinDef (Argentina)
 * - Wilson Center Digital Archive (Cold War International History Project - KGB/URSS)
 *
 * Decisoes tecnicas e restricoes:
 * - Leitura e decodificacao de JSON compacto via lib/estatico/compactar.ts.
 * - Cobertura agregada COBERTURA_DESCLASSIFICADOS pre-calculada para importacao leve em Server Components.
 * - Zero dado pessoal sensivel (validado por varredura automatica mod-11).
 */

import { expandir, type TabelaCompacta } from "@/lib/estatico/compactar";
import jsonDesclassificados from "@/data/internacional/desclassificados-g20.compact.json";

export interface DocumentoDesclassificadoG20 {
  id: string;
  titulo: string;
  resumo: string;
  orgaoInteligencia: string;
  nomeCompletoOrgao: string;
  paisOrigem: string;
  codigoIsoPais: string;
  bandeiraPais: string;
  continente: "América do Norte" | "América do Sul" | "Europa" | "Oceania" | "Eurásia";
  dataPublicacao: string; // Formato YYYY-MM-DD
  dataDesclassificacao: string; // Formato YYYY-MM-DD
  nivelClassificacaoOriginal: "Ultrassecreto" | "Secreto" | "Confidencial" | "Reservado";
  temas: string[];
  assuntos: string[];
  paisesMencionados: string[];
  sujeitosMencionados: string[];
  numeroRegistroOficial: string;
  quantidadePaginas: number;
  urlOficialCustodia: string;
  urlPdfOriginal: string;
  contextoBrasil: string;
}

/** Cache em memoria para evitar expansao repetida */
let cacheDocumentos: DocumentoDesclassificadoG20[] | null = null;

/**
 * Retorna todos os documentos desclassificados do G20 decodificados.
 *
 * @returns Array de documentos desclassificados tipados
 */
export function obterDocumentosDesclassificados(): DocumentoDesclassificadoG20[] {
  if (!cacheDocumentos) {
    cacheDocumentos = expandir(
      jsonDesclassificados as unknown as TabelaCompacta
    ) as unknown as DocumentoDesclassificadoG20[];
  }
  return cacheDocumentos;
}

// Calculo dos agregados medidos para exportacao leve
const docsCalculo = obterDocumentosDesclassificados();

const paisesOrigemSet = new Set(docsCalculo.map((d) => d.paisOrigem));
const orgaosSet = new Set(docsCalculo.map((d) => d.orgaoInteligencia));
const continentesSet = new Set(docsCalculo.map((d) => d.continente));
const temasSet = new Set(docsCalculo.flatMap((d) => d.temas));

const anosOriginais = docsCalculo
  .map((d) => parseInt(d.dataPublicacao.substring(0, 4), 10))
  .filter((ano) => !isNaN(ano));

const anosDesclassificacao = docsCalculo
  .map((d) => parseInt(d.dataDesclassificacao.substring(0, 4), 10))
  .filter((ano) => !isNaN(ano));

const somaDiferencaAnos = docsCalculo.reduce((acc, d) => {
  const anoPub = parseInt(d.dataPublicacao.substring(0, 4), 10);
  const anoDesc = parseInt(d.dataDesclassificacao.substring(0, 4), 10);
  if (!isNaN(anoPub) && !isNaN(anoDesc) && anoDesc >= anoPub) {
    return acc + (anoDesc - anoPub);
  }
  return acc;
}, 0);

const mediaAnosCalculada = docsCalculo.length > 0 ? Math.round(somaDiferencaAnos / docsCalculo.length) : 0;

/**
 * Constantes agregadas de cobertura para importacao ultraleve em Server Components
 */
export const COBERTURA_DESCLASSIFICADOS = {
  totalDocumentos: docsCalculo.length,
  totalOrgaos: orgaosSet.size,
  totalPaisesOrigem: paisesOrigemSet.size,
  totalDocsMencionamBrasil: docsCalculo.filter((d) => d.paisesMencionados.includes("Brasil")).length,
  paisesOrigem: Array.from(paisesOrigemSet).sort(),
  orgaosInteligencia: Array.from(orgaosSet).sort(),
  continentes: Array.from(continentesSet).sort(),
  temasPrincipais: Array.from(temasSet).sort(),
  anoDocumentoMaisAntigo: anosOriginais.length > 0 ? Math.min(...anosOriginais) : 1964,
  anoDesclassificacaoMaisRecente: anosDesclassificacao.length > 0 ? Math.max(...anosDesclassificacao) : 2021,
  mediaAnosEmSegredo: mediaAnosCalculada,
  dataMedicao: "2026-09-30",
} as const;
