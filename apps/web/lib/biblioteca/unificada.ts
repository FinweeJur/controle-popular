/**
 * lib/biblioteca/unificada.ts
 *
 * Módulo de acesso e manipulação da Biblioteca Unificada do Controle Popular.
 * Reúne documentos corporativos (ESG, DFPs), atos das 91 instituições de justiça,
 * TACs ambientais, acordos de reparação e acervo de pesquisa acadêmica nacional
 * (artigos SciELO, teses de doutorado, dissertações de mestrado e notas técnicas).
 *
 * Atende às regras do AGENTS.md:
 * - Regra das 5 coisas: gráfico, 4 cartões de topo, CSV (UTF-8 BOM e ;), filtros e ordenação;
 * - Tipagem estrita TypeScript;
 * - Zero vazamento de dados pessoais.
 */

import dadosBrutos from "@/data/biblioteca-unificada.json";

export interface DocumentoUnificado {
  id: string;
  titulo: string;
  tipo: string;
  tipoRotulo: string;
  categoria:
    | "Acadêmico & Pesquisa"
    | "Empresas & ESG"
    | "Justiça & Controle"
    | "Ambiental & Desastres"
    | "Cidades & Gestão"
    | "Congresso & Leis";
  tema: string;
  entidade: string;
  estado: string;
  ano: number;
  autor: string;
  microResumo: string;
  urlOficial: string;
  urlPdf?: string;
  palavrasChave: string[];
  tamanhoFormatado?: string;
}

export interface MetricasBiblioteca {
  totalDocumentos: number;
  totalCategorias: number;
  totalTemas: number;
  totalEmpresas: number;
  totalInstituicoesJustica: number;
  totalAcademico: number;
  distribuicaoPorCategoria: Record<string, number>;
  distribuicaoPorTema: Record<string, number>;
  distribuicaoPorAno: Record<string, number>;
  distribuicaoPorEstado: Record<string, number>;
}

export const METRICAS_BIBLIOTECA: MetricasBiblioteca = {
  totalDocumentos: dadosBrutos.totalDocumentos,
  totalCategorias: dadosBrutos.totalCategorias,
  totalTemas: dadosBrutos.totalTemas,
  totalEmpresas: dadosBrutos.totalEmpresas,
  totalInstituicoesJustica: dadosBrutos.totalInstituicoesJustica,
  totalAcademico: dadosBrutos.totalAcademico,
  distribuicaoPorCategoria: dadosBrutos.distribuicaoPorCategoria,
  distribuicaoPorTema: dadosBrutos.distribuicaoPorTema,
  distribuicaoPorAno: dadosBrutos.distribuicaoPorAno,
  distribuicaoPorEstado: dadosBrutos.distribuicaoPorEstado,
};

export const TODOS_DOCUMENTOS: DocumentoUnificado[] =
  dadosBrutos.itens as DocumentoUnificado[];

/** Retorna a coleção completa de documentos da biblioteca unificada. */
export function listarDocumentosUnificados(): DocumentoUnificado[] {
  return TODOS_DOCUMENTOS;
}

/** Retorna apenas documentos de cunho acadêmico e científico (teses, artigos, notas). */
export function listarDocumentosAcademicos(): DocumentoUnificado[] {
  return TODOS_DOCUMENTOS.filter(
    (d) => d.categoria === "Acadêmico & Pesquisa"
  );
}

/** Filtra documentos por palavra-chave ou termo associado a uma empresa (ex: Vale, Sigma). */
export function obterDocumentosPorTemaOuEntidade(
  termo: string
): DocumentoUnificado[] {
  const normalizado = termo.toLowerCase().trim();
  return TODOS_DOCUMENTOS.filter(
    (d) =>
      d.entidade.toLowerCase().includes(normalizado) ||
      d.tema.toLowerCase().includes(normalizado) ||
      d.palavrasChave.some((p) => p.toLowerCase().includes(normalizado)) ||
      d.titulo.toLowerCase().includes(normalizado)
  );
}

/**
 * Gera arquivo CSV com BOM UTF-8 (\uFEFF) e separador ponto-e-vírgula (;)
 * conforme exigência inegociável do AGENTS.md para compatibilidade perfeita com Excel.
 */
export function exportarCsvBiblioteca(documentos: DocumentoUnificado[]): string {
  const BOM = "\uFEFF";
  const cabecalho = [
    "Identificador",
    "Título",
    "Categoria",
    "Tema",
    "Tipo de Documento",
    "Entidade / Órgão",
    "UF / Âmbito",
    "Ano",
    "Autor / Fonte",
    "Microresumo",
    "Link Oficial",
    "Link do PDF / Espelho R2",
    "Palavras-Chave",
  ].join(";");

  const linhas = documentos.map((d) => {
    const limpo = (s?: string) =>
      (s ?? "").replace(/[\r\n]+/g, " ").replace(/"/g, '""');
    return [
      `"${limpo(d.id)}"`,
      `"${limpo(d.titulo)}"`,
      `"${limpo(d.categoria)}"`,
      `"${limpo(d.tema)}"`,
      `"${limpo(d.tipoRotulo)}"`,
      `"${limpo(d.entidade)}"`,
      `"${limpo(d.estado)}"`,
      `"${d.ano}"`,
      `"${limpo(d.autor)}"`,
      `"${limpo(d.microResumo)}"`,
      `"${limpo(d.urlOficial)}"`,
      `"${limpo(d.urlPdf)}"`,
      `"${limpo(d.palavrasChave.join(", "))}"`,
    ].join(";");
  });

  return BOM + [cabecalho, ...linhas].join("\r\n");
}
