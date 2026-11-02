import { describe, it, expect } from "vitest";
import {
  ESTADOS_INDICADORES,
  PAISES_INTERNACIONAIS,
  INDICADORES_DEFINICOES,
  obterTodosEstados,
  obterEstadoPorUf,
  obterEstadosPorRegiao,
  obterMetricasPorDimensao,
  gerarCsvIndicadores,
} from "./dados-nacionais";

describe("Base de dados nacionais de indicadores cívicos", () => {
  it("contém 28 itens: 27 UFs e a Média Brasil", () => {
    const estados = obterTodosEstados();
    expect(estados).toHaveLength(28);

    const ufs = estados.map((e) => e.uf);
    expect(ufs).toContain("BR");
    expect(ufs).toContain("MG");
    expect(ufs).toContain("SP");
    expect(ufs).toContain("RJ");
    expect(ufs).toContain("BA");
    expect(ufs).toContain("AM");
    expect(ufs).toContain("RS");
  });

  it("recupera estado por UF em maiúsculas ou minúsculas", () => {
    const mg = obterEstadoPorUf("mg");
    expect(mg).toBeDefined();
    expect(mg?.nome).toBe("Minas Gerais");
    expect(mg?.capital).toBe("Belo Horizonte");
    expect(mg?.leitosSusPorMil).toBeGreaterThan(0);
    expect(mg?.idebFundamental).toBeGreaterThan(0);
  });

  it("filtra estados por região geográfica", () => {
    const sul = obterEstadosPorRegiao("Sul");
    expect(sul).toHaveLength(3);
    const ufsSul = sul.map((e) => e.uf).sort();
    expect(ufsSul).toEqual(["PR", "RS", "SC"]);
  });

  it("filtra definições de métricas por dimensão", () => {
    const metricasSaude = obterMetricasPorDimensao("saude");
    expect(metricasSaude.length).toBeGreaterThanOrEqual(4);
    expect(metricasSaude.some((m) => m.id === "leitosSusPorMil")).toBe(true);

    const metricasEducacao = obterMetricasPorDimensao("educacao");
    expect(metricasEducacao.some((m) => m.id === "idebFundamental")).toBe(true);
  });

  it("possui catálogo internacional consistente", () => {
    expect(PAISES_INTERNACIONAIS.length).toBeGreaterThanOrEqual(5);
    const brasil = PAISES_INTERNACIONAIS.find((p) => p.codigoIso3 === "BRA");
    expect(brasil).toBeDefined();
    expect(brasil?.expectativaVida).toBeGreaterThan(70);
  });

  it("gera CSV válido com BOM UTF-8 e delimitador ponto e vírgula", () => {
    const csv = gerarCsvIndicadores(["MG", "SP", "RJ"]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("UF;Estado;Região");
    expect(csv).toContain("Minas Gerais");
    expect(csv).toContain("São Paulo");
    expect(csv).toContain("Rio de Janeiro");
  });
});
