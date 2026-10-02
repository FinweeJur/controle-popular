/**
 * @file apps/web/lib/seguranca/mortes-intervencao-policial.test.ts
 * @description Guarda do acervo das mortes por intervenção de agente do Estado
 * (Sinesp VDE 2025). Trava o contrato: totais medidos, soma das UFs igual ao
 * Brasil e participação coerente (número errado é dano).
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import type { AcervoMortesIntervencao } from "@/lib/seguranca/mortes-intervencao-policial";

const CAMINHO = path.join(process.cwd(), "data", "seguranca", "mortes-intervencao-policial-2025.json");
const acervo = JSON.parse(fs.readFileSync(CAMINHO, "utf-8")) as AcervoMortesIntervencao;

describe("mortes por intervenção de agente do Estado (Sinesp VDE)", () => {
  it("os totais são medidos do próprio registro", () => {
    expect(acervo.registros).toHaveLength(27);
    expect(acervo.brasil.mdip).toBeGreaterThan(1000);
    expect(acervo.brasil.mvi).toBeGreaterThan(acervo.brasil.mdip);
  });

  it("a soma das UFs fecha com o Brasil", () => {
    const mdip = acervo.registros.reduce((s, r) => s + r.mdip, 0);
    const mvi = acervo.registros.reduce((s, r) => s + r.mvi, 0);
    expect(mdip).toBe(acervo.brasil.mdip);
    expect(mvi).toBe(acervo.brasil.mvi);
  });

  it("cada UF fecha por sexo e a participação bate com MDIP ÷ MVI", () => {
    for (const r of acervo.registros) {
      expect(r.masculino + r.feminino + r.nao_informado).toBe(r.mdip);
      expect(r.mvi).toBeGreaterThanOrEqual(r.mdip);
      if (r.mvi > 0 && r.participacao_pct != null) {
        const esperado = Math.round((100 * r.mdip) / r.mvi * 10) / 10;
        expect(Math.abs(r.participacao_pct - esperado)).toBeLessThanOrEqual(0.1);
      }
    }
  });
});
