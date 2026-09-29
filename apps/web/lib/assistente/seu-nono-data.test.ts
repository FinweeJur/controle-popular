/**
 * @file seu-nono-data.test.ts
 * @description Testes unitários para o catálogo de dados do Seu Nonô (SeuNonoData.ts).
 */

import { describe, it, expect } from "vitest";
import { FRENTES, PAGINAS_DADOS } from "@/app/components/SeuNonoData";

describe("Catálogo do Seu Nonô (SeuNonoData.ts)", () => {
  it("deve conter todas as frentes principais", () => {
    const idsFrentes = FRENTES.map((f) => f.id);
    expect(idsFrentes).toContain("direitos");
    expect(idsFrentes).toContain("terra");
    expect(idsFrentes).toContain("estado");
    expect(idsFrentes).toContain("central");
  });

  it("deve conter as categorias novas de Laboratório e Editais na Central", () => {
    const central = FRENTES.find((f) => f.id === "central");
    expect(central).toBeDefined();

    const idsCategorias = central?.categorias.map((c) => c.id) || [];
    expect(idsCategorias).toContain("laboratorio-e-analise");
    expect(idsCategorias).toContain("editais-e-fontes-estados");

    const catLab = central?.categorias.find((c) => c.id === "laboratorio-e-analise");
    expect(catLab?.perguntas.some((p) => p.id === "laboratorio-powerbi-camadas")).toBe(true);
    expect(catLab?.perguntas.some((p) => p.id === "arvore-obsidian-conexoes")).toBe(true);
  });

  it("PAGINAS_DADOS deve conter fichas completas para o novo ecossistema", () => {
    const idsPaginas = PAGINAS_DADOS.map((p) => p.id);
    expect(idsPaginas).toContain("laboratorio-powerbi");
    expect(idsPaginas).toContain("editais-hub");
    expect(idsPaginas).toContain("estudos-rurais");
    expect(idsPaginas).toContain("fontes-27-estados");
    expect(idsPaginas).toContain("ambiental-condicionantes");
    expect(idsPaginas).toContain("rio-doce-mariana");
    expect(idsPaginas).toContain("comunicabr-federal");
    expect(idsPaginas).toContain("instituicoes-justica-fichas");
  });

  it("todas as perguntas devem ter links válidos e sem CPF", () => {
    for (const frente of FRENTES) {
      for (const cat of frente.categorias) {
        for (const p of cat.perguntas) {
          expect(p.pergunta.length).toBeGreaterThan(5);
          expect(p.resposta.length).toBeGreaterThan(10);
          if (p.link) {
            expect(p.link.href).toBeDefined();
            expect(p.link.texto).toBeDefined();
          }
        }
      }
    }
  });
});
