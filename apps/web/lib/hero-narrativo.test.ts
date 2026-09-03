import { describe, expect, it } from "vitest";
import {
  calcularCamadasPointer,
  camadasAtivas,
  deveAnimar,
  modulosPorTema,
  type CamadaHero,
} from "./hero-narrativo";

const NOMES = ["fundo", "padrao", "conteudo", "fauna"] as const;

function porNome(camadas: CamadaHero[]) {
  return Object.fromEntries(camadas.map((c) => [c.nome, c]));
}

describe("calcularCamadasPointer", () => {
  it("desktop com mouse fino: 4 camadas ativas com os fatores do protótipo", () => {
    const camadas = porNome(
      calcularCamadasPointer({ pointerCoarse: false, reducedMotion: false }),
    );
    expect(camadas.fundo).toMatchObject({ fatorX: 8, fatorY: 6, ativo: true });
    expect(camadas.padrao).toMatchObject({ fatorX: 16, fatorY: 12, ativo: true });
    expect(camadas.conteudo).toMatchObject({ fatorX: 24, fatorY: 18, ativo: true });
    expect(camadas.fauna).toMatchObject({ fatorX: 36, fatorY: 27, ativo: true });
  });

  it("a razão entre camadas adjacentes é >= 1,5x (critério objetivo do plano)", () => {
    const camadas = calcularCamadasPointer({ pointerCoarse: false, reducedMotion: false });
    for (let i = 1; i < camadas.length; i++) {
      expect(camadas[i].fatorX / camadas[i - 1].fatorX).toBeGreaterThanOrEqual(1.5);
      expect(camadas[i].fatorY / camadas[i - 1].fatorY).toBeGreaterThanOrEqual(1.5);
    }
  });

  it("pointer coarse (celular): parallax de mouse não existe", () => {
    const camadas = calcularCamadasPointer({ pointerCoarse: true, reducedMotion: false });
    expect(camadas).toHaveLength(4);
    for (const camada of camadas) {
      expect(camada).toMatchObject({ fatorX: 0, fatorY: 0, ativo: false });
    }
  });

  it("reduced-motion: parallax desligado mesmo com mouse fino", () => {
    const camadas = calcularCamadasPointer({ pointerCoarse: false, reducedMotion: true });
    for (const camada of camadas) {
      expect(camada).toMatchObject({ fatorX: 0, fatorY: 0, ativo: false });
    }
  });

  it("sempre devolve as 4 camadas na ordem fundo → fauna", () => {
    const camadas = calcularCamadasPointer({ pointerCoarse: true, reducedMotion: true });
    expect(camadas.map((c) => c.nome)).toEqual([...NOMES]);
  });
});

describe("camadasAtivas", () => {
  it("true só no desktop com mouse fino e sem reduced-motion", () => {
    expect(camadasAtivas({ pointerCoarse: false, reducedMotion: false })).toBe(true);
    expect(camadasAtivas({ pointerCoarse: true, reducedMotion: false })).toBe(false);
    expect(camadasAtivas({ pointerCoarse: false, reducedMotion: true })).toBe(false);
    expect(camadasAtivas({ pointerCoarse: true, reducedMotion: true })).toBe(false);
  });
});

describe("deveAnimar", () => {
  it("reduced-motion é lei: nenhuma animação roda e tudo fica visível", () => {
    expect(deveAnimar(true, false)).toEqual({
      timeline: false,
      parallax: false,
      fadeIn: false,
    });
    expect(deveAnimar(true, true)).toEqual({
      timeline: false,
      parallax: false,
      fadeIn: false,
    });
  });

  it("celular (pointer coarse): sem parallax, mas a história continua no scroll", () => {
    expect(deveAnimar(false, true)).toEqual({
      timeline: true,
      parallax: false,
      fadeIn: true,
    });
  });

  it("desktop: tudo ligado", () => {
    expect(deveAnimar(false, false)).toEqual({
      timeline: true,
      parallax: true,
      fadeIn: true,
    });
  });
});

describe("modulosPorTema", () => {
  it("tema claro: 3 módulos com os tokens medidos do design system", () => {
    const modulos = modulosPorTema("light");
    expect(modulos.map((m) => m.cor)).toEqual([
      "var(--cp-primary)",
      "var(--cp-accent)",
      "var(--cp-tertiary)",
    ]);
    expect(modulos.every((m) => m.decorativo)).toBe(true);
  });

  it("tema escuro: mesmos tokens, que o tema escurece por si", () => {
    const modulos = modulosPorTema("dark");
    expect(modulos).toHaveLength(3);
    expect(modulos.map((m) => m.cor)).toEqual(modulosPorTema("light").map((m) => m.cor));
  });

  it("alto contraste: nenhum módulo decorativo", () => {
    expect(modulosPorTema("high-contrast")).toEqual([]);
  });
});
