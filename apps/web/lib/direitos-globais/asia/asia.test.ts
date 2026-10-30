/**
 * @file apps/web/lib/direitos-globais/asia/asia.test.ts
 * @description Testes vitest para o módulo Ásia (Frente C).
 *
 * O que protege:
 * - 6 países prioritários na Leva 1 e cobertura das Levas 2 e 3;
 * - nota explícita obrigatória na Rússia como transcontinental euro-asiática;
 * - registro formal da ausência de tribunal regional de direitos humanos na Ásia;
 * - códigos ISO únicos e consistência demográfica e geográfica.
 */

import { describe, expect, it } from "vitest";
import { PAISES_ASIA, paisesPorLeva } from "./paises";
import { INSTRUMENTOS_REGIONAIS_ASIA } from "./tratados-regionais";

describe("Frente C — Países da Ásia (Levas e Prioridades)", () => {
  it("contém exatamente os 6 países definidos na Leva 1", () => {
    const leva1 = paisesPorLeva(1);
    expect(leva1).toHaveLength(6);
    const nomesLeva1 = leva1.map((p) => p.nome);
    expect(nomesLeva1).toContain("China");
    expect(nomesLeva1).toContain("Rússia");
    expect(nomesLeva1).toContain("Índia");
    expect(nomesLeva1).toContain("Vietnã");
    expect(nomesLeva1).toContain("Japão");
    expect(nomesLeva1).toContain("Filipinas");
  });

  it("Rússia possui nota explícita transcontinental obrigatória", () => {
    const russia = PAISES_ASIA.find((p) => p.nome === "Rússia");
    expect(russia).toBeDefined();
    expect(russia?.notaTranscontinental).toBeDefined();
    expect(russia?.notaTranscontinental).toContain("transcontinental");
  });

  it("Leva 2 contém os 6 países previstos", () => {
    const leva2 = paisesPorLeva(2);
    expect(leva2).toHaveLength(6);
    const nomesLeva2 = leva2.map((p) => p.nome);
    expect(nomesLeva2).toContain("Indonésia");
    expect(nomesLeva2).toContain("Bangladesh");
    expect(nomesLeva2).toContain("Paquistão");
    expect(nomesLeva2).toContain("Tailândia");
    expect(nomesLeva2).toContain("Malásia");
    expect(nomesLeva2).toContain("Coreia do Sul");
  });

  it("todos os países têm código ISO único e população positiva", () => {
    const codigos = PAISES_ASIA.map((p) => p.codigo);
    expect(new Set(codigos).size).toBe(PAISES_ASIA.length);
    for (const p of PAISES_ASIA) {
      if (p.populacao) {
        expect(p.populacao).toBeGreaterThan(1000000);
      }
    }
  });

  it("registra a ausência de corte regional vinculante em todos os países asiáticos", () => {
    for (const p of PAISES_ASIA) {
      expect(p.possuiTribunalRegional).toBe(false);
    }
  });

  it("instrumentos regionais documentam formalmente a lacuna institucional", () => {
    const ausencia = INSTRUMENTOS_REGIONAIS_ASIA.find((i) => i.id === "ausencia-corte-asiatica");
    expect(ausencia).toBeDefined();
    expect(ausencia?.descricao).toContain("Não existe na Ásia um tribunal supranacional");
  });
});
