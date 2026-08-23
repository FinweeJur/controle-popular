import { describe, expect, test } from "vitest";
import {
  cruzamentosToCsv,
  montarLinhasCruzamento,
  municipioNaLista,
  ORGAO_POR_TIPO,
  type EntradaBarragemQuilombola,
  type EntradaSigmine,
} from "./cruzamentos-puro";

describe("municipioNaLista", () => {
  test("casa sem acento e sem caixa, em lista separada por virgula", () => {
    expect(municipioNaLista("Senhora do Porto,Carmésia", "carmesia")).toBe(true);
    expect(municipioNaLista("PARACATU", "Paracatu")).toBe(true);
    expect(municipioNaLista("Santa Rita do Itueto,Resplendor", "resplendor")).toBe(true);
  });

  test("nao casa substring nem nome diferente", () => {
    expect(municipioNaLista("Resplendor", "Resplendor do Sul")).toBe(false);
    expect(municipioNaLista("Carmésia", "Carmo da Mata")).toBe(false);
  });

  test("entrada vazia ou alvo vazio nao casam - ausencia nao e sinal", () => {
    expect(municipioNaLista(null, "Betim")).toBe(false);
    expect(municipioNaLista("Betim", "")).toBe(false);
    expect(municipioNaLista(undefined, undefined as unknown as string)).toBe(false);
  });
});

const sig = (over: Partial<EntradaSigmine>): EntradaSigmine => ({
  territorioTipo: "terra_indigena",
  territorioNome: "Terra X",
  semNomeMotivo: null,
  territorioMunicipios: ["Testolândia"],
  sigmineProcesso: "830.123/2021",
  sigmineNome: "Mina Alfa",
  sigmineSubs: "",
  sigmineFase: "LAVRA",
  sigmineUso: null,
  areaIntersecaoHa: 10,
  mapaCamada: "sigmine-operacao",
  mapaIdx: 3,
  ...over,
});

const bar = (over: Partial<EntradaBarragemQuilombola>): EntradaBarragemQuilombola => ({
  territorioNome: "Comunidade Y",
  territorioMunicipios: ["Testolândia"],
  territorioFase: "Titulada",
  barragem: "Barragem Z",
  empreendedor: "Mineradora W",
  municipioBarragem: "Testolândia",
  statusPae: "Apresentado",
  areaIntersecaoHa: 5,
  mapaCamada: "mancha-inundacao-barragens",
  mapaIdx: 7,
  ...over,
});

describe("montarLinhasCruzamento", () => {
  test("ordena operacao < interesse < barragem; dentro do tipo, maior area primeiro", () => {
    const linhas = montarLinhasCruzamento(
      [sig({ areaIntersecaoHa: 1 }), sig({ areaIntersecaoHa: 9 })],
      [sig({ areaIntersecaoHa: 2 })],
      [bar({})]
    );
    expect(linhas.map((l) => l.tipo)).toEqual([
      "mineracao_operacao",
      "mineracao_operacao",
      "mineracao_interesse",
      "barragem_mancha_quilombola",
    ]);
    expect(linhas[0].areaIntersecaoHa).toBe(9);
  });

  test("orgao autorizador por acervo e documento da ANM presente; barragem sem doc vira lacuna explicita", () => {
    const linhas = montarLinhasCruzamento([sig({})], [], [bar({})]);
    expect(ORGAO_POR_TIPO[linhas[0].tipo]).toBe("ANM");
    expect(ORGAO_POR_TIPO[linhas[1].tipo]).toBe("FEAM/SNISB");
    expect(linhas[0].documentoReferencia).toContain("anm.gov.br");
    expect(linhas[1].documentoReferencia).toBeNull();
  });

  test("territorio quilombola sem nome carrega o motivo da lacuna", () => {
    const linhas = montarLinhasCruzamento(
      [],
      [sig({ territorioTipo: "quilombola", territorioNome: null, semNomeMotivo: "sem campo de nome na fonte" })],
      []
    );
    expect(linhas[0].territorioNome).toBeNull();
    expect(linhas[0].semNomeMotivo).toContain("sem campo de nome");
  });
});

describe("cruzamentosToCsv", () => {
  test("BOM UTF-8, separador ; e orgao na coluna", () => {
    const csv = cruzamentosToCsv(montarLinhasCruzamento([sig({ sigmineProcesso: '830;123 "A"' })], [], []));
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("tipo;territorio_tipo;territorio_nome;empreendimento");
    expect(csv).toContain('"830;123 ""A"""');
    expect(csv).toContain(";ANM;");
  });

  test("lista vazia ainda devolve cabecalho", () => {
    const csv = cruzamentosToCsv([]);
    expect(csv.startsWith("\ufefftipo;territorio_tipo;territorio_nome")).toBe(true);
  });
});
