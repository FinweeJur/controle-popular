import { describe, expect, test } from "vitest";
import {
  adicionarItem,
  contemItem,
  desserializar,
  LIMITE_ITENS,
  removerItem,
  serializar,
  type ItemPasta,
} from "./itens";

const pagina: ItemPasta = {
  id: "/tecnologia",
  titulo: "Tecnologia & IA Livre",
  href: "/tecnologia",
  tipo: "pagina",
  adicionadoEm: "2026-09-30T12:00:00.000Z",
};
const lei: ItemPasta = {
  id: "/ambiental/legislacao",
  titulo: "Legislação Ambiental",
  href: "/ambiental/legislacao",
  tipo: "lei",
  adicionadoEm: "2026-09-30T12:05:00.000Z",
};

describe("contemItem", () => {
  test("acha pelo endereço", () => {
    expect(contemItem([pagina], "/tecnologia")).toBe(true);
    expect(contemItem([pagina], "/cidades")).toBe(false);
  });
});

describe("adicionarItem", () => {
  test("adiciona no topo e não duplica", () => {
    const lista = adicionarItem([pagina], lei);
    expect(lista.map((i) => i.id)).toEqual(["/ambiental/legislacao", "/tecnologia"]);
    expect(adicionarItem(lista, pagina)).toHaveLength(2);
  });

  test("respeita o limite, descartando os mais antigos", () => {
    let lista: ItemPasta[] = [];
    for (let i = 0; i < LIMITE_ITENS + 5; i++) {
      lista = adicionarItem(lista, {
        id: `/p/${i}`,
        titulo: `Página ${i}`,
        href: `/p/${i}`,
        tipo: "pagina",
        adicionadoEm: "2026-09-30T12:00:00.000Z",
      });
    }
    expect(lista).toHaveLength(LIMITE_ITENS);
    expect(lista[0].id).toBe(`/p/${LIMITE_ITENS + 4}`);
  });
});

describe("removerItem", () => {
  test("remove pelo endereço", () => {
    expect(removerItem([pagina, lei], "/tecnologia").map((i) => i.id)).toEqual([
      "/ambiental/legislacao",
    ]);
  });
});

describe("serializar / desserializar", () => {
  test("ida e volta preserva a pasta", () => {
    expect(desserializar(serializar([pagina, lei]))).toEqual([pagina, lei]);
  });

  test("tolera nulo, lixo e JSON inválido", () => {
    expect(desserializar(null)).toEqual([]);
    expect(desserializar("nao e json")).toEqual([]);
    expect(desserializar("[1,2,3]")).toEqual([]);
  });

  test("tipo desconhecido vira 'pagina' e item sem campo mínimo é descartado", () => {
    const bruto = JSON.stringify([
      { ...pagina, tipo: "inventado" },
      { id: "/x", titulo: "sem href" },
    ]);
    expect(desserializar(bruto)).toEqual([{ ...pagina, tipo: "pagina" }]);
  });
});
