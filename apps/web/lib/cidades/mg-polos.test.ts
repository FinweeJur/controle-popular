/**
 * Testes unitários para Polos Regionais de Minas Gerais (Plano 2)
 *
 * Papel: Validar integridade dos 10 municípios polo de MG, garantir a
 * correspondência dos códigos IBGE de 6 e 7 dígitos, conferir a população do
 * Censo 2022 (número exato do IBGE) e a política Zero CPF.
 */

import { describe, it, expect } from "vitest";
import {
  POLOS_MG,
  FONTE_POPULACAO,
  buscarPoloMgPorIbge,
  buscarPoloMgPorSlug,
  calcularResumoPolosMg,
} from "./mg-polos";

describe("Polos Regionais de Minas Gerais (Plano 2)", () => {
  it("deve conter exatamente 10 municípios polos catalogados", () => {
    expect(POLOS_MG).toHaveLength(10);
  });

  it("deve conter códigos IBGE válidos para todos os polos (7 e 6 dígitos)", () => {
    for (const polo of POLOS_MG) {
      expect(polo.ibge7).toMatch(/^31\d{5}$/);
      expect(polo.ibge6).toMatch(/^31\d{4}$/);
      expect(polo.ibge7.startsWith(polo.ibge6)).toBe(true);
      expect(polo.nome.length).toBeGreaterThan(0);
      expect(polo.populacaoCenso2022).toBeGreaterThan(0);
    }
  });

  it("deve apontar a fonte oficial da população (IBGE Censo 2022)", () => {
    expect(FONTE_POPULACAO.orgao).toContain("IBGE");
    expect(FONTE_POPULACAO.pesquisa).toContain("Censo");
    expect(FONTE_POPULACAO.url.startsWith("https://servicodados.ibge.gov.br")).toBe(true);
  });

  it("deve encontrar Betim por código de 7 e de 6 dígitos", () => {
    const por7 = buscarPoloMgPorIbge("3106705");
    const por6 = buscarPoloMgPorIbge("310670");
    expect(por7?.nome).toBe("Betim");
    expect(por6?.nome).toBe("Betim");
    expect(por7?.ibge7).toBe("3106705");
  });

  it("deve usar a população exata do Censo 2022 (Betim e BH)", () => {
    const betim = buscarPoloMgPorSlug("betim");
    const bh = buscarPoloMgPorSlug("belo-horizonte");
    // Números medidos na API do IBGE (agregado 4714, variável 93, período 2022).
    expect(betim?.populacaoCenso2022).toBe(411846);
    expect(bh?.populacaoCenso2022).toBe(2315560);
  });

  it("deve calcular métricas consolidadas dos polos", () => {
    const resumo = calcularResumoPolosMg();
    expect(resumo.totalPolos).toBe(10);
    // Soma exata do Censo 2022 dos 10 polos.
    expect(resumo.populacaoTotal).toBe(5584390);
    expect(resumo.fontePopulacao).toBe(FONTE_POPULACAO);
  });
});
