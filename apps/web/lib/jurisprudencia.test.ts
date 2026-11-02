import { describe, expect, it } from "vitest";
import {
  contagemPor,
  contagemTemasIndenizacao,
  contarLista,
  faixasDeValor,
  filtrar,
  filtrarTema,
  ordenar,
  paginar,
  poloPorAno,
  TEMAS_INDENIZACAO,
  textoBuscavel,
  type CasoJurisprudencia,
} from "./jurisprudencia";

/**
 * Regras da página `/jurisprudencia`.
 *
 * Dois blocos com naturezas diferentes:
 * 1. filtro, ordenação, paginação e polo×ano — o esqueleto da lista;
 * 2. recortes de indenização — o acervo NÃO tem campo de "auxílio emergencial"
 *    nem de "PTR": o dado está no texto. Como todo N publicado na faixa de
 *    temas sai deste casamento, ele precisa de teste: um `\bafe\b` mal escrito
 *    casa "afetado" e infla o número em silêncio.
 */

const caso = (processo: string, over: Partial<CasoJurisprudencia> = {}): CasoJurisprudencia => ({
  id: `TJMG:${processo}`,
  processo,
  tribunal: "TJMG",
  tipo: "acordao",
  frente: "brumadinho",
  estado: "MG",
  classe: "Apelação Cível",
  comarca: "Belo Horizonte",
  ano: "2023",
  orgao: "",
  magistrado: "",
  assunto: "",
  polo: "empresa",
  resultado: "negado",
  recorrente: "atingido",
  temas: ["dano moral"],
  ementa: "EMENTA: teste",
  resumo: "resumo de teste",
  danos_pnab: [],
  valor: null,
  link: "",
  status: "aprovado",
  explicacao: "",
  exemplo: "",
  ...over,
});

describe("jurisprudencia", () => {
  it("filtra por polo, tema, comarca, ano e processo", () => {
    const casos = [
      caso("1", { polo: "empresa", temas: ["dano moral", "tap"], comarca: "Betim", ano: "2021" }),
      caso("2", { polo: "atingido", temas: ["tap"], comarca: "Brumadinho", ano: "2022" }),
    ];
    expect(filtrar(casos, { polo: "empresa" })).toHaveLength(1);
    expect(filtrar(casos, { tema: "tap" })).toHaveLength(2);
    expect(filtrar(casos, { comarca: "Brumadinho", ano: "2022" })[0].processo).toBe("2");
    expect(filtrar(casos, { q: "1" })[0].processo).toBe("1");
  });

  it("filtra por tribunal e estado (link pre-selecionado)", () => {
    const casos = [
      caso("1", { tribunal: "TJMG", estado: "MG" }),
      caso("2", { tribunal: "TJES", estado: "ES" }),
    ];
    expect(filtrar(casos, { tribunal: "TJES" }).map((c) => c.processo)).toEqual(["2"]);
    expect(filtrar(casos, { estado: "MG" }).map((c) => c.processo)).toEqual(["1"]);
    expect(filtrar(casos, { tribunal: "TJES", estado: "MG" })).toHaveLength(0);
  });

  it("filtra por frente e tipo (súmula x acórdão)", () => {
    const casos = [
      caso("1", { frente: "brumadinho", tipo: "acordao" }),
      caso("2", { frente: "sumula", tipo: "sumula" }),
    ];
    expect(filtrar(casos, { frente: "sumula" }).map((c) => c.processo)).toEqual(["2"]);
    expect(filtrar(casos, { tipo: "acordao" }).map((c) => c.processo)).toEqual(["1"]);
  });

  it("combina o recorte de indenização com os demais filtros", () => {
    const casos = [
      caso("1", { resumo: "cobrança do auxílio emergencial", polo: "atingido" }),
      caso("2", { resumo: "cobrança do auxílio emergencial", polo: "empresa" }),
      caso("3", { resumo: "sem relação" }),
    ];
    expect(filtrar(casos, { recorte: "auxilio-emergencial" })).toHaveLength(2);
    expect(filtrar(casos, { recorte: "auxilio-emergencial", polo: "atingido" })).toHaveLength(1);
    expect(filtrar(casos, { recorte: "nao-existe" })).toHaveLength(0);
  });

  it("ordena por ano sem perder estabilidade", () => {
    const casos = [caso("b", { ano: "2021" }), caso("a", { ano: "2023" })];
    expect(ordenar(casos, "ano_desc").map((c) => c.processo)).toEqual(["a", "b"]);
    expect(ordenar(casos, "ano_asc").map((c) => c.processo)).toEqual(["b", "a"]);
  });

  it("pagina e limita a página ao total", () => {
    const casos = Array.from({ length: 45 }, (_, i) => caso(String(i)));
    expect(paginar(casos, 1).itens).toHaveLength(20);
    expect(paginar(casos, 3).itens).toHaveLength(5);
    expect(paginar(casos, 99).pagina).toBe(3);
    expect(paginar(casos, 1).totalPaginas).toBe(3);
  });

  it("conta polo por ano", () => {
    const anos = poloPorAno([caso("1", { ano: "2021" }), caso("2", { ano: "2021", polo: "atingido" })]);
    expect(anos).toEqual([{ ano: "2021", total: 2, partes: [["atingido", 1], ["empresa", 1]] }]);
  });
});

describe("contagemPor", () => {
  it("conta resultado e ordena por N", () => {
    const casos = [
      caso("1", { resultado: "negado" }),
      caso("2", { resultado: "negado" }),
      caso("3", { resultado: "provido" }),
    ];
    expect(contagemPor(casos, "resultado")).toEqual([
      ["negado", 2],
      ["provido", 1],
    ]);
  });

  it("usa — para campo vazio, sem inventar categoria", () => {
    expect(contagemPor([caso("1", { polo: "" })], "polo")).toEqual([["—", 1]]);
  });
});

describe("contarLista", () => {
  it("conta um caso em cada tema que ele tem", () => {
    const casos = [
      caso("1", { temas: ["Homicídio", "Omissão penal"] }),
      caso("2", { temas: ["Homicídio"] }),
    ];
    expect(contarLista(casos, "temas")).toEqual([
      ["Homicídio", 2],
      ["Omissão penal", 1],
    ]);
  });

  it("ignora item vazio", () => {
    expect(contarLista([caso("1", { danos_pnab: ["  "] })], "danos_pnab")).toEqual([]);
  });
});

describe("faixasDeValor", () => {
  it("põe cada valor na faixa certa e conta o denominador", () => {
    const casos = [
      caso("1", { valor: 5_000 }),
      caso("2", { valor: 10_000 }),
      caso("3", { valor: 10_001 }),
      caso("4", { valor: 500_000 }),
      caso("5", { valor: 440_000_000 }),
      caso("6", { valor: null }),
      caso("7", { valor: 0 }),
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
    const { dados, n } = faixasDeValor([caso("1", { valor: null })]);
    expect(n).toBe(0);
    expect(dados.every(([, v]) => v === 0)).toBe(true);
  });
});

describe("textoBuscavel", () => {
  it("tira acento e caixa", () => {
    expect(textoBuscavel(caso("1", { resumo: "Auxílio Emergencial INDEFERIDO" }))).toContain(
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
      expect(filtrarTema([caso("1", { resumo: texto })], "auxilio-emergencial")).toHaveLength(1);
    }
  });

  it("não confunde AFE com afetado", () => {
    expect(
      filtrarTema([caso("1", { resumo: "o atingido foi afetado pelo rejeito" })], "auxilio-emergencial"),
    ).toHaveLength(0);
  });

  it("não confunde PTR com palavra que apenas começa parecido", () => {
    expect(filtrarTema([caso("1", { resumo: "ptrdireto" })], "ptr")).toHaveLength(0);
    expect(filtrarTema([caso("1", { resumo: "o PTR do acordo" })], "ptr")).toHaveLength(1);
  });

  it("distingue pensão mensal de pensão comum", () => {
    expect(filtrarTema([caso("1", { resumo: "pensão mensal de dois salários" })], "pensao-mensal")).toHaveLength(1);
    expect(filtrarTema([caso("1", { resumo: "pensão alimentícia" })], "pensao-mensal")).toHaveLength(0);
  });

  it("devolve vazio para slug desconhecido", () => {
    expect(filtrarTema([caso("1", { resumo: "qualquer" })], "nao-existe")).toEqual([]);
  });

  it("conta todos os recortes numa passada", () => {
    const casos = [
      caso("1", { resumo: "dano moral e lucros cessantes" }),
      caso("2", { resumo: "auxilio emergencial e dano moral" }),
      caso("3", { ementa: "NAE não previsto", resumo: "" }),
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
