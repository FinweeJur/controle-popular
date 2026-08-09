import { describe, it, expect } from "vitest";
import { semAcento, separarPalavras, distancia, tolerancia } from "./normalizar";
import { interpretarConsulta, buscar, type IndiceBusca } from "./indice";

/**
 * Índice de teste montado à mão, com os radicais que o PostgreSQL 18.4 devolve
 * de verdade (conferidos com `ts_lexize('portuguese_stem', ...)` sobre o texto
 * JÁ SEM ACENTO — que é a ordem que o servidor usa desde a migration `0046`):
 *
 *     iluminacao -> iluminaca      saude -> saud        lei -> lei
 *     leis       -> leis           contratos -> contrat
 */
const LEXEMAS = ["iluminaca", "saud", "lei", "leis", "contrat", "public", "ambiental"];
const id = (l: string) => LEXEMAS.indexOf(l);

const INDICE: IndiceBusca = {
  lexemas: LEXEMAS,
  formas: {
    iluminacao: id("iluminaca"),
    saude: id("saud"),
    lei: id("lei"),
    leis: id("leis"),
    contrato: id("contrat"),
    contratos: id("contrat"),
    publica: id("public"),
    publicas: id("public"),
    ambiental: id("ambiental"),
  },
  ocorrencias: [
    [1], // iluminaca
    [2, 3], // saud
    [1], // lei
    [4], // leis
    [3], // contrat
    [1, 4], // public
    [5], // ambiental
  ],
  docs: [
    { i: 1, t: "Lei 1.234/2020", e: "Dispoe sobre a iluminacao publica", h: "/a/1", f: "cidades", m: "betim", a: ["urbanismo"], d: "2020-01-01" },
    { i: 2, t: "PL 3611/2023", e: "Politica de saude mental", h: "/c/2", f: "congresso", d: "2023-05-02" },
    { i: 3, t: "Contrato 55", e: "Contratos de saude suplementar", h: "/a/3", f: "cidades", m: "bh", d: "2021-03-03" },
    { i: 4, t: "Consolidacao das leis", e: "Leis publicas municipais", h: "/a/4", f: "cidades", m: "betim", d: "2019-07-07" },
    { i: 5, t: "Norma ambiental", e: "Licenciamento ambiental", h: "/a/5", f: "cidades", m: "betim", d: "2022-02-02" },
  ],
};

const ids = (r: ReturnType<typeof buscar>) => r.map((x) => x.doc.i).sort();

describe("semAcento", () => {
  it("tira acento, til e cedilha", () => {
    expect(semAcento("Iluminação Pública")).toBe("iluminacao publica");
    expect(semAcento("SAÚDE")).toBe("saude");
    expect(semAcento("cidadãos")).toBe("cidadaos");
  });

  // `ª`/`º` não são diacríticos: sobrevivem ao NFD e viravam lixo na consulta.
  it("normaliza ordinais, para '1ª via' casar com '1a via'", () => {
    expect(semAcento("1ª via")).toBe("1a via");
    expect(semAcento("3º andar")).toBe("3o andar");
  });
});

describe("separarPalavras", () => {
  // O jeito OFICIAL de citar uma norma é o que mais aparece em documento — e
  // era justamente o que a busca ingênua não achava.
  it("quebra numero de norma com ponto e barra", () => {
    expect(separarPalavras("Lei 1.234/2020")).toEqual(["lei", "1234", "2020"]);
  });

  it("hifen vira separador, para compra-e-venda casar com 'compra e venda'", () => {
    expect(separarPalavras("compra-e-venda")).toEqual(["compra", "e", "venda"]);
    expect(separarPalavras("meio-ambiente")).toEqual(["meio", "ambiente"]);
  });

  it("separa numero colado em letra", () => {
    expect(separarPalavras("art5")).toEqual(["art", "5"]);
    expect(separarPalavras("PL3611")).toEqual(["pl", "3611"]);
  });
});

describe("tolerancia a erro de digitacao", () => {
  it("palavra curta nao ganha tolerancia", () => {
    // Com 3 letras, distancia 1 transformaria "lei" em "leo"/"rei"/"les".
    expect(tolerancia("lei")).toBe(0);
    expect(tolerancia("saude")).toBe(1);
    expect(tolerancia("licitacoes")).toBe(2);
  });

  it("distancia corta cedo quando passa do limite", () => {
    expect(distancia("saude", "saude")).toBe(0);
    expect(distancia("sáude", "saude", 2)).toBeLessThanOrEqual(2);
    expect(distancia("abacaxi", "lei", 2)).toBeGreaterThan(2);
  });
});

describe("interpretarConsulta", () => {
  it("separa frase entre aspas dos termos soltos", () => {
    const { termos, frases } = interpretarConsulta('"iluminacao publica" saude');
    expect(frases).toEqual(["iluminacao publica"]);
    expect(termos.map((t) => t.palavra)).toEqual(["saude"]);
  });

  it("reconhece exclusao com hifen na frente", () => {
    const { termos } = interpretarConsulta("saude -mental");
    expect(termos).toEqual([
      { palavra: "saude", negado: false },
      { palavra: "mental", negado: true },
    ]);
  });
});

describe("buscar", () => {
  it("acha pelo radical exato", () => {
    expect(ids(buscar("contratos", INDICE))).toEqual([3]);
  });

  // O ponto do exercicio inteiro: quem digita sem acento tem de achar.
  it("acha digitando SEM acento o que esta escrito COM acento", () => {
    expect(ids(buscar("iluminação", INDICE))).toEqual([1]);
    expect(ids(buscar("iluminacao", INDICE))).toEqual([1]);
  });

  // Buraco medido do radicalizador: `lei -> lei` e `leis -> leis`.
  // Sem casamento por prefixo, "leis" nao acharia "lei" e vice-versa.
  it("cobre o buraco do plural que o radicalizador deixa", () => {
    expect(ids(buscar("leis", INDICE))).toContain(1);
    expect(ids(buscar("lei", INDICE))).toContain(4);
  });

  it("perdoa erro de digitacao quando nada casa exatamente", () => {
    const r = buscar("saúdi", INDICE);
    expect(ids(r)).toEqual([2, 3]);
    // A tela precisa poder avisar que corrigiu.
    expect(r[0].aproximados.length).toBeGreaterThan(0);
  });

  it("nao usa aproximacao quando o exato existe", () => {
    const r = buscar("saude", INDICE);
    expect(r.every((x) => x.aproximados.length === 0)).toBe(true);
  });

  it("soma termos em E, nao em OU", () => {
    // 3 tem "contrat" e "saud"; 2 so tem "saud".
    expect(ids(buscar("contratos saude", INDICE))).toEqual([3]);
  });

  it("frase entre aspas exige as palavras juntas", () => {
    expect(ids(buscar('"iluminacao publica"', INDICE))).toEqual([1]);
    expect(ids(buscar('"publica iluminacao"', INDICE))).toEqual([]);
  });

  it("exclusao remove o documento", () => {
    expect(ids(buscar("saude", INDICE))).toEqual([2, 3]);
    expect(ids(buscar("saude -mental", INDICE))).toEqual([3]);
  });

  it("titulo pesa mais que ementa", () => {
    const r = buscar("contrato", INDICE);
    expect(r[0].doc.i).toBe(3); // "Contrato 55" no titulo
  });

  it("filtra por municipio e por tema sem palavra-chave", () => {
    expect(ids(buscar("", INDICE, { municipio: "betim" }))).toEqual([1, 4, 5]);
    expect(ids(buscar("", INDICE, { tema: "urbanismo" }))).toEqual([1]);
  });

  it("filtro e busca textual se somam", () => {
    expect(ids(buscar("saude", INDICE, { municipio: "bh" }))).toEqual([3]);
  });

  it("consulta sem resultado devolve lista vazia, nao o acervo", () => {
    expect(buscar("zzzzqqqq", INDICE)).toEqual([]);
  });
});
