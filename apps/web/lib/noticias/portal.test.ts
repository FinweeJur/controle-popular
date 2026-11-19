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

  test("tabelas e gráficos opcionais têm a forma que o renderizador espera", () => {
    // O JSON é tipado por `as`, não validado na entrada. Uma linha com menos
    // células vira tabela torta sem erro de build; um valor de gráfico em
    // texto vira barra NaN. Aqui a guarda é barata e pega os dois.
    for (const n of listarNoticiasPortal()) {
      for (const t of n.tabelas ?? []) {
        expect(t.colunas.length, `${n.slug}: tabela sem coluna`).toBeGreaterThan(0);
        for (const linha of t.linhas) {
          expect(linha.length, `${n.slug} / ${t.titulo}: linha torta`).toBe(t.colunas.length);
        }
      }
      for (const item of n.grafico?.itens ?? []) {
        expect(Number.isFinite(item.valor), `${n.slug}: valor de gráfico inválido`).toBe(true);
        expect(item.rotulo.trim().length, `${n.slug}: rótulo vazio no gráfico`).toBeGreaterThan(0);
      }
    }
  });
});
