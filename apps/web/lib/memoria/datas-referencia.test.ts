/**
 * Testes do calendário de datas de referência (`/memoria`).
 *
 * Guardam o contrato: toda data tem dia/mês válido, título, descrição, ao
 * menos um tipo de luta e uma fonte com link http(s) — a mesma guarda
 * editorial de todo o acervo (AGENTS.md §7). A citação curta sai no
 * formato do dev `(Instituição, Ano)`.
 */

import { describe, expect, it } from "vitest";
import { DATAS_REFERENCIA, citacaoCurtaData } from "./datas-referencia";

describe("DATAS_REFERENCIA", () => {
  it("tem um conjunto mínimo de datas", () => {
    expect(DATAS_REFERENCIA.length).toBeGreaterThanOrEqual(6);
  });

  it("toda data tem diaMes MM-DD válido", () => {
    for (const d of DATAS_REFERENCIA) {
      expect(d.diaMes, `diaMes inválido em ${d.titulo}`).toMatch(/^\d{2}-\d{2}$/);
      const [mes, dia] = d.diaMes.split("-").map(Number);
      expect(mes).toBeGreaterThanOrEqual(1);
      expect(mes).toBeLessThanOrEqual(12);
      expect(dia).toBeGreaterThanOrEqual(1);
      expect(dia).toBeLessThanOrEqual(31);
    }
  });

  it("toda data tem título, descrição, tipo e fonte completa", () => {
    for (const d of DATAS_REFERENCIA) {
      expect(d.titulo.trim().length, `título vazio em ${d.diaMes}`).toBeGreaterThan(0);
      expect(d.descricao.trim().length, `descrição vazia em ${d.titulo}`).toBeGreaterThan(0);
      expect(d.tipo.length, `tipo vazio em ${d.titulo}`).toBeGreaterThan(0);
      expect(d.fonte.orgao.trim().length).toBeGreaterThan(0);
      expect(d.fonte.ano.trim().length).toBeGreaterThan(0);
      expect(/^https?:\/\//i.test(d.fonte.url), `URL inválida em ${d.titulo}`).toBe(true);
    }
  });

  it("não repete a mesma data (diaMes) duas vezes", () => {
    const vistos = new Set<string>();
    for (const d of DATAS_REFERENCIA) {
      expect(vistos.has(d.diaMes), `data duplicada: ${d.diaMes}`).toBe(false);
      vistos.add(d.diaMes);
    }
  });
});

describe("citacaoCurtaData", () => {
  it("sai no formato (Instituição, Ano)", () => {
    const mab = DATAS_REFERENCIA.find((d) => d.fonte.orgao === "MAB");
    expect(mab).toBeDefined();
    if (mab) expect(citacaoCurtaData(mab.fonte)).toBe(`MAB, ${mab.fonte.ano}`);
  });
});
