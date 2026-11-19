import { describe, expect, it } from "vitest";
import { montarTabela } from "./tabela";
import { filtrarLinhas, ordenarLinhas } from "@/lib/tabela/ordenavel";

/**
 * A montagem da tabela é regra, não desenho: se a coluna "Vagas" for tratada
 * como texto, "10" vem antes de "8"; se a busca não ignorar acento, "direito"
 * não acha "Direito". Os testes cobrem as duas armadilhas e a escolha de
 * facetas (cidade com 2 valores vira filtro; área com 39 não).
 */
const COLUNAS = ["Localização", "Área de competência", "Vagas"];
const LINHAS = [
  ["Ituiutaba", "Direito", "8"],
  ["Ituiutaba", "Direito - OAB ativo", "6"],
  ["Ituiutaba", "Psicologia - CRP ativo", "6"],
  ["Ituiutaba", "Matemática", "5"],
  ["Ituiutaba", "Física", "2"],
  ["Ituiutaba", "Química", "1"],
  ["Ituiutaba", "Pedagogia", "1"],
  ["Ituiutaba", "Ciências Sociais / Geografia", "1"],
  ["Ituiutaba", "Letras", "1"],
  ["Ituiutaba", "Letras Libras", "1"],
  ["Diamantina", "Direito", "8"],
  ["Diamantina", "Direito - OAB ativo", "2"],
];

describe("montarTabela", () => {
  it("reconhece a coluna de vagas como numérica e soma pelo número", () => {
    const t = montarTabela(COLUNAS, LINHAS);
    expect(t.colunas[2].numerica).toBe(true);
    expect(t.campoVagas).toBe("c2");
    expect(t.linhas[0].c2).toBe(8);

    const ordenado = ordenarLinhas(t.linhas, t.colunas[2], "desc");
    expect(ordenado[0].c2).toBe(8);
    expect(ordenado.at(-1)?.c2).toBe(1);
  });

  it("só transforma em select a coluna com 2 a 8 valores únicos", () => {
    const t = montarTabela(COLUNAS, LINHAS);
    expect(t.colunas[0].filtro).toBe(true); // Localização: 2 valores
    expect(t.colunas[1].filtro).toBe(false); // Área: 10 valores
    expect(t.colunas[2].filtro).toBe(false); // Vagas é numérica
  });

  it("busca sem acento e sem caixa acha Direito e Geografia", () => {
    const t = montarTabela(COLUNAS, LINHAS);
    const direito = filtrarLinhas(t.linhas, {}, t.camposBusca, "direito");
    expect(direito).toHaveLength(4);

    const geografia = filtrarLinhas(t.linhas, {}, t.camposBusca, "geografia");
    expect(geografia).toHaveLength(1);
  });

  it("filtro de categoria isola a cidade e a soma de vagas acompanha", () => {
    const t = montarTabela(COLUNAS, LINHAS);
    const diamantina = filtrarLinhas(t.linhas, { c0: "Diamantina" }, t.camposBusca, "");
    expect(diamantina).toHaveLength(2);
    const soma = diamantina.reduce((s, l) => s + Number(l.c2 ?? 0), 0);
    expect(soma).toBe(10);
  });

  it("converte separador de milhar antes de ordenar", () => {
    const t = montarTabela(["Item", "Valor"], [["A", "1.234"], ["B", "999"]]);
    expect(t.linhas[0].c1).toBe(1234);
    const ordenado = ordenarLinhas(t.linhas, t.colunas[1], "desc");
    expect(ordenado[0].c1).toBe(1234);
  });
});
