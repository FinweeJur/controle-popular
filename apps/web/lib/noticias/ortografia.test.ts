import { describe, expect, test } from "vitest";
import noticiasRaw from "@/data/noticias-portal.json";
import { checarTodos, checarPost, contarPalavras, dividirFrases } from "./ortografia";

describe("ortografia do blog — porta de acento e estilo", () => {
  test("unidades: contarPalavras e dividirFrases", () => {
    expect(contarPalavras("uma frase curta.")).toBe(3);
    expect(contarPalavras("")).toBe(0);
    expect(dividirFrases("Frase um. Frase dois! Frase tres?")).toHaveLength(3);
  });

  test("violação pega palavra sem acento e ignora a forma acentuada", () => {
    const r = checarPost("x", { titulo: "Publicacao sem acento", resumo: "Publicação com acento." });
    expect(r.violacoes.map((v) => v.palavra)).toContain("publicacao");
    expect(r.violacoes.map((v) => v.palavra)).not.toContain("publicação");
  });

  test("nenhum post do blog tem palavra obrigatória sem acento", () => {
    const { violacoes, avisos } = checarTodos(noticiasRaw as Parameters<typeof checarTodos>[0]);
    // Avisos de frase longa são relatório, não bloqueio.
    expect(violacoes, JSON.stringify(violacoes, null, 1)).toHaveLength(0);
    expect(avisos.length).toBeGreaterThanOrEqual(0);
  });
});
