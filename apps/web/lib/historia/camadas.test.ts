import { describe, expect, it } from "vitest";
import {
  capitanias,
  fazendasTombadas,
  mineracaoProtegida,
  terrasPublicas,
} from "./camadas";

/**
 * A página `/historia` publica o que estas funções devolvem. O teste trava o
 * contrato com os `.geojson` reais: se uma camada sair do repositório ou mudar
 * de campo, a página nasceria vazia sem avisar. Aqui ela falha.
 */
describe("camadas históricas (leitura dos GeoJSON publicados)", () => {
  it("capitanias: as doações de 1534, com nome e intervalo", () => {
    const c = capitanias();
    expect(c.length).toBeGreaterThanOrEqual(10);
    for (const x of c) {
      expect(x.nome.length).toBeGreaterThan(0);
      expect(x.inicio).toMatch(/^1[5-9]/);
    }
  });

  it("terras públicas: registros com município e link do APM", () => {
    const t = terrasPublicas();
    expect(t.length).toBeGreaterThan(0);
    for (const x of t) {
      expect(x.notacao.length).toBeGreaterThan(0);
      expect(x.municipio).not.toBe("—");
      expect(x.url).toContain("siaapm");
    }
  });

  it("fazendas tombadas: conjunto rural com ato legal e fonte IEPHA", () => {
    const f = fazendasTombadas();
    expect(f.length).toBeGreaterThan(0);
    for (const x of f) {
      expect(x.denominacao.length).toBeGreaterThan(0);
      expect(x.ato.length).toBeGreaterThan(0);
      expect(x.url).toContain("iepha");
    }
  });

  it("mineração em área protegida: dois agregados com total", () => {
    const p = mineracaoProtegida();
    expect(p.map((x) => x.camada)).toEqual(["mineracao-em-uc", "mineracao-em-quilombo"]);
    for (const x of p) {
      expect(x.total).toBeGreaterThan(0);
      expect(x.areas.length).toBeGreaterThan(0);
    }
  });
});
