/**
 * Testes de `lib/transformacao/unidades.ts`.
 *
 * Cobrem conversao direta, transitiva, escala, tempo, moeda, ida-e-volta,
 * conversao inexistente e formatacao pt-BR de moeda.
 */

import { describe, it, expect } from "vitest";
import { converter, formatar } from "./unidades";

describe("converter", () => {
  it("direta: quilometro → metro", () => {
    expect(converter(1, "quilometro", "metro", "comprimento")).toBe(1000);
  });

  it("transitiva: milha → quilometro", () => {
    expect(converter(1, "milha", "quilometro", "comprimento")).toBeCloseTo(1.60934, 5);
  });

  it("escala: unidade → bilhao e bilhao → milhao", () => {
    expect(converter(2300000000, "unidade", "bilhao", "escala")).toBeCloseTo(2.3, 10);
    expect(converter(2.3, "bilhao", "milhao", "escala")).toBe(2300);
  });

  it("tempo: dia → ano (1460 dias ≈ 4 anos)", () => {
    expect(converter(1460, "dia", "ano", "tempo")).toBeCloseTo(4, 5);
  });

  it("moeda com fator fixo: dolar → real", () => {
    expect(converter(418, "dolar", "real", "moeda")).toBeCloseTo(2299, 0);
  });

  it("ida e volta: hora → dia → hora preserva o valor", () => {
    expect(converter(converter(5, "hora", "dia", "tempo"), "dia", "hora", "tempo")).toBeCloseTo(5, 5);
  });

  it("conversao inexistente lança", () => {
    expect(() => converter(1, "litro", "metro", "comprimento")).toThrow();
  });
});

describe("formatar", () => {
  it("moeda em pt-BR contem R$", () => {
    expect(formatar(418, "dolar", "real", "moeda")).toContain("R$");
  });
});
