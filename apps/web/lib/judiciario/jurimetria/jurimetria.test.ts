import { describe, expect, it } from "vitest";
import { construirIndice, consultar, relacionadas } from "./indice";
import { construirMapa, resumoDoMapa } from "./mapa";
import {
  deduplicarDecisoes,
  idDaDecisao,
  normalizarComarca,
  normalizarDanos,
  normalizarData,
  normalizarNormas,
  normalizarResultado,
} from "./normalizar";
import type { DecisaoJurimetria } from "./tipos";

/**
 * Testes do contrato de jurimetria com fixture sintética.
 *
 * Nenhum dado real do TJMG entra aqui: o objetivo é provar as invariantes
 * do contrato, do índice e do mapa antes de ligar a exportação. Os textos
 * são genéricos de propósito; não afirmam fato jurídico.
 */

function decisao(over: Partial<DecisaoJurimetria> = {}): DecisaoJurimetria {
  return {
    id: "tjmg:1",
    tribunal: "TJMG",
    temas: ["rompimento-brumadinho"],
    temasFonte: ["rompimento-brumadinho"],
    processo: "5000000-00.2024.8.13",
    numeroAcordao: "24/00001",
    classe: "Apelação Cível",
    relator: "Relator A",
    dataJulgamento: "2024-05-10",
    dataPublicacao: "2024-05-20",
    comarca: "BRUMADINHO",
    resultado: "favoravel",
    nexo: "afirmado",
    normas: ["cf-88-art-5"],
    normasBrutas: ["CF/88 art. 5"],
    danos: ["agua_abastecimento", "mudanca_habitos_psicossociais"],
    valorIndenizacao: 50000,
    fonte: "pdf",
    confianca: "alta",
    ementa:
      "Água potável e abastecimento no contexto do rompimento da barragem em Brumadinho. " +
      "A decisão reconhece o dano e fixa indenização.",
    urlEspelho: "https://www5.tjmg.jus.br/jurisprudencia/espelho/1",
    arquivoTxt: "parsed/rompimento-brumadinho/24-00001-1.txt",
    ...over,
  };
}

const d1 = decisao();

const d2 = decisao({
  id: "tjmg:2",
  temas: ["rompimento-mariana"],
  temasFonte: ["rompimento-mariana"],
  processo: "5000000-01.2020.8.13",
  numeroAcordao: "20/00002",
  dataJulgamento: "2020-03-01",
  dataPublicacao: "2020-03-10",
  comarca: "MARIANA",
  resultado: "parcial",
  nexo: "misto",
  normas: ["peab-mg"],
  normasBrutas: ["PEAB/MG"],
  danos: ["agua_abastecimento"],
  valorIndenizacao: null,
  fonte: "ementa",
  confianca: "media",
  ementa: "Água e abastecimento após o rompimento da barragem de Fundão, em Mariana.",
  urlEspelho: "https://www5.tjmg.jus.br/jurisprudencia/espelho/2",
  arquivoTxt: null,
});

const d3 = decisao({
  id: "tjmg:3",
  temas: ["rompimento-brumadinho"],
  temasFonte: ["rompimento-brumadinho"],
  processo: "5000000-02.2021.8.13",
  numeroAcordao: null,
  dataJulgamento: "2021-07-15",
  dataPublicacao: null,
  comarca: null,
  resultado: "nao_classificado",
  nexo: "nao_classificado",
  normas: [],
  normasBrutas: [],
  danos: [],
  valorIndenizacao: null,
  fonte: "ementa",
  confianca: "baixa",
  ementa: "Decisão sobre questão processual, sem classificação de mérito.",
  urlEspelho: null,
  arquivoTxt: null,
});

const duplicada = decisao({
  id: "tjmg:1",
  temas: ["rompimento-mariana"],
  temasFonte: ["rompimento-mariana"],
  fonte: "ementa",
  confianca: "media",
  ementa: "Texto menor.",
  urlEspelho: null,
  arquivoTxt: null,
});

describe("normalização do contrato", () => {
  it("transforma pendente em não classificado", () => {
    expect(normalizarResultado("pendente")).toBe("nao_classificado");
    expect(normalizarResultado("favorável")).toBe("favoravel");
    expect(normalizarResultado("desfavoravel")).toBe("desfavoravel");
  });

  it("normaliza data brasileira para ISO", () => {
    expect(normalizarData("08/10/2026")).toBe("2026-10-08");
    expect(normalizarData("2026-10-08T12:00:00Z")).toBe("2026-10-08");
    expect(normalizarData("data inválida")).toBeNull();
  });

  it("canonicaliza comarca sem inventar acento", () => {
    expect(normalizarComarca("Belo")).toBe("BELO HORIZONTE");
    expect(normalizarComarca("brumadinho")).toBe("BRUMADINHO");
    expect(normalizarComarca("pendente")).toBeNull();
  });

  it("separa dano de ausência e de termo desconhecido", () => {
    expect(normalizarDanos("agua_abastecimento|pendente|desconhecido")).toEqual([
      "agua_abastecimento",
    ]);
    expect(normalizarDanos("desvalorizacao_imoveis|agua_abastecimento")).toEqual([
      "desvalorizacao_imoveis",
      "agua_abastecimento",
    ]);
  });

  it("mapeia norma e descarta categoria jurídica", () => {
    const normas = normalizarNormas("CF/88 art. 5; Lei 7.347/85 (ACP); Lucros cessantes");
    expect(normas).toContain("cf-88-art-5");
    expect(normas).toContain("lei-7347-85-acp");
    expect(normas).not.toContain("lucros-cessantes");
  });

  it("gera id estável por acórdão, processo, data e classe", () => {
    const a = idDaDecisao({
      numeroAcordao: "24/00001",
      processo: "5000000-00.2024.8.13",
      dataJulgamento: "2024-05-10",
      classe: "Apelação Cível",
    });
    const b = idDaDecisao({
      numeroAcordao: "24/00001",
      processo: "5000000-00.2024.8.13",
      dataJulgamento: "2024-05-10",
      classe: "Apelação Cível",
    });
    expect(a).toBe(b);
    expect(a).toContain("tjmg:");
  });
});

describe("índice e deduplicação", () => {
  it("funde duplicata, mantém os temas e prefere PDF/confiança alta", () => {
    const decisoes = deduplicarDecisoes([d1, duplicada, d2, d3]);
    expect(decisoes).toHaveLength(3);
    const fundida = decisoes.find((d) => d.id === "tjmg:1")!;
    expect(fundida.temas).toEqual(
      expect.arrayContaining(["rompimento-brumadinho", "rompimento-mariana"])
    );
    expect(fundida.fonte).toBe("pdf");
    expect(fundida.confianca).toBe("alta");
    expect(fundida.urlEspelho).toBe(d1.urlEspelho);
  });

  it("filtra por tema e por dano antes de ranquear", () => {
    const indice = construirIndice([d1, d2, d3]);
    const porDano = consultar(indice, { dano: "agua_abastecimento", limite: 10 });
    expect(porDano).toHaveLength(2);
    expect(porDano.every((r) => r.decisao.danos.includes("agua_abastecimento"))).toBe(true);

    const porTema = consultar(indice, { tema: "rompimento-brumadinho", limite: 10 });
    expect(porTema).toHaveLength(2);
    expect(porTema.every((r) => r.decisao.temas.includes("rompimento-brumadinho"))).toBe(true);
  });

  it("acha a decisão certa por texto e explica o motivo", () => {
    const indice = construirIndice([d1, d2, d3]);
    const resultado = consultar(indice, {
      texto: "água Brumadinho",
      tema: "rompimento-brumadinho",
      limite: 5,
    });
    expect(resultado[0].decisao.id).toBe("tjmg:1");
    expect(resultado[0].motivos.some((m) => m.startsWith("termo:"))).toBe(true);
  });

  it("liga relacionadas por dano e por tema", () => {
    const indice = construirIndice([d1, d2, d3]);
    const rel = relacionadas(indice, "tjmg:1", 5);
    const ids = rel.map((r) => r.decisao.id);
    expect(ids).toContain("tjmg:2");
    expect(ids).toContain("tjmg:3");
    expect(rel.find((r) => r.decisao.id === "tjmg:2")!.motivos).toContain("mesmo dano");
  });
});

describe("mapa", () => {
  it("conta cobertura, temas e casos-guia sem afirmar resultado", () => {
    const mapa = construirMapa([d1, d2, d3], {
      geradoEm: "2026-10-21",
      fonte: {
        repositorio: "tjmg-jurimetria",
        commit: "abc123",
        arquivos: ["tabelas/_/jurimetria_consolidado.csv"],
      },
    });

    expect(mapa.cobertura.total).toBe(3);
    expect(mapa.cobertura.comInteiroTeor).toBe(1);
    expect(mapa.cobertura.semFonte).toBe(1);
    expect(mapa.cobertura.porResultado.favoravel).toBe(1);
    expect(mapa.cobertura.porResultado.nao_classificado).toBe(1);

    const brumadinho = mapa.temas.find((t) => t.slug === "rompimento-brumadinho")!;
    expect(brumadinho.decisoes).toBe(2);
    expect(brumadinho.casosGuia).toContain("tjmg:1");
    expect(brumadinho.rota).toBe("/judiciario/jurisprudencia/tema/rompimento-brumadinho");
  });

  it("gera um resumo curto para o prompt, sem despejar ementas", () => {
    const mapa = construirMapa([d1, d2, d3], {
      geradoEm: "2026-10-21",
      fonte: { repositorio: "tjmg-jurimetria", commit: null, arquivos: [] },
    });
    const resumo = resumoDoMapa(mapa);
    expect(resumo).toContain("Mapa da jurimetria do TJMG: 3 decisões");
    expect(resumo).toContain("rompimento-brumadinho");
    expect(resumo).not.toContain(d1.ementa);
  });
});
