import { describe, it, expect, vi, afterEach } from "vitest";
import { carregarGrupoFatiado, montarIndiceDeGrupos, carregarIndiceBusca } from "./carregarIndice";
import { buscar } from "./indice";
import type { ManifestoFatias } from "../estatico/fatiar";

/** Responde com JSON, como o `fetch` do navegador faria para um arquivo estático. */
function respostaJson(corpo: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 404,
    json: async () => corpo,
  } as Response;
}

function manifesto(fatias: number, linhasPorFatia: number[], bytesPorFatia: number[]): ManifestoFatias {
  return {
    total: linhasPorFatia.reduce((a, b) => a + b, 0),
    fatias,
    linhasPorFatia,
    bytesPorFatia,
    orcamentoBytes: 2 * 1024 * 1024,
    avisos: [],
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("carregarGrupoFatiado", () => {
  it("monta manifesto vazio (fatias: 0) sem tentar buscar 0.json", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toBe("/base/manifesto.json");
      return respostaJson(manifesto(0, [], []));
    });
    vi.stubGlobal("fetch", fetchMock);

    const linhas = await carregarGrupoFatiado("/base");
    expect(linhas).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("baixa as fatias em sequencia e concatena na ordem", async () => {
    const chamadas: string[] = [];
    const fetchMock = vi.fn(async (url: string) => {
      chamadas.push(url);
      if (url.endsWith("manifesto.json")) return respostaJson(manifesto(3, [2, 2, 1], [20, 20, 10]));
      if (url.endsWith("/0.json")) return respostaJson(["a", "b"]);
      if (url.endsWith("/1.json")) return respostaJson(["c", "d"]);
      if (url.endsWith("/2.json")) return respostaJson(["e"]);
      throw new Error(`inesperado: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const linhas = await carregarGrupoFatiado<string>("/base");
    expect(linhas).toEqual(["a", "b", "c", "d", "e"]);
    // sequencial: manifesto, depois 0, 1, 2 nessa ordem exata
    expect(chamadas).toEqual(["/base/manifesto.json", "/base/0.json", "/base/1.json", "/base/2.json"]);
  });

  it("reporta progresso em bytes conforme cada fatia chega", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("manifesto.json")) return respostaJson(manifesto(2, [1, 1], [30, 70]));
      if (url.endsWith("/0.json")) return respostaJson(["x"]);
      return respostaJson(["y"]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const progresso: number[] = [];
    await carregarGrupoFatiado<string>("/base", (p) => progresso.push(p.bytesCarregados));
    expect(progresso).toEqual([30, 100]);
  });

  it("HTTP nao-ok vira erro (o chamador decide como mostrar)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => respostaJson({}, false))
    );
    await expect(carregarGrupoFatiado("/base")).rejects.toThrow(/HTTP 404/);
  });
});

describe("montarIndiceDeGrupos", () => {
  it("remonta lexemas/ocorrencias a partir das tuplas de vocabulario, na ordem", () => {
    const indice = montarIndiceDeGrupos(
      [{ i: 1, t: "Lei 1", e: "ementa", h: "/a/1", f: "cidades" }],
      [
        ["ambiental", [1]],
        ["lei", [1]],
      ],
      [
        ["ambiental", 0],
        ["lei", 1],
      ]
    );
    expect(indice.lexemas).toEqual(["ambiental", "lei"]);
    expect(indice.ocorrencias).toEqual([[1], [1]]);
    expect(indice.formas).toEqual({ ambiental: 0, lei: 1 });
    expect(indice.docs).toHaveLength(1);
  });
});

describe("carregarIndiceBusca — integracao com buscar()", () => {
  it("o indice remontado a partir das fatias e buscavel de verdade", async () => {
    const docs = [
      { i: 1, t: "Lei 1.234/2020", e: "Dispoe sobre a iluminacao publica", h: "/a/1", f: "cidades" as const },
      { i: 2, t: "PL 3611/2023", e: "Politica de saude mental", h: "/c/2", f: "congresso" as const },
    ];
    const vocabulario: [string, number[]][] = [
      ["iluminaca", [1]],
      ["public", [1]],
      ["saud", [2]],
    ];
    const formas: [string, number][] = [
      ["iluminacao", 0],
      ["publica", 1],
      ["saude", 2],
    ];

    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/idx/docs/manifesto.json") return respostaJson(manifesto(1, [2], [500]));
      if (url === "/idx/docs/0.json") return respostaJson(docs);
      if (url === "/idx/vocabulario/manifesto.json") return respostaJson(manifesto(1, [3], [100]));
      if (url === "/idx/vocabulario/0.json") return respostaJson(vocabulario);
      if (url === "/idx/formas/manifesto.json") return respostaJson(manifesto(1, [3], [80]));
      if (url === "/idx/formas/0.json") return respostaJson(formas);
      throw new Error(`inesperado: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const indice = await carregarIndiceBusca("/idx");
    const resultado = buscar("iluminação", indice); // digitado COM acento, radical foi gerado SEM
    expect(resultado.map((r) => r.doc.i)).toEqual([1]);
  });

  it("soma o progresso dos tres grupos (docs + vocabulario + formas)", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("manifesto.json")) return respostaJson(manifesto(1, [1], [40]));
      return respostaJson([]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const totais: number[] = [];
    await carregarIndiceBusca("/idx", (p) => totais.push(p.bytesCarregados));
    // 3 grupos x 40 bytes cada, soma final = 120
    expect(Math.max(...totais)).toBe(120);
  });
});
