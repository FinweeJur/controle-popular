import { describe, it, expect } from "vitest";
import {
  listarAcoesClimaticasJuma,
  acoesJumaPorMunicipioOuUf,
  listarTesesTJMG,
  processosSirenejudPorMunicipio,
  obterPanoramaJudicial,
} from "./jurisprudencia-clima-barragens";

describe("Jurisprudência Socioambiental: Juma, SIRENEJud e TJMG", () => {
  it("carrega as ações climáticas catalogadas do Juma", () => {
    const acoes = listarAcoesClimaticasJuma();
    expect(acoes.length).toBeGreaterThanOrEqual(8);

    for (const a of acoes) {
      expect(a.id.trim().length).toBeGreaterThan(0);
      expect(a.titulo.trim().length).toBeGreaterThan(5);
      expect(a.numeroProcesso.trim().length).toBeGreaterThan(3);
      expect(a.resumo.trim().length).toBeGreaterThan(20);
      expect(a.principaisNormas.length).toBeGreaterThan(0);
    }
  });

  it("filtra ações do Juma por município", () => {
    const mariana = acoesJumaPorMunicipioOuUf("Mariana");
    expect(mariana.length).toBeGreaterThanOrEqual(2); // Samarco Germano e Rio Doce

    const bh = acoesJumaPorMunicipioOuUf("Belo Horizonte");
    expect(bh.length).toBeGreaterThanOrEqual(2); // Serra do Taquaril e FUNCAP
  });

  it("carrega teses consolidadas do TJMG sobre barragens (pesquisa NACAB)", () => {
    const teses = listarTesesTJMG();
    expect(teses.length).toBe(5);

    const temas = teses.map((t) => t.tema);
    expect(temas).toContain("Interrupção Prolongada do Fornecimento de Água Potável");
    expect(temas).toContain("Inversão do Ônus da Prova e Vulnerabilidade Técnica");
    expect(temas).toContain("Legitimidade de Pescadores e Lavradores Informais");
  });

  it("cruza com processos ambientais reais do SIRENEJud/CNJ", () => {
    const gv = processosSirenejudPorMunicipio("3127701"); // Gov. Valadares
    expect(gv).toBeDefined();
    expect(gv?.total).toBeGreaterThan(100000); // 108.612 processos

    const betim = processosSirenejudPorMunicipio("Betim");
    expect(betim).toBeDefined();
    expect(betim?.total).toBeGreaterThan(1000);
  });

  it("obterPanoramaJudicial entrega visão integrada para um município", () => {
    const panoramaMariana = obterPanoramaJudicial("Mariana", "3140001");
    expect(panoramaMariana.cidade).toBe("Mariana");
    expect(panoramaMariana.acoesClimaticasJuma.length).toBeGreaterThanOrEqual(1);
    expect(panoramaMariana.sirenejudProcessos).toBeDefined();
    expect(panoramaMariana.tesesTJMG.length).toBeGreaterThan(0);
  });
});
