import { describe, expect, test } from "vitest";
import {
  montarExportacao,
  serializarExportacao,
  validarImportacao,
} from "./dados-locais";

const cidadeJson = JSON.stringify([
  { id: "3106705", nome: "Betim", uf: "MG", href: "/betim" },
]);
const pastaJson = JSON.stringify([
  { id: "/tecnologia", titulo: "Tecnologia", href: "/tecnologia", tipo: "pagina", adicionadoEm: "2026-09-30T12:00:00.000Z" },
]);
const temasJson = JSON.stringify(["cidades", "ambiental"]);

describe("montarExportacao", () => {
  test("interpreta os valores crus do localStorage", () => {
    const e = montarExportacao({ cidadesJson: cidadeJson, pastaJson, temasJson });
    expect(e.versao).toBe(1);
    expect(e.cidades).toHaveLength(1);
    expect(e.pasta).toHaveLength(1);
    expect(e.temas).toEqual(["cidades", "ambiental"]);
  });

  test("tolera valores ausentes", () => {
    const e = montarExportacao({ cidadesJson: null, pastaJson: null, temasJson: null });
    expect(e.cidades).toEqual([]);
    expect(e.pasta).toEqual([]);
    expect(e.temas).toEqual([]);
  });
});

describe("ida e volta", () => {
  test("exportar e importar preserva o conteúdo", () => {
    const original = montarExportacao({ cidadesJson: cidadeJson, pastaJson, temasJson });
    const lido = validarImportacao(serializarExportacao(original));
    expect(lido).not.toBeNull();
    expect(lido!.cidades).toEqual(original.cidades);
    expect(lido!.pasta).toEqual(original.pasta);
    expect(lido!.temas).toEqual(original.temas);
  });
});

describe("validarImportacao", () => {
  test("recusa JSON inválido e texto que não é objeto", () => {
    expect(validarImportacao("nao e json")).toBeNull();
    expect(validarImportacao("123")).toBeNull();
    expect(validarImportacao('"texto"')).toBeNull();
  });

  test("descarta item inválido em vez de quebrar", () => {
    const lido = validarImportacao(
      JSON.stringify({
        cidades: [{ id: "3106705", nome: "Betim", uf: "MG", href: "/betim" }, { id: "sem-nome" }],
        pasta: [],
        temas: ["cidades", "inventado"],
      }),
    );
    expect(lido!.cidades).toHaveLength(1);
    expect(lido!.temas).toEqual(["cidades"]);
  });
});
