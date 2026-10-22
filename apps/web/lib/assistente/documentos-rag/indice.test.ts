import { describe, expect, it } from "vitest";
import {
  construirIndiceDocumentos,
  construirMapaDocumentos,
  consultarDocumentos,
  resumoMapaDocumentos,
  urlDoTrecho,
} from "./indice";
import type { TrechoDocumento } from "./tipos";

/**
 * Testes do índice documental com fixture sintética.
 *
 * Nenhum PDF real entra aqui: o contrato é o que importa — trecho, página,
 * link oficial, ranqueamento e limite por documento.
 */

function trecho(over: Partial<TrechoDocumento> = {}): TrechoDocumento {
  return {
    id: "doc-1:p1:c0",
    docId: "doc-1",
    titulo: "Relatório de segurança hídrica",
    tipo: "Relatório técnico",
    categoria: "Ambiental & Desastres",
    tema: "Segurança hídrica",
    orgao: "Governo de MG",
    ano: 2024,
    pagina: 1,
    texto: "A água do abastecimento foi interditada após o rompimento da barragem.",
    urlOriginal: "https://exemplo.gov.br/doc.pdf",
    urlPdf: "https://exemplo.gov.br/doc.pdf",
    resumo: "Relatório sobre água e barragem.",
    tags: ["água", "barragem"],
    fonte: "fixture",
    ...over,
  };
}

const t1 = trecho();
const t2 = trecho({
  id: "doc-1:p2:c0",
  pagina: 2,
  texto: "A comunidade recebeu auxílio emergencial e acompanhamento de saúde.",
  tags: ["auxílio", "saúde"],
});
const t3 = trecho({
  id: "doc-2:p1:c0",
  docId: "doc-2",
  titulo: "Prestação de contas do acordo",
  categoria: "Justiça & Controle",
  tema: "Reparação",
  orgao: "Pro-Brumadinho",
  ano: 2025,
  texto: "A prestação de contas detalha os repasses do acordo de reparação.",
  urlOriginal: "https://exemplo.gov.br/contas.pdf",
  urlPdf: "https://exemplo.gov.br/contas.pdf",
  tags: ["reparação", "repasses"],
});

describe("índice documental", () => {
  it("recupera o trecho certo e explica o termo", () => {
    const indice = construirIndiceDocumentos([t1, t2, t3]);
    const resultado = consultarDocumentos(indice, { texto: "água barragem" });
    expect(resultado[0]?.trecho.id).toBe("doc-1:p1:c0");
    expect(resultado[0]?.motivos.some((m) => m.startsWith("termo:"))).toBe(true);
  });

  it("limita a dois trechos por documento", () => {
    const indice = construirIndiceDocumentos([t1, t2, t3]);
    const resultado = consultarDocumentos(indice, { texto: "água comunidade", limite: 5 });
    const doDoc1 = resultado.filter((r) => r.trecho.docId === "doc-1");
    expect(doDoc1.length).toBeLessThanOrEqual(2);
  });

  it("filtra por categoria, tema e ano", () => {
    const indice = construirIndiceDocumentos([t1, t2, t3]);
    expect(consultarDocumentos(indice, { texto: "repasses", categoria: "Justiça & Controle" })).toHaveLength(1);
    expect(consultarDocumentos(indice, { texto: "água", tema: "Segurança hídrica" }).length).toBeGreaterThan(0);
    expect(consultarDocumentos(indice, { texto: "água", ano: 2025 })).toHaveLength(0);
  });

  it("monta mapa e resumo sem despejar trechos", () => {
    const indice = construirIndiceDocumentos([t1, t2, t3]);
    const mapa = construirMapaDocumentos(indice);
    expect(mapa.totalDocumentos).toBe(2);
    expect(mapa.totalTrechos).toBe(3);
    expect(mapa.porCategoria.some((c) => c.slug === "Ambiental & Desastres")).toBe(true);
    const resumo = resumoMapaDocumentos(mapa);
    expect(resumo).toContain("2 documentos");
    expect(resumo).not.toContain("interditada");
  });

  it("anexa a página ao link oficial do PDF", () => {
    expect(urlDoTrecho(t1)).toBe("https://exemplo.gov.br/doc.pdf#page=1");
    expect(urlDoTrecho({ ...t1, urlPdf: null })).toBe("https://exemplo.gov.br/doc.pdf");
  });
});
