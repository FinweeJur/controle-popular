import { describe, expect, it } from "vitest";

import {
  contagemPor,
  contagemTemasIndenizacao,
  contarLista,
  faixasDeValor,
  filtrarTema,
  TEMAS_INDENIZACAO,
  textoBuscavel,
  type CasoJurisprudencia,
} from "./jurisprudencia";

/**
 * A tabela de recortes da página `/jurisprudencia`.
 *
 * O acervo não tem campo de "auxílio emergencial" nem de "PTR": o dado está no
 * texto. Como todo N publicado sai deste casamento, ele precisa de teste — um
 * `\bafe\b` mal escrito casa "afetado" e infla o número em silêncio.
 */

function caso(parcial: Partial<CasoJurisprudencia>): CasoJurisprudencia {
  return {
    id: "x",
    processo: "0000000-00.2020.8.13",
    tribunal: "TJMG",
    tipo: "acordao",
    frente: "brumadinho",
    estado: "MG",
    classe: "",
    comarca: "",
    ano: "2020",
    orgao: "",
    magistrado: "",
    assunto: "",
    polo: "",
    resultado: "",
    recorrente: "",
    temas: [],
    ementa: "",
    resumo: "",
    danos_pnab: [],
    valor: null,
    link: "",
    status: "aprovado",
    explicacao: "",
    exemplo: "",
    ...parcial,
  };
}

describe("contagemPor", () => {
  it("conta resultado e ordena por N", () => {
    const casos = [
      caso({ resultado: "negado" }),
      caso({ resultado: "negado" }),
      caso({ resultado: "provido" }),
    ];
    expect(contagemPor(casos, "resultado")).toEqual([
      ["negado", 2],
      ["provido", 1],
    ]);
  });

  it("usa — para campo vazio, sem inventar categoria", () => {
    expect(contagemPor([caso({ polo: "" })], "polo")).toEqual([["—", 1]]);
  });
});

describe("contarLista", () => {
  it("conta um caso em cada tema que ele tem", () => {
    const casos = [
      caso({ temas: ["Homicídio", "Omissão penal"] }),
      caso({ temas: ["Homicídio"] }),
    ];
    expect(contarLista(casos, "temas")).toEqual([
      ["Homicídio", 2],
      ["Omissão penal", 1],
    ]);
  });

  it("ignora item vazio", () => {
    expect(contarLista([caso({ danos_pnab: ["  "] })], "danos_pnab")).toEqual([]);
  });
});

describe("faixasDeValor", () => {
  it("põe cada valor na faixa certa e conta o denominador", () => {
    const casos = [
      caso({ valor: 5_000 }),
      caso({ valor: 10_000 }),
      caso({ valor: 10_001 }),
      caso({ valor: 500_000 }),
      caso({ valor: 440_000_000 }),
      caso({ valor: null }),
      caso({ valor: 0 }),
    ];
    const { dados, n } = faixasDeValor(casos);
    // 0 e null ficam fora: não há valor, e fingir que é "até 10 mil" mentiria.
    expect(n).toBe(5);
    expect(dados[0][1]).toBe(2); // até 10 mil
    expect(dados[1][1]).toBe(1); // 10 mil a 50 mil
    expect(dados[3][1]).toBe(1); // 100 mil a 500 mil
    expect(dados[6][1]).toBe(1); // acima de 5 mi
  });

  it("devolve faixas zeradas quando não há valor", () => {
    const { dados, n } = faixasDeValor([caso({ valor: null })]);
    expect(n).toBe(0);
    expect(dados.every(([, v]) => v === 0)).toBe(true);
  });
});

describe("textoBuscavel", () => {
  it("tira acento e caixa", () => {
    expect(textoBuscavel(caso({ resumo: "Auxílio Emergencial INDEFERIDO" }))).toContain(
      "auxilio emergencial indeferido",
    );
  });
});

describe("recortes de indenização", () => {
  it("casa auxílio emergencial, AFE e auxílio financeiro emergencial", () => {
    for (const texto of [
      "cobrança do auxílio emergencial",
      "pagamento da AFE em atraso",
      "auxílio financeiro emergencial não pago",
    ]) {
      expect(filtrarTema([caso({ resumo: texto })], "auxilio-emergencial")).toHaveLength(1);
    }
  });

  it("não confunde AFE com afetado", () => {
    expect(filtrarTema([caso({ resumo: "o atingido foi afetado pelo rejeito" })], "auxilio-emergencial")).toHaveLength(0);
  });

  it("não confunde PTR com palavra que apenas começa parecido", () => {
    expect(filtrarTema([caso({ resumo: "ptrdireto" })], "ptr")).toHaveLength(0);
    expect(filtrarTema([caso({ resumo: "o PTR do acordo" })], "ptr")).toHaveLength(1);
  });

  it("distingue pensão mensal de pensão comum", () => {
    expect(filtrarTema([caso({ resumo: "pensão mensal de dois salários" })], "pensao-mensal")).toHaveLength(1);
    expect(filtrarTema([caso({ resumo: "pensão alimentícia" })], "pensao-mensal")).toHaveLength(0);
  });

  it("devolve vazio para slug desconhecido", () => {
    expect(filtrarTema([caso({ resumo: "qualquer" })], "nao-existe")).toEqual([]);
  });

  it("conta todos os recortes numa passada", () => {
    const casos = [
      caso({ resumo: "dano moral e lucros cessantes" }),
      caso({ resumo: "auxilio emergencial e dano moral" }),
      caso({ ementa: "NAE não previsto" }),
    ];
    const contagem = contagemTemasIndenizacao(casos);
    const por = Object.fromEntries(contagem.map((item) => [item.slug, item.n]));
    expect(por["dano-moral"]).toBe(2);
    expect(por["lucros-cessantes"]).toBe(1);
    expect(por["auxilio-emergencial"]).toBe(1);
    expect(por["nae"]).toBe(1);
    expect(por["reassentamento"]).toBe(0);
  });

  it("mantém slug único em cada recorte", () => {
    const slugs = TEMAS_INDENIZACAO.map((tema) => tema.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
