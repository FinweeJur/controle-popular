import { describe, expect, test } from "vitest";
import { extrairTagsDeCampos } from "@/lib/tags";
import { REGRAS_TAGS_LICENCIAMENTO } from "./tags-licenciamento";

describe("tags de licenciamento ambiental", () => {
  test("identifica mineração e extração", () => {
    expect(extrairTagsDeCampos(["Lavra e beneficiamento de minério de ferro"], REGRAS_TAGS_LICENCIAMENTO)).toContain(
      "mineração"
    );
  });

  test("identifica energia hidrelétrica", () => {
    expect(extrairTagsDeCampos(["Usina hidro-elétrica de Pequeno Porte"], REGRAS_TAGS_LICENCIAMENTO)).toContain(
      "energia"
    );
  });

  test("não emite tag quando nenhuma regra casa", () => {
    expect(extrairTagsDeCampos(["Licença genérica sem vocabulário específico"], REGRAS_TAGS_LICENCIAMENTO)).toEqual(
      []
    );
  });
});
