/**
 * lib/ambiental/biblioteca-desastres.ts
 *
 * Módulo de consulta e consolidação da Biblioteca Unificada de Documentos
 * dos Crimes Socioambientais de Mariana (Bacia do Rio Doce) e Brumadinho (Bacia do Paraopeba).
 */

import * as fs from "node:fs";
import * as path from "node:path";

export interface ItemDocumentoDesastre {
  id: string;
  desastre: "mariana" | "brumadinho";
  bacia: "doce" | "paraopeba";
  titulo: string;
  data: string | null;
  tipo: string;
  orgao: string;
  esfera: string;
  uf: string;
  tags: string[];
  resumo: string | null;
  url: string;
  fonteId: string;
}

interface ItemFonte {
  id: string;
  desastre: string;
  bacia: string;
  titulo: string;
  data: string | null;
  tipo: string;
  tipoOrigem?: string;
  orgao: string;
  esfera: string;
  uf: string;
  tags: string[];
  resumo: string | null;
  url: string;
  fonteId: string;
  coletadoEm?: string;
}

interface DadosBiblioteca {
  geradoEm: string;
  fontes?: Array<{ id: string; nome: string; licenca: string; itens: number }>;
  ficouDeFora?: string;
  itens: ItemFonte[];
}

export interface CatalogoBibliotecaDesastres {
  total_documentos: number;
  totais: {
    brumadinho_paraopeba: number;
    mariana_rio_doce: number;
    esferas: Record<string, number>;
    ufs: Record<string, number>;
  };
  documentos: ItemDocumentoDesastre[];
}

let cacheBiblioteca: CatalogoBibliotecaDesastres | null = null;

function resolverCaminhoJson(): string {
  const caminhos = [
    path.resolve(process.cwd(), "public", "data", "biblioteca-desastres.json"),
    path.resolve(process.cwd(), "apps", "web", "public", "data", "biblioteca-desastres.json"),
    path.resolve(__dirname, "..", "..", "public", "data", "biblioteca-desastres.json"),
  ];

  for (const c of caminhos) {
    if (fs.existsSync(c)) return c;
  }
  return caminhos[0];
}

function converterItem(item: ItemFonte): ItemDocumentoDesastre {
  return {
    id: item.id,
    desastre: item.desastre as "mariana" | "brumadinho",
    bacia: item.bacia as "doce" | "paraopeba",
    titulo: item.titulo,
    data: item.data,
    tipo: item.tipo,
    orgao: item.orgao,
    esfera: item.esfera,
    uf: item.uf,
    tags: item.tags,
    resumo: item.resumo,
    url: item.url,
    fonteId: item.fonteId,
  };
}

export function carregarBibliotecaDesastres(): CatalogoBibliotecaDesastres {
  if (cacheBiblioteca) return cacheBiblioteca;

  const jsonPath = resolverCaminhoJson();
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Arquivo biblioteca-desastres.json não encontrado em: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const dados = JSON.parse(raw) as DadosBiblioteca;

  const documentos = dados.itens.map(converterItem);

  const brumadinho_paraopeba = documentos.filter((d) => d.desastre === "brumadinho").length;
  const mariana_rio_doce = documentos.filter((d) => d.desastre === "mariana").length;

  const esferas: Record<string, number> = {};
  const ufs: Record<string, number> = {};
  for (const doc of documentos) {
    esferas[doc.esfera] = (esferas[doc.esfera] || 0) + 1;
    ufs[doc.uf] = (ufs[doc.uf] || 0) + 1;
  }

  cacheBiblioteca = {
    total_documentos: documentos.length,
    totais: {
      brumadinho_paraopeba,
      mariana_rio_doce,
      esferas,
      ufs,
    },
    documentos,
  };

  return cacheBiblioteca;
}

export function listarDocumentosDesastres(): ItemDocumentoDesastre[] {
  return carregarBibliotecaDesastres().documentos;
}

export function obterEstatisticasBiblioteca() {
  return carregarBibliotecaDesastres().totais;
}

export function filtrarDocumentosPorDesastre(desastre: "mariana" | "brumadinho"): ItemDocumentoDesastre[] {
  return listarDocumentosDesastres().filter((d) => d.desastre === desastre);
}
