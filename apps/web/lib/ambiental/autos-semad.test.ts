import { describe, expect, test } from "vitest";
import {
  percentual,
  resumoAutosSemad,
  somarContagens,
  TOTAL_AUTOS_SEMAD,
} from "./autos-semad";

/**
 * Guarda do agregado do Sisema.
 *
 * O risco desta página não é código: é número que não fecha. Se o coletor
 * mudar a forma do arquivo, os totais por órgão, situação e ano têm de somar
 * exatamente o total declarado — senão a tela publica contagem inventada.
 */
describe("autos de infração do Sisema", () => {
  const resumo = resumoAutosSemad(15);

  test("o total declarado é a soma de todos os recortes", () => {
    expect(somarContagens(resumo.orgaos)).toBe(resumo.total);
    expect(somarContagens(resumo.situacoes)).toBe(resumo.total);

    const somaAnos = resumo.anos.reduce((soma, item) => soma + item.total, 0);
    expect(somaAnos + resumo.semData + resumo.foraDeFaixa).toBe(resumo.total);
  });

  test("o total bate com a constante usada na home", () => {
    expect(resumo.total).toBe(TOTAL_AUTOS_SEMAD);
    expect(resumo.total).toBeGreaterThan(500_000);
  });

  test("a série por ano é cronológica e só tem ano de quatro dígitos", () => {
    const anos = resumo.anos.map((item) => item.ano);
    expect(anos).toEqual([...anos].sort((a, b) => a - b));
    for (const ano of anos) {
      expect(ano).toBeGreaterThanOrEqual(1990);
      expect(ano).toBeLessThan(2100);
    }
  });

  test("o ranking de municípios respeita o limite e a ordem decrescente", () => {
    expect(resumo.topMunicipios.length).toBe(15);
    const totais = resumo.topMunicipios.map((m) => m.total);
    expect(totais).toEqual([...totais].sort((a, b) => b - a));
    for (const municipio of resumo.topMunicipios) {
      expect(somarContagens(municipio.orgaos)).toBe(municipio.total);
    }
  });

  test("nenhum nome de município carrega padrão de CPF", () => {
    const comCpf = resumo.topMunicipios.filter((m) => /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/.test(m.municipio));
    expect(comCpf).toEqual([]);
  });

  test("percentual não divide por zero", () => {
    expect(percentual(1, 0)).toBe(0);
    expect(percentual(1, 3)).toBe(33.3);
  });
});
