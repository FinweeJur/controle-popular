/**
 * apps/web/lib/empresas/empresas-documentos.test.ts
 *
 * Testes unitários do catálogo de documentos oficiais das empresas monitoradas.
 *
 * Fontes oficiais:
 * - Valida a integridade do arquivo empresas-documentos.json e funções de filtragem.
 */

import { describe, it, expect } from "vitest";
import {
  obterCatalogoDocumentos,
  listarDocumentosPorEmpresa,
  filtrarDocumentos,
  COBERTURA_DOCUMENTOS_EMPRESAS,
} from "./empresas-documentos";

describe("Biblioteca Documental das Empresas Estratégicas", () => {
  it("o catálogo contém acervo de documentos oficiais verificados", () => {
    const cat = obterCatalogoDocumentos();
    expect(cat.totalDocumentos).toBe(26);
    expect(cat.totalEmpresas).toBe(20);
    expect(cat.itens.length).toBe(26);
    expect(COBERTURA_DOCUMENTOS_EMPRESAS.totalDocumentos).toBe(26);
  });

  it("todo documento possui id, urlOficial e micro-resumo factual", () => {
    const cat = obterCatalogoDocumentos();
    for (const doc of cat.itens) {
      expect(doc.id.startsWith("doc-")).toBe(true);
      expect(doc.empresaNome.trim().length).toBeGreaterThan(0);
      expect(doc.microResumo.trim().length).toBeGreaterThan(20);
      expect(doc.urlOficial.startsWith("http")).toBe(true);
      expect(doc.tamanhoBytes).toBeGreaterThan(0);
      expect(doc.tags.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("listarDocumentosPorEmpresa localiza documentos da Vale e BlackRock", () => {
    const docsVale = listarDocumentosPorEmpresa("vale-s-a");
    expect(docsVale.length).toBeGreaterThanOrEqual(2);
    expect(docsVale.some((d) => d.tipoDocumento === "clima")).toBe(true);

    const docsBlackrock = listarDocumentosPorEmpresa("blackrock-inc");
    expect(docsBlackrock.length).toBeGreaterThanOrEqual(1);
    expect(docsBlackrock[0].pais).toBe("Estados Unidos");
  });

  it("filtrarDocumentos aplica filtros combinados e busca semântica", () => {
    const cat = obterCatalogoDocumentos();
    const filtradosClima = filtrarDocumentos(cat.itens, { tipo: "clima" });
    expect(filtradosClima.length).toBe(5);
    expect(filtradosClima.every((d) => d.tipoDocumento === "clima")).toBe(true);

    const filtradosBrasil = filtrarDocumentos(cat.itens, { pais: "Brasil" });
    expect(filtradosBrasil.length).toBe(16);

    const buscaMineracao = filtrarDocumentos(cat.itens, { busca: "mineração" });
    expect(buscaMineracao.length).toBeGreaterThan(0);
  });
});

