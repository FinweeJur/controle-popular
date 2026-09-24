import { describe, it, expect, beforeAll } from "vitest";
import { listarTodasEntidades, obterEntidadePorSlug } from "./entidades-dados";
import { EMPRESAS } from "./dados";

describe("listarTodasEntidades", () => {
  beforeAll(() => {
    listarTodasEntidades();
  });

  it("inclui Sigma Lithium na listagem (ficha legada fora do JSON)", () => {
    const sigma = obterEntidadePorSlug("sigma-lithium");
    expect(sigma).toBeDefined();
    expect(sigma?.nome).toContain("Sigma");
  });

  it("não duplica slug que já existe no JSON", () => {
    const todas = listarTodasEntidades();
    const slugs = todas.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("cada ficha legada com slug está presente na listagem", () => {
    const todas = new Set(listarTodasEntidades().map((e) => e.slug));
    for (const emp of EMPRESAS) {
      expect(todas.has(emp.slug)).toBe(true);
    }
  });
});
