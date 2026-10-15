/**
 * Testes de `lib/transformacao/unidades.ts`.
 *
 * Cobrem conversao direta, transitiva, escala, tempo, moeda, ida-e-volta,
 * conversao inexistente e formatacao pt-BR de moeda.
 */

import { describe, it, expect } from "vitest";
import cambioDia from "../../data/cambio-dia.json";
import { converter, formatar, tabelaMoeda } from "./unidades";

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

  it("ida e volta: hora → dia → hora preserva o valor", () => {
    expect(converter(converter(5, "hora", "dia", "tempo"), "dia", "hora", "tempo")).toBeCloseTo(5, 5);
  });

  it("conversao inexistente lança", () => {
    expect(() => converter(1, "litro", "metro", "comprimento")).toThrow();
  });
});

describe("operacao por inteiro (exatidao do piloto da Fase 6)", () => {
  // `x * (1/1e6)` e `x / 1e6` podem diferir em 1 ulp; o portal escrevia
  // `x / 1e6`, entao a conversao tem de bater bit a bit com a divisao.
  it("escala: unidade → milhao e a divisao exata de antes", () => {
    expect(converter(49_999_999, "unidade", "milhao", "escala")).toBe(49_999_999 / 1e6);
  });

  it("tempo: dia → ano e a divisao exata de antes", () => {
    expect(converter(50, "dia", "ano", "tempo")).toBe(50 / 365);
  });

  it("ida e volta fica exata em escala", () => {
    expect(converter(converter(49_999_999, "unidade", "milhao", "escala"), "milhao", "unidade", "escala")).toBe(
      49_999_999
    );
  });
});

describe("moeda", () => {
  it("usa a PTAX do dia quando o arquivo tem cotacao valida", () => {
    expect(converter(1, "dolar", "real", "moeda")).toBe(cambioDia.cotacoes.USD);
    expect(converter(1, "euro", "real", "moeda")).toBe(cambioDia.cotacoes.EUR);
  });

  it("cai no fator de referencia sem cotacao (fallback gracioso)", () => {
    expect(tabelaMoeda(null).dolar.real).toBe(5.5);
    expect(tabelaMoeda({}).real.dolar).toBeCloseTo(1 / 5.5, 12);
    expect(tabelaMoeda({ USD: Number.NaN }).dolar.real).toBe(5.5);
  });

  it("a matriz e coerente com a base em real (ida e volta)", () => {
    const ida = converter(418, "dolar", "real", "moeda");
    expect(converter(ida, "real", "dolar", "moeda")).toBeCloseTo(418, 9);
  });
});

describe("formatar", () => {
  it("moeda em pt-BR contem R$", () => {
    expect(formatar(418, "dolar", "real", "moeda")).toContain("R$");
  });
});
