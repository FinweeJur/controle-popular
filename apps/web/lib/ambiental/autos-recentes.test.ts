import { describe, expect, test } from "vitest";
import { agregarPorAno, buscar, filtrarAutos, normalizar, type AutoRecente } from "./autos-recentes";

/**
 * Regras que a busca não pode quebrar:
 * - filtro por município ignora acento e caixa;
 * - faixa de valor é inclusiva;
 * - a contagem por ano não inventa ano;
 * - paginação nunca devolve mais que o limite.
 */
const autos: AutoRecente[] = [
  { a: "1001", d: "2026-02-10", o: "SEMAD", v: 5000, s: "Em processamento", m: "Belo Horizonte", u: "URFBIO", e: "" },
  { a: "1002", d: "2025-11-03", o: "IEF", v: 1500, s: "Quitação do DAE", m: "Betim", u: "URFBIO", e: "" },
  { a: "1003", d: "2025-01-20", o: "SEMAD", v: 90000, s: "Em processamento", m: "Contagem", u: "URFBIO", e: "" },
  { a: "1004", d: "2024-07-01", o: "SEMAD", v: 0, s: "Anulação de Processo", m: "Betim", u: "URFBIO", e: "" },
];

describe("busca de autos recentes", () => {
  test("normaliza acento e caixa do município", () => {
    expect(normalizar("Belo Horizonte")).toBe("BELO HORIZONTE");
    expect(normalizar("São João d'El-Rei")).toBe("SAO JOAO D'EL-REI");
  });

  test("filtra por município sem acento e por faixa de valor inclusiva", () => {
    const resultado = filtrarAutos(autos, { municipio: "betim", valorMin: 0, valorMax: 1500 });
    expect(resultado.map((a) => a.a)).toEqual(["1002", "1004"]);
  });

  test("filtra por ano e por número do auto", () => {
    expect(filtrarAutos(autos, { ano: "2025" }).map((a) => a.a)).toEqual(["1002", "1003"]);
    expect(filtrarAutos(autos, { q: "1003" }).map((a) => a.a)).toEqual(["1003"]);
  });

  test("conta por ano só anos reais", () => {
    expect(agregarPorAno(autos)).toEqual([
      { rotulo: "2024", valor: 1 },
      { rotulo: "2025", valor: 2 },
      { rotulo: "2026", valor: 1 },
    ]);
  });

  test("pagina e soma valor do filtro", () => {
    const resultado = buscar(autos, { porPagina: 2, pagina: 2 });
    expect(resultado.total).toBe(4);
    expect(resultado.paginas).toBe(2);
    expect(resultado.itens.map((a) => a.a)).toEqual(["1003", "1004"]);
    expect(resultado.valorTotal).toBe(96500);
  });
});
