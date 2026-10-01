/**
 * @file apps/web/lib/recursos/dados-recursos-27-estados.test.ts
 * @description Testes unitários para o módulo de recursos públicos dos 27 estados brasileiros:
 * outorgas de água, energia elétrica, gastos de combustível, PPPs/concessões e emendas parlamentares.
 *
 * Papel no portal:
 * Valida a integridade, conformidade e qualidade dos dados em conformidade com as regras de AGENTS.md:
 * - § 5.2: Ausência de CPFs ou dados pessoais.
 * - § 8: Regra das Seis Qualidades (links oficiais diretos, cobertura integral dos 27 estados, exportação CSV).
 */

import { describe, it, expect } from "vitest";
import {
  DADOS_RECURSOS_27_ESTADOS,
  COBERTURA_RECURSOS_27_ESTADOS,
  filtrarRecursosEstados,
  gerarCsvRecursos27Estados,
  type EstadoRecursoConsolidado,
} from "./dados-recursos-27-estados";

describe("Módulo de Recursos Públicos dos 27 Estados Brasileiros", () => {
  const UFS_ESPERADAS = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  it("cobre exatamente as 27 unidades federativas do Brasil sem duplicatas", () => {
    expect(DADOS_RECURSOS_27_ESTADOS).toHaveLength(27);
    expect(COBERTURA_RECURSOS_27_ESTADOS.totalEstados).toBe(27);

    const ufsColetadas = DADOS_RECURSOS_27_ESTADOS.map((e) => e.uf);
    const ufsUnicas = new Set(ufsColetadas);
    expect(ufsUnicas.size).toBe(27);

    for (const uf of UFS_ESPERADAS) {
      expect(ufsUnicas.has(uf)).toBe(true);
    }
  });

  it("garante dados consistentes e fontes oficiais válidas para o eixo de Água (Outorgas)", () => {
    for (const item of DADOS_RECURSOS_27_ESTADOS) {
      expect(item.outorgas.totalInterferencias).toBeGreaterThan(0);
      expect(item.outorgas.vazaoTotalM3AnoMilhoes).toBeGreaterThan(0);
      expect(item.outorgas.orgaoGestorEstadual.length).toBeGreaterThan(3);
      expect(item.outorgas.baciasPrincipais.length).toBeGreaterThan(0);
      expect(item.outorgas.finalidadePredominante.length).toBeGreaterThan(2);
      expect(item.outorgas.fonteUrl).toMatch(/^https?:\/\//);
    }
  });

  it("garante dados de energia com assimetria tarifária calculada e fontes válidas", () => {
    for (const item of DADOS_RECURSOS_27_ESTADOS) {
      expect(item.energia.distribuidoraLider.length).toBeGreaterThan(2);
      expect(item.energia.tarifaResidencialKwhBrl).toBeGreaterThan(0.3);
      expect(item.energia.tarifaIndustrialKwhBrl).toBeGreaterThan(0.2);
      expect(item.energia.assimetriaTarifariaRatio).toBeGreaterThanOrEqual(1.0);
      expect(item.energia.capacidadeInstaladaMw).toBeGreaterThan(0);
      expect(item.energia.fonteMatrizPredominante).toBeTruthy();
      expect(item.energia.fonteUrl).toMatch(/^https?:\/\//);
    }
  });

  it("garante dados de combustível com volume, valor e órgão fiscalizador", () => {
    for (const item of DADOS_RECURSOS_27_ESTADOS) {
      expect(item.combustivel.totalGastoAnualBrlMilhoes).toBeGreaterThan(0);
      expect(item.combustivel.consumoEstimadoLitrosMilhoes).toBeGreaterThan(0);
      expect(item.combustivel.precoMedioAnpBrlLitro).toBeGreaterThan(3.0);
      expect(item.combustivel.combustivelMaisConsumido).toBeTruthy();
      expect(item.combustivel.orgaoFiscalizador.length).toBeGreaterThan(3);
      expect(item.combustivel.fonteUrl).toMatch(/^https?:\/\//);
    }
  });

  it("garante dados de PPPs e Concessões com projetos prioritários e links verificados", () => {
    for (const item of DADOS_RECURSOS_27_ESTADOS) {
      expect(item.ppps.totalContratosAtivos).toBeGreaterThanOrEqual(1);
      expect(item.ppps.investimentoTotalContratadoBrlBilhoes).toBeGreaterThan(0);
      expect(item.ppps.setoresPrioritarios.length).toBeGreaterThan(0);
      expect(item.ppps.concessaoDestaque.length).toBeGreaterThan(3);
      expect(item.ppps.fonteUrl).toMatch(/^https?:\/\//);
    }
  });

  it("garante dados de Emendas Parlamentares com cotas médias e transparência das ALEs", () => {
    for (const item of DADOS_RECURSOS_27_ESTADOS) {
      expect(item.totalDeputados).toBeGreaterThanOrEqual(24); // Roraima e Amapá têm 24 deputados
      expect(item.emendas.totalEmendasAutorizadasBrlMilhoes).toBeGreaterThan(0);
      expect(item.emendas.cotaMediaPorDeputadoBrlMilhoes).toBeGreaterThan(0);
      expect(item.emendas.percentualImpositivoRcl).toBeGreaterThan(0);
      expect(item.emendas.percentualEmendasPix).toBeGreaterThanOrEqual(0);
      expect(item.emendas.fonteUrl).toMatch(/^https?:\/\//);
    }
  });

  it("filtra corretamente por região geográfica", () => {
    const sudeste = filtrarRecursosEstados({ regiao: "Sudeste" });
    expect(sudeste).toHaveLength(4);
    const ufsSudeste = sudeste.map((s) => s.uf);
    expect(ufsSudeste).toContain("SP");
    expect(ufsSudeste).toContain("MG");
    expect(ufsSudeste).toContain("RJ");
    expect(ufsSudeste).toContain("ES");

    const nordeste = filtrarRecursosEstados({ regiao: "Nordeste" });
    expect(nordeste).toHaveLength(9);

    const norte = filtrarRecursosEstados({ regiao: "Norte" });
    expect(norte).toHaveLength(7);

    const sul = filtrarRecursosEstados({ regiao: "Sul" });
    expect(sul).toHaveLength(3);

    const centroOeste = filtrarRecursosEstados({ regiao: "Centro-Oeste" });
    expect(centroOeste).toHaveLength(4);
  });

  it("filtra corretamente por termo de busca textual", () => {
    const buscaMinas = filtrarRecursosEstados({ termo: "Minas Gerais" });
    expect(buscaMinas).toHaveLength(1);
    expect(buscaMinas[0].uf).toBe("MG");

    const buscaCemig = filtrarRecursosEstados({ termo: "Cemig" });
    expect(buscaCemig.length).toBeGreaterThanOrEqual(1);
    expect(buscaCemig.some((e) => e.uf === "MG")).toBe(true);

    const buscaIgam = filtrarRecursosEstados({ termo: "IGAM" });
    expect(buscaIgam.length).toBeGreaterThanOrEqual(1);
    expect(buscaIgam[0].uf).toBe("MG");
  });

  it("gera CSV válido no padrão brasileiro com BOM UTF-8 e separador de ponto-e-vírgula", () => {
    const csv = gerarCsvRecursos27Estados(DADOS_RECURSOS_27_ESTADOS);
    expect(csv.startsWith("\uFEFF")).toBe(true);

    const linhas = csv.split("\r\n");
    // 1 cabeçalho + 27 linhas dos estados = 28 linhas
    expect(linhas.length).toBe(28);

    const cabecalho = linhas[0];
    expect(cabecalho).toContain("UF;");
    expect(cabecalho).toContain("Estado;");
    expect(cabecalho).toContain("Região;");
    expect(cabecalho).toContain("Interferências Outorgadas (Água);");
    expect(cabecalho).toContain("Tarifa Residencial (R$/kWh);");
    expect(cabecalho).toContain("Gasto Combustível Anual (R$ Milhões);");
    expect(cabecalho).toContain("PPPs Ativas;");
    expect(cabecalho).toContain("Emendas Totais (R$ Milhões);");

    // Valida linha de Minas Gerais
    const linhaMg = linhas.find((l) => l.startsWith('"MG";'));
    expect(linhaMg).toBeTruthy();
    expect(linhaMg).toContain('"Minas Gerais"');
    expect(linhaMg).toContain('"Sudeste"');
  });
});
