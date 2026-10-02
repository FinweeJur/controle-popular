/**
 * @file apps/web/lib/estado/renuncia-fiscal.test.ts
 * @description Guarda do acervo da renúncia fiscal (Receita/DGT, Quadro I).
 * Trava o contrato do JSON: totais medidos, soma das funções igual ao total
 * publicado e cada linha fechando pelas regiões (número errado é dano).
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import type { AcervoRenunciaFiscal } from "@/lib/estado/renuncia-fiscal";

const CAMINHO = path.join(process.cwd(), "data", "estado", "renuncia-fiscal-2023.json");
const acervo = JSON.parse(fs.readFileSync(CAMINHO, "utf-8")) as AcervoRenunciaFiscal;

describe("renúncia fiscal (Receita/DGT)", () => {
  it("os totais são medidos do próprio registro", () => {
    expect(acervo.total_funcoes).toBe(acervo.registros.length);
    expect(acervo.total_renuncia).toBeGreaterThan(0);
    expect(acervo.ano_base).toBe(2023);
  });

  it("a soma das funções fecha com o total publicado", () => {
    const soma = acervo.registros.reduce((s, r) => s + r.total, 0);
    expect(Math.abs(soma - acervo.total_renuncia)).toBeLessThan(1);
  });

  it("cada linha fecha pelas regiões", () => {
    for (const r of acervo.registros) {
      const partes = r.norte + r.nordeste + r.centro_oeste + r.sudeste + r.sul;
      expect(Math.abs(partes - r.total)).toBeLessThan(1);
    }
  });

  it("a renúncia como fração da arrecadação fica entre 0 e 1", () => {
    expect(acervo.renuncia_sobre_arrecadacao).not.toBeNull();
    expect(acervo.renuncia_sobre_arrecadacao!).toBeGreaterThan(0);
    expect(acervo.renuncia_sobre_arrecadacao!).toBeLessThan(1);
  });
});
