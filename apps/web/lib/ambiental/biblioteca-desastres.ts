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
  desastre: "mariana" | "brumadinho" | "nacional" | "outro";
  bacia: "doce" | "paraopeba" | "itatiaucu" | "jequitinhonha" | "sao_francisco" | "velhas" | "para" | "verde_grande" | "mucuri" | "paracatu" | "geral";
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
  coletadoEm?: string;
  caso_nacional?: string;
  regiao_mg?: string;
  acao_coletiva?: boolean;
  instituicao_justica?: string;
  classificavel: boolean;
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
  caso_nacional?: string;
  regiao_mg?: string;
  acao_coletiva?: boolean;
  instituicao_justica?: string;
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
    nacional: number;
    regioes_mg: Record<string, number>;
    esferas: Record<string, number>;
    ufs: Record<string, number>;
    acoes_coletivas: number;
    instituicoes_justica: Record<string, number>;
  };
  regioes_disponiveis: string[];
  tipos_disponiveis: string[];
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
  const desastre = (item.desastre as ItemDocumentoDesastre["desastre"]) ?? "outro";
  const bacia = (item.bacia as ItemDocumentoDesastre["bacia"]) ?? "geral";
  return {
    id: item.id,
    desastre,
    bacia,
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
    coletadoEm: item.coletadoEm,
    caso_nacional: item.caso_nacional,
    regiao_mg: item.regiao_mg,
    acao_coletiva: item.acao_coletiva ?? false,
    instituicao_justica: item.instituicao_justica,
    classificavel: true,
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
  const nacional = documentos.filter((d) => d.desastre === "nacional").length;

  const esferas: Record<string, number> = {};
  const ufs: Record<string, number> = {};
  const regioes_mg: Record<string, number> = {};
  const instituicoes_justica: Record<string, number> = {};
  let acoes_coletivas = 0;
  for (const doc of documentos) {
    esferas[doc.esfera] = (esferas[doc.esfera] || 0) + 1;
    ufs[doc.uf] = (ufs[doc.uf] || 0) + 1;
    if (doc.regiao_mg) regioes_mg[doc.regiao_mg] = (regioes_mg[doc.regiao_mg] || 0) + 1;
    if (doc.instituicao_justica) instituicoes_justica[doc.instituicao_justica] = (instituicoes_justica[doc.instituicao_justica] || 0) + 1;
    if (doc.acao_coletiva) acoes_coletivas++;
  }

  const regioes_disponiveis = [...new Set(documentos.map((d) => d.bacia).filter(Boolean))].sort();
  const tipos_disponiveis = [...new Set(documentos.map((d) => d.tipo).filter(Boolean))].sort();

  cacheBiblioteca = {
    total_documentos: documentos.length,
    totais: {
      brumadinho_paraopeba,
      mariana_rio_doce,
      nacional,
      regioes_mg,
      esferas,
      ufs,
      acoes_coletivas,
      instituicoes_justica,
    },
    regioes_disponiveis,
    tipos_disponiveis,
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

export function filtrarDocumentosPorDesastre(desastre: ItemDocumentoDesastre["desastre"]): ItemDocumentoDesastre[] {
  return listarDocumentosDesastres().filter((d) => d.desastre === desastre);
}

export function filtrarDocumentosPorRegiao(regiao: string): ItemDocumentoDesastre[] {
  return listarDocumentosDesastres().filter((d) => d.bacia === regiao || d.regiao_mg === regiao);
}

export function filtrarDocumentosPorAcaoColetiva(): ItemDocumentoDesastre[] {
  return listarDocumentosDesastres().filter((d) => d.acao_coletiva);
}

export function obterRegioesDisponiveis(): string[] {
  return carregarBibliotecaDesastres().regioes_disponiveis;
}

export function obterTiposDisponiveis(): string[] {
  return carregarBibliotecaDesastres().tipos_disponiveis;
}
