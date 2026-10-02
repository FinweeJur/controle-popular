/**
 * @file apps/web/lib/judiciario/sisdepen.test.ts
 * @description Guarda do acervo do SISDEPEN (população prisional por UF).
 * Trava o contrato: totais medidos, soma das UFs igual ao Brasil e ocupação
 * coerente com população ÷ capacidade (número errado é dano).
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import type { AcervoSisdepen } from "@/lib/judiciario/sisdepen";

const CAMINHO = path.join(process.cwd(), "data", "judiciario", "sisdepen-2025-2.json");
const acervo = JSON.parse(fs.readFileSync(CAMINHO, "utf-8")) as AcervoSisdepen;

describe("SISDEPEN — população prisional por UF", () => {
  it("os totais são medidos do próprio registro", () => {
    expect(acervo.registros).toHaveLength(27);
    expect(acervo.total_estabelecimentos).toBeGreaterThan(1000);
    expect(acervo.brasil.populacao).toBeGreaterThan(500_000);
  });

  it("a soma das UFs fecha com o total do Brasil", () => {
    const pop = acervo.registros.reduce((s, r) => s + r.populacao, 0);
    const cap = acervo.registros.reduce((s, r) => s + r.capacidade, 0);
    const prov = acervo.registros.reduce((s, r) => s + r.provisorios, 0);
    expect(pop).toBe(acervo.brasil.populacao);
    expect(cap).toBe(acervo.brasil.capacidade);
    expect(prov).toBe(acervo.brasil.provisorios);
  });

  it("a ocupação bate com população ÷ capacidade em cada UF", () => {
    for (const r of acervo.registros) {
      if (r.capacidade > 0 && r.taxa_ocupacao != null) {
        const esperado = Math.round((100 * r.populacao) / r.capacidade * 10) / 10;
        expect(Math.abs(r.taxa_ocupacao - esperado)).toBeLessThanOrEqual(0.1);
      }
      expect(r.provisorios).toBeLessThanOrEqual(r.populacao);
    }
  });
});
