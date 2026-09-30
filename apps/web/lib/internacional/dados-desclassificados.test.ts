/**
 * @file apps/web/lib/internacional/dados-desclassificados.test.ts
 * @description Testes unitarios do modulo de documentos desclassificados de inteligencia do G20.
 */

import { describe, it, expect } from "vitest";
import {
  COBERTURA_DESCLASSIFICADOS,
  obterDocumentosDesclassificados,
} from "./dados-desclassificados";

describe("dados-desclassificados", () => {
  it("carrega agregados de cobertura de desclassificados medidos e datados", () => {
    expect(COBERTURA_DESCLASSIFICADOS.totalDocumentos).toBeGreaterThanOrEqual(15);
    expect(COBERTURA_DESCLASSIFICADOS.totalOrgaos).toBeGreaterThanOrEqual(8);
    expect(COBERTURA_DESCLASSIFICADOS.totalPaisesOrigem).toBeGreaterThanOrEqual(7);
    expect(COBERTURA_DESCLASSIFICADOS.totalDocsMencionamBrasil).toBeGreaterThanOrEqual(12);
    expect(COBERTURA_DESCLASSIFICADOS.mediaAnosEmSegredo).toBeGreaterThanOrEqual(20);
    expect(COBERTURA_DESCLASSIFICADOS.paisesOrigem).toContain("Brasil");
    expect(COBERTURA_DESCLASSIFICADOS.paisesOrigem).toContain("Estados Unidos");
    expect(COBERTURA_DESCLASSIFICADOS.paisesOrigem).toContain("Reino Unido");
    expect(COBERTURA_DESCLASSIFICADOS.paisesOrigem).toContain("Alemanha");
  });

  it("carrega documentos com URLs canonicas de custodia e PDFs oficiais", () => {
    const docs = obterDocumentosDesclassificados();
    expect(docs.length).toBeGreaterThanOrEqual(15);

    for (const doc of docs) {
      expect(doc.id).toMatch(/^DOC-/);
      expect(doc.titulo.length).toBeGreaterThan(10);
      expect(doc.resumo.length).toBeGreaterThan(20);
      expect(doc.orgaoInteligencia).toBeTruthy();
      expect(doc.codigoIsoPais).toMatch(/^[A-Z]{3}$/);
      expect(doc.dataPublicacao).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(doc.dataDesclassificacao).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(doc.urlOficialCustodia).toMatch(/^https?:\/\//);
      expect(doc.urlPdfOriginal).toMatch(/^https?:\/\//);
      expect(doc.numeroRegistroOficial).toBeTruthy();
      expect(doc.quantidadePaginas).toBeGreaterThan(0);
      expect(doc.assuntos.length).toBeGreaterThan(0);
      expect(doc.temas.length).toBeGreaterThan(0);
      expect(doc.paisesMencionados.length).toBeGreaterThan(0);
      expect(doc.sujeitosMencionados.length).toBeGreaterThan(0);
    }
  });

  it("localiza o memorando CIA de 1974 sobre execucoes e o relatorio SNI de 1976", () => {
    const docs = obterDocumentosDesclassificados();

    const ciaCondor = docs.find((d) => d.id === "DOC-CIA-1974-CONDOR");
    expect(ciaCondor).toBeDefined();
    expect(ciaCondor?.sujeitosMencionados).toContain("Ernesto Geisel");
    expect(ciaCondor?.sujeitosMencionados).toContain("Henry Kissinger");
    expect(ciaCondor?.numeroRegistroOficial).toBe("CIA-RDP80R01580R002000090001-0");

    const sniCondor = docs.find((d) => d.id === "DOC-SNI-1976-CONDOR");
    expect(sniCondor).toBeDefined();
    expect(sniCondor?.paisOrigem).toBe("Brasil");
    expect(sniCondor?.paisesMencionados).toContain("Chile");
    expect(sniCondor?.assuntos).toContain("Operação Condor");
  });

  it("verifica documentos de mineracao e recursos naturais (DSI Serra Pelada e CSIS)", () => {
    const docs = obterDocumentosDesclassificados();

    const serraPelada = docs.find((d) => d.id === "DOC-DSI-1981-SERRA-PELADA");
    expect(serraPelada).toBeDefined();
    expect(serraPelada?.assuntos).toContain("Serra Pelada");
    expect(serraPelada?.assuntos).toContain("Vale do Rio Doce");

    const csisMining = docs.find((d) => d.id === "DOC-CSIS-1989-MINING-AMAZON");
    expect(csisMining).toBeDefined();
    expect(csisMining?.paisOrigem).toBe("Canadá");
    expect(csisMining?.assuntos).toContain("Yanomami");
  });
});
