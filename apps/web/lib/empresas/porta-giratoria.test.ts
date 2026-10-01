/**
 * @file apps/web/lib/empresas/porta-giratoria.test.ts
 * @description Guarda do acervo da porta giratória (FRE/CVM).
 *
 * O filtro que produz o acervo roda em Python (`scripts/etl/empresas/
 * coletar-porta-giratoria-cvm.py`); este teste trava o CONTRATO do JSON
 * versionado que a página consome: campos presentes, padrões conhecidos,
 * totais medidos do dado (nunca digitados à mão) e — o mais importante —
 * nenhum CPF vazado, já que a fonte (FRE) traz o documento e o formulário da
 * companhia às vezes cola o CPF no próprio texto declarado.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { PADROES_PORTA_GIRATORIA, type AcervoPortaGiratoria } from "@/lib/empresas/porta-giratoria";

const CAMINHO = path.join(process.cwd(), "data", "empresas", "porta-giratoria-cvm.json");
const acervo = JSON.parse(fs.readFileSync(CAMINHO, "utf-8")) as AcervoPortaGiratoria;
const rotulos = new Set<string>(PADROES_PORTA_GIRATORIA);

describe("acervo da porta giratória (FRE/CVM)", () => {
  it("os totais são medidos do próprio registro, não digitados", () => {
    expect(acervo.total_registros).toBe(acervo.registros.length);
    expect(acervo.total_pessoas).toBeGreaterThan(0);
    expect(acervo.total_empresas).toBeGreaterThan(0);
    expect(acervo.total_empresas).toBeLessThanOrEqual(acervo.registros.length);
  });

  it("nenhum CPF (formatado ou cru) vaza no acervo versionado", () => {
    const texto = JSON.stringify(acervo);
    expect(texto).not.toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
    expect(texto).not.toMatch(/(?<!\d)\d{11}(?!\d)/);
    // também no formato sem máscara de pontos
    expect(texto).not.toMatch(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b(?!\d)/);
  });

  it("todo registro tem os campos obrigatórios e padrão de cargo público conhecido", () => {
    for (const r of acervo.registros) {
      expect(typeof r.nome).toBe("string");
      expect(r.nome.length).toBeGreaterThan(3);
      expect(r.companhia.length).toBeGreaterThan(1);
      expect(r.cnpj_cia).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
      expect(r.id_doc).toMatch(/^\d+$/);
      expect(r.url_documento).toMatch(/^https?:\/\//);
      expect(Array.isArray(r.padroes)).toBe(true);
      // Há dois caminhos de entrada no acervo: casar um padrão de cargo
      // público OU a companhia declarar a pessoa como PEP. Um dos dois existe.
      expect(r.padroes.length > 0 || r.pep_declarada).toBe(true);
      for (const p of r.padroes) expect(rotulos.has(p)).toBe(true);
      // Todo registro traz evidência: trecho citado ou declaração de PEP.
      expect(r.trecho.length > 0 || r.pep_declarada).toBe(true);
    }
  });

  it("a data de posse, quando presente, está em formato ISO", () => {
    for (const r of acervo.registros) {
      if (r.data_posse) expect(r.data_posse).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
