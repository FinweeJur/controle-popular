import { describe, it, expect } from "vitest";
import {
  listarRelatorios,
  obterRelatorio,
  relatoriosPorMunicipio,
  relatoriosPorEstado,
  relatoriosPorTema,
  contagemPorTema,
} from "./relatorios";

describe("Relatórios de Direitos Humanos (CIDH, ONU, CNDH)", () => {
  it("carrega a lista completa de relatórios oficiais", () => {
    const todos = listarRelatorios();
    expect(todos.length).toBeGreaterThanOrEqual(9);
    for (const r of todos) {
      expect(r.id.length).toBeGreaterThan(0);
      expect(r.titulo.length).toBeGreaterThan(5);
      expect(r.resumoCidadao.length).toBeGreaterThan(20);
      expect(r.recomendacoesChave.length).toBeGreaterThan(0);
      expect(r.linkOficial.startsWith("http")).toBe(true);
    }
  });

  it("recupera relatório específico por ID", () => {
    const r = obterRelatorio("cidh-brasil-pais-2021");
    expect(r).toBeDefined();
    expect(r?.orgao).toBe("CIDH (OEA)");
    expect(r?.ano).toBe(2021);
  });

  it("filtra relatórios cruzando por município", () => {
    const mariana = relatoriosPorMunicipio("Mariana");
    expect(mariana.length).toBeGreaterThanOrEqual(3); // CIDH País, REDESCA Empresas, CNDH Missão Rio Doce

    const brumadinho = relatoriosPorMunicipio("Brumadinho");
    expect(brumadinho.length).toBeGreaterThanOrEqual(3); // CIDH País, ONU Mineração/Tóxicos, CNDH Bacias

    const sp = relatoriosPorMunicipio("São Paulo");
    expect(sp.length).toBeGreaterThanOrEqual(2);
  });

  it("filtra relatórios por Estado (UF)", () => {
    const mg = relatoriosPorEstado("MG");
    expect(mg.length).toBeGreaterThanOrEqual(5);

    const sp = relatoriosPorEstado("SP");
    expect(sp.length).toBeGreaterThanOrEqual(2);
  });

  it("filtra relatórios por tema e conta categorias", () => {
    const indigenas = relatoriosPorTema("povos_indigenas");
    expect(indigenas.length).toBeGreaterThanOrEqual(2);

    const mineracao = relatoriosPorTema("mineracao_barragens");
    expect(mineracao.length).toBeGreaterThanOrEqual(2);

    const contagem = contagemPorTema();
    expect(contagem["pidesca_socioambiental"]).toBeGreaterThan(0);
  });
});
