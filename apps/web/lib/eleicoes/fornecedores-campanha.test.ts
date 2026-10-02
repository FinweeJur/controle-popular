/**
 * @file apps/web/lib/eleicoes/fornecedores-campanha.test.ts
 * @description Guarda do acervo de fornecedores de campanha (TSE 2022/MG).
 * Trava o contrato do JSON versionado: totais medidos, CNPJ válido, valor
 * mínimo respeitado e nenhum CPF (a fonte traz CPF de candidato e de
 * fornecedor pessoa física; nada pode vazar).
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import type { AcervoFornecedoresCampanha } from "@/lib/eleicoes/fornecedores-campanha";

const CAMINHO = path.join(process.cwd(), "data", "eleicoes", "fornecedores-campanha-2022-mg.json");
const acervo = JSON.parse(fs.readFileSync(CAMINHO, "utf-8")) as AcervoFornecedoresCampanha;

describe("fornecedores de campanha (TSE 2022/MG)", () => {
  it("os totais são medidos do próprio registro", () => {
    expect(acervo.total_fornecedores_publicados).toBe(acervo.registros.length);
    expect(acervo.total_fornecedores_pj).toBeGreaterThanOrEqual(acervo.total_fornecedores_publicados);
    expect(acervo.total_geral_contratado).toBeGreaterThan(0);
  });

  it("nenhum CPF (formatado ou cru) vaza no acervo versionado", () => {
    const texto = JSON.stringify(acervo);
    expect(texto).not.toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
    expect(texto).not.toMatch(/(?<!\d)\d{11}(?!\d)/);
  });

  it("todo registro é pessoa jurídica com CNPJ válido e respeita o valor mínimo", () => {
    for (const r of acervo.registros) {
      expect(r.cnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
      expect(r.total).toBeGreaterThanOrEqual(acervo.valor_minimo);
      expect(r.despesas).toBeGreaterThan(0);
      expect(Array.isArray(r.top_destinos)).toBe(true);
    }
  });
});
