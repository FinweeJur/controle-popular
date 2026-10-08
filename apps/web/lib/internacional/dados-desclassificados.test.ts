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
    expect(COBERTURA_DESCLASSIFICADOS.totalDocumentos).toBeGreaterThanOrEqual(25);
    expect(COBERTURA_DESCLASSIFICADOS.totalOrgaos).toBeGreaterThanOrEqual(15);
    expect(COBERTURA_DESCLASSIFICADOS.totalPaisesOrigem).toBeGreaterThanOrEqual(20);
    expect(COBERTURA_DESCLASSIFICADOS.totalDocsMencionamBrasil).toBeGreaterThanOrEqual(20);
    expect(COBERTURA_DESCLASSIFICADOS.mediaAnosEmSegredo).toBeGreaterThanOrEqual(20);
    expect(COBERTURA_DESCLASSIFICADOS.paisesOrigem).toContain("Brasil");
    expect(COBERTURA_DESCLASSIFICADOS.paisesOrigem).toContain("Estados Unidos");
    expect(COBERTURA_DESCLASSIFICADOS.paisesOrigem).toContain("Reino Unido");
    expect(COBERTURA_DESCLASSIFICADOS.paisesOrigem).toContain("Alemanha");
    expect(COBERTURA_DESCLASSIFICADOS.paisesOrigem).toContain("China");
    expect(COBERTURA_DESCLASSIFICADOS.paisesOrigem).toContain("Japão");
    expect(COBERTURA_DESCLASSIFICADOS.paisesOrigem).toContain("Índia");
    expect(COBERTURA_DESCLASSIFICADOS.paisesOrigem).toContain("África do Sul");
    expect(COBERTURA_DESCLASSIFICADOS.continentes).toContain("África");
    expect(COBERTURA_DESCLASSIFICADOS.continentes).toContain("Ásia");
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

  it("verifica documentos do G20 da Asia, Africa e Europa (China, Africa do Sul, Japao, Mexico, Portugal)", () => {
    const docs = obterDocumentosDesclassificados();

    const chinaDoc = docs.find((d) => d.id === "DOC-MSS-1974-BEIJING-BRASILIA");
    expect(chinaDoc).toBeDefined();
    expect(chinaDoc?.paisOrigem).toBe("China");
    expect(chinaDoc?.continente).toBe("Ásia");
    expect(chinaDoc?.assuntos).toContain("Minério de Ferro");

    const africaSulDoc = docs.find((d) => d.id === "DOC-SSA-1979-SOUTH-ATLANTIC");
    expect(africaSulDoc).toBeDefined();
    expect(africaSulDoc?.continente).toBe("África");
    expect(africaSulDoc?.sujeitosMencionados).toContain("P. W. Botha");

    const japaoDoc = docs.find((d) => d.id === "DOC-MOFA-1980-CARAJAS-INVESTMENT");
    expect(japaoDoc).toBeDefined();
    expect(japaoDoc?.assuntos).toContain("Projeto Carajás");

    const mexicoDoc = docs.find((d) => d.id === "DOC-DFS-1975-EXILADOS-UNAM");
    expect(mexicoDoc).toBeDefined();
    expect(mexicoDoc?.sujeitosMencionados).toContain("Darcy Ribeiro");

    const portugalDoc = docs.find((d) => d.id === "DOC-PIDE-1973-LIGACOES-DOPS");
    expect(portugalDoc).toBeDefined();
    expect(portugalDoc?.assuntos).toContain("DOPS");
  });

  it("verifica que todos os documentos estao geolocalizados com coordenadas e alianças validas", () => {
    const docs = obterDocumentosDesclassificados();
    expect(docs.length).toBeGreaterThanOrEqual(80);

    for (const doc of docs) {
      expect(typeof doc.latitude).toBe("number");
      expect(typeof doc.longitude).toBe("number");
      expect(typeof doc.localidadeFoco).toBe("string");
      expect(doc.latitude).toBeGreaterThanOrEqual(-90);
      expect(doc.latitude).toBeLessThanOrEqual(90);
      expect(doc.longitude).toBeGreaterThanOrEqual(-180);
      expect(doc.longitude).toBeLessThanOrEqual(180);
      expect(doc.localidadeFoco?.length).toBeGreaterThan(3);
      expect(doc.aliancaInteligencia).toBeDefined();
      expect(["Five Eyes", "Nine Eyes", "Twelve Eyes", "Fourteen Eyes", "G20 Soberano"]).toContain(
        doc.aliancaInteligencia
      );
      expect(doc.naturezaDocumento).toBeDefined();
      expect(["Desclassificado Histórico", "Relatório Público Contemporâneo"]).toContain(
        doc.naturezaDocumento
      );
    }
  });

  it("verifica relatorios historicos e contemporaneos do FBI e da NSA dos EUA", () => {
    const docs = obterDocumentosDesclassificados();

    const fbiCointelpro = docs.find((d) => d.id === "DOC-FBI-COINTELPRO-CONE-SUL");
    expect(fbiCointelpro).toBeDefined();
    expect(fbiCointelpro?.orgaoInteligencia).toBe("FBI");
    expect(fbiCointelpro?.aliancaInteligencia).toBe("Five Eyes");
    expect(fbiCointelpro?.naturezaDocumento).toBe("Desclassificado Histórico");

    const fbiCyber = docs.find((d) => d.id === "DOC-FBI-IC3-CYBER-THREATS-2024");
    expect(fbiCyber).toBeDefined();
    expect(fbiCyber?.naturezaDocumento).toBe("Relatório Público Contemporâneo");
    expect(fbiCyber?.nivelClassificacaoOriginal).toBe("Público / Ostensivo");

    const nsaEchelon = docs.find((d) => d.id === "DOC-NSA-ECHELON-SYSTEM");
    expect(nsaEchelon).toBeDefined();
    expect(nsaEchelon?.orgaoInteligencia).toBe("NSA");
    expect(nsaEchelon?.assuntos).toContain("ECHELON");

    const nsaMalvinas = docs.find((d) => d.id === "DOC-NSA-FALKLANDS-SIGINT-1982");
    expect(nsaMalvinas).toBeDefined();
    expect(nsaMalvinas?.assuntos).toContain("Guerra das Malvinas");

    const nsaFisa = docs.find((d) => d.id === "DOC-NSA-FISA-702-TRANSPARENCY");
    expect(nsaFisa).toBeDefined();
    expect(nsaFisa?.naturezaDocumento).toBe("Relatório Público Contemporâneo");
  });

  it("verifica documentos dos paises Five Eyes, Nine Eyes e Twelve Eyes", () => {
    const docs = obterDocumentosDesclassificados();

    // Five Eyes: Reino Unido GCHQ e Nova Zelândia
    const gchqDoc = docs.find((d) => d.id === "DOC-GCHQ-UK-ANNUAL-CYBER-REVIEW");
    expect(gchqDoc).toBeDefined();
    expect(gchqDoc?.orgaoInteligencia).toBe("GCHQ");
    expect(gchqDoc?.aliancaInteligencia).toBe("Five Eyes");

    const nzDoc = docs.find((d) => d.id === "DOC-NZSIS-NZ-SECURITY-THREAT-ENV");
    expect(nzDoc).toBeDefined();
    expect(nzDoc?.paisOrigem).toBe("Nova Zelândia");

    // Nine Eyes: Dinamarca FE e Noruega NIS
    const dnkDoc = docs.find((d) => d.id === "DOC-FE-DNK-UDSYN-INTELLIGENCE");
    expect(dnkDoc).toBeDefined();
    expect(dnkDoc?.aliancaInteligencia).toBe("Nine Eyes");

    const norDoc = docs.find((d) => d.id === "DOC-NIS-NOR-FOKUS-ARCTIC-RESOURCES");
    expect(norDoc).toBeDefined();
    expect(norDoc?.aliancaInteligencia).toBe("Nine Eyes");

    // Twelve Eyes: Alemanha BND Crypto AG, Itália AISE, Espanha CNI e Suécia MUST
    const bndCrypto = docs.find((d) => d.id === "DOC-BND-DEU-RUBICON-CRYPTO-AG");
    expect(bndCrypto).toBeDefined();
    expect(bndCrypto?.assuntos).toContain("Crypto AG");
    expect(bndCrypto?.aliancaInteligencia).toBe("Twelve Eyes");

    const itaDoc = docs.find((d) => d.id === "DOC-AISE-ITA-MEDITERRANEAN-SECURITY");
    expect(itaDoc).toBeDefined();
    expect(itaDoc?.paisOrigem).toBe("Itália");

    const espDoc = docs.find((d) => d.id === "DOC-CNI-ESP-CCN-CERT-CYBERTHREATS");
    expect(espDoc).toBeDefined();
    expect(espDoc?.paisOrigem).toBe("Espanha");

    const sweDoc = docs.find((d) => d.id === "DOC-MUST-SWE-ARSOVERSIKT-BALTIC");
    expect(sweDoc).toBeDefined();
    expect(sweDoc?.paisOrigem).toBe("Suécia");
  });
});
