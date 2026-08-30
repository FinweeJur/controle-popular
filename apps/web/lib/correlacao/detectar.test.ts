import { describe, it, expect } from "vitest";
import {
  calcularVariacaoDiaria,
  detectarMovimentosSignificativos,
  correlacionarComNoticias,
  DEFAULT_CONFIG,
  type Cotacao,
  type Noticia,
} from "./detectar";

function makeCotacoes(
  precos: number[],
  inicio: string = "2025-01-01"
): Cotacao[] {
  return precos.map((fechamento, i) => {
    const d = new Date(inicio);
    d.setDate(d.getDate() + i);
    return {
      data: d.toISOString().split("T")[0],
      fechamento,
      abertura: fechamento,
      maxima: fechamento,
      minima: fechamento,
      volume: 1000,
    };
  });
}

function makeNoticias(
  titulos: string[],
  datas: (string | null)[]
): Noticia[] {
  return titulos.map((titulo, i) => ({
    titulo,
    link: `https://example.com/${i}`,
    data: datas[i],
    fonte: "Fonte Teste",
    descricao: `Descricao ${i}`,
  }));
}

describe("calcularVariacaoDiaria", () => {
  it("computes correct percentages", () => {
    const cotacoes = makeCotacoes([100, 110, 99, 99]);
    const result = calcularVariacaoDiaria(cotacoes);
    expect(result).toHaveLength(3);
    expect(result[0].variacao).toBeCloseTo(10, 5);
    expect(result[1].variacao).toBeCloseTo(-10, 5);
    expect(result[2].variacao).toBeCloseTo(0, 5);
  });
});

describe("detectarMovimentosSignificativos", () => {
  it("finds movements above threshold", () => {
    const cotacoes = makeCotacoes([
      50, 50, 50, 50, 45, 50, 50, 50, 50, 56,
    ]);
    const result = detectarMovimentosSignificativos(cotacoes);
    expect(result.length).toBeGreaterThanOrEqual(1);
    const datas = result.map((m) => m.data);
    expect(datas).toContain(cotacoes[4].data);
    expect(result.find((m) => m.data === cotacoes[4].data)!.variacao).toBeCloseTo(
      -10,
      5
    );
  });

  it("ignores movements below threshold", () => {
    const cotacoes = makeCotacoes([
      50, 51, 52, 51, 50, 49, 50, 51, 52, 53,
    ]);
    const result = detectarMovimentosSignificativos(cotacoes);
    expect(result).toHaveLength(0);
  });

  it("config override works", () => {
    const cotacoes = makeCotacoes([50, 52, 54, 56, 58, 60]);
    const resultDefault = detectarMovimentosSignificativos(cotacoes);
    const resultLow = detectarMovimentosSignificativos(cotacoes, {
      limiarVariacao: 1,
    });
    expect(resultLow.length).toBeGreaterThanOrEqual(resultDefault.length);
    expect(resultLow.length).toBeGreaterThanOrEqual(1);
  });
});

describe("correlacionarComNoticias", () => {
  it("matches news within window", () => {
    const cotacoes = makeCotacoes([
      50, 50, 50, 50, 45, 50, 50, 50, 50, 56,
    ]);
    const movimentos = detectarMovimentosSignificativos(cotacoes);
    const noticias = makeNoticias(
      ["Noticia dia 4", "Noticia dia 6"],
      [cotacoes[3].data, cotacoes[5].data]
    );
    const result = correlacionarComNoticias(
      movimentos,
      noticias,
      cotacoes
    );
    const movDrop = result.find((m) => m.data === cotacoes[4].data);
    expect(movDrop).toBeDefined();
    expect(movDrop!.noticias).toHaveLength(2);
  });

  it("excludes news outside window", () => {
    const cotacoes = makeCotacoes([
      50, 50, 50, 50, 45, 50, 50, 50, 50, 56,
    ]);
    const movimentos = detectarMovimentosSignificativos(cotacoes);
    const noticias = makeNoticias(
      ["Noticia antiga", "Noticia longe"],
      [cotacoes[0].data, cotacoes[9].data]
    );
    const result = correlacionarComNoticias(
      movimentos,
      noticias,
      cotacoes
    );
    const movDrop = result.find((m) => m.data === cotacoes[4].data);
    expect(movDrop).toBeDefined();
    expect(movDrop!.noticias).toHaveLength(0);
  });

  it("handles null news dates", () => {
    const cotacoes = makeCotacoes([
      50, 50, 50, 50, 45, 50, 50, 50, 50, 56,
    ]);
    const movimentos = detectarMovimentosSignificativos(cotacoes);
    const noticias = makeNoticias(
      ["Sem data", "Com data"],
      [null, cotacoes[5].data]
    );
    const result = correlacionarComNoticias(
      movimentos,
      noticias,
      cotacoes
    );
    const movDrop = result.find((m) => m.data === cotacoes[4].data);
    expect(movDrop).toBeDefined();
    expect(movDrop!.noticias).toHaveLength(1);
    expect(movDrop!.noticias[0].titulo).toBe("Com data");
  });

  it("returns empty array for empty cotacoes", () => {
    const movimentos = detectarMovimentosSignificativos([]);
    expect(movimentos).toHaveLength(0);
    const result = correlacionarComNoticias([], [], []);
    expect(result).toHaveLength(0);
  });
});
