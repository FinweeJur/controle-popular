import { describe, expect, test } from "vitest";
import { acertou, contarAcertos, LICOES, listarLicoes } from "./licoes";

/**
 * Guardas das micro-lições.
 *
 * Sem isto, uma lição pode ir ao ar com a resposta correta fora do intervalo
 * (índice apontando para o nada) ou sem fonte — e a "explicação" ensinaria o
 * errado, que é o pior modo de falhar num material educativo.
 */
describe("LICOES", () => {
  test("há lições e os ids são únicos", () => {
    expect(LICOES.length).toBeGreaterThan(0);
    expect(new Set(LICOES.map((l) => l.id)).size).toBe(LICOES.length);
  });

  test("toda lição tem resumo, fonte com link e pergunta válida", () => {
    for (const l of LICOES) {
      expect(l.titulo).not.toBe("");
      expect(l.resumo).not.toBe("");
      expect(l.paragrafos.length).toBeGreaterThan(0);
      expect(l.fonte.url).toMatch(/^(https?:\/\/|\/)/);
      expect(l.pergunta.opcoes.length).toBeGreaterThanOrEqual(2);
      expect(l.pergunta.correta).toBeGreaterThanOrEqual(0);
      expect(l.pergunta.correta).toBeLessThan(l.pergunta.opcoes.length);
      expect(l.pergunta.explicacao).not.toBe("");
    }
  });
});

describe("acertou", () => {
  test("compara com o índice correto", () => {
    const l = LICOES[0];
    expect(acertou(l, l.pergunta.correta)).toBe(true);
    expect(acertou(l, l.pergunta.correta === 0 ? 1 : 0)).toBe(false);
  });
});

describe("contarAcertos", () => {
  test("conta só as respostas certas, ignorando as ausentes", () => {
    const respostas = {
      [LICOES[0].id]: LICOES[0].pergunta.correta,
      [LICOES[1].id]: LICOES[1].pergunta.correta === 0 ? 1 : 0,
    };
    expect(contarAcertos(respostas)).toBe(1);
    expect(contarAcertos({})).toBe(0);
  });
});

describe("listarLicoes", () => {
  test("devolve a lista completa", () => {
    expect(listarLicoes()).toHaveLength(LICOES.length);
  });
});
