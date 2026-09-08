import { describe, expect, test } from "vitest";
import { fetchAtosDiario, fetchResumoDiario, fetchSerieDiarioPorAno } from "./diario";

describe("lib/betim/diario", () => {
  describe("fetchAtosDiario", () => {
    test("carrega atos de Diamantina por slug e por id IBGE", async () => {
      const atosSlug = await fetchAtosDiario("diamantina");
      const atosId = await fetchAtosDiario("3121605");

      expect(atosSlug.length).toBeGreaterThanOrEqual(75);
      expect(atosId.length).toBe(atosSlug.length);

      const primeiro = atosSlug[0];
      expect(primeiro).toBeDefined();
      expect(primeiro.id).toBeTruthy();
      expect(primeiro.data_publicacao).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(primeiro.link_fonte).toContain("diariomunicipal.com.br");
      expect(primeiro.tipo).toBeDefined();
    });

    test("carrega atos de Betim por slug e por id IBGE", async () => {
      const atosSlug = await fetchAtosDiario("betim");
      const atosId = await fetchAtosDiario("3106705");

      expect(atosSlug.length).toBeGreaterThan(0);
      expect(atosId.length).toBe(atosSlug.length);
      expect(atosSlug.some((a) => a.tipo === "edital")).toBe(true);
      expect(atosSlug.some((a) => a.tipo === "contrato")).toBe(true);
    });

    test("carrega atos de Belo Horizonte por slug bh e id IBGE", async () => {
      const atosBh = await fetchAtosDiario("bh");
      const atosBeloHorizonte = await fetchAtosDiario("belo-horizonte");
      const atosId = await fetchAtosDiario("3106200");

      expect(atosBh.length).toBeGreaterThan(0);
      expect(atosBeloHorizonte.length).toBe(atosBh.length);
      expect(atosId.length).toBe(atosBh.length);
    });

    test("carrega atos de Araçuaí e Itinga", async () => {
      const atosAracuai = await fetchAtosDiario("aracuai");
      const atosItinga = await fetchAtosDiario("itinga");

      expect(atosAracuai.length).toBeGreaterThan(0);
      expect(atosItinga.length).toBeGreaterThan(0);
    });

    test("municipio inexistente retorna lista vazia", async () => {
      const atos = await fetchAtosDiario("cidade-que-nao-existe-9999");
      expect(atos).toEqual([]);
    });
  });

  describe("fetchResumoDiario", () => {
    test("calcula soma dos tipos compativel com o total", async () => {
      const resumo = await fetchResumoDiario("diamantina");

      expect(resumo.total).toBeGreaterThanOrEqual(75);
      const soma =
        resumo.totalEditais +
        resumo.totalContratos +
        resumo.totalConvenios +
        resumo.totalDecretos +
        resumo.totalPortarias +
        resumo.totalLeis +
        resumo.totalOutros;

      expect(soma).toBe(resumo.total);
    });

    test("municipio inexistente retorna zeros no resumo", async () => {
      const resumo = await fetchResumoDiario("cidade-inexistente");
      expect(resumo).toEqual({
        total: 0,
        totalEditais: 0,
        totalContratos: 0,
        totalConvenios: 0,
        totalDecretos: 0,
        totalPortarias: 0,
        totalLeis: 0,
        totalOutros: 0,
      });
    });
  });

  describe("fetchSerieDiarioPorAno", () => {
    test("agrupa atos por ano e ordena ascendentemente", async () => {
      const serie = await fetchSerieDiarioPorAno("diamantina");

      expect(serie.length).toBeGreaterThan(0);
      for (let i = 1; i < serie.length; i++) {
        expect(serie[i].ano).toBeGreaterThan(serie[i - 1].ano);
      }

      const somaSerie = serie.reduce((acc, curr) => acc + curr.total, 0);
      const resumo = await fetchResumoDiario("diamantina");
      expect(somaSerie).toBe(resumo.total);
    });

    test("municipio inexistente retorna serie vazia", async () => {
      const serie = await fetchSerieDiarioPorAno("cidade-inexistente");
      expect(serie).toEqual([]);
    });
  });
});
