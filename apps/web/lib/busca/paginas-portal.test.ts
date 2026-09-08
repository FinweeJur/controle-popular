import { describe, it, expect } from "vitest";
import { buscarPaginasPortal, PAGINAS_PORTAL } from "./paginas-portal";

describe("buscarPaginasPortal", () => {
  it("encontra páginas por termos de grande relevância cívica", () => {
    const resMariana = buscarPaginasPortal("mariana");
    expect(resMariana.length).toBeGreaterThan(0);
    expect(resMariana[0].href).toBe("/ambiental/mariana");

    const resBrumadinho = buscarPaginasPortal("brumadinho");
    expect(resBrumadinho.length).toBeGreaterThan(0);
    expect(resBrumadinho.some((p) => p.href.startsWith("/paraopeba"))).toBe(true);

    const resTjmg = buscarPaginasPortal("tjmg");
    expect(resTjmg.length).toBeGreaterThan(0);
    expect(resTjmg[0].href).toBe("/judiciario/instituicoes/tjmg");

    const resBarragens = buscarPaginasPortal("barragens");
    expect(resBarragens.length).toBeGreaterThan(0);
    expect(resBarragens.some((p) => p.href.includes("barragens"))).toBe(true);

    const resTecnologia = buscarPaginasPortal("ia livre");
    expect(resTecnologia.length).toBeGreaterThan(0);
    expect(resTecnologia[0].href).toBe("/tecnologia");
  });

  it("tolera acentos e caixa alta", () => {
    const res = buscarPaginasPortal("ORÇAMENTO");
    expect(res.length).toBeGreaterThan(0);
    expect(res.some((p) => p.href.includes("orcamento") || p.descricao.toLowerCase().includes("orcamento"))).toBe(true);
  });

  it("retorna vazio para consultas curtas ou sem sentido", () => {
    expect(buscarPaginasPortal("")).toEqual([]);
    expect(buscarPaginasPortal("x")).toEqual([]);
    expect(buscarPaginasPortal("zzzzzzzzzzz")).toEqual([]);
  });

  it("garante integridade de todas as páginas catalogadas", () => {
    for (const p of PAGINAS_PORTAL) {
      expect(p.id).toBeTruthy();
      expect(p.titulo).toBeTruthy();
      expect(p.descricao).toBeTruthy();
      expect(p.href.startsWith("/")).toBe(true);
      expect(p.palavrasChave.length).toBeGreaterThan(0);
    }
  });
});
