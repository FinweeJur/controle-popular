/**
 * @file apps/web/lib/direitos-globais/casos-corte.test.ts
 * @description Guarda da lista de casos enviados à Corte IDH.
 *
 * O que protege:
 * - nada de caso duplicado (país + número);
 * - link sempre no domínio da OEA e data em ISO;
 * - país sempre dentro dos vinte da América Latina;
 * - Brasil presente (o leitor brasileiro procura o seu país primeiro).
 */

import { describe, expect, it } from "vitest";
import { PAISES_CIDH } from "./cidh";
import {
  CASOS_NA_CORTE,
  casosDoPais,
  paisesComCasos,
} from "./casos-corte";

describe("casos enviados à Corte", () => {
  it("não repete país e número de caso", () => {
    const chaves = CASOS_NA_CORTE.map((c) => `${c.pais}|${c.caso}`);
    expect(new Set(chaves).size).toBe(chaves.length);
    expect(CASOS_NA_CORTE.length).toBeGreaterThanOrEqual(80);
  });

  it("só usa país da lista e link da OEA", () => {
    for (const c of CASOS_NA_CORTE) {
      expect(PAISES_CIDH).toContain(c.pais);
      expect(c.nome.length).toBeGreaterThan(3);
      expect(c.caso).toMatch(/^\d{1,2}\.\d{3}$/);
      expect(c.dataRemissao).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new URL(c.url).hostname).toBe("www.oas.org");
      expect([2024, 2025, 2026]).toContain(c.ano);
    }
  });

  it("ordena do mais recente para o mais antigo por país", () => {
    for (const pais of paisesComCasos()) {
      const datas = casosDoPais(pais).map((c) => c.dataRemissao);
      const ordenadas = [...datas].sort((a, b) => b.localeCompare(a));
      expect(datas).toEqual(ordenadas);
    }
  });

  it("tem Brasil e pelo menos três países", () => {
    expect(casosDoPais("Brasil").length).toBeGreaterThan(0);
    expect(paisesComCasos().length).toBeGreaterThan(3);
    expect(casosDoPais("Atlântida")).toHaveLength(0);
  });
});
