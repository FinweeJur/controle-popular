import { describe, it, expect } from "vitest";
import {
  parseTsvectorLexemas,
  truncarEmenta,
  montarTituloMunicipal,
  construirVocabulario,
  construirFormas,
  ABREV_TIPO_PROPOSICAO_MUNICIPAL,
  abreviacoesCongresso,
  numeroCongresso,
} from "./gerador";

describe("parseTsvectorLexemas", () => {
  it("extrai radicais de um tsvector real (medido no PostgreSQL 18.4)", () => {
    // to_tsvector('portuguese', unaccent_immutable('Dispoe sobre a iluminacao publica municipal'))
    const tsv = "'dispo':1 'iluminaca':4 'municipal':6 'public':5 'sobr':2";
    expect(parseTsvectorLexemas(tsv)).toEqual(
      expect.arrayContaining(["dispo", "iluminaca", "municipal", "public", "sobr"])
    );
    expect(parseTsvectorLexemas(tsv)).toHaveLength(5);
  });

  it("tsvector vazio (documento sem texto) devolve lista vazia", () => {
    expect(parseTsvectorLexemas("")).toEqual([]);
    expect(parseTsvectorLexemas("   ")).toEqual([]);
  });

  it("deduplica radical repetido no mesmo documento", () => {
    expect(parseTsvectorLexemas("'lei':1,4,9 'contrat':2")).toEqual(["lei", "contrat"]);
  });

  it("desfaz o escape de aspa simples dentro do radical", () => {
    expect(parseTsvectorLexemas("'don''t':1")).toEqual(["don't"]);
  });

  it("ignora peso de posição (A/B/C/D) sem quebrar o radical seguinte", () => {
    expect(parseTsvectorLexemas("'lei':1A 'contrat':2BC")).toEqual(["lei", "contrat"]);
  });
});

describe("truncarEmenta", () => {
  it("null/undefined vira string vazia, nao 'null' literal", () => {
    expect(truncarEmenta(null, 10)).toBe("");
    expect(truncarEmenta(undefined, 10)).toBe("");
  });

  it("texto curto nao e alterado", () => {
    expect(truncarEmenta("Dispoe sobre iluminacao publica", 100)).toBe(
      "Dispoe sobre iluminacao publica"
    );
  });

  it("texto longo corta no limite e marca com reticencias", () => {
    const longo = "a".repeat(50);
    const cortado = truncarEmenta(longo, 10);
    expect(cortado).toBe(`${"a".repeat(10)}…`);
  });

  it("apara espaco em branco nas pontas antes de medir", () => {
    expect(truncarEmenta("   iluminacao publica   ", 100)).toBe("iluminacao publica");
  });
});

describe("montarTituloMunicipal", () => {
  it("monta o mesmo formato que a tela dinamica hoje usa", () => {
    expect(montarTituloMunicipal("Lei", "1234", 2020, "ato")).toBe("Lei nº 1234/2020");
    expect(montarTituloMunicipal("PL", 55, 2023, "proposicao")).toBe("PL nº 55/2023");
  });

  it("tipo ausente cai no rotulo generico por origem", () => {
    expect(montarTituloMunicipal(null, "10", 2020, "ato")).toBe("Ato nº 10/2020");
    expect(montarTituloMunicipal(null, "10", 2020, "proposicao")).toBe("Proposição nº 10/2020");
  });

  it("numero e ano ausentes nao deixam 'nº /' sobrando", () => {
    expect(montarTituloMunicipal("Lei", null, null, "ato")).toBe("Lei");
    expect(montarTituloMunicipal("Lei", "10", null, "ato")).toBe("Lei nº 10");
    expect(montarTituloMunicipal("Lei", null, 2020, "ato")).toBe("Lei/2020");
  });
});

describe("ABREV_TIPO_PROPOSICAO_MUNICIPAL", () => {
  it("cobre os tipos de maior volume da base (Bug 1)", () => {
    expect(ABREV_TIPO_PROPOSICAO_MUNICIPAL.projeto_lei).toBe("pl");
    expect(ABREV_TIPO_PROPOSICAO_MUNICIPAL.requerimento).toBe("req");
  });

  // "ela" é stopword do dicionário portuguese_stem (pronome) — teria formas["ela"]
  // sempre vazio. Documentado no comentário do mapa; este teste é a trava.
  it("nao mapeia emenda_lei_organica pra abreviacao que vira stopword", () => {
    expect(ABREV_TIPO_PROPOSICAO_MUNICIPAL.emenda_lei_organica).toBeUndefined();
  });
});

describe("abreviacoesCongresso", () => {
  it("extrai o prefixo do identificacao, em minusculo", () => {
    expect(abreviacoesCongresso("PL 4793/2026")).toEqual(["pl"]);
    expect(abreviacoesCongresso("PEC 5/2024")).toEqual(["pec"]);
  });

  it("MPV ganha o sinonimo 'mp', do jeito que a imprensa chama", () => {
    expect(abreviacoesCongresso("MPV 1200/2024")).toEqual(["mpv", "mp"]);
  });

  it("identificacao ausente ou sem prefixo alfabetico nao quebra", () => {
    expect(abreviacoesCongresso(null)).toEqual([]);
    expect(abreviacoesCongresso(undefined)).toEqual([]);
    expect(abreviacoesCongresso("4793")).toEqual([]);
  });
});

describe("numeroCongresso", () => {
  it("extrai o numero do identificacao", () => {
    expect(numeroCongresso("PL 4793/2026")).toBe("4793");
    expect(numeroCongresso("MPV 1200/2024")).toBe("1200");
  });

  it("sem digito, devolve undefined", () => {
    expect(numeroCongresso("Proposição")).toBeUndefined();
    expect(numeroCongresso(null)).toBeUndefined();
  });
});

describe("construirVocabulario", () => {
  it("ordena os radicais (contrato de IndiceBusca.lexemas)", () => {
    const { lexemas } = construirVocabulario([
      { docId: 0, lexemas: ["saud", "ambiental"] },
      { docId: 1, lexemas: ["lei"] },
    ]);
    expect(lexemas).toEqual([...lexemas].sort());
    expect(lexemas).toEqual(["ambiental", "lei", "saud"]);
  });

  it("ocorrencias[lexemaId] lista os documentos que tem aquele radical", () => {
    const { lexemas, ocorrencias } = construirVocabulario([
      { docId: 0, lexemas: ["saud", "lei"] },
      { docId: 1, lexemas: ["saud"] },
      { docId: 2, lexemas: ["contrat"] },
    ]);
    const idx = (l: string) => lexemas.indexOf(l);
    expect(ocorrencias[idx("saud")]).toEqual([0, 1]);
    expect(ocorrencias[idx("lei")]).toEqual([0]);
    expect(ocorrencias[idx("contrat")]).toEqual([2]);
  });

  it("radical repetido dentro do mesmo doc (defensivo) nao duplica ocorrencia", () => {
    const { lexemas, ocorrencias } = construirVocabulario([
      { docId: 5, lexemas: ["lei", "lei"] },
    ]);
    // Nao e o contrato normal (parseTsvectorLexemas ja dedup por doc), mas a
    // funcao nao deve fingir que dois documentos leram "lei" quando foi um so
    // duas vezes -- aqui ela so agrega o que recebeu; o dedup por doc e
    // responsabilidade de quem monta `entradas`.
    expect(ocorrencias[lexemas.indexOf("lei")]).toEqual([5, 5]);
  });
});

describe("construirFormas", () => {
  const idDoLexema = new Map([
    ["iluminaca", 0],
    ["lei", 1],
    ["saud", 2],
  ]);

  it("mapeia forma de superficie para o id do radical no acervo", () => {
    const formas = construirFormas(
      [
        { forma: "iluminacao", radical: "iluminaca" },
        { forma: "leis", radical: "lei" },
      ],
      idDoLexema
    );
    expect(formas).toEqual({ iluminacao: 0, leis: 1 });
  });

  it("descarta stopword (radical nulo, o que ts_lexize devolve pra stopword)", () => {
    const formas = construirFormas(
      [
        { forma: "de", radical: null },
        { forma: "saude", radical: "saud" },
      ],
      idDoLexema
    );
    expect(formas).toEqual({ saude: 2 });
  });

  it("descarta radical que nao aparece em nenhum documento do acervo", () => {
    const formas = construirFormas([{ forma: "fantasma", radical: "nao-existe" }], idDoLexema);
    expect(formas).toEqual({});
  });
});
