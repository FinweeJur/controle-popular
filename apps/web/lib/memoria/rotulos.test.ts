/**
 * Testes dos rótulos e agrupamentos da linha do tempo (`/memoria`).
 *
 * Guardam duas verdades que um comentário não sustenta: todo tipo de luta
 * do acervo tem rótulo por extenso (cor nunca é o único canal — AGENTS §8),
 * e o século do ano segue a regra do calendário (o ano 1600 é do século
 * XVI, porque o século XVI vai de 1501 a 1600).
 */

import { describe, expect, it } from "vitest";
import { CALENDARIO_LUTAS } from "./calendario";
import { ROTULO_TIPO, TIPOS_ORDEM, numeroDoSeculo, seculoDe } from "./rotulos";
import type { TipoLuta } from "./tipos";

describe("ROTULO_TIPO", () => {
  it("cobre os oito tipos do vocabulário do plano", () => {
    const esperado: TipoLuta[] = [
      "revolta", "resistencia", "greve", "quilombo",
      "indigena", "campo", "direitos", "anistia",
    ];
    expect([...TIPOS_ORDEM].sort()).toEqual([...esperado].sort());
    for (const t of esperado) {
      expect(ROTULO_TIPO[t]?.trim().length, `rótulo vazio para ${t}`).toBeGreaterThan(0);
    }
  });

  it("todo tipo que aparece no calendário tem rótulo", () => {
    for (const e of CALENDARIO_LUTAS) {
      for (const t of e.tipo) {
        expect(ROTULO_TIPO[t], `tipo sem rótulo: ${t} em ${e.titulo}`).toBeTruthy();
      }
    }
  });
});

describe("seculoDe", () => {
  it("segue a regra do calendário (1600 é século XVI)", () => {
    expect(seculoDe("1600")).toBe("Século XVI");
    expect(seculoDe("1501")).toBe("Século XVI");
    expect(seculoDe("1500")).toBe("Século XV");
    expect(seculoDe("1849")).toBe("Século XIX");
    expect(seculoDe("1994")).toBe("Século XX");
    expect(seculoDe("2019")).toBe("Século XXI");
  });

  it("não inventa século para fato sem data (lacuna declarada)", () => {
    expect(seculoDe("")).toBe("Sem data");
    expect(seculoDe("0")).toBe("Sem data");
    expect(numeroDoSeculo("")).toBe(0);
  });
});

describe("numeroDoSeculo", () => {
  it("ordena cronologicamente, sem data por último (0)", () => {
    expect(numeroDoSeculo("1600")).toBe(16);
    expect(numeroDoSeculo("1849")).toBe(19);
    expect(numeroDoSeculo("2019")).toBe(21);
    expect(numeroDoSeculo("1849")).toBeLessThan(numeroDoSeculo("1994"));
  });
});
