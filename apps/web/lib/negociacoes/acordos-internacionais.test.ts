import { describe, it, expect } from "vitest";
import {
  obterAcordosELicitacoesInternacionais,
  calcularAgregadosNegociacoes,
  gerarCsvAcordosInternacionais,
} from "./acordos-internacionais";

describe("acordos-internacionais", () => {
  it("carrega a base de acordos e licitações internacionais com os 7 setores", () => {
    const itens = obterAcordosELicitacoesInternacionais();
    expect(itens).toBeDefined();
    expect(itens.length).toBeGreaterThan(0);

    const setores = new Set(itens.map((i) => i.setor));
    expect(setores.has("mineracao")).toBe(true);
    expect(setores.has("energia")).toBe(true);
    expect(setores.has("infraestrutura")).toBe(true);
    expect(setores.has("saude")).toBe(true);
    expect(setores.has("tecnologia")).toBe(true);
    expect(setores.has("educacao")).toBe(true);
    expect(setores.has("construcao_civil")).toBe(true);
    expect(itens.some((i) => i.paises.includes("China"))).toBe(true);
  });

  it("calcula agregados financeiros e quantitativos corretamente", () => {
    const itens = obterAcordosELicitacoesInternacionais();
    const agregados = calcularAgregadosNegociacoes(itens);

    expect(agregados.totalItens).toBe(itens.length);
    expect(agregados.valorTotalBrl).toBeGreaterThan(0);
    expect(agregados.valorTotalUsd).toBeGreaterThan(0);
    expect(agregados.totalEditaisAbertos).toBeGreaterThan(0);
    expect(agregados.totalSetores).toBe(7);
    expect(agregados.totalPaisesEnvolvidos).toBeGreaterThan(5);
  });

  it("gera CSV com cabeçalho, BOM UTF-8 e delimitador ';'", () => {
    const itens = obterAcordosELicitacoesInternacionais();
    const csv = gerarCsvAcordosInternacionais(itens);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Título do Acordo/Edital;Setor;Tipo de Instrumento");
    expect(csv).toContain("Mineração & Minerais Críticos");
    expect(csv).toContain("Estados Unidos");
  });
});
