/**
 * @file apps/web/lib/trabalho/cadastro-empregadores.test.ts
 * @description Guarda do acervo do Cadastro de Empregadores (MTE).
 *
 * O parser roda em Python (`scripts/etl/trabalho/coletar-lista-suja-mte.py`);
 * este teste trava o CONTRATO do JSON versionado: totais medidos, CNPJ válido,
 * nenhum CPF (a fonte cola o CPF no nome do empregador em vários registros —
 * achado pelo autoteste do coletor) e o campo de pessoa física omitida presente.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import type { AcervoCadastroEmpregadores } from "@/lib/trabalho/cadastro-empregadores";

const CAMINHO = path.join(process.cwd(), "data", "trabalho", "cadastro-empregadores-mte.json");
const acervo = JSON.parse(fs.readFileSync(CAMINHO, "utf-8")) as AcervoCadastroEmpregadores;

describe("Cadastro de Empregadores (MTE)", () => {
  it("os totais são medidos do próprio registro", () => {
    expect(acervo.total_registros).toBe(acervo.registros.length);
    expect(acervo.total_empresas).toBeGreaterThan(0);
    expect(acervo.total_empresas).toBeLessThanOrEqual(acervo.total_registros);
    expect(acervo.total_ufs).toBeGreaterThan(0);
    expect(acervo.empregadores_pessoa_fisica_omitidos).toBeGreaterThanOrEqual(0);
  });

  it("nenhum CPF (formatado ou cru) vaza no acervo versionado", () => {
    const texto = JSON.stringify(acervo);
    expect(texto).not.toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
    expect(texto).not.toMatch(/(?<!\d)\d{11}(?!\d)/);
  });

  it("todo registro é pessoa jurídica com CNPJ válido e campos obrigatórios", () => {
    for (const r of acervo.registros) {
      expect(r.cnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
      expect(r.empregador.length).toBeGreaterThan(2);
      expect(r.uf).toMatch(/^[A-Z]{2}$/);
      expect(r.id).toBeGreaterThan(0);
      // datas, quando presentes, em ISO
      if (r.inclusao_cadastro) expect(r.inclusao_cadastro).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (r.decisao_administrativa) expect(r.decisao_administrativa).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
