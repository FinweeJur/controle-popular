/**
 * Testes dos helpers das seções em locais de votação alterados
 * (`locais-votacao-2026.ts`): agregado por UF e integridade da coleção.
 *
 * Fonte: TSE — Eleitorado por local de votação — 2026 (dado coletado).
 */
import { describe, expect, it } from "vitest";
import { colecao, linhasAlteradas, resumirPorUf } from "./locais-votacao-2026";

describe("locais-votacao-2026", () => {
  it("a coleção tem carimbo de geração e contagem coerente", () => {
    expect(colecao.geradoEm).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/);
    expect(colecao.totalSecoes).toBeGreaterThan(1_000_000);
    expect(colecao.secoesAlteradas).toBe(linhasAlteradas.length);
    expect(colecao.linhas.length).toBeGreaterThan(10_000);
  });

  it("toda linha alterada de verdade: difere do original em algo", () => {
    for (const linha of linhasAlteradas.slice(0, 500)) {
      const mudou =
        linha.l !== linha.lo || linha.d !== linha.do || linha.t === "predio";
      expect(mudou).toBe(true);
    }
  });

  it("resumo por UF soma as seções e deduplica municípios", () => {
    const resumo = resumirPorUf([
      { u: "MG", m: "GUAIRACA", z: 1, s: 1, e: 10, l: "A", d: "B", lo: "C", do: "D", t: "predio" },
      { u: "MG", m: "GUAIRACA", z: 1, s: 2, e: 5, l: "A", d: "B", lo: "C", do: "D", t: "predio" },
      { u: "RJ", m: "REJAGE", z: 2, s: 1, e: 3, l: "A", d: "B", lo: "C", do: "D", t: "predio" },
    ]);
    expect(resumo).toEqual([
      { uf: "MG", municipios: 1, secoes: 2, eleitores: 15 },
      { uf: "RJ", municipios: 1, secoes: 1, eleitores: 3 },
    ]);
  });

  it("todo item do resumo tem dado", () => {
    const resumo = resumirPorUf(linhasAlteradas);
    for (const item of resumo) {
      expect(item.secoes).toBeGreaterThan(0);
      expect(item.uf).toHaveLength(2);
    }
  });
});
