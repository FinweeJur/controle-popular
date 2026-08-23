import { describe, it, expect } from "vitest";
import { processosPorEmpresa } from "./sigmine";

describe("processosPorEmpresa", () => {
  it("encontra processos da Sigma Mineracao S.A.", async () => {
    const processos = await processosPorEmpresa(["SIGMA MINERACAO S.A."]);
    expect(processos.length).toBeGreaterThan(0);
    expect(processos.every((p) => p.nome.toUpperCase().includes("SIGMA"))).toBe(true);
  });

  it("encontra processos da Belo Lithium", async () => {
    const processos = await processosPorEmpresa(["BELO LITHIUM MINERACAO LTDA"]);
    expect(processos.length).toBeGreaterThan(0);
    expect(processos.every((p) => p.nome.toUpperCase().includes("LITHIUM"))).toBe(true);
  });

  it("retorna vazio para sinonimo inexistente", async () => {
    const processos = await processosPorEmpresa(["EMPRESA INEXISTENTE XYZ LTDA"]);
    expect(processos).toHaveLength(0);
  });

  it("ordena por area decrescente", async () => {
    const processos = await processosPorEmpresa(["SIGMA MINERACAO S.A."]);
    for (let i = 1; i < processos.length; i++) {
      expect(processos[i - 1].areaHa).toBeGreaterThanOrEqual(processos[i].areaHa);
    }
  });
});
