import { describe, it, expect } from "vitest";
import {
  carregarCatalogoCidades,
  listarCidadesEstrategicas,
  obterCidadePorIbge,
  listarCapitais,
  listarPolosPorRegiao,
  listarCidadesPorUf,
  buscarCidadesEstrategicas,
  obterEstatisticasExpansao,
} from "./estrategicas";

describe("expansão nacional — 199 cidades estratégicas", () => {
  it("carrega o catálogo completo com 199 municípios", () => {
    const cat = carregarCatalogoCidades();
    expect(cat.total).toBe(199);
    expect(cat.cidades.length).toBe(199);
    expect(cat.por_tipo.capital).toBe(27);
    expect(cat.por_tipo["polo-interior"]).toBe(172);
  });

  it("garante exatamente 27 capitais estaduais/DF", () => {
    const capitais = listarCapitais();
    expect(capitais.length).toBe(27);

    const nomes = capitais.map((c) => c.nome);
    expect(nomes).toContain("Belo Horizonte");
    expect(nomes).toContain("São Paulo");
    expect(nomes).toContain("Rio de Janeiro");
    expect(nomes).toContain("Salvador");
    expect(nomes).toContain("Manaus");
    expect(nomes).toContain("Curitiba");
    expect(nomes).toContain("Brasília");
  });

  it("garante cobertura de todas as 27 Unidades Federativas", () => {
    const stats = obterEstatisticasExpansao();
    expect(stats.totalEstados).toBe(27);
    expect(stats.distribuicaoRegiao.Norte).toBe(29);
    expect(stats.distribuicaoRegiao.Nordeste).toBe(54);
    expect(stats.distribuicaoRegiao.Sudeste).toBe(54);
    expect(stats.distribuicaoRegiao.Sul).toBe(38);
    expect(stats.distribuicaoRegiao["Centro-Oeste"]).toBe(24);
  });

  it("localiza cidades por código IBGE de 7 dígitos e DATASUS de 6 dígitos", () => {
    // Belo Horizonte (3106200 / 310620)
    const bh7 = obterCidadePorIbge("3106200");
    expect(bh7).toBeDefined();
    expect(bh7?.nome).toBe("Belo Horizonte");

    const bh6 = obterCidadePorIbge("310620");
    expect(bh6).toBeDefined();
    expect(bh6?.nome).toBe("Belo Horizonte");

    // Contagem (3118601 / 311860)
    const contagem = obterCidadePorIbge("3118601");
    expect(contagem).toBeDefined();
    expect(contagem?.nome).toBe("Contagem");
  });

  it("filtra por região e por UF", () => {
    const sudeste = listarPolosPorRegiao("Sudeste");
    expect(sudeste.length).toBe(54);

    const mg = listarCidadesPorUf("MG");
    expect(mg.length).toBeGreaterThanOrEqual(15);
    const nomesMg = mg.map((c) => c.nome);
    expect(nomesMg).toContain("Belo Horizonte");
    expect(nomesMg).toContain("Uberlândia");
    expect(nomesMg).toContain("Juiz de Fora");
    expect(nomesMg).toContain("Montes Claros");
  });

  it("busca por termo normalizado sem sensibilidade a acento", () => {
    const res1 = buscarCidadesEstrategicas("maraba");
    expect(res1.length).toBeGreaterThan(0);
    expect(res1[0].nome).toBe("Marabá");

    const res2 = buscarCidadesEstrategicas("santarem");
    expect(res2.length).toBeGreaterThan(0);
    expect(res2[0].nome).toBe("Santarém");
  });
});
