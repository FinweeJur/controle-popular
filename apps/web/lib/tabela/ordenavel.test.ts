import { describe, it, expect } from "vitest";
import {
  compararLinhas,
  chaveOrdenacao,
  normalizar,
  opcoesDeFiltro,
  textoCsv,
  type ColunaOrdenavel,
} from "./ordenavel";

/**
 * Teste-guarda da lógica pura da tabela ordenável — o que o leitor usa para
 * ordenar e filtrar os agregados dos gastos de campanha (AGENTS.md § 8,
 * qualidade 3). Aqui a régua dos ausentes e a combinação de campos são
 * verificadas sem montar React.
 */
describe("lib/tabela/ordenavel", () => {
  const moeda: ColunaOrdenavel = { campo: "valor", rotulo: "Valor", numerica: true, formato: "moeda" };
  const texto: ColunaOrdenavel = { campo: "nome", rotulo: "Nome" };
  const combo: ColunaOrdenavel = { campo: "cargo", rotulo: "Cargo/UF", combinar: ["cargo", "uf"], separador: "/" };

  it("normaliza acento e caixa", () => {
    expect(normalizar("  ÁéÇ ")).toBe("aec");
  });

  it("ordena texto sem acento e sem caixa (pt-BR)", () => {
    const a = { nome: "Água" };
    const b = { nome: "arbusto" };
    expect(compararLinhas(a, b, texto, "asc")).toBeLessThan(0);
    expect(compararLinhas(a, b, texto, "desc")).toBeGreaterThan(0);
  });

  it("no número, o presente vem antes do ausente nas duas direções", () => {
    const comValor = { valor: 10 };
    const semValor = { valor: null };
    expect(compararLinhas(comValor, semValor, moeda, "asc")).toBeLessThan(0);
    expect(compararLinhas(comValor, semValor, moeda, "desc")).toBeLessThan(0);
  });

  it("combinar junta os campos com o separador", () => {
    expect(chaveOrdenacao({ cargo: "Senador", uf: "MG" }, combo)).toBe("Senador/MG");
  });

  it("textoCsv devolve número cru na moeda e string vazia no nulo", () => {
    expect(textoCsv({ valor: 1234.5 }, moeda)).toBe(1234.5);
    expect(textoCsv({ valor: null }, moeda)).toBe("");
    expect(textoCsv({ cargo: "Senador", uf: "MG" }, combo)).toBe("Senador/MG");
  });

  it("opções de filtro são únicas e em ordem pt-BR", () => {
    const linhas = [{ g: "meta" }, { g: "google" }, { g: "meta" }, { g: "" }];
    expect(opcoesDeFiltro(linhas, { campo: "g", rotulo: "Grupo", filtro: true })).toEqual([
      "google",
      "meta",
    ]);
  });
});
