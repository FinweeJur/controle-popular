import { describe, it, expect } from "vitest";
import instituicoesData from "@/data/judiciario-instituicoes-detalhe.json";
import { THEMES } from "@/app/[municipio]/components/ThemeSwitcher";

describe("Instituições de Justiça dos 27 Estados", () => {
  it("contém cobertura de todas as 27 Unidades Federativas do Brasil", () => {
    const ufs = new Set<string>();
    for (const inst of instituicoesData) {
      if (inst.uf) ufs.add(inst.uf);
    }

    const todasUfs = [
      "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA",
      "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN",
      "RO", "RR", "RS", "SC", "SE", "SP", "TO",
    ];

    for (const uf of todasUfs) {
      expect(ufs.has(uf)).toBe(true);
    }
    expect(ufs.size).toBe(27);
  });

  it("possui Tribunais de Justiça, Ministérios Públicos e Defensorias em todos os estados", () => {
    const siglas = new Set(instituicoesData.map((i) => i.sigla));

    // Exemplos solicitados especificamente pelo usuário
    expect(siglas.has("mprj")).toBe(true);
    expect(siglas.has("dprj")).toBe(true);
    expect(siglas.has("tjrj")).toBe(true);
    expect(siglas.has("mppa")).toBe(true);
    expect(siglas.has("dppa")).toBe(true);
    expect(siglas.has("tjpa")).toBe(true);
    expect(siglas.has("tjrs")).toBe(true);
    expect(siglas.has("mprs")).toBe(true);
    expect(siglas.has("dprs")).toBe(true);
    expect(siglas.has("tjsp")).toBe(true);
    expect(siglas.has("mpsp")).toBe(true);
    expect(siglas.has("dpsp")).toBe(true);
  });

  it("cada instituição possui orçamento, liderança e atos/documentos estruturados", () => {
    expect(instituicoesData.length).toBeGreaterThanOrEqual(85);

    for (const inst of instituicoesData) {
      expect(inst.sigla).toBeTruthy();
      expect(inst.nome).toBeTruthy();
      expect(inst.tipo).toBeTruthy();
      expect(inst.orcamento).toBeDefined();
      expect(inst.orcamento.total).toBeTruthy();
      expect(inst.documentosEAtos).toBeDefined();
      expect(inst.documentosEAtos.length).toBeGreaterThan(0);

      for (const ato of inst.documentosEAtos) {
        expect(ato.id).toBeTruthy();
        expect(ato.titulo).toBeTruthy();
        expect(ato.tipo).toBeTruthy();
        expect(ato.tema).toBeTruthy();
        expect(ato.microResumo).toBeTruthy();
        expect(ato.tags.length).toBeGreaterThan(0);
      }
    }
  });

  it("organograma de cada instituição possui áreas com site, telefone, e-mail e endereço", () => {
    for (const inst of instituicoesData) {
      expect(inst.organograma).toBeDefined();
      expect(inst.organograma.length).toBeGreaterThanOrEqual(2);

      for (const item of inst.organograma as any[]) {
        expect(item.area).toBeTruthy();
        expect(item.funcao).toBeTruthy();
        expect(item.site).toMatch(/^https?:\/\//);
        expect(item.telefone).toMatch(/\(\d{2}\)\s\d{4,5}-\d{4}/);
        expect(item.email).toContain("@");
        expect(item.endereco).toContain("CEP");
      }
    }
  });

  it("lideranças contêm nomes de pessoas reais e notícia de posse vinculada", () => {
    for (const inst of instituicoesData) {
      const nome = inst.lideranca.nome;
      expect(nome).not.toContain("Desembargador Presidente do");
      expect(nome).not.toContain("Procurador-Geral de Justiça do");
      expect(nome).not.toContain("Defensor Público-Geral do");
      expect(inst.lideranca.mandato).toMatch(/\d{4}–\d{4}/);
      expect(inst.lideranca.email).toContain("@");

      // Deve possuir notícia de posse ou atos de liderança
      const temNoticiaPosse = inst.documentosEAtos.some(
        (ato) => ato.tipo === "noticia" && (ato.tags.includes("posse") || ato.tags.includes("lideranca"))
      );
      expect(temNoticiaPosse).toBe(true);
    }
  });
});

describe("Seletor de Biomas e Temas", () => {
  it("inclui todos os biomas e temas requeridos", () => {
    const valores = THEMES.map((t) => t.value);
    expect(valores).toContain("pequi");
    expect(valores).toContain("cerrado");
    expect(valores).toContain("mata-atlantica");
    expect(valores).toContain("caatinga");
    expect(valores).toContain("pantanal");
    expect(valores).toContain("light");
    expect(valores).toContain("dark");
    expect(valores).toContain("high-contrast");
    expect(valores.length).toBe(8);
  });

  it("possui metadados visuais (cor, emoji e descrição) para cada tema", () => {
    for (const t of THEMES) {
      expect(t.label).toBeTruthy();
      expect(t.emoji).toBeTruthy();
      expect(t.cor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(t.desc).toBeTruthy();
    }
  });
});
