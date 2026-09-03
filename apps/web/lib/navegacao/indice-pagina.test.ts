import { describe, it, expect } from "vitest";

function gerarSlug(texto: string, idx: number): string {
  const limpo = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return limpo || `secao-${idx}`;
}

describe("componente de navegação e índice de página (TOC)", () => {
  it("gera slugs sem acentos e válidos para âncoras HTML", () => {
    expect(gerarSlug("1. Gráficos de Distribuição Regional", 0)).toBe("1-graficos-de-distribuicao-regional");
    expect(gerarSlug("Quem tem direito à indenização?", 1)).toBe("quem-tem-direito-a-indenizacao");
    expect(gerarSlug("Vulnerabilidade & Risco (BATER / CEMADEN)", 2)).toBe("vulnerabilidade-risco-bater-cemaden");
  });

  it("garante fallback numérico para títulos com apenas símbolos", () => {
    expect(gerarSlug("???", 5)).toBe("secao-5");
    expect(gerarSlug("", 3)).toBe("secao-3");
  });
});
