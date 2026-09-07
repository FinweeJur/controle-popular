import { describe, expect, it } from "vitest";
import {
  listarCidadesEstrategicas,
  listarCapitais,
  obterCidadePorIbge,
  obterCidadePorSlugOuId,
  obterDadosCompletosCidade,
  listarTodasCidadesCompletas,
  obterEstatisticasExpansao,
} from "./estrategicas";

describe("lib/cidades/estrategicas — 199 Cidades Estratégicas", () => {
  it("deve carregar exatamente as 199 cidades estratégicas do catálogo nacional", () => {
    const cidades = listarCidadesEstrategicas();
    expect(cidades.length).toBe(199);
  });

  it("deve conter exatamente as 27 capitais de estado e DF", () => {
    const capitais = listarCapitais();
    expect(capitais.length).toBe(27);
    const ufs = new Set(capitais.map((c) => c.uf));
    expect(ufs.size).toBe(27);
  });

  it("deve recuperar município por código IBGE 7 dígitos, 6 dígitos ou slug", () => {
    const bhPorIbge = obterCidadePorIbge("3106200");
    expect(bhPorIbge).toBeDefined();
    expect(bhPorIbge?.nome).toBe("Belo Horizonte");

    const spPorSlug = obterCidadePorSlugOuId("sp");
    expect(spPorSlug).toBeDefined();
    expect(spPorSlug?.nome).toBe("São Paulo");

    const curitibaPorSlug = obterCidadePorSlugOuId("curitiba");
    expect(curitibaPorSlug).toBeDefined();
    expect(curitibaPorSlug?.uf).toBe("PR");
  });

  it("deve retornar métricas e indicadores auditados para todas as 199 cidades no banco consolidado", () => {
    const banco = listarTodasCidadesCompletas();
    expect(banco.length).toBe(199);

    for (const c of banco) {
      expect(c.id_municipio).toBeDefined();
      expect(c.nome).toBeTruthy();
      expect(c.uf).toHaveLength(2);
      expect(c.populacao).toBeGreaterThan(1000);
      expect(c.pib_mais_recente_bi).toBeGreaterThan(0);
      expect(c.pib_per_capita_reais).toBeGreaterThan(0);
      expect(c.saude_estabelecimentos).toBeGreaterThan(0);
      expect(c.escolas_total).toBeGreaterThan(0);
      expect(c.repasses_federais_anuais_mi).toBeGreaterThan(0);
      expect(c.serie_pib.length).toBeGreaterThanOrEqual(10);
      expect(c.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("deve retornar estatísticas de expansão válidas", () => {
    const stats = obterEstatisticasExpansao();
    expect(stats.totalCidades).toBe(199);
    expect(stats.totalCapitais).toBe(27);
    expect(stats.totalPolosInterior).toBe(172);
    expect(stats.totalEstados).toBe(27);
  });
});
