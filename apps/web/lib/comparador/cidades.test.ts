import { describe, expect, test } from "vitest";
import {
  compararCidades,
  type CidadeComparavel,
  escolasPor10Mil,
  formatarIndicador,
  INDICADORES_COMPARACAO,
  repassesPerCapita,
  resumoTexto,
  saudePor10Mil,
} from "./cidades";

const capital: CidadeComparavel = {
  id: "3106200",
  nome: "Belo Horizonte",
  uf: "MG",
  regiao: "Sudeste",
  tipo: "capital",
  populacao: 2_000_000,
  pibBi: 100,
  pibPerCapita: 50_000,
  repassesMi: 3_000,
  saude: 2_000,
  escolas: 1_000,
};

const polo: CidadeComparavel = {
  id: "3106705",
  nome: "Betim",
  uf: "MG",
  regiao: "Sudeste",
  tipo: "polo-interior",
  populacao: 400_000,
  pibBi: 30,
  pibPerCapita: 75_000,
  repassesMi: 600,
  saude: 300,
  escolas: 200,
};

describe("per capita", () => {
  test("repasse federal por habitante converte milhões em reais", () => {
    // 3.000 milhões = R$ 3 bi; sobre 2 milhões de pessoas = R$ 1.500.
    expect(repassesPerCapita(capital)).toBe(1500);
  });

  test("densidades por 10 mil habitantes", () => {
    expect(saudePor10Mil(capital)).toBe(10);
    expect(escolasPor10Mil(capital)).toBe(5);
  });

  test("população zero devolve null em vez de infinito", () => {
    const semPop = { ...capital, populacao: 0 };
    expect(repassesPerCapita(semPop)).toBeNull();
    expect(saudePor10Mil(semPop)).toBeNull();
    expect(escolasPor10Mil(semPop)).toBeNull();
  });
});

describe("formatarIndicador", () => {
  test("formata inteiro, decimal e moeda no padrão brasileiro", () => {
    expect(formatarIndicador(2000000, "inteiro")).toBe("2.000.000");
    expect(formatarIndicador(105.8, "decimal")).toBe("105,8");
    expect(formatarIndicador(1234.5, "moeda").replace(/\u00A0/g, " ")).toBe("R$ 1.234,50");
  });

  test("valor nulo vira travessão", () => {
    expect(formatarIndicador(null, "moeda")).toBe("—");
    expect(formatarIndicador(Number.NaN, "inteiro")).toBe("—");
  });
});

describe("compararCidades", () => {
  const linhas = compararCidades(capital, polo);

  test("devolve uma linha por indicador", () => {
    expect(linhas).toHaveLength(INDICADORES_COMPARACAO.length);
  });

  test("marca o lado maior quando os valores diferem", () => {
    const populacao = linhas.find((l) => l.id === "populacao")!;
    expect(populacao.maior).toBe("A");
    const pibPerCapita = linhas.find((l) => l.id === "pib-per-capita")!;
    expect(pibPerCapita.maior).toBe("B"); // Betim tem PIB/hab maior
  });

  test("calcula a diferença absoluta formatada", () => {
    const populacao = linhas.find((l) => l.id === "populacao")!;
    expect(populacao.diferenca).toBe("1.600.000");
  });
});

describe("resumoTexto", () => {
  test("traz nome, números e fonte, sem campo vazio", () => {
    const texto = resumoTexto(capital, "07/09/2026");
    expect(texto).toContain("Belo Horizonte/MG");
    expect(texto).toContain("População");
    expect(texto).toContain("07/09/2026");
    expect(texto).toContain("controlepopular.com.br");
    expect(texto).not.toContain("undefined");
    expect(texto).not.toContain("null");
  });
});
