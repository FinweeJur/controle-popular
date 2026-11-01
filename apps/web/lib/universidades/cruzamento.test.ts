/**
 * @file apps/web/lib/universidades/cruzamento.test.ts
 * @description Testes dos cruzamentos tema × estado, local e data.
 *
 * O que este teste protege:
 * - contagem por tema e por UF não perde nem duplica registro;
 * - registro sem tema continua aparecendo em local e data;
 * - projeto e grupo são contados em colunas separadas;
 * - ordem estável (UF e ano), para a tela não dançar entre renders.
 */

import { describe, expect, it } from "vitest";
import {
  cruzarTemasPorUf,
  proximoFiltro,
  resumirPorData,
  resumirPorLocal,
  type RegistroCruzamento,
} from "./cruzamento";

const nome = (id: string) => (id === "saude" ? "Saúde" : "Educação");

const REGISTROS: RegistroCruzamento[] = [
  {
    tipo: "pesquisa",
    instituicao: "UFVJM",
    uf: "MG",
    temas: ["saude", "educacao"],
    ano: "2026",
  },
  {
    tipo: "pesquisa",
    instituicao: "UFOP",
    uf: "MG",
    temas: ["educacao"],
    ano: "2026",
  },
  {
    tipo: "extensao",
    instituicao: "UFVJM",
    uf: "MG",
    temas: ["saude"],
    ano: "2024",
  },
  {
    tipo: "pesquisa",
    instituicao: "UFRGS",
    uf: "RS",
    temas: [],
    ano: "2026",
  },
];

describe("cruzarTemasPorUf", () => {
  it("conta cada tema em cada UF", () => {
    const linhas = cruzarTemasPorUf(REGISTROS, nome);
    const saude = linhas.find((l) => l.tema === "saude");
    expect(saude?.total).toBe(2);
    expect(saude?.porUf).toEqual([{ uf: "MG", total: 2 }]);
    const educacao = linhas.find((l) => l.tema === "educacao");
    expect(educacao?.total).toBe(2);
    expect(educacao?.porUf).toEqual([{ uf: "MG", total: 2 }]);
  });

  it("ignora registro sem tema", () => {
    const linhas = cruzarTemasPorUf(REGISTROS, nome);
    const soma = linhas.reduce((s, l) => s + l.total, 0);
    expect(soma).toBe(4);
    expect(linhas.flatMap((l) => l.porUf.map((c) => c.uf))).not.toContain("RS");
  });

  it("ordena pelo nome do tema", () => {
    const linhas = cruzarTemasPorUf(REGISTROS, nome);
    expect(linhas.map((l) => l.nome)).toEqual(["Educação", "Saúde"]);
  });
});

describe("resumirPorLocal", () => {
  it("separa grupos de projetos e lista instituições", () => {
    const linhas = resumirPorLocal(REGISTROS);
    const mg = linhas.find((l) => l.uf === "MG");
    expect(mg).toMatchObject({ grupos: 2, projetos: 1, total: 3 });
    expect(mg?.instituicoes).toEqual(["UFOP", "UFVJM"]);

    const rs = linhas.find((l) => l.uf === "RS");
    expect(rs).toMatchObject({ grupos: 1, projetos: 0, total: 1 });
  });

  it("sai em ordem alfabética de UF", () => {
    expect(resumirPorLocal(REGISTROS).map((l) => l.uf)).toEqual(["MG", "RS"]);
  });
});

describe("resumirPorData", () => {
  it("soma por ano e separa o tipo", () => {
    const linhas = resumirPorData(REGISTROS);
    expect(linhas).toEqual([
      { ano: "2026", grupos: 3, projetos: 0, total: 3 },
      { ano: "2024", grupos: 0, projetos: 1, total: 1 },
    ]);
  });

  it("descarta registro sem ano", () => {
    const linhas = resumirPorData([
      { tipo: "pesquisa", instituicao: "X", uf: "MG", temas: [], ano: null },
    ]);
    expect(linhas).toEqual([]);
  });
});

describe("proximoFiltro", () => {
  const vazio = { tema: "", uf: "", ano: "" };

  it("aplica tema e estado no mesmo clique", () => {
    expect(proximoFiltro(vazio, { tema: "saude", uf: "MG" })).toEqual({
      tema: "saude",
      uf: "MG",
      ano: "",
    });
  });

  it("repete o clique e limpa tema e estado", () => {
    const atual = { tema: "saude", uf: "MG", ano: "" };
    expect(proximoFiltro(atual, { tema: "saude", uf: "MG" })).toEqual(vazio);
  });

  it("tema sozinho vale para todos os estados", () => {
    const atual = { tema: "saude", uf: "MG", ano: "" };
    expect(proximoFiltro(atual, { tema: "educacao" })).toEqual({
      tema: "educacao",
      uf: "",
      ano: "",
    });
  });

  it("clicar de novo no mesmo tema desliga o tema", () => {
    const atual = { tema: "saude", uf: "", ano: "" };
    expect(proximoFiltro(atual, { tema: "saude" })).toEqual(vazio);
  });

  it("estado alterna sem perder o tema", () => {
    const atual = { tema: "saude", uf: "", ano: "" };
    expect(proximoFiltro(atual, { uf: "MG" })).toEqual({
      tema: "saude",
      uf: "MG",
      ano: "",
    });
    expect(proximoFiltro({ tema: "saude", uf: "MG", ano: "" }, { uf: "MG" })).toEqual({
      tema: "saude",
      uf: "",
      ano: "",
    });
  });

  it("ano alterna e preserva o resto", () => {
    const atual = { tema: "saude", uf: "MG", ano: "2026" };
    expect(proximoFiltro(atual, { ano: "2026" })).toEqual({
      tema: "saude",
      uf: "MG",
      ano: "",
    });
    expect(proximoFiltro(atual, { ano: "2024" })).toEqual({
      tema: "saude",
      uf: "MG",
      ano: "2024",
    });
  });
});
