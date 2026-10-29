import { describe, expect, it } from "vitest";
import { filtrar, ordenar, paginar, poloPorAno, type CasoJurisprudencia } from "./jurisprudencia";

const caso = (processo: string, over: Partial<CasoJurisprudencia> = {}): CasoJurisprudencia => ({
  processo,
  tipo: "apelacao",
  classe: "Apelação Cível",
  comarca: "Belo Horizonte",
  ano: "2023",
  polo: "empresa",
  resultado: "negado",
  recorrente: "atingido",
  temas: ["dano moral"],
  danos_pnab: [],
  valor: null,
  link: "",
  status: "aprovado",
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
