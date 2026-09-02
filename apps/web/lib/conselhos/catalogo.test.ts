import { describe, it, expect } from "vitest";
import {
  listarConselhos,
  obterConselho,
  conselhosPorMunicipio,
  conselhosPorCategoria,
  conselhosPorEsfera,
  conselhosPorBacia,
  contagemConselhosPorCategoria,
} from "./catalogo";

describe("Conselhos Sociais, Bacias e Colegiados Participativos", () => {
  it("carrega a lista completa com campos obrigatórios preenchidos", () => {
    const todos = listarConselhos();
    expect(todos.length).toBeGreaterThanOrEqual(15);

    for (const c of todos) {
      expect(c.id.trim().length).toBeGreaterThan(0);
      expect(c.nome.trim().length).toBeGreaterThan(5);
      expect(c.sigla.trim().length).toBeGreaterThan(1);
      expect(c.descricaoPapel.trim().length).toBeGreaterThan(20);
      expect(c.quemParticipa.trim().length).toBeGreaterThan(10);
      expect(c.tags.length).toBeGreaterThan(0);
    }
  });

  it("recupera conselho por ID", () => {
    const c = obterConselho("cbh-rio-doce");
    expect(c).toBeDefined();
    expect(c?.sigla).toBe("CBH-Doce");
    expect(c?.categoria).toBe("bacias_hidrograficas");
  });

  it("filtra comitês de bacia hidrográfica", () => {
    const bacias = conselhosPorCategoria("bacias_hidrograficas");
    expect(bacias.length).toBeGreaterThanOrEqual(6);

    const siglas = bacias.map((b) => b.sigla);
    expect(siglas).toContain("CBHSF");
    expect(siglas).toContain("CBH-Doce");
    expect(siglas).toContain("CBH-Velhas");
    expect(siglas).toContain("CBH-Paraopeba");
  });

  it("filtra conselhos por município", () => {
    // Diamantina tem CODEMA, Conselho Biribiri, Conselho Tutelar, CMS e COMPAC
    const diamantina = conselhosPorMunicipio("Diamantina");
    expect(diamantina.length).toBeGreaterThanOrEqual(4);

    // Betim tem CODEMA e CMS
    const betim = conselhosPorMunicipio("Betim");
    expect(betim.length).toBeGreaterThanOrEqual(2);
  });

  it("filtra conselhos por bacia hidrográfica", () => {
    const velhas = conselhosPorBacia("Bacia do Rio das Velhas");
    expect(velhas.length).toBeGreaterThanOrEqual(1);
    expect(velhas[0].sigla).toBe("CBH-Velhas");
  });

  it("filtra conselhos por esfera federativa", () => {
    const federais = conselhosPorEsfera("federal");
    expect(federais.length).toBeGreaterThanOrEqual(4);

    const municipais = conselhosPorEsfera("municipal");
    expect(municipais.length).toBeGreaterThanOrEqual(6);
  });

  it("calcula contagem agregada por categoria", () => {
    const contagem = contagemConselhosPorCategoria();
    expect(contagem["bacias_hidrograficas"]).toBeGreaterThan(0);
    expect(contagem["meio_ambiente"]).toBeGreaterThan(0);
    expect(contagem["direitos_humanos"]).toBeGreaterThan(0);
  });
});
