/**
 * @file Testes da faceta por setor de `/empresas`.
 *
 * Cobre o que o painel promete ao leitor: o N de cada botão soma o acervo,
 * o denominador é o total real, slug inválido não derruba a página e o href
 * de "Todos" não cria URL duplicada.
 */

import { describe, expect, it } from "vitest";
import {
  SETOR_TODOS,
  contarPorSetor,
  hrefSetor,
  setorDe,
  type EntidadeComSetor,
} from "./facetas-setor";

function entidade(setor: string, setorRotulo: string): EntidadeComSetor {
  return { setor, setorRotulo };
}

const ACERVO: EntidadeComSetor[] = [
  entidade("mineracao", "Mineração & Metalurgia"),
  entidade("mineracao", "Mineração & Metalurgia"),
  entidade("mineracao", "Mineração & Metalurgia"),
  entidade("energia", "Energia & Petróleo"),
  entidade("energia", "Energia & Petróleo"),
  entidade("tecnologia", "Tecnologia & Inovação"),
  entidade("agua_saneamento", "Água & Saneamento Básico"),
];

describe("contarPorSetor", () => {
  it("conta o acervo inteiro e não repete setor", () => {
    const facetas = contarPorSetor(ACERVO);
    expect(facetas).toHaveLength(4);
    expect(facetas.reduce((soma, faceta) => soma + faceta.n, 0)).toBe(ACERVO.length);
  });

  it("ordena por N decrescente e desempata pelo rótulo", () => {
    expect(contarPorSetor(ACERVO).map((faceta) => faceta.slug)).toEqual([
      "mineracao",
      "energia",
      "agua_saneamento",
      "tecnologia",
    ]);
  });

  it("usa o rótulo do dado e cai no slug quando ele falta", () => {
    const facetas = contarPorSetor([entidade("energia", "Energia & Petróleo"), entidade("outros", "")]);
    expect(facetas.find((faceta) => faceta.slug === "energia")?.rotulo).toBe("Energia & Petróleo");
    expect(facetas.find((faceta) => faceta.slug === "outros")?.rotulo).toBe("outros");
  });

  it("ignora entidade sem setor em vez de criar botão vazio", () => {
    const facetas = contarPorSetor([entidade("", ""), entidade("energia", "Energia & Petróleo")]);
    expect(facetas.map((faceta) => faceta.slug)).toEqual(["energia"]);
  });
});

describe("setorDe", () => {
  const facetas = contarPorSetor(ACERVO);

  it("aceita slug existente", () => {
    expect(setorDe("energia", facetas)).toBe("energia");
  });

  it("aceita array e pega o primeiro valor", () => {
    expect(setorDe(["mineracao", "energia"], facetas)).toBe("mineracao");
  });

  it("devolve Todos para ausente, vazio ou desconhecido", () => {
    expect(setorDe(undefined, facetas)).toBe(SETOR_TODOS);
    expect(setorDe("", facetas)).toBe(SETOR_TODOS);
    expect(setorDe("setor-que-nao-existe", facetas)).toBe(SETOR_TODOS);
  });
});

describe("hrefSetor", () => {
  it("Todos sem query", () => {
    expect(hrefSetor()).toBe("/empresas");
    expect(hrefSetor(SETOR_TODOS)).toBe("/empresas");
  });

  it("recorte com query codificada", () => {
    expect(hrefSetor("agua_saneamento")).toBe("/empresas?setor=agua_saneamento");
  });
});
