import { describe, it, expect } from "vitest";
import { buscar, docPassaPeriodo, docTemTipo, type IndiceBusca } from "./indice";

/**
 * Indice de teste focado nos filtros novos (frente/tipo/periodo) — doc 3 nao
 * tem `k` nem `d` de proposito: e o caso "indice gerado por versao antiga do
 * gerador" que o leitor precisa tolerar sem quebrar.
 */
const INDICE: IndiceBusca = {
  lexemas: ["iluminaca", "public", "saud"],
  formas: { iluminacao: 0, publica: 1, saude: 2 },
  ocorrencias: [
    [1, 7], // iluminaca
    [1, 7], // public
    [2], // saud
  ],
  docs: [
    { i: 1, t: "Lei 1.234/2020", e: "Dispoe sobre a iluminacao publica", h: "/a/1", f: "cidades", m: "betim", a: ["urbanismo"], d: "2026-09-05", k: "ato-oficial" },
    { i: 2, t: "PL 3611/2023", e: "Politica de saude publica", h: "/c/2", f: "congresso", d: "2026-01-10", k: "proposicao-federal" },
    { i: 3, t: "Betim no ComunicaBR", e: "Indicadores federais sem tipo e sem data", h: "/d/3", f: "cidades", m: "betim" },
    { i: 4, t: "TJMG", e: "Tribunal de Justica de Minas Gerais", h: "/j/4", f: "judiciario", k: "tribunal", d: "2025-05-01" },
    { i: 5, t: "Ministro Relator", e: "Nome do magistrado", h: "/j/5", f: "judiciario", k: "magistrado", d: "2026-08-31" },
    { i: 6, t: "Novidade do portal", e: "A atualizacao da semana", h: "/n/6", f: "blog", k: "atualizacao", d: "2026-09-10" },
    { i: 7, t: "Ato antigo", e: "Publica a iluminacao da praca", h: "/a/7", f: "cidades", m: "bh", k: "ato-oficial", d: "2026-09-09" },
  ],
};

const ids = (r: ReturnType<typeof buscar>) => r.map((x) => x.doc.i).sort();

describe("frase exata", () => {
  it("aspas exigem as palavras juntas, na ordem", () => {
    // Doc 1 tem "iluminacao publica" coladas; doc 7 tem as duas palavras
    // separadas por outras ("Publica a iluminacao") — so o 1 casa.
    expect(ids(buscar('"iluminacao publica"', INDICE))).toEqual([1]);
    expect(ids(buscar('"publica iluminacao"', INDICE))).toEqual([]);
  });
});

describe("filtro de frente", () => {
  it("sem palavra-chave lista so as zonas pedidas", () => {
    expect(ids(buscar("", INDICE, { frente: ["congresso", "blog"] }))).toEqual([2, 6]);
  });

  it("lista vazia ou ausente = todas as zonas", () => {
    expect(ids(buscar("", INDICE, { frente: [] }))).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("se soma com a busca textual", () => {
    expect(ids(buscar("saude", INDICE, { frente: ["congresso"] }))).toEqual([2]);
    expect(ids(buscar("saude", INDICE, { frente: ["cidades"] }))).toEqual([]);
  });
});

describe("filtro de tipo (doc sem k e tolerado)", () => {
  it("doc sem k nunca quebra e nunca casa com tipo especifico", () => {
    expect(ids(buscar("", INDICE, { tipo: "ato-oficial" }))).toEqual([1, 7]);
    expect(ids(buscar("", INDICE, { tipo: "estudo" }))).toEqual([]);
  });

  it("tribunal-magistrado agrupa os dois tipos do judiciario", () => {
    expect(ids(buscar("", INDICE, { tipo: "tribunal-magistrado" }))).toEqual([4, 5]);
  });

  it("tipo se soma com a busca textual", () => {
    expect(ids(buscar("iluminacao", INDICE, { tipo: "ato-oficial" }))).toEqual([1, 7]);
  });
});

describe("filtro de período (doc sem data fica de fora)", () => {
  const HOJE = "2026-09-10";

  it("7 dias: so docs com d dentro da janela; sem data fica de fora", () => {
    expect(ids(buscar("", INDICE, { periodo: "7", hoje: HOJE }))).toEqual([1, 6, 7]);
  });

  it("30 e 90 dias usam a mesma regra com janela maior", () => {
    expect(ids(buscar("", INDICE, { periodo: "30", hoje: HOJE }))).toEqual([1, 5, 6, 7]);
    expect(ids(buscar("", INDICE, { periodo: "90", hoje: HOJE }))).toEqual([1, 5, 6, 7]);
  });

  it("ano corrente e ano anterior", () => {
    expect(ids(buscar("", INDICE, { periodo: "ano-corrente", hoje: HOJE }))).toEqual([1, 2, 5, 6, 7]);
    expect(ids(buscar("", INDICE, { periodo: "ano-anterior", hoje: HOJE }))).toEqual([4]);
  });

  it("periodo, tipo e frente se somam", () => {
    expect(
      ids(buscar("", INDICE, { frente: ["cidades", "judiciario"], tipo: "tribunal-magistrado", periodo: "ano-anterior", hoje: HOJE }))
    ).toEqual([4]);
  });
});

describe("docPassaPeriodo", () => {
  it("doc sem data nunca passa", () => {
    expect(docPassaPeriodo(undefined, "7", "2026-09-10")).toBe(false);
  });

  it("tolera data com hora (so os 10 primeiros caracteres valem)", () => {
    expect(docPassaPeriodo("2026-09-08T12:00:00", "7", "2026-09-10")).toBe(true);
  });
});

describe("docTemTipo", () => {
  it("sem k nao casa com nada", () => {
    expect(docTemTipo(undefined, "ato-oficial")).toBe(false);
  });

  it("justica e aceito como tribunal-magistrado (indice antigo)", () => {
    expect(docTemTipo("justica", "tribunal-magistrado")).toBe(true);
  });
});