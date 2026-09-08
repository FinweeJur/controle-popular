import { describe, it, expect } from "vitest";
import {
  obterTodasInstituicoes,
  obterInstituicao,
  listarInstituicoesPorPoder,
  listarInstituicoesPorEsfera,
  buscarInstituicoes,
  obterNoticiasDaInstituicao,
  encontrarSiglaInstituicao,
} from "./catalogo";

describe("Catálogo de Instituições e Secretarias de Todas as Esferas", () => {
  it("deve conter todas as 19 instituições nas 4 esferas de poder", () => {
    const todas = obterTodasInstituicoes();
    expect(todas.length).toBe(19);

    const poderes = new Set(todas.map((i) => i.poder));
    expect(poderes).toContain("Executivo");
    expect(poderes).toContain("Legislativo");
    expect(poderes).toContain("Judiciário");
    expect(poderes).toContain("Sistema de Justiça");

    const esferas = new Set(todas.map((i) => i.esfera));
    expect(esferas).toContain("Federal");
    expect(esferas).toContain("Estadual");
    expect(esferas).toContain("Municipal");
  });

  it("todas as instituições devem ter contatos completos: telefone, endereço e e-mail", () => {
    const todas = obterTodasInstituicoes();
    for (const inst of todas) {
      expect(inst.ouvidoria).toBeDefined();
      expect(inst.ouvidoria.telefone.length).toBeGreaterThan(5);
      expect(inst.ouvidoria.endereco.length).toBeGreaterThan(10);
      expect(inst.ouvidoria.email).toContain("@");
      expect(inst.ouvidoria.canal.length).toBeGreaterThan(3);
    }
  });

  it("todas as instituições devem ter organograma com áreas e funções descritas", () => {
    const todas = obterTodasInstituicoes();
    for (const inst of todas) {
      expect(inst.organograma.length).toBeGreaterThanOrEqual(2);
      for (const item of inst.organograma) {
        expect(item.area.length).toBeGreaterThan(3);
        expect(item.funcao.length).toBeGreaterThan(15);
      }
    }
  });

  it("todas as instituições devem ter orçamento com ano, total e folha de pessoal", () => {
    const todas = obterTodasInstituicoes();
    for (const inst of todas) {
      expect(inst.orcamento.ano).toBeGreaterThanOrEqual(2024);
      expect(inst.orcamento.total).toContain("R$");
      expect(inst.orcamento.folhaPessoal).toContain("R$");
      expect(inst.orcamento.custeioInvestimentos).toContain("R$");
    }
  });

  it("todas as instituições devem ter documentos-chave e notícias conectadas", () => {
    const todas = obterTodasInstituicoes();
    for (const inst of todas) {
      expect(inst.documentosChave.length).toBeGreaterThanOrEqual(1);
      expect(inst.noticias.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("deve localizar instituições específicas por sigla", () => {
    const fazenda = obterInstituicao("fazenda");
    expect(fazenda).toBeDefined();
    expect(fazenda?.nome).toBe("Ministério da Fazenda");
    expect(fazenda?.lideranca.nome).toBe("Fernando Haddad");

    const tjmg = obterInstituicao("tjmg");
    expect(tjmg).toBeDefined();
    expect(tjmg?.poder).toBe("Judiciário");
    expect(tjmg?.esfera).toBe("Estadual");

    const camara = obterInstituicao("camara-dos-deputados");
    expect(camara).toBeDefined();
    expect(camara?.poder).toBe("Legislativo");

    const smobi = obterInstituicao("smobi-bh");
    expect(smobi).toBeDefined();
    expect(smobi?.esfera).toBe("Municipal");

    const inexistente = obterInstituicao("orgao-inexistente-xyz");
    expect(inexistente).toBeUndefined();
  });

  it("deve filtrar por poder e por esfera", () => {
    const executivo = listarInstituicoesPorPoder("Executivo");
    expect(executivo.length).toBeGreaterThan(5);

    const estaduais = listarInstituicoesPorEsfera("Estadual");
    expect(estaduais.length).toBeGreaterThan(3);

    const municipais = listarInstituicoesPorEsfera("Municipal");
    expect(municipais.length).toBe(3); // SMSA-BH, SMOBI-BH, CMBH
  });

  it("deve buscar instituições por termos chave", () => {
    const buscaSaude = buscarInstituicoes("saúde");
    expect(buscaSaude.length).toBeGreaterThanOrEqual(2); // Ministério da Saúde e SES-MG e SMSA-BH

    const buscaMeioAmbiente = buscarInstituicoes("meio ambiente");
    expect(buscaMeioAmbiente.length).toBeGreaterThanOrEqual(2); // MMA e SEMAD-MG
  });

  it("deve conectar notícias e releases das secretarias e instituições", () => {
    const noticiasFazenda = obterNoticiasDaInstituicao("fazenda");
    expect(noticiasFazenda.length).toBeGreaterThanOrEqual(2);
    expect(noticiasFazenda[0].titulo.length).toBeGreaterThan(10);
    expect(noticiasFazenda[0].url.length).toBeGreaterThan(5);

    const noticiasTJMG = obterNoticiasDaInstituicao("tjmg");
    expect(noticiasTJMG.length).toBeGreaterThanOrEqual(2);
  });

  it("deve mapear nomes de secretarias para suas siglas no catálogo", () => {
    expect(encontrarSiglaInstituicao("Secretaria de Estado de Saúde (SES-MG)")).toBe("ses-mg");
    expect(encontrarSiglaInstituicao("Secretaria de Estado de Fazenda")).toBe("sef-mg");
    expect(encontrarSiglaInstituicao("Ministério da Saúde")).toBe("saude");
    expect(encontrarSiglaInstituicao("Ministério da Educação (MEC)")).toBe("mec");
    expect(encontrarSiglaInstituicao("Secretaria Municipal de Obras (SMOBI-BH)")).toBe("smobi-bh");
    expect(encontrarSiglaInstituicao("Órgão Fantasma Totalmente Desconhecido")).toBeUndefined();
  });
});
