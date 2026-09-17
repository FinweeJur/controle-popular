import { describe, expect, test } from "vitest";
import {
  normalizarNumerosTexto,
  normalizarGrandezaValor,
} from "./normalizar-numeros";

describe("normalizarNumerosTexto", () => {
  test("converte bilhões fracionários para milhões", () => {
    expect(normalizarNumerosTexto("O acordo prevê 0,4 bilhões para o projeto."))
      .toBe("O acordo prevê 400 milhões para o projeto.");

    expect(normalizarNumerosTexto("Investimento de R$ 0,05 bilhão na ferrovia."))
      .toBe("Investimento de R$ 50 milhões na ferrovia.");

    expect(normalizarNumerosTexto("Exatamente 0,001 bilhão de reais."))
      .toBe("Exatamente 1 milhão de reais.");
  });

  test("converte milhões fracionários para mil", () => {
    expect(normalizarNumerosTexto("Contrato de 0,2 milhões assinado."))
      .toBe("Contrato de 200 mil assinado.");

    expect(normalizarNumerosTexto("Custo estimado em R$ 0,75 milhão."))
      .toBe("Custo estimado em R$ 750 mil.");
  });

  test("converte mil fracionário para unidades inteiras", () => {
    expect(normalizarNumerosTexto("Atendeu 0,5 mil pessoas."))
      .toBe("Atendeu 500 pessoas.");

    expect(normalizarNumerosTexto("Meta de R$ 0,8 mil alcançada."))
      .toBe("Meta de R$ 800 alcançada.");
  });

  test("mantém intactos números que já expressam grandezas inteiras", () => {
    expect(normalizarNumerosTexto("O orçamento é de R$ 1,5 bilhão."))
      .toBe("O orçamento é de R$ 1,5 bilhão.");

    expect(normalizarNumerosTexto("Foram repassados 400 milhões de reais."))
      .toBe("Foram repassados 400 milhões de reais.");

    expect(normalizarNumerosTexto("A cidade tem 150 mil habitantes."))
      .toBe("A cidade tem 150 mil habitantes.");
  });
});

describe("normalizarGrandezaValor", () => {
  test("normaliza valor puro < 1 em bilhões para milhões", () => {
    const res = normalizarGrandezaValor(0.4, "bilhao");
    expect(res.valor).toBe(400);
    expect(res.unidade).toBe("milhões");
    expect(res.formatado).toBe("400 milhões");
  });

  test("normaliza 0.001 bilhão para 1 milhão (singular)", () => {
    const res = normalizarGrandezaValor(0.001, "bilhao");
    expect(res.valor).toBe(1);
    expect(res.unidade).toBe("milhão");
    expect(res.formatado).toBe("1 milhão");
  });

  test("mantém valores >= 1 inalterados", () => {
    const res = normalizarGrandezaValor(2.5, "bilhao");
    expect(res.valor).toBe(2.5);
    expect(res.unidade).toBe("bilhões");
    expect(res.formatado).toBe("2,5 bilhões");
  });
});
