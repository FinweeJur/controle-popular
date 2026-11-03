/**
 * @file estrela-scroll.test.ts
 * @description Testes da fórmula do progresso da estrela (ver
 * `estrela-scroll.ts`). Cobrem os sete critérios de aceite que dependem de
 * aritmética: entrada pelo topo, saída pelo fim, presa nas pontas, âncora em
 * 55%, e trilha degenerada.
 */
import { describe, expect, it } from "vitest";
import { ANCORAGEM_DA_ESTRELA, progressoDaEstrela } from "./estrela-scroll";

const JANELA = 800; // innerHeight de referência; 55% = 440 px de âncora.

describe("progressoDaEstrela", () => {
  it("ancora em 55% da janela", () => {
    expect(ANCORAGEM_DA_ESTRELA).toBe(0.55);
  });

  it("vale 0 quando o topo da trilha encosta na âncora", () => {
    expect(progressoDaEstrela(JANELA * 0.55, 1000, JANELA)).toBe(0);
  });

  it("cresce linearmente enquanto a seção atravessa a tela", () => {
    // Âncora a 440; trilha de 1000 px. Rolando 220 px: (440-220)/1000 = 0,22.
    expect(progressoDaEstrela(220, 1000, JANELA)).toBeCloseTo(0.22);
    expect(progressoDaEstrela(-240, 1000, JANELA)).toBeCloseTo(0.68);
  });

  it("vale 1 quando o fim da trilha passa da âncora e fica presa lá", () => {
    // Âncora a 440; trilha de 1000. Com o topo em -560, o fim da trilha
    // encosta na âncora: (440 - (-560)) / 1000 = 1. Passou disso, continua 1
    // — presa no fim da linha, nunca passa do último item.
    expect(progressoDaEstrela(-560, 1000, JANELA)).toBe(1);
    expect(progressoDaEstrela(-5000, 1000, JANELA)).toBe(1);
  });

  it("vale 0 antes de a seção entrar na tela (presa no topo)", () => {
    expect(progressoDaEstrela(700, 1000, JANELA)).toBe(0);
    expect(progressoDaEstrela(999999, 1000, JANELA)).toBe(0);
  });

  it("trilha degenerada ou número não finito devolve 0, nunca NaN", () => {
    expect(progressoDaEstrela(100, 0, JANELA)).toBe(0);
    expect(progressoDaEstrela(100, -40, JANELA)).toBe(0);
    expect(progressoDaEstrela(Number.NaN, 1000, JANELA)).toBe(0);
    expect(progressoDaEstrela(100, Number.POSITIVE_INFINITY, JANELA)).toBe(0);
    expect(progressoDaEstrela(100, 1000, Number.NaN)).toBe(0);
  });

  it("funciona em janelas fora do padrão (celular deitado, zoom)", () => {
    // 390x844 em pé: âncora em 464,2 px. Topo 400 px acima da âncora → 0,4.
    const janelaAlta = 844;
    expect(progressoDaEstrela(janelaAlta * 0.55, 1000, janelaAlta)).toBe(0);
    expect(progressoDaEstrela(janelaAlta * 0.55 - 400, 1000, janelaAlta)).toBeCloseTo(0.4, 5);
  });
});
