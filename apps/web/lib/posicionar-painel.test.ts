/**
 * Testes do posicionador de painéis flutuantes (a parte com DOM fica no hook
 * `usePosicaoPainel`). Guardam a regra do dono (03/10/2026): o índice do rádio,
 * o menu do pet e a janelinha do Seu Nonô nunca podem ser cortados pela borda.
 */
import { describe, expect, it } from "vitest";
import {
  ESPACO_PAINEL,
  MARGEM_PAINEL,
  posicionarPainel,
} from "./posicionar-painel";

const VISAO = { larg: 1000, alt: 800 };

describe("posicionarPainel", () => {
  it("cabe em cima: abre acima da âncora", () => {
    const ancora = { esq: 100, topo: 600, larg: 48, alt: 48 };
    const painel = { larg: 320, alt: 300 };
    const r = posicionarPainel(ancora, painel, VISAO);
    expect(r.vertical).toBe("acima");
    expect(r.altura).toBe(300);
    expect(r.limitadoAltura).toBe(false);
    // Base do painel a um vão do topo da âncora.
    expect(r.y).toBe(ancora.topo - ESPACO_PAINEL - painel.alt); // 292
    // Cabe à direita da âncora: cresce para a direita.
    expect(r.horizontal).toBe("direita");
    expect(r.x).toBe(ancora.esq);
  });

  it("não cabe em cima: abre embaixo", () => {
    const ancora = { esq: 100, topo: 20, larg: 48, alt: 48 };
    const painel = { larg: 320, alt: 300 };
    const r = posicionarPainel(ancora, painel, VISAO);
    expect(r.vertical).toBe("abaixo");
    expect(r.limitadoAltura).toBe(false);
    // Topo do painel a um vão da base da âncora.
    expect(r.y).toBe(ancora.topo + ancora.alt + ESPACO_PAINEL); // 76
  });

  it("âncora perto da borda direita: o painel vira e fica inteiro (alinha à esquerda)", () => {
    const ancora = { esq: 940, topo: 300, larg: 48, alt: 48 };
    const painel = { larg: 320, alt: 200 };
    const r = posicionarPainel(ancora, painel, VISAO);
    // Não cabe à direita (940+320 > 1000): vira para a esquerda.
    expect(r.horizontal).toBe("esquerda");
    // Borda direita do painel encosta na borda direita da âncora.
    expect(r.x).toBe(ancora.esq + ancora.larg - painel.larg); // 668
    expect(r.x + r.largura).toBeLessThanOrEqual(VISAO.larg - MARGEM_PAINEL);
    expect(r.x).toBeGreaterThanOrEqual(MARGEM_PAINEL);
  });

  it("âncora fora da borda direita: clampa na margem", () => {
    const ancora = { esq: 980, topo: 300, larg: 48, alt: 48 };
    const painel = { larg: 320, alt: 200 };
    const r = posicionarPainel(ancora, painel, VISAO);
    expect(r.horizontal).toBe("esquerda");
    // Mesmo virando, o clamp segura 8 px da borda: 1000 - 320 - 8.
    expect(r.x).toBe(VISAO.larg - painel.larg - MARGEM_PAINEL); // 672
    expect(r.x + r.largura).toBe(VISAO.larg - MARGEM_PAINEL);
  });

  it("canaleta menor que o painel: clampa na margem e limita a altura", () => {
    const visao = { larg: 360, alt: 300 };
    const ancora = { esq: 40, topo: 260, larg: 48, alt: 48 };
    const painel = { larg: 320, alt: 500 };
    const r = posicionarPainel(ancora, painel, visao);
    // Acima: 260-8-8 = 244; abaixo: 300-308-16 < 0 → abre acima, cortando.
    expect(r.vertical).toBe("acima");
    expect(r.limitadoAltura).toBe(true);
    expect(r.altura).toBe(auxDisponivelAcima(ancora)); // 244
    expect(r.y).toBe(MARGEM_PAINEL); // 260-8-244 = 8
    // O conteúdo passa a rolar: a base fica a um vão da âncora.
    expect(r.y + r.altura).toBe(ancora.topo - ESPACO_PAINEL);
  });
});

/** Espaço livre acima da âncora (mesma conta do utilitário), didático no teste. */
function auxDisponivelAcima(ancora: { topo: number }): number {
  return ancora.topo - MARGEM_PAINEL - ESPACO_PAINEL;
}
