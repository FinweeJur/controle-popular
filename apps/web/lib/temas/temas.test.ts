import { describe, expect, test } from "vitest";
import {
  alternarTema,
  contemTema,
  desserializarTemas,
  LIMITE_TEMAS,
  serializarTemas,
  TEMAS,
  temasSeguidos,
} from "./temas";

describe("TEMAS", () => {
  test("há temas, ids únicos e rotas internas", () => {
    expect(TEMAS.length).toBeGreaterThan(0);
    expect(new Set(TEMAS.map((t) => t.id)).size).toBe(TEMAS.length);
    for (const t of TEMAS) expect(t.href.startsWith("/")).toBe(true);
  });
});

describe("alternarTema", () => {
  test("liga e desliga, mantendo a ordem do catálogo", () => {
    const comDois = alternarTema(["ambiental"], "cidades");
    expect(comDois).toEqual(["cidades", "ambiental"]); // ordem do catálogo
    expect(alternarTema(comDois, "cidades")).toEqual(["ambiental"]);
  });

  test("ignora id fora do catálogo", () => {
    expect(alternarTema(["cidades"], "inexistente")).toEqual(["cidades"]);
  });
});

describe("contemTema", () => {
  test("acha pelo id", () => {
    expect(contemTema(["cidades"], "cidades")).toBe(true);
    expect(contemTema(["cidades"], "congresso")).toBe(false);
  });
});

describe("serializar / desserializar", () => {
  test("ida e volta preserva a lista", () => {
    expect(desserializarTemas(serializarTemas(["cidades", "memoria"]))).toEqual(["cidades", "memoria"]);
  });

  test("tolera lixo e descarta id fora do catálogo", () => {
    expect(desserializarTemas(null)).toEqual([]);
    expect(desserializarTemas("nao e json")).toEqual([]);
    expect(desserializarTemas('["cidades","inventado",42]')).toEqual(["cidades"]);
  });

  test("trunca no limite", () => {
    const muitos = Array.from({ length: LIMITE_TEMAS + 5 }, () => "cidades");
    expect(desserializarTemas(JSON.stringify(muitos)).length).toBeLessThanOrEqual(LIMITE_TEMAS);
  });
});

describe("temasSeguidos", () => {
  test("devolve os temas na ordem do catálogo", () => {
    const seguidos = temasSeguidos(["memoria", "cidades"]);
    expect(seguidos.map((t) => t.id)).toEqual(["cidades", "memoria"]);
  });
});
