import { describe, it, expect } from "vitest";
import {
  listarDocumentosUnificados,
  listarDocumentosAcademicos,
  obterDocumentosPorTemaOuEntidade,
  exportarCsvBiblioteca,
  METRICAS_BIBLIOTECA,
} from "./unificada";

describe("Biblioteca Unificada e Acervo Acadêmico", () => {
  it("carrega a base de dados consolidada com mais de 800 documentos", () => {
    const docs = listarDocumentosUnificados();
    expect(docs.length).toBeGreaterThan(800);
    expect(METRICAS_BIBLIOTECA.totalDocumentos).toBe(docs.length);
  });

  it("filtra corretamente os documentos acadêmicos e científicos", () => {
    const academicos = listarDocumentosAcademicos();
    expect(academicos.length).toBeGreaterThanOrEqual(15);
    
    // Confere presença dos temas obrigatórios pedidos pelo usuário
    const temas = academicos.map((d) => d.tema);
    expect(temas).toContain("Vale & Mineração");
    expect(temas).toContain("Sigma & Lítio");
    expect(temas).toContain("Protocolo de Consulta Prévia");
    expect(temas).toContain("Licenciamento Ambiental");
    expect(temas).toContain("Transparência & PNCP");
    expect(temas).toContain("Instituições de Justiça");
    
    // Confere fontes universitárias de prestígio
    const entidades = academicos.map((d) => d.entidade);
    expect(entidades.some((e) => e.includes("UFMG"))).toBe(true);
    expect(entidades.some((e) => e.includes("Fiocruz"))).toBe(true);
    expect(entidades.some((e) => e.includes("IPEA"))).toBe(true);
    expect(entidades.some((e) => e.includes("UnB"))).toBe(true);
  });

  it("busca e correlaciona registros sobre a Vale e Sigma Lithium", () => {
    const vale = obterDocumentosPorTemaOuEntidade("Vale");
    expect(vale.length).toBeGreaterThan(0);
    expect(vale.some((d) => d.titulo.toLowerCase().includes("brumadinho") || d.tema === "Vale & Mineração")).toBe(true);

    const sigma = obterDocumentosPorTemaOuEntidade("Sigma");
    expect(sigma.length).toBeGreaterThan(0);
    expect(sigma.some((d) => d.tema === "Sigma & Lítio")).toBe(true);
  });

  it("gera CSV estritamente compatível com Excel: BOM UTF-8 e separador ponto-e-vírgula", () => {
    const docs = listarDocumentosAcademicos().slice(0, 5);
    const csv = exportarCsvBiblioteca(docs);

    // Regra inegociável do AGENTS.md: BOM UTF-8 (\uFEFF) no início
    expect(csv.startsWith("\uFEFF")).toBe(true);

    // Separador deve ser ponto-e-vírgula
    const primeiraLinha = csv.split("\r\n")[0];
    expect(primeiraLinha).toContain(";");
    expect(primeiraLinha).toContain("Identificador;Título;Categoria;Tema");
  });

  it("garante integridade e ausência de campos vazios críticos em todos os itens", () => {
    const docs = listarDocumentosUnificados();
    for (const d of docs) {
      expect(d.id).toBeTruthy();
      expect(d.titulo).toBeTruthy();
      expect(d.categoria).toBeTruthy();
      expect(d.ano).toBeGreaterThanOrEqual(2010);
      expect(d.urlOficial.startsWith("http")).toBe(true);
    }
  });
});
