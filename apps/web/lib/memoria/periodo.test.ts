import { describe, expect, it } from "vitest";
import { anoDoPeriodo } from "./periodo";

describe("anoDoPeriodo", () => {
  it("lê o primeiro ano de um intervalo", () => {
    expect(anoDoPeriodo("1983-1984")).toBe(1983);
    expect(anoDoPeriodo("1896-1897")).toBe(1896);
  });

  it("lê década escrita por extenso", () => {
    expect(anoDoPeriodo("década de 1970-1980")).toBe(1970);
  });

  it("converte século romano no primeiro ano dele", () => {
    expect(anoDoPeriodo("século XIX")).toBe(1801);
    expect(anoDoPeriodo("séculos XX e XXI")).toBe(1901);
  });

  it("manda período sem data para o fim da fila", () => {
    expect(anoDoPeriodo("")).toBe(9999);
    expect(anoDoPeriodo("sem data")).toBe(9999);
  });

  it("ordena 1888 antes de 1979", () => {
    const lista = ["1979", "século XIX", "1888", "década de 1970-1980"];
    expect([...lista].sort((a, b) => anoDoPeriodo(a) - anoDoPeriodo(b))).toEqual([
      "século XIX",
      "1888",
      "década de 1970-1980",
      "1979",
    ]);
  });
});
