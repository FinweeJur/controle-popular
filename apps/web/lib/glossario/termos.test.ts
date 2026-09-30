import { describe, expect, test } from "vitest";
import { buscarTermos, TERMOS } from "./termos";

/**
 * Guardas do glossário.
 *
 * Sem isto, um termo pode entrar sem definição (o "o que é isto" vira nada) ou
 * com link inválido — e a pessoa sob estresse clica num beco.
 */
describe("TERMOS", () => {
  test("há termos, ids únicos e ordenados por nome", () => {
    expect(TERMOS.length).toBeGreaterThan(0);
    expect(new Set(TERMOS.map((t) => t.id)).size).toBe(TERMOS.length);
    const nomes = TERMOS.map((t) => t.termo);
    expect([...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"))).toEqual(nomes);
  });

  test("todo termo tem definição e, se tiver fonte, link válido", () => {
    for (const t of TERMOS) {
      expect(t.termo).not.toBe("");
      expect(t.definicao.length).toBeGreaterThan(20);
      if (t.fonte) expect(t.fonte.url).toMatch(/^(https?:\/\/|\/)/);
    }
  });
});

describe("buscarTermos", () => {
  test("vazio devolve todos", () => {
    expect(buscarTermos("")).toHaveLength(TERMOS.length);
  });

  test("acha por termo ignorando acento e caixa", () => {
    const achados = buscarTermos("LICITACAO");
    expect(achados.some((t) => t.id === "licitacao")).toBe(true);
  });

  test("acha pela definição", () => {
    expect(buscarTermos("royalty").some((t) => t.id === "cfem")).toBe(true);
  });
});
