import { describe, expect, test } from "vitest";
import {
  compararValores,
  filtrarPorIgual,
  filtrarPorTexto,
  ordenarPor,
} from "./ordenar";

interface Linha {
  nome: string;
  valor: number;
  data: string;
  tipo: string;
}

const LINHAS: Linha[] = [
  { nome: "Água e esgoto", valor: 1200.5, data: "2026-03-01", tipo: "obra" },
  { nome: "agua mineral", valor: 99, data: "2026-01-15", tipo: "servico" },
  { nome: "Beto Construtora", valor: 8500, data: "2025-11-30", tipo: "obra" },
  { nome: "Café Central", valor: Number.NaN, data: "2026-06-20", tipo: "servico" },
  { nome: "Dona Maria", valor: 10, data: "invalida", tipo: "obra" },
];

describe("ordenarPor", () => {
  test("não muta a lista de entrada", () => {
    const copia = [...LINHAS];
    ordenarPor(LINHAS, "nome");
    expect(LINHAS).toEqual(copia);
  });

  test("texto ordena sem acento e sem caixa: 'Água' e 'agua' ficam juntas", () => {
    const nomes = ordenarPor(LINHAS, "nome").map((l) => l.nome);
    // "agua mineral" (sem acento) vem junto de "Água e esgoto" (com acento) —
    // a comparação é sobre o texto normalizado, então o empate da primeira
    // letra desce para a segunda palavra.
    expect(nomes[0]).toBe("Água e esgoto");
    expect(nomes[1]).toBe("agua mineral");
    expect(nomes[2]).toBe("Beto Construtora");
  });

  test("desc inverte os presentes, mas ausente continua no fim", () => {
    const nomes = ordenarPor(LINHAS, "nome", "desc").map((l) => l.nome);
    expect(nomes[0]).toBe("Dona Maria");
    expect(nomes[nomes.length - 1]).toBe("Água e esgoto");
  });

  test("numero ordena numericamente, não alfabeticamente", () => {
    const valores = ordenarPor(LINHAS, "valor", "asc", "numero").map((l) => l.valor);
    expect(valores.slice(0, 3)).toEqual([10, 99, 1200.5]);
    // NaN (Café Central) e data inválida (Dona Maria) vão para o fim.
    expect(valores[3]).toBe(8500);
    expect(Number.isNaN(valores[4])).toBe(true);
  });

  test("data ISO ordena cronologicamente; inválida fica no fim mesmo em desc", () => {
    const datas = ordenarPor(LINHAS, "data", "asc", "data").map((l) => l.data);
    expect(datas.slice(0, 3)).toEqual(["2025-11-30", "2026-01-15", "2026-03-01"]);
    expect(datas[3]).toBe("2026-06-20");
    expect(datas[4]).toBe("invalida");

    const desc = ordenarPor(LINHAS, "data", "desc", "data").map((l) => l.data);
    expect(desc[0]).toBe("2026-06-20");
    expect(desc[4]).toBe("invalida");
  });

  test("empate é estável: ordem original se mantém", () => {
    const iguais: Linha[] = [
      { nome: "Mesmo Nome", valor: 1, data: "2026-01-01", tipo: "a" },
      { nome: "Mesmo nome", valor: 2, data: "2026-01-01", tipo: "b" },
      { nome: "mesmo nome", valor: 3, data: "2026-01-01", tipo: "c" },
    ];
    const tipos = ordenarPor(iguais, "nome").map((l) => l.tipo);
    expect(tipos).toEqual(["a", "b", "c"]);
  });
});

describe("compararValores", () => {
  test("texto sem acento", () => {
    expect(compararValores("Água", "agua", "texto")).toBe(0);
    expect(compararValores("a", "b", "texto")).toBe(-1);
  });
  test("numero com ausente por último", () => {
    expect(compararValores(1, Number.NaN, "numero")).toBe(-1);
    expect(compararValores(Number.NaN, 1, "numero")).toBe(1);
  });
  test("data inválida por último", () => {
    expect(compararValores("2026-01-01", "x", "data")).toBe(-1);
  });
});

describe("filtrarPorIgual", () => {
  test("valor exato por enum/tipo", () => {
    const obras = filtrarPorIgual(LINHAS, "tipo", "obra");
    expect(obras).toHaveLength(3);
    expect(obras.every((l) => l.tipo === "obra")).toBe(true);
  });

  test("valor inexistente devolve vazio", () => {
    expect(filtrarPorIgual(LINHAS, "tipo", "nada")).toEqual([]);
  });
});

describe("filtrarPorTexto", () => {
  test("termo casa dentro do texto, sem acento e sem caixa", () => {
    expect(filtrarPorTexto(LINHAS, "nome", "AGUA")).toHaveLength(2);
    expect(filtrarPorTexto(LINHAS, "nome", "água")).toHaveLength(2);
  });

  test("termo vazio devolve tudo", () => {
    expect(filtrarPorTexto(LINHAS, "nome", "   ")).toEqual(LINHAS);
  });

  test("sem casamento devolve vazio", () => {
    expect(filtrarPorTexto(LINHAS, "nome", "zebra")).toEqual([]);
  });
});