/**
 * @file estrela-scroll.test.ts
 * @description Testes da fórmula da estrela (ver `estrela-scroll.ts`), na
 * versão pedida pelo dono em 03/11/2026: a estrela fica centralizada no
 * EVENTO sob a âncora de 55% e desce de evento em evento, presa nas pontas.
 * Cobrimos: âncora, escolha de evento, brecha entre itens, antes do primeiro,
 * depois do último, lista vazia e o recorte do ponto dentro da trilha.
 */
import { describe, expect, it } from "vitest";
import { ANCORAGEM_DA_ESTRELA, eventoNoAlvo, topoDoPonto } from "./estrela-scroll";

// Cenário fixo: trilha em y_doc 100..1300; três eventos de 400 px, com
// 0..10 px de brecha — [100,500], [510,910], [920,1300].
const TOPOS = [100, 510, 920];
const FINS = [500, 910, 1300];

describe("ANCORAGEM_DA_ESTRELA", () => {
  it("é 55% da altura da janela", () => {
    expect(ANCORAGEM_DA_ESTRELA).toBe(0.55);
  });
});

describe("eventoNoAlvo", () => {
  it("escolhe o evento que contém o alvo", () => {
    expect(eventoNoAlvo(200, TOPOS, FINS)).toBe(0);
    expect(eventoNoAlvo(600, TOPOS, FINS)).toBe(1);
    expect(eventoNoAlvo(1000, TOPOS, FINS)).toBe(2);
  });

  it("mantém o evento anterior na brecha entre itens (passo controlado)", () => {
    // Âncora caindo exatamente na troca não fica piscando entre os dois:
    // a brecha [500,510] pertence visualmente ao item anterior... e o
    // crossing só acontece quando a âncora atinge o topo do próximo.
    expect(eventoNoAlvo(500, TOPOS, FINS)).toBe(0);
    expect(eventoNoAlvo(505, TOPOS, FINS)).toBe(0);
    expect(eventoNoAlvo(510, TOPOS, FINS)).toBe(1);
  });

  it("prende no primeiro antes da seção e no último depois dela", () => {
    expect(eventoNoAlvo(0, TOPOS, FINS)).toBe(0);
    expect(eventoNoAlvo(99, TOPOS, FINS)).toBe(0);
    expect(eventoNoAlvo(1300, TOPOS, FINS)).toBe(2);
    expect(eventoNoAlvo(999_999, TOPOS, FINS)).toBe(2);
  });

  it("devolve -1 sem eventos ou com listas de tamanhos diferentes", () => {
    expect(eventoNoAlvo(500, [], [])).toBe(-1);
    expect(eventoNoAlvo(500, [100], [500, 910])).toBe(-1);
  });

  it("em alvo não finito fica no primeiro, nunca perde a estrela", () => {
    expect(eventoNoAlvo(Number.NaN, TOPOS, FINS)).toBe(0);
  });

  it("funciona em listas longas (caso /memoria: ~260 itens)", () => {
    const topos = Array.from({ length: 260 }, (_, i) => 1000 + i * 200);
    const fins = topos.map((t) => t + 190);
    expect(eventoNoAlvo(1000 + 42 * 200 + 95, topos, fins)).toBe(42);
    expect(eventoNoAlvo(10_000, topos, fins)).toBe(45); // 1000+45*200 ≤ 10000 < fim 45
    expect(eventoNoAlvo(1000, topos, fins)).toBe(0);
    expect(eventoNoAlvo(53_000, topos, fins)).toBe(259);
  });
});

describe("topoDoPonto", () => {
  it("centraliza o ponto no centro do evento", () => {
    // Evento [510,910] → centro 710; trilha em 100; ponto de 24 px.
    // top = 710 - 100 - 12 = 598.
    expect(topoDoPonto(710, 100, 1200, 24)).toBe(598);
  });

  it("não deixa o ponto sair da trilha (presa nas pontas)", () => {
    expect(topoDoPonto(-1000, 100, 1200, 24)).toBe(0);
    expect(topoDoPonto(9999, 100, 1200, 24)).toBe(1176); // 1200 - 24
  });

  it("trilha ou ponto degenerados devolvem 0 (sem NaN no style)", () => {
    expect(topoDoPonto(710, 100, 0, 24)).toBe(0);
    expect(topoDoPonto(710, 100, 1200, 0)).toBe(0);
    expect(topoDoPonto(Number.NaN, 100, 1200, 24)).toBe(0);
    expect(topoDoPonto(710, Number.POSITIVE_INFINITY, 1200, 24)).toBe(0);
  });

  it("acompanha ponto alto quando o leitor aumenta a fonte", () => {
    // Mesmo centro de evento, ponto de 32 px (fonte A+): top desloca 4 px.
    expect(topoDoPonto(710, 100, 1200, 32)).toBe(710 - 100 - 16);
  });
});
