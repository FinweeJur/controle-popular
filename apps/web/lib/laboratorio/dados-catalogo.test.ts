import { describe, it, expect } from "vitest";
import {
  CATALOGO_DADOS,
  obterDadoPorId,
  listarPorCategoria,
  listarCategorias,
} from "./dados-catalogo";

describe("dados-catalogo", () => {
  it("CATALOGO_DADOS is an array", () => {
    expect(Array.isArray(CATALOGO_DADOS)).toBe(true);
  });

  it("contém as fontes novas (Antigravity, 19/09)", () => {
    for (const id of [
      "legislativo-estaduais",
      "fornecedores-multinacionais",
      "acordos-internacionais",
      "pncp-mg",
    ]) {
      expect(obterDadoPorId(id)).toBeDefined();
    }
  });

  it("novas fontes geram séries dither não vazias", () => {
    for (const id of [
      "legislativo-estaduais",
      "fornecedores-multinacionais",
      "acordos-internacionais",
      "pncp-mg",
    ]) {
      const dado = obterDadoPorId(id);
      expect(dado?.dadosParaDither().length).toBeGreaterThan(0);
    }
  });

  it("obterDadoPorId returns undefined for missing", () => {
    expect(obterDadoPorId("nonexistent")).toBeUndefined();
  });

  it("listarCategorias returns an array", () => {
    const cats = listarCategorias();
    expect(Array.isArray(cats)).toBe(true);
  });
});
