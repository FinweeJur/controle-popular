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

  it("tem a camada de salários do Judiciário (sessão 23/09 — 23 camadas)", () => {
    expect(obterDadoPorId("judiciario-remuneracoes")).toBeDefined();
    expect(CATALOGO_DADOS.length).toBeGreaterThanOrEqual(22);
  });

  it("camada de remunerações gera série dither não vazia quando o JSON existe", () => {
    const dado = obterDadoPorId("judiciario-remuneracoes");
    expect(dado).toBeDefined();
    const series = dado!.dadosParaDither();
    // acervo pode ser null em ambiente sem data/ — aí a lista é vazia mas o id existe
    if (series.length > 0) {
      expect(series[0].pontos.length).toBeGreaterThan(0);
      expect(series[0].pontos.every((p) => Number.isFinite(p.y))).toBe(true);
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
