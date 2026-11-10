/**
 * @file Teste da camada que aplica as ementas completas ao acervo.
 *
 * O risco que este teste cobre é silencioso: se o módulo parar de casar o
 * processo, a tela volta a mostrar 500 caracteres como se fossem a ementa
 * inteira — e nada quebra.
 */
import { describe, expect, it } from "vitest";
import completas from "@/data/ementas-completas.json";
import { ACERVO_JURISPRUDENCIA } from "./jurisprudencia-acervo";

const RECUPERADAS = completas as Record<
  string,
  { ementa: string; fonte: string; coletado_em: string }
>;

describe("acervo de jurisprudência com ementas completas", () => {
  const porProcesso = new Map(
    ACERVO_JURISPRUDENCIA.casos.map((caso) => [caso.processo, caso])
  );

  it("mantém o total de casos do arquivo bruto", () => {
    expect(ACERVO_JURISPRUDENCIA.casos).toHaveLength(ACERVO_JURISPRUDENCIA.total);
    expect(ACERVO_JURISPRUDENCIA.casos.length).toBeGreaterThan(20000);
  });

  it("aplica cada ementa recuperada no processo certo", () => {
    const aplicadas: string[] = [];
    for (const [processo, dado] of Object.entries(RECUPERADAS)) {
      const caso = porProcesso.get(processo);
      expect(caso, `processo ausente no acervo: ${processo}`).toBeDefined();
      // Nunca encurtar: só vale o texto maior.
      expect(caso!.ementa.length).toBeGreaterThanOrEqual(dado.ementa.length);
      if (caso!.ementa === dado.ementa) aplicadas.push(processo);
    }
    expect(aplicadas.length).toBeGreaterThanOrEqual(80);
  });

  it("não deixa reticência no fim de ementa recuperada", () => {
    for (const processo of Object.keys(RECUPERADAS)) {
      const texto = porProcesso.get(processo)!.ementa.trim();
      expect(texto.endsWith("…"), processo).toBe(false);
      expect(texto.endsWith("..."), processo).toBe(false);
    }
  });

  it("toda ementa recuperada é maior que o recorte de 500 caracteres", () => {
    for (const [processo, dado] of Object.entries(RECUPERADAS)) {
      expect(dado.ementa.length, processo).toBeGreaterThan(500);
      expect(dado.fonte, processo).toMatch(/^https:\/\//);
      expect(dado.coletado_em, processo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
