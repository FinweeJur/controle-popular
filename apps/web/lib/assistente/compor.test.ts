import { describe, it, expect } from "vitest";
import { compor, interpretarComposicao } from "./compor";
import type { DocumentoIndexado, IndiceBusca } from "@/lib/busca/indice";

/**
 * Índice de teste sintético, no mesmo molde de `indice.test.ts`: documentos
 * de cidade com `m` (slug) e `a` (temas). Nada aqui depende do índice real
 * de build (que não está no git — só o `home-pc` publica) nem do Postgres:
 * a composição tem de ser agnóstica a dados, e estes casos fixam isso.
 *
 * Acervo:
 *   betim   — urbanismo, urbanismo, saude, sem tema   (4)
 *   bh      — urbanismo, lazer, lazer, sem tema       (4)
 *   aracuai — terras                                  (1)
 */
let proximoId = 1;
function doc(m: string, temas: string[]): DocumentoIndexado {
  const d: DocumentoIndexado = {
    i: proximoId++,
    t: `Documento ${proximoId - 1}`,
    e: "Ementa sintetica",
    h: `/${m}/prefeitura/legislacao`,
    f: "cidades",
    m,
    a: temas.length > 0 ? temas : undefined,
  };
  return d;
}

function indiceComDocs(docs: DocumentoIndexado[]): IndiceBusca {
  return { lexemas: [], ocorrencias: [], formas: {}, docs };
}

const INDICE = indiceComDocs([
  doc("betim", ["urbanismo"]),
  doc("betim", ["urbanismo"]),
  doc("betim", ["saude"]),
  doc("betim", []),
  doc("bh", ["urbanismo"]),
  doc("bh", ["lazer"]),
  doc("bh", ["lazer"]),
  doc("bh", []),
  doc("aracuai", ["terras"]),
]);

describe("interpretarComposicao — comparar", () => {
  it("reconhece 'compare' com duas cidades", () => {
    expect(interpretarComposicao("compare betim e bh")).toEqual({
      tipo: "comparar",
      cidades: ["betim", "bh"],
    });
  });

  it("casa nome por extenso e apelido", () => {
    expect(interpretarComposicao("compare Betim e Belo Horizonte")).toEqual({
      tipo: "comparar",
      cidades: ["betim", "bh"],
    });
  });

  it("casa 'vs' como separador", () => {
    expect(interpretarComposicao("betim vs bh")).toEqual({
      tipo: "comparar",
      cidades: ["betim", "bh"],
    });
  });

  it("casa a frase 'qual tem mais'", () => {
    expect(interpretarComposicao("qual tem mais documentos betim ou bh")).toEqual({
      tipo: "comparar",
      cidades: ["betim", "bh"],
    });
  });

  it("a ordem das cidades segue a da frase", () => {
    expect(interpretarComposicao("compare bh com betim")).toEqual({
      tipo: "comparar",
      cidades: ["bh", "betim"],
    });
  });

  it("duas menções da mesma cidade cala", () => {
    expect(interpretarComposicao("compare betim com betim")).toBeNull();
  });
});

describe("interpretarComposicao — cidade não atendida", () => {
  it("'compare betim e contagem' diz que Contagem não é atendida", () => {
    expect(interpretarComposicao("compare betim e contagem")).toEqual({
      tipo: "cidadeNaoAtendida",
      nome: "contagem",
      cidade: "betim",
    });
  });

  it("'compare uberlandia e contagem' aponta a primeira, sem cidade atendida", () => {
    expect(interpretarComposicao("compare uberlandia e contagem")).toEqual({
      tipo: "cidadeNaoAtendida",
      nome: "uberlandia",
      cidade: null,
    });
  });

  it("assunto conhecido não vira cidade não atendida", () => {
    expect(interpretarComposicao("compare saude em betim")).toBeNull();
  });
});

describe("interpretarComposicao — lacuna", () => {
  it("reconhece 'o que falta' com uma cidade", () => {
    expect(interpretarComposicao("o que falta em betim")).toEqual({
      tipo: "lacuna",
      cidade: "betim",
    });
  });

  it("'faltam' sozinho também casa", () => {
    expect(interpretarComposicao("faltam documentos de saude em betim")).toEqual({
      tipo: "lacuna",
      cidade: "betim",
    });
  });

  it("'falta de agua em betim' cala — é pergunta de conteúdo", () => {
    expect(interpretarComposicao("falta de agua em betim")).toBeNull();
  });

  it("'o que falta' sem cidade cala", () => {
    expect(interpretarComposicao("o que falta em mulheres aqui")).toBeNull();
  });

  it("lacuna com duas cidades cala — ambíguo", () => {
    expect(interpretarComposicao("o que falta em betim e bh")).toBeNull();
  });
});

describe("interpretarComposicao — sem sinal", () => {
  it("navegação comum segue o caminho dos degraus 0/1", () => {
    expect(interpretarComposicao("saude em bh")).toBeNull();
    expect(interpretarComposicao("contratos da prefeitura de betim")).toBeNull();
    expect(interpretarComposicao("")).toBeNull();
  });
});

describe("compor — comparacao", () => {
  const resposta = compor({ tipo: "comparar", cidades: ["betim", "bh"] }, INDICE);

  it("conta documentos por cidade no índice", () => {
    expect(resposta).toMatchObject({
      tipo: "comparacao",
      a: { slug: "betim", nome: "Betim", total: 4 },
      b: { slug: "bh", nome: "Belo Horizonte", total: 4 },
    });
  });

  it("ordena temas pela maior diferença, empate em ordem de inserção", () => {
    if (resposta.tipo !== "comparacao") throw new Error("resposta inesperada");
    expect(resposta.linhas.map((l) => l.tema)).toEqual(["lazer", "urbanismo", "saude"]);
    expect(resposta.linhas[0]).toEqual({ tema: "lazer", a: 0, b: 2 });
    expect(resposta.linhas[1]).toEqual({ tema: "urbanismo", a: 2, b: 1 });
    expect(resposta.linhas[2]).toEqual({ tema: "saude", a: 1, b: 0 });
  });

  it("documentos sem tema contam no total, não nas linhas", () => {
    if (resposta.tipo !== "comparacao") throw new Error("resposta inesperada");
    const semTema = resposta.linhas.find((l) => l.tema === "");
    expect(semTema).toBeUndefined();
    expect(resposta.a.total).toBe(4);
  });
});

describe("compor — lacuna", () => {
  it("lista temas com documento em outra cidade e zero na alvo", () => {
    const resposta = compor({ tipo: "lacuna", cidade: "betim" }, INDICE);
    expect(resposta).toMatchObject({ tipo: "lacuna", cidade: { slug: "betim", nome: "Betim" } });
    if (resposta.tipo !== "lacuna") throw new Error("resposta inesperada");
    expect(resposta.faltando.map((f) => f.tema)).toEqual(["lazer", "terras"]);
    expect(resposta.faltando[0].exemplo.slug).toBe("bh");
    expect(resposta.faltando[1].exemplo.slug).toBe("aracuai");
  });

  it("tema já presente na alvo não é lacuna", () => {
    const resposta = compor({ tipo: "lacuna", cidade: "bh" }, INDICE);
    if (resposta.tipo !== "lacuna") throw new Error("resposta inesperada");
    const temas = resposta.faltando.map((f) => f.tema);
    expect(temas).not.toContain("urbanismo");
    expect(temas).not.toContain("lazer");
  });

  it("cidade sem nenhum documento na alvo lista o acervo das outras", () => {
    const vazia = indiceComDocs([doc("betim", ["urbanismo"]), doc("bh", ["lazer"])]);
    const resposta = compor({ tipo: "lacuna", cidade: "itinga" }, vazia);
    if (resposta.tipo !== "lacuna") throw new Error("resposta inesperada");
    expect(resposta.faltando.map((f) => f.tema)).toEqual(["urbanismo", "lazer"]);
  });
});

describe("compor — cidade não atendida", () => {
  it("mantém a cidade atendida que foi mencionada junto", () => {
    expect(
      compor({ tipo: "cidadeNaoAtendida", nome: "contagem", cidade: "betim" }, INDICE)
    ).toEqual({ tipo: "cidadeNaoAtendida", nome: "contagem", cidade: { slug: "betim", nome: "Betim" } });
  });

  it("sem cidade atendida mencionada, devolve cidade nula", () => {
    expect(
      compor({ tipo: "cidadeNaoAtendida", nome: "uberlandia", cidade: null }, INDICE)
    ).toEqual({ tipo: "cidadeNaoAtendida", nome: "uberlandia", cidade: null });
  });
});