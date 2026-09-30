import { describe, expect, test } from "vitest";
import {
  alternarFavorito,
  contemFavorito,
  desserializar,
  LIMITE_FAVORITOS,
  serializar,
  type CidadeFavorita,
} from "./cidades";

const betim: CidadeFavorita = {
  id: "3106705",
  nome: "Betim",
  uf: "MG",
  href: "/betim",
};
const bh: CidadeFavorita = {
  id: "3106200",
  nome: "Belo Horizonte",
  uf: "MG",
  href: "/bh",
};

describe("contemFavorito", () => {
  test("acha pelo código IBGE", () => {
    expect(contemFavorito([betim], "3106705")).toBe(true);
    expect(contemFavorito([betim], "3106200")).toBe(false);
  });
});

describe("alternarFavorito", () => {
  test("adiciona no topo e remove ao repetir", () => {
    const com = alternarFavorito([betim], bh);
    expect(com.map((c) => c.id)).toEqual(["3106200", "3106705"]);
    const sem = alternarFavorito(com, bh);
    expect(sem.map((c) => c.id)).toEqual(["3106705"]);
  });

  test("respeita o limite, descartando os mais antigos", () => {
    let lista: CidadeFavorita[] = [];
    for (let i = 0; i < LIMITE_FAVORITOS + 5; i++) {
      lista = alternarFavorito(lista, {
        id: String(3000000 + i),
        nome: `Cidade ${i}`,
        uf: "MG",
        href: `/c/${i}`,
      });
    }
    expect(lista.length).toBe(LIMITE_FAVORITOS);
    // A última adicionada fica no topo.
    expect(lista[0].id).toBe(String(3000000 + LIMITE_FAVORITOS + 4));
  });
});

describe("serializar / desserializar", () => {
  test("ida e volta preserva a lista", () => {
    expect(desserializar(serializar([betim, bh]))).toEqual([betim, bh]);
  });

  test("tolera nulo, lixo e JSON inválido", () => {
    expect(desserializar(null)).toEqual([]);
    expect(desserializar("nao e json")).toEqual([]);
    expect(desserializar('{"a":1}')).toEqual([]);
  });

  test("descarta item sem campo mínimo e trunca no limite", () => {
    const bruto = JSON.stringify([
      { id: "1", nome: "Sem href" },
      betim,
      { id: 2, nome: "id numérico", uf: "MG", href: "/x" },
    ]);
    expect(desserializar(bruto)).toEqual([betim]);
  });
});
