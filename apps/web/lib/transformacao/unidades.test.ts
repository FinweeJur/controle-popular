/**
 * Testes de `lib/transformacao/unidades.ts`.
 *
 * Cobrem conversao direta, transitiva, escala, tempo, moeda, ida-e-volta,
 * conversao inexistente e formatacao pt-BR de moeda. O pedido e nomeado
 * (`{ valor, de, para, dominio }`) — ver `Par`/`Pedido` em `unidades.ts`.
 */

import { describe, it, expect } from "vitest";
import cambioDia from "../../data/cambio-dia.json";
import { converter, formatar, tabelaMoeda } from "./unidades";

describe("converter", () => {
  it("direta: quilometro → metro", () => {
    expect(converter({ valor: 1, de: "quilometro", para: "metro", dominio: "comprimento" })).toBe(1000);
  });

  it("transitiva: milha → quilometro", () => {
    expect(converter({ valor: 1, de: "milha", para: "quilometro", dominio: "comprimento" })).toBeCloseTo(1.60934, 5);
  });

  it("escala: unidade → bilhao e bilhao → milhao", () => {
    expect(converter({ valor: 2300000000, de: "unidade", para: "bilhao", dominio: "escala" })).toBeCloseTo(2.3, 10);
    expect(converter({ valor: 2.3, de: "bilhao", para: "milhao", dominio: "escala" })).toBe(2300);
  });

  it("tempo: dia → ano (1460 dias ≈ 4 anos)", () => {
    expect(converter({ valor: 1460, de: "dia", para: "ano", dominio: "tempo" })).toBeCloseTo(4, 5);
  });

  it("ida e volta: hora → dia → hora preserva o valor", () => {
    const horaDia = converter({ valor: 5, de: "hora", para: "dia", dominio: "tempo" });
    expect(converter({ valor: horaDia, de: "dia", para: "hora", dominio: "tempo" })).toBeCloseTo(5, 5);
  });

  it("conversao inexistente lança", () => {
    expect(() => converter({ valor: 1, de: "litro", para: "metro", dominio: "comprimento" })).toThrow();
  });
});

describe("operacao por inteiro (exatidao do piloto da Fase 6)", () => {
  // `x * (1/1e6)` e `x / 1e6` podem diferir em 1 ulp; o portal escrevia
  // `x / 1e6`, entao a conversao tem de bater bit a bit com a divisao.
  it("escala: unidade → milhao e a divisao exata de antes", () => {
    expect(converter({ valor: 49_999_999, de: "unidade", para: "milhao", dominio: "escala" })).toBe(49_999_999 / 1e6);
  });

  it("tempo: dia → ano e a divisao exata de antes", () => {
    expect(converter({ valor: 50, de: "dia", para: "ano", dominio: "tempo" })).toBe(50 / 365);
  });

  it("ida e volta fica exata em escala", () => {
    const ida = converter({ valor: 49_999_999, de: "unidade", para: "milhao", dominio: "escala" });
    expect(converter({ valor: ida, de: "milhao", para: "unidade", dominio: "escala" })).toBe(49_999_999);
  });
});

describe("moeda", () => {
  it("usa a PTAX do dia quando o arquivo tem cotacao valida", () => {
    expect(converter({ valor: 1, de: "dolar", para: "real", dominio: "moeda" })).toBe(cambioDia.cotacoes.USD);
    expect(converter({ valor: 1, de: "euro", para: "real", dominio: "moeda" })).toBe(cambioDia.cotacoes.EUR);
  });

  it("cai no fator de referencia sem cotacao (fallback gracioso)", () => {
    expect(tabelaMoeda(null).dolar.real).toBe(5.5);
    expect(tabelaMoeda({}).real.dolar).toBeCloseTo(1 / 5.5, 12);
    expect(tabelaMoeda({ USD: Number.NaN }).dolar.real).toBe(5.5);
  });

  it("a matriz e coerente com a base em real (ida e volta)", () => {
    const ida = converter({ valor: 418, de: "dolar", para: "real", dominio: "moeda" });
    expect(converter({ valor: ida, de: "real", para: "dolar", dominio: "moeda" })).toBeCloseTo(418, 9);
  });
});

describe("formatar", () => {
  it("moeda em pt-BR contem R$", () => {
    expect(formatar({ valor: 418, de: "dolar", para: "real", dominio: "moeda" })).toContain("R$");
  });
});
