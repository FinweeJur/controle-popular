import { describe, expect, it } from "vitest";
import { pathValido } from "./validar";

describe("pathValido", () => {
  it("aceita path absoluto simples", () => {
    expect(pathValido("/betim")).toBe(true);
  });

  it("aceita path aninhado", () => {
    expect(pathValido("/betim/prefeitura/contratos")).toBe(true);
  });

  it("aceita a raiz", () => {
    expect(pathValido("/")).toBe(true);
  });

  it("recusa string vazia", () => {
    expect(pathValido("")).toBe(false);
  });

  it("recusa quem não começa com /", () => {
    expect(pathValido("betim")).toBe(false);
  });

  it("recusa URL absoluta", () => {
    expect(pathValido("https://evil.example/betim")).toBe(false);
  });

  it("recusa protocol-relative //host", () => {
    expect(pathValido("//evil.example/betim")).toBe(false);
  });

  it("recusa espaço no meio", () => {
    expect(pathValido("/betim/algo errado")).toBe(false);
  });

  it("recusa string gigante", () => {
    expect(pathValido(`/${"a".repeat(400)}`)).toBe(false);
  });

  it("recusa não-string", () => {
    expect(pathValido(123)).toBe(false);
    expect(pathValido(null)).toBe(false);
    expect(pathValido(undefined)).toBe(false);
  });
});
