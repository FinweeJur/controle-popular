import { describe, expect, it } from "vitest";

import {
  calcularNota,
  classificarRequerimento,
  componenteNormativa,
  componenteProducaoAmpla,
} from "./rank";

const cheia = {
  saldoAutoria: 10,
  nProposicoesAnalisadas: 20,
  coerencia: { valor: 1, medido: true },
  presenca: { valor: 1, medido: true },
  producaoAmpla: 1,
};

describe("calcularNota", () => {
  it("todos os eixos em 1 → nota 100", () => {
    expect(calcularNota(cheia).nota).toBe(100);
  });

  it("menos de 5 proposições analisadas → nota none (insuficiente)", () => {
    expect(calcularNota({ ...cheia, nProposicoesAnalisadas: 4 }).nota).toBeNull();
    expect(calcularNota({ ...cheia, nProposicoesAnalisadas: 0 }).nota).toBeNull();
  });

  it("eixo não medido redistribui peso e marca eixoParcial", () => {
    const parcial = calcularNota({ ...cheia, coerencia: { valor: 1, medido: false } });
    // normativa 0,4 + presença 0,25 + ampla 0,1 = 0,75 de peso remanescente.
    // média = (0,4 + 0,25 + 0,1) / 0,75 = 1 → nota 100, mas eixoParcial.
    expect(parcial.nota).toBe(100);
    expect(parcial.eixoParcial).toBe(true);
    expect(parcial.componentes.coerencia).toBeNull();
  });

  it("saldo negativo puxa a nota para baixo, não para 0 bruto", () => {
    // normativa com saldo −10 = 0,5 − 0,5 = 0
    const baixa = calcularNota({
      ...cheia,
      saldoAutoria: -10,
    });
    const esperado = Math.round(
      ((0.4 * 0 + 0.25 * 1 + 0.25 * 1 + 0.1 * 1) / 1) * 100
    );
    expect(baixa.nota).toBe(esperado);
  });

  it("produção ampla pode zerar sem zerar a nota", () => {
    const semAmpla = calcularNota({ ...cheia, producaoAmpla: 0 });
    expect(semAmpla.nota).toBe(
      Math.round(((0.4 * 1 + 0.25 + 0.25) / 1) * 100)
    );
  });
});

describe("componenteNormativa", () => {
  it("âncora fixa: saldo 10 → 1,0; saldo 0 → 0,5; saldo −10 → 0", () => {
    expect(componenteNormativa(10)).toBe(1);
    expect(componenteNormativa(0)).toBe(0.5);
    expect(componenteNormativa(-10)).toBe(0);
  });

  it("saturação: saldo muito alto fica no teto, muito baixo no piso", () => {
    expect(componenteNormativa(1000)).toBe(1);
    expect(componenteNormativa(-1000)).toBe(0);
  });
});

describe("componenteProducaoAmpla", () => {
  it("5 pontos (âncora) satura; menos escala", () => {
    expect(componenteProducaoAmpla(0, 0)).toBe(0);
    expect(componenteProducaoAmpla(5, 5)).toBeCloseTo(0.6);
    // saturação: 100 requerimentos de audiência = 30 pontos → cap em 5
    expect(componenteProducaoAmpla(100, 0)).toBe(1);
  });
});

describe("classificarRequerimento", () => {
  it("audiência em caixa e acentos variáveis", () => {
    expect(classificarRequerimento("Requerimento de audiência pública")).toBe("audiencia");
    expect(classificarRequerimento("Realiza audiencia publica com especialistas")).toBe("audiencia");
  });

  it("fiscalização e comissão externa", () => {
    expect(classificarRequerimento("Fiscalização de contrato de concessão")).toBe("fiscalizacao");
    expect(classificarRequerimento("Providências sobre danos na bacia")).toBe("fiscalizacao");
  });

  it("dúvida não conta", () => {
    expect(classificarRequerimento("Solicita delegação de competência")).toBeNull();
    expect(classificarRequerimento(null)).toBeNull();
    expect(classificarRequerimento("")).toBeNull();
  });

  it("audiência vence fiscalização quando as duas aparecem — e vale mais", () => {
    expect(
      classificarRequerimento("Audiência pública e fiscalização do contrato")
    ).toBe("audiencia");
  });
});
