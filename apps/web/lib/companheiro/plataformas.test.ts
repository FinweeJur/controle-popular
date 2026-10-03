/**
 * @file plataformas.test.ts
 * @description Testes da física de superfícies do companheiro — a régua do
 * AGENTS.md: regra de caminhada é número de regra, então dupla verificação
 * com casos calculados à mão. Cada asserção traz a conta feita.
 */
import { describe, expect, it } from "vitest";
import {
  FOLGA_PES,
  alvoDoSalto,
  passoQueda,
  plataformaSalto,
  superficieSob,
  type Plataforma,
} from "./plataformas";

describe("superficieSob", () => {
  it("sem plataforma o chão é 0", () => {
    expect(superficieSob([], 100, 0)).toBe(0);
  });

  it("pega a plataforma que cobre o centro do pé", () => {
    const plats: Plataforma[] = [{ x0: 50, x1: 250, y: 120 }];
    // centro 100 ∈ [50..250] e 120 ≤ 0 + folga? não — 120 > 0+2, ACIMA:
    // não vale como chão de quem está no chão (precisa saltar).
    expect(superficieSob(plats, 100, 0)).toBe(0);
    // já pisando em 118 (120 − folga), a mesma plataforma vira chão:
    expect(superficieSob(plats, 100, 118)).toBe(120);
  });

  it("pega o MENOR y exatamente na folga: yPisada + FOLGA_PES ainda conta", () => {
    const plats: Plataforma[] = [{ x0: 0, x1: 999, y: 50 + FOLGA_PES }];
    expect(superficieSob(plats, 10, 50)).toBe(50 + FOLGA_PES);
    // um pixel acima da folga já não conta:
    const alta: Plataforma[] = [{ x0: 0, x1: 999, y: 50 + FOLGA_PES + 1 }];
    expect(superficieSob(alta, 10, 50)).toBe(0);
  });

  it("entre duas plataformas sob o pé, fica na mais alta", () => {
    const plats: Plataforma[] = [
      { x0: 0, x1: 999, y: 40 },
      { x0: 0, x1: 999, y: 90 },
    ];
    expect(superficieSob(plats, 300, 90)).toBe(90);
  });

  it("plataforma fora do x do pé não conta", () => {
    const plats: Plataforma[] = [{ x0: 500, x1: 700, y: 80 }];
    expect(superficieSob(plats, 100, 80)).toBe(0);
    expect(superficieSob(plats, 500, 80)).toBe(80); // borda esquerda inclusive
    expect(superficieSob(plats, 700, 80)).toBe(80); // borda direita inclusive
  });
});

describe("plataformaSalto", () => {
  it("devolve o degrau à frente dentro do alcance", () => {
    const plats: Plataforma[] = [{ x0: 80, x1: 300, y: 150 }];
    const alvo = plataformaSalto(plats, { yAgora: 0, xPonta: 85, alcance: 300 });
    expect(alvo).toEqual(plats[0]);
  });

  it("xPonta na borda exata ainda conta (é o primeiro quadro do encontro)", () => {
    const plats: Plataforma[] = [{ x0: 80, x1: 300, y: 60 }];
    expect(
      plataformaSalto(plats, { yAgora: 0, xPonta: 80, alcance: 200 }),
    ).toEqual(plats[0]);
    expect(
      plataformaSalto(plats, { yAgora: 0, xPonta: 300, alcance: 200 }),
    ).toEqual(plats[0]);
    // um pixel depois da borda direita já não é mais "à frente":
    expect(
      plataformaSalto(plats, { yAgora: 0, xPonta: 301, alcance: 200 }),
    ).toBeNull();
  });

  it("fora do alcance devolve null (anda por baixo, sem tentar)", () => {
    const plats: Plataforma[] = [{ x0: 80, x1: 300, y: 500 }];
    expect(
      plataformaSalto(plats, { yAgora: 0, xPonta: 100, alcance: 300 }),
    ).toBeNull();
  });

  it("no mesmo nível ou abaixo não é salto (já está lá ou é queda)", () => {
    const plats: Plataforma[] = [
      { x0: 0, x1: 999, y: 0 }, // chão: não salta para o chão
      { x0: 0, x1: 999, y: 40 }, // 40 ≤ 0 + folga? não — é salto sim
    ];
    expect(
      plataformaSalto(plats.slice(0, 1), { yAgora: 0, xPonta: 10, alcance: 300 }),
    ).toBeNull();
    expect(
      plataformaSalto(plats.slice(0, 1), { yAgora: 40, xPonta: 10, alcance: 300 }),
    ).toBeNull(); // pisando em cima dela, não precisa saltar
  });

  it("escolhe o MAIOR degrau alcançável entre os candidatos", () => {
    const plats: Plataforma[] = [
      { x0: 60, x1: 999, y: 50 }, // degrau baixo, coberto
      { x0: 90, x1: 400, y: 200 }, // degrau alto, alcançável (alcance 300)
      { x0: 95, x1: 300, y: 400 }, // alto demais (400 > 0 + 300)
    ];
    const alvo = plataformaSalto(plats, { yAgora: 0, xPonta: 100, alcance: 300 });
    expect(alvo).toEqual(plats[1]);
  });
});

describe("alvoDoSalto", () => {
  const p: Plataforma = { x0: 100, x1: 400, y: 130 };

  it("indo para a direita, pousa 2 px depois da borda esquerda", () => {
    // conta: x = x0 + 2 = 102; centro do pé = 102 + 50/2 = 127 ∈ [100..400]
    expect(alvoDoSalto(p, 1, 50)).toEqual({ x: 102, y: 130 });
  });

  it("indo para a esquerda, pousa 2 px antes da borda direita", () => {
    // conta: x = x1 − larg − 2 = 400 − 50 − 2 = 348; centro = 373 ∈ [100..400]
    expect(alvoDoSalto(p, -1, 50)).toEqual({ x: 348, y: 130 });
  });
});

describe("passoQueda", () => {
  it("acelera a cada quadro até o teto de 2400 px/s", () => {
    // 1º quadro: 0 + 5200·0,016 ≈ 83 px/s; bem abaixo do teto.
    const um = passoQueda(500, 0, 0.016, 0);
    expect(um.vel).toBeGreaterThan(0);
    expect(um.vel).toBeLessThan(2400);
    // muitos quadros seguidos tocam no teto:
    let y = 50000;
    let vel = 0;
    for (let i = 0; i < 400; i++) {
      const q = passoQueda(y, vel, 0.016, 0);
      y = q.y;
      vel = q.vel;
      if (q.pousou) break;
    }
    expect(vel).toBe(2400);
  });

  it("cola exatamente na superfície e zera a velocidade", () => {
    // y=100, queda rápida (vel 2000) em 0,016 s desce 32 px → 68 < sob 70?
    // 68 ≤ 70 → pousa em 70 com vel 0.
    const q = passoQueda(100, 2000, 0.016, 70);
    expect(q).toEqual({ y: 70, vel: 0, pousou: true });
  });

  it("nunca atravessa a superfície", () => {
    const q = passoQueda(71, 2400, 0.05, 70);
    // desceria 120 px (2400·0,05) → −49, mas cola em 70.
    expect(q.y).toBe(70);
    expect(q.pousou).toBe(true);
  });

  it("no ar devolve posição acima da superfície com vel crescendo", () => {
    const q = passoQueda(1000, 100, 0.016, 0);
    expect(q.pousou).toBe(false);
    expect(q.y).toBeCloseTo(1000 - (100 + 5200 * 0.016) * 0.016, 5);
    expect(q.vel).toBeGreaterThan(100);
  });
});
