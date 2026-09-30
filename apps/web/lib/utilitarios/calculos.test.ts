import { describe, expect, test } from "vitest";
import {
  arredondar,
  formatarMoedaBR,
  formatarNumeroBR,
  perCapita,
  percentualDe,
  quantoRepresenta,
  regraDeTres,
} from "./calculos";

describe("percentualDe", () => {
  test("calcula percentual simples", () => {
    expect(percentualDe(1000, 15)).toBe(150);
    expect(percentualDe(200, 0)).toBe(0);
  });

  test("devolve null para entrada inválida", () => {
    expect(percentualDe(Number.NaN, 10)).toBeNull();
    expect(percentualDe(100, Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe("quantoRepresenta", () => {
  test("acha a fatia percentual", () => {
    expect(quantoRepresenta(30, 120)).toBe(25);
    expect(quantoRepresenta(50, 50)).toBe(100);
  });

  test("nunca divide por zero — devolve null", () => {
    expect(quantoRepresenta(10, 0)).toBeNull();
  });
});

describe("perCapita", () => {
  test("divide o total pela população", () => {
    expect(perCapita(1000000, 1000)).toBe(1000);
  });

  test("população zero ou negativa devolve null", () => {
    expect(perCapita(1000, 0)).toBeNull();
    expect(perCapita(1000, -5)).toBeNull();
  });
});

describe("regraDeTres", () => {
  test("resolve a proporção", () => {
    // Se 2 corresponde a 10, então 6 corresponde a 30.
    expect(regraDeTres(2, 10, 6)).toBe(30);
  });

  test("base zero devolve null", () => {
    expect(regraDeTres(0, 10, 6)).toBeNull();
  });
});

describe("arredondar", () => {
  test("arredonda para o número de casas pedido", () => {
    expect(arredondar(1.005, 2)).toBe(1.01);
    expect(arredondar(2.3456, 3)).toBe(2.346);
  });
});

describe("formatação brasileira", () => {
  test("número usa vírgula decimal e ponto de milhar", () => {
    // Intl insere espaço não separável (NBSP) entre R$ e o valor.
    expect(formatarNumeroBR(1234.5)).toBe("1.234,50");
    expect(formatarMoedaBR(1234.5).replace(/\u00A0/g, " ")).toBe("R$ 1.234,50");
  });
});
