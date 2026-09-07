import { describe, it, expect } from "vitest";
import {
  obterCatalogoDocumentos,
  listarDocumentosPorEmpresa,
  filtrarDocumentos,
  COBERTURA_DOCUMENTOS_EMPRESAS,
} from "./empresas-documentos";

describe("Biblioteca Documental das Empresas Estratégicas", () => {
  it("o catálogo contém 520 documentos distribuídos entre as 130 empresas", () => {
    const cat = obterCatalogoDocumentos();
    expect(cat.totalDocumentos).toBe(520);
    expect(cat.totalEmpresas).toBe(130);
    expect(cat.itens.length).toBe(520);
    expect(COBERTURA_DOCUMENTOS_EMPRESAS.totalDocumentos).toBe(520);
  });

  it("todo documento possui id, urlOficial, urlR2 no Cloudflare e micro-resumo factual", () => {
    const cat = obterCatalogoDocumentos();
    for (const doc of cat.itens) {
      expect(doc.id.startsWith("doc-")).toBe(true);
      expect(doc.empresaNome.trim().length).toBeGreaterThan(0);
      expect(doc.microResumo.trim().length).toBeGreaterThan(20);
      expect(doc.urlOficial.startsWith("http")).toBe(true);
      expect(doc.urlR2.startsWith("https://arquivos.controlepopular.com.br/")).toBe(true);
      expect(doc.tamanhoBytes).toBeGreaterThan(100_000);
      expect(doc.tags.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("listarDocumentosPorEmpresa localiza documentos da Vale e BlackRock", () => {
    const docsVale = listarDocumentosPorEmpresa("vale-s-a");
    expect(docsVale.length).toBe(4);
    expect(docsVale.some((d) => d.tipoDocumento === "sustentabilidade")).toBe(true);
    expect(docsVale.some((d) => d.tipoDocumento === "clima")).toBe(true);

    const docsBlackrock = listarDocumentosPorEmpresa("blackrock-inc");
    expect(docsBlackrock.length).toBe(4);
    expect(docsBlackrock[0].pais).toBe("Estados Unidos");
  });

  it("filtrarDocumentos aplica filtros combinados e busca semântica", () => {
    const cat = obterCatalogoDocumentos();
    const filtradosClima = filtrarDocumentos(cat.itens, { tipo: "clima" });
    expect(filtradosClima.length).toBe(130);
    expect(filtradosClima.every((d) => d.tipoDocumento === "clima")).toBe(true);

    const filtradosBrasil = filtrarDocumentos(cat.itens, { pais: "Brasil" });
    expect(filtradosBrasil.length).toBe(240); // 60 empresas nacionais x 4 docs

    const buscaMineracao = filtrarDocumentos(cat.itens, { busca: "mineração" });
    expect(buscaMineracao.length).toBeGreaterThan(0);
  });
});
