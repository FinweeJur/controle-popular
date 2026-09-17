import { describe, expect, test } from "vitest";
import { obterUrlDocumento } from "./espelho";

describe("obterUrlDocumento — espelho R2 com fallback transparente", () => {
  test("retorna URL original quando não houver espelho R2", () => {
    const url = "https://exemplo.gov.br/documento-inexistente.pdf";
    expect(obterUrlDocumento(url)).toBe(url);
  });

  test("retorna vazio para string vazia ou nula", () => {
    expect(obterUrlDocumento("")).toBe("");
    expect(obterUrlDocumento(null)).toBe("");
    expect(obterUrlDocumento(undefined)).toBe("");
  });
});
