import { describe, expect, test } from "vitest";
import { ranquearPorSimilaridade, similaridadeCosseno, similaridadeLexical } from "./similaridade";

describe("similaridadeCosseno", () => {
  test("vetor idêntico a si mesmo dá 1", () => {
    expect(similaridadeCosseno([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 10);
  });

  test("vetores ortogonais dão 0", () => {
    expect(similaridadeCosseno([1, 0], [0, 1])).toBeCloseTo(0, 10);
  });

  test("vetores opostos dão -1", () => {
    expect(similaridadeCosseno([1, 2], [-1, -2])).toBeCloseTo(-1, 10);
  });

  test("magnitude não importa — só direção", () => {
    // (10,0) e (1,0) apontam pro mesmo lugar; a distância euclidiana entre
    // eles é grande, mas o cosseno tem de dar 1 — é a diferença que a
    // docstring do módulo justifica.
    expect(similaridadeCosseno([10, 0], [1, 0])).toBeCloseTo(1, 10);
  });

  test("vetores de tamanhos diferentes lançam erro", () => {
    expect(() => similaridadeCosseno([1, 2], [1, 2, 3])).toThrow(/tamanhos diferentes/);
  });

  test("vetor vazio lança erro", () => {
    expect(() => similaridadeCosseno([], [])).toThrow(/vazios/);
  });

  test("vetor nulo (todo zero) dá 0, não divide por zero", () => {
    expect(similaridadeCosseno([0, 0, 0], [1, 2, 3])).toBe(0);
  });
});

describe("ranquearPorSimilaridade", () => {
  test("ordena do mais parecido pro menos parecido", () => {
    const consulta = [1, 0];
    const candidatos = [
      { rotulo: "oposto", vetor: [-1, 0] },
      { rotulo: "igual", vetor: [1, 0] },
      { rotulo: "perpendicular", vetor: [0, 1] },
    ];
    const ranking = ranquearPorSimilaridade(consulta, candidatos, (c) => c.vetor);
    expect(ranking.map((r) => r.item.rotulo)).toEqual(["igual", "perpendicular", "oposto"]);
    expect(ranking[0].score).toBeCloseTo(1, 10);
    expect(ranking[2].score).toBeCloseTo(-1, 10);
  });

  test("lista vazia devolve ranking vazio", () => {
    expect(ranquearPorSimilaridade([1, 0], [] as { vetor: number[] }[], (c) => c.vetor)).toEqual([]);
  });
});

describe("similaridadeLexical", () => {
  test("textos sem tokens comuns dão 0", () => {
    expect(similaridadeLexical("saúde pública hospital", "mineração ferro barragem")).toBe(0);
  });

  test("pergunta com termos contidos em documento longo obtém score relevante (> 0.3)", () => {
    const pergunta = "De onde vêm os R$ 251 bilhões monitorados no painel do portal?";
    const doc =
      "O portal monitora R$ 251 bilhões no painel geral de impacto popular. " +
      "Soma pública oficial: Rio Doce R$ 171 bi + Brumadinho R$ 37,7 bi + Justiça MG R$ 20,1 bi + cidades monitoradas R$ 22,7 bi. " +
      "Dados consolidados de acordos judiciais e compras públicas das prefeituras.";
    const score = similaridadeLexical(pergunta, doc);
    expect(score).toBeGreaterThan(0.4);
  });

  test("pergunta sobre acordo de Mariana obtém score alto com boost", () => {
    const pergunta = "Como funciona a repactuação do Rio Doce de R$ 171 bi e o repasse para MG?";
    const doc = "Acordo de Repactuação do Rio Doce e Mariana: R$ 171 bilhões totais, com R$ 100 bi em dinheiro novo para saúde, saneamento e repasses municipais.";
    const score = similaridadeLexical(pergunta, doc);
    expect(score).toBeGreaterThan(0.5);
  });
});
