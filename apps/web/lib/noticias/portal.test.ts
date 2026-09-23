import { describe, expect, test } from "vitest";
import { listarNoticiasPortal } from "./portal";

describe("listarNoticiasPortal — isolamento de editais e integridade do blog", () => {
  test("nenhuma notícia do blog possui slug de edital diário (radar-editais)", () => {
    const noticias = listarNoticiasPortal();
    expect(noticias.length).toBeGreaterThan(0);

    for (const n of noticias) {
      expect(n.slug.startsWith("radar-editais")).toBe(false);
      expect(n.categoria).not.toBe("Edital");
      expect((n.palavrasChave || []).some((k) => k.toLowerCase() === "radar-editais")).toBe(false);
    }
  });

  test("todas as publicações do blog pertencem às categorias editoriais legítimas", () => {
    const categoriasValidas = new Set([
      "Relatório Técnico",
      "Investigação Cívica",
      "Explicador",
      "Divulgação Científica",
      "Ferramentas do Portal",
    ]);

    const noticias = listarNoticiasPortal();
    for (const n of noticias) {
      expect(categoriasValidas.has(n.categoria)).toBe(true);
    }
  });
});
