/**
 * Testes do limitador de arrasto (o resto do hook toca `window` e só roda
 * no navegador). Guardam a regra que impede a janelinha de sumir pela borda
 * da tela — o pedido do dono (30/09/2026) para o rádio e o Seu Nonô.
 */
import { describe, expect, it } from "vitest";
import { limitarDeslocamento, MARGEM_VISAO } from "./usarArrastavel";

const VISAO = { larg: 1000, alt: 1000 };

describe("limitarDeslocamento", () => {
  it("deixa andar dentro da tela", () => {
    const caixa = { esq: 16, topo: 900, larg: 200, alt: 56 };
    expect(limitarDeslocamento(500, 0, caixa, VISAO)).toEqual({ x: 500, y: 0 });
  });

  it("freia na borda direita e inferior (com a folga)", () => {
    const caixa = { esq: 16, topo: 900, larg: 200, alt: 56 };
    const r = limitarDeslocamento(9999, 9999, caixa, VISAO);
    expect(r.x).toBe(VISAO.larg - (caixa.esq + caixa.larg) - MARGEM_VISAO);
    expect(r.y).toBe(VISAO.alt - (caixa.topo + caixa.alt) - MARGEM_VISAO);
  });

  it("freia na borda esquerda e superior (com a folga)", () => {
    const caixa = { esq: 16, topo: 900, larg: 200, alt: 56 };
    const r = limitarDeslocamento(-9999, -9999, caixa, VISAO);
    expect(r.x).toBe(-caixa.esq + MARGEM_VISAO);
    expect(r.y).toBe(-caixa.topo + MARGEM_VISAO);
  });

  it("trava no zero quando o painel é maior que a tela", () => {
    const caixa = { esq: -500, topo: 0, larg: 2000, alt: 100 };
    expect(limitarDeslocamento(123, 0, caixa, VISAO).x).toBe(
      -caixa.esq + MARGEM_VISAO,
    );
  });
});
