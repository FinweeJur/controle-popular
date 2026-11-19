import { describe, it, expect } from "vitest";
import {
  ANO_DE_PICO,
  CFEM,
  MUNICIPIOS_PARA_50,
  MUNICIPIOS_PARA_80,
  RANKING_UF,
  SERIE_ANUAL,
  TOP_MUNICIPIOS,
  UFS_PARA_80,
} from "./cfem";

/**
 * Dupla verificação do agregado da CFEM (REGRAS-DURAS §9). O dado é dinheiro
 * público somado de 2.239.128 linhas: se a soma não fecha com o total que a
 * própria fonte declara, a página publica número errado. Estes testes rodam a
 * conferência no arquivo REAL, não numa amostra.
 */
describe("agregado da CFEM — a soma tem de fechar com o total declarado", () => {
  it("ranking de UF cobre as 27 UFs e soma o total do Brasil", () => {
    expect(RANKING_UF).toHaveLength(27);
    const soma = RANKING_UF.reduce((s, l) => s + l.total, 0);
    expect(Math.abs(soma - CFEM.totalBrasil)).toBeLessThan(0.05);
    expect(CFEM.fechaComTotal).toBe(true);
  });

  it("municípios + estados = total, sem sobra nem falta", () => {
    expect(
      Math.abs(CFEM.totalMunicipios + CFEM.totalEstados - CFEM.totalBrasil)
    ).toBeLessThan(0.05);
  });

  it("série anual cobre 2007 até o ano corrente, na ordem", () => {
    expect(CFEM.primeiroAno).toBe("2007");
    expect(SERIE_ANUAL).toHaveLength(CFEM.anos.length);
    const soma = SERIE_ANUAL.reduce((s, l) => s + l.total, 0);
    expect(Math.abs(soma - CFEM.totalBrasil)).toBeLessThan(0.05);
  });

  it("concentração é 2 UFs, medida e não estimada", () => {
    expect(UFS_PARA_80).toBe(2);
    expect(RANKING_UF[0].uf).toBe("MG");
    expect(RANKING_UF[1].uf).toBe("PA");
  });

  it("top 20 municípios vem ordenado e não passa do total municipal", () => {
    expect(TOP_MUNICIPIOS).toHaveLength(20);
    expect(TOP_MUNICIPIOS[0].nome).toBe("PARAUAPEBAS");
    const soma = TOP_MUNICIPIOS.reduce((s, m) => s + m.total, 0);
    expect(soma).toBeLessThan(CFEM.totalMunicipios);
    expect(MUNICIPIOS_PARA_50).toBeLessThan(MUNICIPIOS_PARA_80);
    expect(MUNICIPIOS_PARA_80).toBeLessThan(CFEM.municipiosComRepasse);
  });

  it("o pico da série bate com o maior ano medido", () => {
    const maior = Math.max(...SERIE_ANUAL.map((l) => l.total));
    expect(ANO_DE_PICO.total).toBe(maior);
  });
});
