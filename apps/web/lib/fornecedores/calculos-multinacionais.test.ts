import { describe, it, expect } from "vitest";
import {
  obterFornecedoresMultinacionais,
  calcularAgregadosMultinacionais,
  formatarMoedaBrl,
  formatarMoedaUsd,
  gerarCsvFornecedoresMultinacionais,
} from "./calculos-multinacionais";

describe("calculos-multinacionais", () => {
  it("carrega a lista de fornecedores multinacionais sem erro", () => {
    const empresas = obterFornecedoresMultinacionais();
    expect(empresas).toBeDefined();
    expect(empresas.length).toBeGreaterThan(0);
    expect(empresas.some((e) => e.id === "msft")).toBe(true);
    expect(empresas.some((e) => e.id === "saab")).toBe(true);
    expect(empresas.some((e) => e.id === "aecom")).toBe(true);
    expect(empresas.some((e) => e.id === "state-grid")).toBe(true);
    expect(empresas.some((e) => e.pais_origem === "China")).toBe(true);
  });

  it("calcula agregados financeiros e percentuais corretamente", () => {
    const empresas = obterFornecedoresMultinacionais();
    const agregados = calcularAgregadosMultinacionais(empresas);

    expect(agregados.totalEmpresas).toBe(empresas.length);
    expect(agregados.totalContratosBrl).toBeGreaterThan(0);
    expect(agregados.totalContratosUsd).toBeGreaterThan(0);
    expect(agregados.totalComContrapartida).toBeGreaterThan(0);
    expect(agregados.pctComContrapartida).toBeGreaterThanOrEqual(0);
    expect(agregados.pctComContrapartida).toBeLessThanOrEqual(100);
  });

  it("formata moeda em BRL e USD adequadamente", () => {
    expect(formatarMoedaBrl(3_500_000_000)).toContain("R$ 3,5");
    expect(formatarMoedaBrl(3_500_000_000)).toContain("bi");
    expect(formatarMoedaUsd(700_000_000)).toContain("US$ 700");
    expect(formatarMoedaUsd(700_000_000)).toContain("mi");
  });

  it("gera CSV no padrão de 5 coisas com BOM UTF-8 e separador ';'", () => {
    const empresas = obterFornecedoresMultinacionais();
    const csv = gerarCsvFornecedoresMultinacionais(empresas);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Empresa;País;Continente");
    expect(csv).toContain("Microsoft Corporation");
    expect(csv).toContain("Saab AB");
  });
});
