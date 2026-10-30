/**
 * @file apps/web/lib/direitos-globais/sentencas.test.ts
 * @description Guarda da lista de condenações da Corte IDH.
 *
 * O que protege:
 * - uma linha por sentença (país + Serie C), sem repetição;
 * - só sentença de mérito, não interpretação nem cumprimento;
 * - data em ISO e link no domínio da Corte;
 * - Cuba fora (não é parte) e Brasil dentro.
 */

import { describe, expect, it } from "vitest";
import { PAISES_CIDH } from "./cidh";
import { SENTENCAS, paisesCondenados, sentencasDoPais } from "./sentencas";

describe("condenações da Corte IDH", () => {
  it("não repete país e número de série", () => {
    const chaves = SENTENCAS.map((s) => `${s.pais}|${s.serie}`);
    expect(new Set(chaves).size).toBe(chaves.length);
    expect(SENTENCAS.length).toBeGreaterThanOrEqual(390);
  });

  it("só tem sentença de mérito", () => {
    for (const s of SENTENCAS) {
      expect(s.tipo).not.toMatch(/Interpretaci|Cumplimiento|Supervisi|Resoluci/i);
      expect(s.nome.length).toBeGreaterThanOrEqual(2);
      expect(s.serie).toBeGreaterThan(0);
      expect(s.dataSentenca).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const ano = Number(s.dataSentenca.slice(0, 4));
      expect(ano).toBeGreaterThanOrEqual(1988);
      expect(ano).toBeLessThanOrEqual(2026);
      expect(s.url).toMatch(/^https:\/\/(www\.)?corteidh\.or\.cr\//);
    }
  });

  it("só usa país da lista", () => {
    for (const s of SENTENCAS) expect(PAISES_CIDH).toContain(s.pais);
  });

  it("Cuba não aparece e Brasil tem a Ximenes Lopes", () => {
    expect(paisesCondenados()).not.toContain("Cuba");
    const brasil = sentencasDoPais("Brasil");
    expect(brasil.length).toBeGreaterThanOrEqual(20);
    expect(brasil.some((s) => s.serie === 149 && s.nome.includes("Ximenes"))).toBe(true);
  });

  it("ordena da mais recente para a mais antiga", () => {
    for (const pais of paisesCondenados()) {
      const datas = sentencasDoPais(pais).map((s) => s.dataSentenca);
      expect(datas).toEqual([...datas].sort((a, b) => b.localeCompare(a)));
    }
  });
});
