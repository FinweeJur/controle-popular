import { describe, expect, test } from "vitest";
import { formatCurrencyBRL, formatCurrencyCompactaBR } from "./format";

describe("formatCurrencyCompactaBR", () => {
  test("abaixo de R$ 1 mil fica inteiro — o curto nunca troca um valor legível", () => {
    expect(formatCurrencyCompactaBR(0)).toBe(formatCurrencyBRL(0));
    expect(formatCurrencyCompactaBR(999)).toBe(formatCurrencyBRL(999));
    expect(formatCurrencyCompactaBR(999.9)).toBe(formatCurrencyBRL(999.9));
  });

  test("a partir de R$ 1 mil entra o formato curto", () => {
    expect(formatCurrencyCompactaBR(1000)).toBe("R$ 1 mil");
    expect(formatCurrencyCompactaBR(12345)).toBe("R$ 12,3 mil");
    expect(formatCurrencyCompactaBR(922368.78)).toBe("R$ 922,4 mil");
    expect(formatCurrencyCompactaBR(999_999)).toBe("R$ 1 milhão");
  });

  test("milhões com singular e plural", () => {
    expect(formatCurrencyCompactaBR(1_000_000)).toBe("R$ 1 milhão");
    expect(formatCurrencyCompactaBR(2_400_000)).toBe("R$ 2,4 milhões");
    expect(formatCurrencyCompactaBR(92_600_000)).toBe("R$ 92,6 milhões");
  });

  test("bilhões com singular e plural", () => {
    expect(formatCurrencyCompactaBR(1_000_000_000)).toBe("R$ 1 bilhão");
    expect(formatCurrencyCompactaBR(2_400_000_000)).toBe("R$ 2,4 bilhões");
    expect(formatCurrencyCompactaBR(37_600_000_000)).toBe("R$ 37,6 bilhões");
  });

  test("trilhão existe para o caso que ainda não veio", () => {
    expect(formatCurrencyCompactaBR(1_500_000_000_000)).toBe("R$ 1,5 trilhão");
  });

  test("negativo mantém o sinal do formatador canônico", () => {
    expect(formatCurrencyCompactaBR(-12345)).toBe("-R$ 12,3 mil");
    expect(formatCurrencyCompactaBR(-999)).toBe(formatCurrencyBRL(-999));
  });
});