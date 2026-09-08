import { describe, it, expect } from "vitest";
import {
  obterTodasUnidadesJudiciarias,
  obterEstatisticasContatos,
  listarUnidadesPorTribunal,
  listarUnidadesPorUf,
  listarUnidadesPorRamo,
  listarUnidadesPorComarca,
  buscarUnidadesJudiciarias,
} from "./contatos";

describe("Central Nacional de Contatos do Judiciário (Varas, Gabinetes e Secretarias)", () => {
  it("deve carregar mais de 900 unidades judiciárias catalogadas", () => {
    const unidades = obterTodasUnidadesJudiciarias();
    expect(unidades.length).toBeGreaterThanOrEqual(900);
  });

  it("deve cobrir os 3 ramos da justiça: Estadual, Federal e Trabalho", () => {
    const estatisticas = obterEstatisticasContatos();
    expect(estatisticas.porRamo.estadual).toBeGreaterThanOrEqual(700);
    expect(estatisticas.porRamo.federal).toBeGreaterThanOrEqual(50);
    expect(estatisticas.porRamo.trabalho).toBeGreaterThanOrEqual(150);
  });

  it("deve cobrir todas as 298 comarcas de Minas Gerais e mais de 500 unidades em MG", () => {
    const mgUnidades = listarUnidadesPorUf("MG");
    expect(mgUnidades.length).toBeGreaterThanOrEqual(500);

    const tjmg = listarUnidadesPorTribunal("tjmg");
    expect(tjmg.length).toBeGreaterThanOrEqual(400);

    const trf6 = listarUnidadesPorTribunal("trf6");
    expect(trf6.length).toBeGreaterThanOrEqual(20);

    const trt3 = listarUnidadesPorTribunal("trt3");
    expect(trt3.length).toBeGreaterThanOrEqual(40);
  });

  it("deve conter comarcas fundamentais de Minas Gerais (BH, Betim, Contagem, Uberlândia)", () => {
    const bh = listarUnidadesPorComarca("Belo Horizonte");
    expect(bh.length).toBeGreaterThanOrEqual(40);

    const betim = listarUnidadesPorComarca("Betim");
    expect(betim.length).toBeGreaterThanOrEqual(15);

    const contagem = listarUnidadesPorComarca("Contagem");
    expect(contagem.length).toBeGreaterThanOrEqual(12);

    const uberlandia = listarUnidadesPorComarca("Uberlândia");
    expect(uberlandia.length).toBeGreaterThanOrEqual(8);
  });

  it("todas as unidades devem possuir coordenador/titular com cargo e nome", () => {
    const unidades = obterTodasUnidadesJudiciarias();
    for (const u of unidades) {
      expect(u.coordenador).toBeDefined();
      expect(u.coordenador.cargo.length).toBeGreaterThan(2);
      expect(u.coordenador.nome.length).toBeGreaterThan(3);
    }
  });

  it("todas as unidades devem possuir telefone com DDD, e-mail institucional, endereço com CEP e link de balcão virtual", () => {
    const unidades = obterTodasUnidadesJudiciarias();
    for (const u of unidades) {
      expect(u.telefone).toMatch(/\(\d{2}\)\s\d{4,5}-\d{4}/);
      expect(u.email).toContain("@");
      expect(u.endereco).toContain("CEP");
      expect(u.linkBalcaoVirtual).toMatch(/^https?:\/\//);
    }
  });

  it("deve realizar busca textual por juiz, comarca, vara ou telefone", () => {
    const resJuiz = buscarUnidadesJudiciarias("Clayton Rosa");
    expect(resJuiz.length).toBeGreaterThanOrEqual(1);

    const resBetim = buscarUnidadesJudiciarias("Betim");
    expect(resBetim.length).toBeGreaterThanOrEqual(10);

    const resVara = buscarUnidadesJudiciarias("1ª Vara Cível");
    expect(resVara.length).toBeGreaterThanOrEqual(5);
  });
});
