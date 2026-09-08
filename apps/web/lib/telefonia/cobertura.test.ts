import { describe, it, expect } from "vitest";
import { obterCoberturaTelefonia, obterRankingOperadoras } from "./cobertura";

describe("cobertura de telefonia municipal", () => {
  it("devolve dados de Betim com lider TIM e presenca de 5G", () => {
    const betim = obterCoberturaTelefonia("3106705");
    expect(betim).not.toBeNull();
    expect(betim?.municipio).toBe("Betim");
    expect(betim?.total_torres).toBeGreaterThan(200);
    expect(betim?.tem_5g).toBe(true);
    expect(betim?.lider?.operadora).toBe("TIM");
    expect(betim?.lider?.geracao_max).toBe("5G");
    expect(betim?.ranking.length).toBeGreaterThanOrEqual(3);
  });

  it("devolve dados de Belo Horizonte com mais de mil torres", () => {
    const bh = obterCoberturaTelefonia("3106200");
    expect(bh).not.toBeNull();
    expect(bh?.municipio).toBe("Belo Horizonte");
    expect(bh?.total_torres).toBeGreaterThan(1000);
    expect(bh?.tem_5g).toBe(true);
  });

  it("devolve dados de Diamantina com lider Vivo", () => {
    const diam = obterCoberturaTelefonia("3121605");
    expect(diam).not.toBeNull();
    expect(diam?.municipio).toBe("Diamantina");
    expect(diam?.lider?.operadora).toBe("Vivo");
  });

  it("devolve dados de Aracuai e Itinga no Vale do Jequitinhonha", () => {
    const aracuai = obterCoberturaTelefonia("3103405");
    expect(aracuai).not.toBeNull();
    expect(aracuai?.lider?.operadora).toBe("Vivo");

    const itinga = obterCoberturaTelefonia("3134004");
    expect(itinga).not.toBeNull();
    expect(itinga?.lider?.operadora).toBe("Vivo");
    expect(itinga?.ranking.length).toBeGreaterThanOrEqual(1);
  });

  it("ranking vem ordenado decrescente por quantidade de torres", () => {
    const ranking = obterRankingOperadoras("3106705");
    expect(ranking.length).toBeGreaterThan(0);
    for (let i = 1; i < ranking.length; i++) {
      expect(ranking[i - 1].torres).toBeGreaterThanOrEqual(ranking[i].torres);
    }
  });

  it("devolve null para municipios fora de MG ou codigos inexistentes", () => {
    expect(obterCoberturaTelefonia("3550308")).toBeNull(); // Sao Paulo
    expect(obterCoberturaTelefonia("9999999")).toBeNull();
    expect(obterCoberturaTelefonia("")).toBeNull();
    expect(obterRankingOperadoras("9999999")).toEqual([]);
  });
});
