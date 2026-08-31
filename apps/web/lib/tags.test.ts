import { describe, expect, test } from "vitest";
import { extrairTags, extrairTagsDeCampos, type RegraTag } from "./tags";

const REGRAS_TESTE: RegraTag[] = [
  { tag: "agua", termos: ["agua", "abastecimento", "captacao"] },
  { tag: "mineração", termos: ["mineracao", "minério", "mina"] },
  { tag: "energia", termos: ["energia", "hidreletrica", "hidroeletrica", "hidro eletrica", "termoeletrica"] },
];

describe("extrairTags", () => {
  test("retorna tags que casam por palavra inteira", () => {
    expect(extrairTags("Usina hidrelétrica de captacao de agua", REGRAS_TESTE)).toEqual([
      "agua",
      "energia",
    ]);
  });

  test("não casa substring acidental", () => {
    expect(extrairTags("aguapés e assolar", REGRAS_TESTE)).toEqual([]);
  });

  test("ignora acentos e hífens", () => {
    // "hidro-elétrica" normaliza para "hidro eletrica"; a regra precisa
    // declarar o sinônimo com espaço para casar.
    expect(extrairTags("hidro-elétrica e mineração", REGRAS_TESTE)).toEqual(["mineração", "energia"]);
    expect(extrairTags("captação-de-água", REGRAS_TESTE)).toEqual(["agua"]);
  });

  test("texto vazio devolve array vazio", () => {
    expect(extrairTags("", REGRAS_TESTE)).toEqual([]);
  });

  test("ordem das regras define ordem das tags", () => {
    const regras: RegraTag[] = [
      { tag: "b", termos: ["x"] },
      { tag: "a", termos: ["x"] },
    ];
    expect(extrairTags("x", regras)).toEqual(["b", "a"]);
  });
});

describe("extrairTagsDeCampos", () => {
  test("concatena campos e extrai tags", () => {
    expect(extrairTagsDeCampos(["Mina", null, "captacao de agua"], REGRAS_TESTE)).toEqual([
      "agua",
      "mineração",
    ]);
  });
});
