import { describe, expect, test } from "vitest";
import { converter, UNIDADES, unidadesPorCategoria } from "./medidas";

describe("converter", () => {
  test("converte dentro da categoria", () => {
    expect(converter(1, "km", "m")).toBe(1000);
    expect(converter(1, "ha", "m2")).toBe(10000);
    expect(converter(1000, "l", "m3")).toBe(1);
    expect(converter(1, "t", "kg")).toBe(1000);
  });

  test("alqueires têm valores distintos por estado", () => {
    expect(converter(1, "alq-mg", "ha")).toBeCloseTo(4.84, 2);
    expect(converter(1, "alq-sp", "ha")).toBeCloseTo(2.42, 2);
    expect(converter(1, "alq-go", "ha")).toBeCloseTo(9.68, 2);
  });

  test("recusa converter entre categorias diferentes", () => {
    expect(converter(1, "m", "l")).toBeNull();
    expect(converter(1, "kg", "km")).toBeNull();
  });

  test("recusa unidade inexistente e valor inválido", () => {
    expect(converter(1, "xxx", "m")).toBeNull();
    expect(converter(Number.NaN, "m", "km")).toBeNull();
  });
});

describe("unidadesPorCategoria", () => {
  test("agrupa sem misturar categorias", () => {
    const area = unidadesPorCategoria("area");
    expect(area.length).toBeGreaterThan(0);
    expect(area.every((u) => u.categoria === "area")).toBe(true);
  });

  test("não há id repetido na tabela", () => {
    const ids = new Set(UNIDADES.map((u) => u.id));
    expect(ids.size).toBe(UNIDADES.length);
  });
});
