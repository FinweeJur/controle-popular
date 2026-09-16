import { describe, it, expect } from "vitest";
import {
  ITENS_EDITAIS,
  COBERTURA_EDITAIS,
  POR_ORGAO,
  POR_MODALIDADE,
  listarOrgaos,
  listarModalidades,
  listarAnos,
  editaisParaCsv,
} from "./dados";

describe("Editais - Módulo de Dados e Agregados", () => {
  it("carrega a coleção consolidada de editais com sucesso", () => {
    expect(ITENS_EDITAIS.length).toBeGreaterThan(0);
    expect(COBERTURA_EDITAIS.total).toBe(ITENS_EDITAIS.length);
    expect(COBERTURA_EDITAIS.orgaosCount).toBeGreaterThan(0);
    expect(COBERTURA_EDITAIS.modalidadesCount).toBeGreaterThan(0);
  });

  it("itens possuem campos obrigatórios preenchidos", () => {
    for (const item of ITENS_EDITAIS) {
      expect(item.id).toBeTruthy();
      expect(item.titulo).toBeTruthy();
      expect(item.orgao).toBeTruthy();
      expect(item.modalidade).toBeTruthy();
      expect(item.objeto).toBeTruthy();
      expect(item.condicoesEPrazos).toBeTruthy();
      expect(item.urlOficial).toMatch(/^https?:\/\//);
      expect(item.dataPublicacao).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("distribuição por órgão e modalidade calcula totais válidos", () => {
    expect(POR_ORGAO.length).toBeGreaterThan(0);
    expect(POR_MODALIDADE.length).toBeGreaterThan(0);

    const somaOrgaos = POR_ORGAO.reduce((acc, curr) => acc + curr.total, 0);
    expect(somaOrgaos).toBe(ITENS_EDITAIS.length);
  });

  it("funções de listagem para filtros retornam coleções deduplicadas", () => {
    const orgaos = listarOrgaos();
    const modalidades = listarModalidades();
    const anos = listarAnos();

    expect(orgaos.length).toBe(new Set(orgaos).size);
    expect(modalidades.length).toBe(new Set(modalidades).size);
    expect(anos.length).toBe(new Set(anos).size);
    expect(anos).toContain(2026);
  });

  it("editaisParaCsv gera formato compatível com Excel (BOM UTF-8 e separador ';')", () => {
    const csv = editaisParaCsv(ITENS_EDITAIS.slice(0, 5));
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("data_publicacao;orgao;modalidade;numero;titulo;objeto");
    expect(csv.split("\r\n").length).toBeGreaterThanOrEqual(6);
  });
});
