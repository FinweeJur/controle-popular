/**
 * @file apps/web/lib/ambiental/ibama-autos.test.ts
 * @description Guarda do acervo dos autos de infração do IBAMA por município.
 * Trava o contrato: totais medidos, soma das UFs igual ao total nacional e
 * nenhum dado do infrator (nome/CPF) — a base tem, o acervo não publica.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import type { AcervoIbamaAutos } from "@/lib/ambiental/ibama-autos";

const CAMINHO = path.join(process.cwd(), "data", "ambiental", "ibama-autos-municipio.json");
const acervo = JSON.parse(fs.readFileSync(CAMINHO, "utf-8")) as AcervoIbamaAutos;

describe("autos de infração do IBAMA por município", () => {
  it("os totais são medidos do próprio registro", () => {
    expect(acervo.total_autos).toBeGreaterThan(10_000);
    expect(acervo.registros.length).toBe(acervo.total_municipios);
    expect(acervo.janela).toBe("2015 a 2026");
  });

  it("a soma das UFs fecha com o total nacional", () => {
    const soma = Object.values(acervo.por_uf).reduce((s, u) => s + u.autos, 0);
    expect(soma).toBe(acervo.total_autos);
  });

  it("cada município tem contagem coerente e nenhum dado do infrator", () => {
    for (const r of acervo.registros) {
      expect(r.autos).toBeGreaterThan(0);
      expect(r.valor).toBeGreaterThanOrEqual(0);
      expect(r.com_embargo).toBeLessThanOrEqual(r.autos);
      expect(r.cod_ibge).toMatch(/^\d{7}$/);
      // Nenhuma coluna de identificação do autuado pode ter vazado para o acervo.
      expect(Object.keys(r).some((k) => /cpf|cnpj|nome|infrator|pessoa/i.test(k))).toBe(false);
    }
    const texto = JSON.stringify(acervo);
    expect(texto).not.toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/); // CPF formatado
  });
});
