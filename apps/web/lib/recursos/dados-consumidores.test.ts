/**
 * @file apps/web/lib/recursos/dados-consumidores.test.ts
 * @description Testes unitários para o módulo de maiores consumidores de água, energia,
 * combustível, empregos e capital em Minas Gerais e nos 20 países do G20.
 */

import { describe, it, expect } from "vitest";
import {
  obterTop50ConsumidoresMg,
  obterConsumoPaisesG20,
  obterPegadaEIntensidadeSetorial,
  obterTop5ConsumidoresPorMunicipio,
  gerarFatiasDonutMg,
  calcularEquivalenciaPopulacionalAgua,
  calcularEquivalenciaResidencialEnergia,
  exportarCsvConsumidoresMg,
  exportarCsvConsumoG20,
  COBERTURA_CONSUMIDORES_RECURSOS,
} from "./dados-consumidores";

describe("Módulo de Maiores Consumidores Corporativos e Setoriais (MG + G20)", () => {
  it("carrega exatamente os 50 maiores consumidores de Minas Gerais com links oficiais", () => {
    const mg = obterTop50ConsumidoresMg();
    expect(mg).toHaveLength(50);
    expect(COBERTURA_CONSUMIDORES_RECURSOS.totalEmpresasMg).toBe(50);

    for (const item of mg) {
      expect(item.id).toBeTruthy();
      expect(item.empresa).toBeTruthy();
      expect(item.codigoIbgeMunicipio).toHaveLength(7);
      expect(item.aguaOutorgadaM3Ano).toBeGreaterThan(0);
      expect(item.energiaConsumidaMwhAno).toBeGreaterThan(0);
      expect(item.combustivelLitrosAno).toBeGreaterThan(0);
      expect(item.empregosDiretos).toBeGreaterThan(0);
      expect(item.capitalMovimentadoBrl).toBeGreaterThan(0);
      expect(item.urlFonteAgua.startsWith("https://")).toBe(true);
      expect(item.urlFonteEnergia.startsWith("https://")).toBe(true);
      expect(item.urlFonteCombustivel.startsWith("https://")).toBe(true);
      expect(item.urlFonteEmpregoCapital.startsWith("https://")).toBe(true);
    }
  });

  it("carrega todos os 20 membros do G20 com dados de água, energia, combustível e tarifas", () => {
    const g20 = obterConsumoPaisesG20();
    expect(g20).toHaveLength(20);
    expect(COBERTURA_CONSUMIDORES_RECURSOS.totalPaisesG20).toBe(20);

    const isos = g20.map((p) => p.codigoIso3);
    expect(isos).toContain("BRA");
    expect(isos).toContain("USA");
    expect(isos).toContain("CAN");
    expect(isos).toContain("CHN");
    expect(isos).toContain("DEU");
    expect(isos).toContain("GBR");
    expect(isos).toContain("FRA");
    expect(isos).toContain("ITA");
    expect(isos).toContain("IND");
    expect(isos).toContain("JPN");
    expect(isos).toContain("AUS");
    expect(isos).toContain("KOR");
    expect(isos).toContain("SAU");
    expect(isos).toContain("ZAF");
    expect(isos).toContain("MEX");
    expect(isos).toContain("ARG");
    expect(isos).toContain("RUS");
    expect(isos).toContain("IDN");
    expect(isos).toContain("TUR");
    expect(isos).toContain("EUU");

    for (const p of g20) {
      expect(p.retiradaAguaTotalBilhoesM3Ano).toBeGreaterThan(0);
      expect(p.energiaEletricaTotalTwhAno).toBeGreaterThan(0);
      expect(p.urlFonteOficial.startsWith("https://")).toBe(true);
      expect(p.urlWorldBank.startsWith("https://")).toBe(true);
    }
  });

  it("calcula corretamente o Top 5 por município (Betim, Belo Horizonte e cidades sem megaplanta)", () => {
    // Betim (3106705) tem REGAP e Stellantis instaladas localmente
    const betim = obterTop5ConsumidoresPorMunicipio("3106705", "Betim", "combustivel");
    expect(betim.temPlantaMegaconsumidoraLocal).toBe(true);
    expect(betim.itensTop5).toHaveLength(5);
    expect(betim.itensTop5[0].municipioNome).toBe("Betim");
    expect(betim.itensTop5[0].escopoLocal).toBe("Planta Local no Município");
    expect(betim.fatorDesigualdadeAgua).toBeGreaterThan(100);
    expect(betim.fatorDesigualdadeEnergia).toBeGreaterThan(2);

    // Município pequeno sem megaplanta no Top 50 recebe os 5 maiores operadores estaduais
    const cidadePequena = obterTop5ConsumidoresPorMunicipio("3100104", "Abadia dos Dourados", "agua");
    expect(cidadePequena.temPlantaMegaconsumidoraLocal).toBe(false);
    expect(cidadePequena.itensTop5).toHaveLength(5);
    expect(cidadePequena.itensTop5[0].escopoLocal).toBe("Concessão / Rede Estadual na Região");
  });

  it("gera fatias de Donut Chart que fecham 100% com a fatia complementar", () => {
    const mg = obterTop50ConsumidoresMg();
    const donutAgua = gerarFatiasDonutMg(mg, "agua", 5);
    expect(donutAgua.fatias).toHaveLength(6); // Top 5 + Restante
    expect(donutAgua.percentualConcentradoTop).toBeGreaterThan(0);
    expect(donutAgua.percentualConcentradoTop).toBeLessThan(100);

    const ultimaFatia = donutAgua.fatias[donutAgua.fatias.length - 1];
    expect(ultimaFatia.ehRestante).toBe(true);
  });

  it("calcula equivalência populacional hídrica e residencial elétrica e exporta CSV com BOM UTF-8", () => {
    // 40.150.000 m³/ano = ~1.000.000 de habitantes pelo padrão OMS (40,15 m³/hab/ano)
    expect(calcularEquivalenciaPopulacionalAgua(40_150_000)).toBe(1_000_000);
    expect(calcularEquivalenciaResidencialEnergia(1_920_000)).toBe(1_000_000);

    const pegada = obterPegadaEIntensidadeSetorial();
    expect(pegada.length).toBeGreaterThanOrEqual(8);

    const csvMg = exportarCsvConsumidoresMg(obterTop50ConsumidoresMg().slice(0, 3));
    expect(csvMg.startsWith("\uFEFF")).toBe(true);
    expect(csvMg).toContain("Ranking;Empresa / Planta;Grupo Econômico");

    const csvG20 = exportarCsvConsumoG20(obterConsumoPaisesG20().slice(0, 3));
    expect(csvG20.startsWith("\uFEFF")).toBe(true);
    expect(csvG20).toContain("País;ISO-3;Continente");
  });
});
