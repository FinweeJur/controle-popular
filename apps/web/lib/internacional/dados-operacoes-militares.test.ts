/**
 * @file apps/web/lib/internacional/dados-operacoes-militares.test.ts
 * @description Testes unitarios do modulo de operacoes militares, contratos de defesa e PMCs.
 */

import { describe, it, expect } from "vitest";
import {
  obterOperacoesMilitares,
  obterOperacoesMilitaresGeolocalizadas,
  obterOperacaoMilitarPorId,
  COBERTURA_OPERACOES_MILITARES,
} from "./dados-operacoes-militares";

describe("Módulo de Operações Militares, Contratos e PMCs", () => {
  it("deve carregar todas as operações decodificadas com integridade", () => {
    const ops = obterOperacoesMilitares();
    expect(ops).toBeInstanceOf(Array);
    expect(ops.length).toBeGreaterThanOrEqual(40);
  });

  it("deve garantir que todos os registros possuem coordenadas geográficas válidas", () => {
    const geo = obterOperacoesMilitaresGeolocalizadas();
    expect(geo.length).toBe(COBERTURA_OPERACOES_MILITARES.totalOperacoes);

    for (const op of geo) {
      expect(typeof op.latitude).toBe("number");
      expect(typeof op.longitude).toBe("number");
      expect(op.latitude).toBeGreaterThanOrEqual(-90);
      expect(op.latitude).toBeLessThanOrEqual(90);
      expect(op.longitude).toBeGreaterThanOrEqual(-180);
      expect(op.longitude).toBeLessThanOrEqual(180);
      expect(op.localidadeFoco).toBeTruthy();
    }
  });

  it("deve buscar operação específica por ID canônico", () => {
    const ajax = obterOperacaoMilitarPorId("OP-1953-IRN-AJAX");
    expect(ajax).toBeDefined();
    expect(ajax?.codinome).toContain("Ajax");
    expect(ajax?.paisTeatro).toBe("Irã");
    expect(ajax?.paisesPatrocinadores).toContain("Estados Unidos");
    expect(ajax?.paisesPatrocinadores).toContain("Reino Unido");

    const blackwater = obterOperacaoMilitarPorId("PMC-2007-IRQ-NISOUR-BLACKWATER");
    expect(blackwater).toBeDefined();
    expect(blackwater?.tipoOperacao).toBe("pmc_milicia_privada");
    expect(blackwater?.pmcsEnvolvidas.length).toBeGreaterThan(0);
    expect(blackwater?.urlFonteOficial).toContain("https://");
  });

  it("deve verificar consistência das métricas agregadas de cobertura", () => {
    expect(COBERTURA_OPERACOES_MILITARES.totalOperacoes).toBeGreaterThan(0);
    expect(COBERTURA_OPERACOES_MILITARES.totalPaisesTeatro).toBeGreaterThan(15);
    expect(COBERTURA_OPERACOES_MILITARES.totalPaisesPatrocinadores).toBeGreaterThan(5);
    expect(COBERTURA_OPERACOES_MILITARES.continentesTeatro.length).toBeGreaterThanOrEqual(5);
    expect(COBERTURA_OPERACOES_MILITARES.anoMaisAntigo).toBeLessThanOrEqual(1955);
    expect(COBERTURA_OPERACOES_MILITARES.anoMaisRecente).toBeGreaterThanOrEqual(2022);
  });

  it("deve garantir que todos os links oficiais são HTTPS e válidos", () => {
    const ops = obterOperacoesMilitares();
    for (const op of ops) {
      expect(op.urlFonteOficial).toMatch(/^https:\/\//);
      expect(op.fonteOficialNome.length).toBeGreaterThan(3);
      expect(op.assuntos.length).toBeGreaterThan(0);
    }
  });

  it("não deve conter CPFs nem dados pessoais não autorizados nos campos de texto", () => {
    const ops = obterOperacoesMilitares();
    const regexCpf = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/;

    for (const op of ops) {
      const textoCompleto = `${op.titulo} ${op.resumo} ${op.desfechoSoberania} ${op.conexaoBrasilOuAmericaLatina}`;
      expect(regexCpf.test(textoCompleto)).toBe(false);
    }
  });
});
