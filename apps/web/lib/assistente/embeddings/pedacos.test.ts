import { describe, expect, test } from "vitest";
import { fatiarTexto } from "./pedacos";

describe("fatiarTexto", () => {
  test("texto vazio (ou só espaço) devolve pedaço nenhum", () => {
    expect(fatiarTexto("")).toEqual([]);
    expect(fatiarTexto("   \n\n  ")).toEqual([]);
  });

  test("um parágrafo curto vira um pedaço só, texto intacto", () => {
    const texto = "Institui o Grupo de Trabalho GT Rio Doce.";
    const pedacos = fatiarTexto(texto);
    expect(pedacos).toEqual([{ indice: 0, texto }]);
  });

  test("preserva acento, maiúscula e pontuação — NÃO é separarPalavras", () => {
    // Decisão documentada em pedacos.ts: chunking pra embedding preserva o
    // texto natural; normalizar (baixar caixa, tirar acento) é coisa de
    // busca por palavra-chave, degradaria o vetor aqui.
    const texto = "A Barragem de Fundão, em Mariana/MG — rompeu em 2015.";
    const [pedaco] = fatiarTexto(texto);
    expect(pedaco.texto).toBe(texto);
  });

  test("cada parágrafo (separado por linha em branco) vira um pedaço, em ordem", () => {
    const texto = ["Primeiro parágrafo, curto.", "Segundo parágrafo, também curto.", "Terceiro."].join("\n\n");
    const pedacos = fatiarTexto(texto);
    expect(pedacos.map((p) => p.texto)).toEqual([
      "Primeiro parágrafo, curto.",
      "Segundo parágrafo, também curto.",
      "Terceiro.",
    ]);
    expect(pedacos.map((p) => p.indice)).toEqual([0, 1, 2]);
  });

  test("parágrafo vazio entre dois parágrafos reais é descartado", () => {
    const texto = "Um.\n\n\n\nDois.";
    expect(fatiarTexto(texto).map((p) => p.texto)).toEqual(["Um.", "Dois."]);
  });

  test("parágrafo maior que maxPalavras vira janelas com sobreposição", () => {
    const palavras = Array.from({ length: 25 }, (_, i) => `p${i}`);
    const texto = palavras.join(" ");
    const pedacos = fatiarTexto(texto, { maxPalavras: 10, sobreposicaoPalavras: 3 });

    // passo = 10 - 3 = 7: janelas em 0, 7, 14, 21 -> 4 pedaços (a última
    // cobre 21-25, só 4 palavras, e para porque chegou ao fim).
    expect(pedacos).toHaveLength(4);
    expect(pedacos[0].texto.split(" ")).toEqual(palavras.slice(0, 10));
    expect(pedacos[1].texto.split(" ")).toEqual(palavras.slice(7, 17));
    expect(pedacos[2].texto.split(" ")).toEqual(palavras.slice(14, 24));
    expect(pedacos[3].texto.split(" ")).toEqual(palavras.slice(21, 25));

    // a sobreposição é literal: as 3 últimas palavras de uma janela são as
    // 3 primeiras da próxima.
    expect(pedacos[0].texto.split(" ").slice(-3)).toEqual(pedacos[1].texto.split(" ").slice(0, 3));

    // nenhuma palavra do original se perde, e nenhuma aparece fora de ordem
    expect(pedacos.at(-1)!.texto.split(" ").at(-1)).toBe("p24");
  });

  test("parágrafo com exatamente maxPalavras não é fatiado", () => {
    const palavras = Array.from({ length: 10 }, (_, i) => `p${i}`);
    const pedacos = fatiarTexto(palavras.join(" "), { maxPalavras: 10, sobreposicaoPalavras: 2 });
    expect(pedacos).toHaveLength(1);
  });

  test("documento com parágrafo curto e parágrafo longo mistura as duas regras", () => {
    const curto = "Ementa curta de uma norma.";
    const longo = Array.from({ length: 15 }, (_, i) => `w${i}`).join(" ");
    const pedacos = fatiarTexto([curto, longo].join("\n\n"), { maxPalavras: 10, sobreposicaoPalavras: 2 });
    // 1 pedaço pro parágrafo curto + 2 janelas pro longo (passo 8: 0-10, 8-15)
    expect(pedacos).toHaveLength(3);
    expect(pedacos[0].texto).toBe(curto);
  });

  test("maxPalavras <= 0 lança erro", () => {
    expect(() => fatiarTexto("qualquer coisa", { maxPalavras: 0 })).toThrow(/maxPalavras/);
    expect(() => fatiarTexto("qualquer coisa", { maxPalavras: -5 })).toThrow(/maxPalavras/);
  });

  test("sobreposicaoPalavras negativa ou >= maxPalavras lança erro", () => {
    expect(() => fatiarTexto("qualquer coisa", { maxPalavras: 10, sobreposicaoPalavras: -1 })).toThrow(
      /sobreposicaoPalavras/
    );
    expect(() => fatiarTexto("qualquer coisa", { maxPalavras: 10, sobreposicaoPalavras: 10 })).toThrow(
      /sobreposicaoPalavras/
    );
  });
});
