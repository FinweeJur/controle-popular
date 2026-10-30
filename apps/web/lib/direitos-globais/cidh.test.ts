/**
 * @file apps/web/lib/direitos-globais/cidh.test.ts
 * @description Guarda do quadro de adesão ao sistema interamericano.
 *
 * O que protege:
 * - vinte países e oito tratados, sem célula faltando;
 * - status dentro do vocabulário fechado e ano plausível;
 * - Cuba fora do Pacto (fato conferido, não digitação);
 * - obrigações com texto, fonte e citação.
 */

import { describe, expect, it } from "vitest";
import {
  ADESAO,
  OBRIGACOES,
  PAISES_CIDH,
  TRATADOS_INTERAMERICANOS,
  adesaoDoPais,
  ratificacoesPorTratado,
} from "./cidh";

describe("sistema interamericano — quadro de adesão", () => {
  it("tem 20 países e 8 tratados, sem célula vazia", () => {
    expect(PAISES_CIDH).toHaveLength(20);
    expect(TRATADOS_INTERAMERICANOS).toHaveLength(8);
    for (const tratado of TRATADOS_INTERAMERICANOS) {
      const mapa = ADESAO[tratado.id];
      expect(mapa).toBeDefined();
      expect(Object.keys(mapa)).toHaveLength(20);
      for (const pais of PAISES_CIDH) {
        const adesao = mapa[pais];
        expect(adesao).toBeDefined();
        expect(["ratificado", "assinado", "nao"]).toContain(adesao.status);
        if (adesao.status === "ratificado") {
          expect(adesao.ano).toBeGreaterThanOrEqual(1969);
          expect(adesao.ano).toBeLessThanOrEqual(2026);
        }
      }
    }
  });

  it("Cuba não ratificou o Pacto de San José", () => {
    expect(ADESAO["B-32"]["Cuba"].status).toBe("nao");
    expect(ADESAO["B-32"]["Brasil"]).toEqual({ status: "ratificado", ano: 1992 });
  });

  it("conta ratificações dentro dos vinte", () => {
    for (const { total } of ratificacoesPorTratado()) {
      expect(total).toBeGreaterThanOrEqual(0);
      expect(total).toBeLessThanOrEqual(20);
    }
  });

  it("adesão por país devolve os oito tratados", () => {
    const linhas = adesaoDoPais("Brasil");
    expect(linhas).toHaveLength(8);
    expect(linhas.every((l) => l.tratado.id && l.adesao.status)).toBe(true);
  });

  it("tratado desconhecido não estoura", () => {
    expect(adesaoDoPais("Atlântida").every((l) => l.adesao.status === "nao")).toBe(true);
  });
});

describe("sistema interamericano — obrigações", () => {
  it("transcreve os artigos 1, 2, 63 e 68 do Pacto", () => {
    const citacoes = OBRIGACOES.map((o) => o.citacao);
    expect(citacoes).toEqual(["Artículo 1.1", "Artículo 2", "Artículo 63.1", "Artículo 68.1"]);
    for (const o of OBRIGACOES) {
      expect(o.texto.length).toBeGreaterThan(80);
      expect(o.url).toMatch(/^https:\/\/www\.oas\.org\//);
      expect(o.dataAcesso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
