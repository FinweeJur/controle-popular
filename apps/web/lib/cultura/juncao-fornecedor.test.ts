import { describe, expect, test } from "vitest";
import {
  AFIRMACAO_DA_JUNCAO,
  chavesParaConsulta,
  cnpjValidoPorDv,
  estatisticasDeChave,
  juntarPorCnpj,
  normalizarCnpjChave,
  porMunicipioDoIncentivador,
  RESSALVA_TOTAL_DOADO,
  SEM_BANCO,
  SEM_TRILHA_DE_DOACAO,
  type FornecedorChaveavel,
  type IncentivadorChaveavel,
} from "./juncao-fornecedor";

function inc(over: Partial<IncentivadorChaveavel> = {}): IncentivadorChaveavel {
  return {
    nome: "EMPRESA X",
    municipio: "Betim",
    UF: "MG",
    total_doado: 1000,
    tipo_pessoa: "juridica",
    cgccpf: "00000000000191",
    ...over,
  };
}

function forn(over: Partial<FornecedorChaveavel> = {}): FornecedorChaveavel {
  return { cnpj: "00000000000191", razao_social: "EMPRESA X LTDA", ...over };
}

describe("normalizarCnpjChave — os três casos do lado do contrato", () => {
  test("com pontuação, como o PNCP grava", () => {
    expect(normalizarCnpjChave("00.000.000/0001-91")).toBe("00000000000191");
  });

  test("nulo e indefinido devolvem null, não string vazia", () => {
    expect(normalizarCnpjChave(null)).toBeNull();
    expect(normalizarCnpjChave(undefined)).toBeNull();
  });

  test("vazio e só ruído devolvem null — é a linha que só tem fornecedor_nome", () => {
    expect(normalizarCnpjChave("")).toBeNull();
    expect(normalizarCnpjChave("   ")).toBeNull();
    expect(normalizarCnpjChave("NAO INFORMADO")).toBeNull();
  });

  test("a máscara de pessoa física NÃO vira chave de 6 dígitos", () => {
    // Devolver "008317" aqui casaria com qualquer coisa.
    expect(normalizarCnpjChave("***008317**")).toBeNull();
  });

  test("CPF de 11 dígitos fica de fora: a junção é entre empresas", () => {
    expect(normalizarCnpjChave("12345678909")).toBeNull();
  });

  test("preserva zero à esquerda — Number() faria a junção falhar calada", () => {
    expect(normalizarCnpjChave("00000000108634")).toBe("00000000108634");
    // O modo de falha real: alguém passa o valor já convertido para número.
    expect(normalizarCnpjChave(Number("00000000108634"))).toBeNull();
  });
});

describe("cnpjValidoPorDv", () => {
  test("aceita CNPJ real", () => {
    expect(cnpjValidoPorDv("00000000000191")).toBe(true);
  });

  test("recusa dígito verificador errado", () => {
    expect(cnpjValidoPorDv("00000000000192")).toBe(false);
    // O único reprovado do acervo de MG, medido em 15/08/2026.
    expect(cnpjValidoPorDv("17184201000150")).toBe(false);
  });

  test("recusa repetição e comprimento errado", () => {
    expect(cnpjValidoPorDv("00000000000000")).toBe(false);
    expect(cnpjValidoPorDv("1234")).toBe(false);
  });
});

describe("juntarPorCnpj", () => {
  test("contrato de vazio: qualquer lado vazio devolve lista vazia", () => {
    expect(juntarPorCnpj([], [forn()])).toEqual([]);
    expect(juntarPorCnpj([inc()], [])).toEqual([]);
    expect(juntarPorCnpj([], [])).toEqual([]);
  });

  test("junta pela chave normalizada, mesmo com pontuação do outro lado", () => {
    const par = juntarPorCnpj([inc()], [forn({ cnpj: "00.000.000/0001-91" })]);
    expect(par).toHaveLength(1);
    expect(par[0].cnpj).toBe("00000000000191");
    expect(par[0].fornecedor.razao_social).toBe("EMPRESA X LTDA");
  });

  test("fornecedor sem CNPJ nunca casa — nem por nome idêntico", () => {
    const semCnpj = juntarPorCnpj(
      [inc({ nome: "EMPRESA X LTDA" })],
      [{ cnpj: null, razao_social: "EMPRESA X LTDA" }]
    );
    expect(semCnpj).toEqual([]);
  });

  test("incentivador mascarado não casa com fornecedor nenhum", () => {
    expect(juntarPorCnpj([inc({ cgccpf: "***008317**" })], [forn({ cnpj: "008317" })])).toEqual([]);
  });

  test("cada CNPJ sai uma vez só, mesmo com fornecedor repetido", () => {
    const par = juntarPorCnpj([inc()], [forn(), forn({ cnpj: "00.000.000/0001-91" })]);
    expect(par).toHaveLength(1);
  });

  test("CNPJ que reprova no DV entra na junção, marcado — não é descartado", () => {
    const par = juntarPorCnpj(
      [inc({ cgccpf: "17184201000150" })],
      [forn({ cnpj: "17184201000150" })]
    );
    expect(par).toHaveLength(1);
    expect(par[0].cnpj_valido_por_dv).toBe(false);
  });

  test("ordena por nome do incentivador, não por valor doado", () => {
    const pares = juntarPorCnpj(
      [
        inc({ nome: "ZEBRA SA", cgccpf: "00000000000191", total_doado: 9_000_000 }),
        inc({ nome: "ABELHA SA", cgccpf: "11222333000181", total_doado: 1 }),
      ],
      [forn(), forn({ cnpj: "11222333000181" })]
    );
    expect(pares.map((p) => p.incentivador.nome)).toEqual(["ABELHA SA", "ZEBRA SA"]);
  });
});

describe("as regras de texto — elas são o produto, não enfeite", () => {
  test("a ressalva do valor viaja COLADA ao número, em toda linha", () => {
    const pares = juntarPorCnpj([inc()], [forn()]);
    expect(pares[0].incentivador.ressalva_total_doado).toBe(RESSALVA_TOTAL_DOADO);
  });

  test("o campo do valor diz no próprio nome que é do Brasil inteiro", () => {
    const pares = juntarPorCnpj([inc()], [forn()]);
    expect(Object.keys(pares[0].incentivador)).toContain("total_doado_brasil");
    expect(Object.keys(pares[0].incentivador)).not.toContain("total_doado");
  });

  test("a afirmação da junção nega troca de favor e nega achado, com todas as letras", () => {
    expect(AFIRMACAO_DA_JUNCAO).toMatch(/aparece nos dois acervos/i);
    expect(AFIRMACAO_DA_JUNCAO).toMatch(/não indica troca de favor/i);
    expect(AFIRMACAO_DA_JUNCAO).toMatch(/ponto de partida.*não achado/i);
  });

  test("a ressalva do valor diz Brasil e nega relação com o contrato", () => {
    expect(RESSALVA_TOTAL_DOADO).toMatch(/BRASIL inteiro/);
    expect(RESSALVA_TOTAL_DOADO).toMatch(/não é o valor doado nesta cidade/i);
    expect(RESSALVA_TOTAL_DOADO).toMatch(/não tem relação com o contrato/i);
  });

  test("não se promete trilha de doação, porque ela não existe", () => {
    expect(SEM_TRILHA_DE_DOACAO).toMatch(/não é possível dizer quais projetos/i);
  });

  test("sem banco a tela diz que NÃO FOI VERIFICADO, e não que não há nada", () => {
    expect(SEM_BANCO).toMatch(/não pôde ser feito/i);
    expect(SEM_BANCO).toMatch(/não significa que nenhuma empresa/i);
  });
});

describe("chavesParaConsulta", () => {
  test("deduplica, ordena e descarta o que não é CNPJ", () => {
    expect(
      chavesParaConsulta([
        inc({ cgccpf: "11222333000181" }),
        inc({ cgccpf: "00000000000191" }),
        inc({ cgccpf: "00.000.000/0001-91" }),
        inc({ cgccpf: "***008317**" }),
        inc({ cgccpf: "***REDIGIDO***" }),
      ])
    ).toEqual(["00000000000191", "11222333000181"]);
  });

  test("acervo sem nenhuma chave devolve lista vazia, não lança", () => {
    expect(chavesParaConsulta([inc({ cgccpf: "***008317**" })])).toEqual([]);
  });
});

describe("estatisticasDeChave", () => {
  test("separa CNPJ, máscara e documento redigido", () => {
    const e = estatisticasDeChave([
      inc({ cgccpf: "00000000000191" }),
      inc({ cgccpf: "00000000000191" }),
      inc({ cgccpf: "17184201000150" }),
      inc({ cgccpf: "***008317**", tipo_pessoa: "fisica" }),
      inc({ cgccpf: "***REDIGIDO***", tipo_pessoa: "fisica" }),
    ]);
    expect(e.registros).toBe(5);
    expect(e.comCnpj).toBe(3);
    expect(e.cnpjsDistintos).toBe(2);
    expect(e.cnpjsRepetidos).toBe(1);
    expect(e.dvValido).toBe(1);
    expect(e.dvInvalido).toBe(1);
    expect(e.mascarados).toBe(1);
    expect(e.redigidos).toBe(1);
  });

  test("conta o rótulo 'juridica' que vem sem CNPJ — tipo_pessoa não é filtro", () => {
    const e = estatisticasDeChave([inc({ cgccpf: "***437406**", tipo_pessoa: "juridica" })]);
    expect(e.rotuloJuridicaSemCnpj).toBe(1);
    expect(e.comCnpj).toBe(0);
  });
});

describe("porMunicipioDoIncentivador", () => {
  test("conta empresas distintas por município, do maior para o menor", () => {
    expect(
      porMunicipioDoIncentivador([
        inc({ municipio: "Belo Horizonte", cgccpf: "00000000000191" }),
        inc({ municipio: "Belo Horizonte", cgccpf: "11222333000181" }),
        inc({ municipio: "Betim", cgccpf: "17184201000150" }),
        inc({ municipio: "Betim", cgccpf: "***008317**" }),
      ])
    ).toEqual([
      { municipio: "Belo Horizonte", empresas: 2 },
      { municipio: "Betim", empresas: 1 },
    ]);
  });

  test("município em branco vira rótulo explícito, não string vazia", () => {
    expect(porMunicipioDoIncentivador([inc({ municipio: "  " })])).toEqual([
      { municipio: "(não informado)", empresas: 1 },
    ]);
  });
});
