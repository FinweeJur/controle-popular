import { describe, it, expect } from "vitest";
import { slugDeTitulo } from "./indice-pagina";

/**
 * O slug do sumário é o que o link `#ancora` usa. Testa a função REAL do
 * componente `IndicePagina` (antes este arquivo reimplementava o slug inline —
 * teste que passava sem exercitar o código).
 */
describe("slugDeTitulo — âncora do sumário de página", () => {
  it("gera slugs sem acentos e válidos para âncoras HTML", () => {
    expect(slugDeTitulo("1. Gráficos de Distribuição Regional", 0)).toBe(
      "1-graficos-de-distribuicao-regional"
    );
    expect(slugDeTitulo("Quem tem direito à indenização?", 1)).toBe(
      "quem-tem-direito-a-indenizacao"
    );
    expect(slugDeTitulo("Vulnerabilidade & Risco (BATER / CEMADEN)", 2)).toBe(
      "vulnerabilidade-risco-bater-cemaden"
    );
  });

  it("garante fallback numérico para títulos com apenas símbolos", () => {
    expect(slugDeTitulo("???", 5)).toBe("secao-5");
    expect(slugDeTitulo("", 3)).toBe("secao-3");
  });
});
