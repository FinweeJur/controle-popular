import { describe, expect, test } from "vitest";
import { CATEGORIAS_MODELO, listarModelos, MODELOS } from "./textos";

/**
 * Guardas dos modelos prontos.
 *
 * Cada modelo precisa de base legal, canal, corpo com campos e categoria
 * válida. Sem isto, um modelo sem fonte (ou sem campo para preencher) entra
 * no ar como texto genérico — e o cidadão protocola um pedido sem base.
 */
describe("MODELOS", () => {
  test("há modelos e os ids são únicos", () => {
    expect(MODELOS.length).toBeGreaterThan(0);
    const ids = new Set(MODELOS.map((m) => m.id));
    expect(ids.size).toBe(MODELOS.length);
  });

  test("todo modelo tem fonte e canal com link válido", () => {
    for (const m of MODELOS) {
      expect(m.fonte.nome).not.toBe("");
      expect(m.fonte.url).toMatch(/^(https?:\/\/|\/)/);
      expect(m.canal.nome).not.toBe("");
      expect(m.canal.url).toMatch(/^(https?:\/\/|\/)/);
    }
  });

  test("todo modelo tem campos para preencher e categoria válida", () => {
    for (const m of MODELOS) {
      expect(m.titulo).not.toBe("");
      expect(m.descricao).not.toBe("");
      expect(m.dica).not.toBe("");
      expect(m.corpo).toContain("[");
      expect(CATEGORIAS_MODELO).toContain(m.categoria);
    }
  });
});

describe("listarModelos", () => {
  test("filtra por categoria", () => {
    for (const categoria of CATEGORIAS_MODELO) {
      const lista = listarModelos(categoria);
      expect(lista.length).toBeGreaterThan(0);
      expect(lista.every((m) => m.categoria === categoria)).toBe(true);
    }
  });

  test("'todas' devolve a lista completa", () => {
    expect(listarModelos("todas")).toHaveLength(MODELOS.length);
  });
});
