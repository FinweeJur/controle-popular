import { describe, expect, test } from "vitest";
import { extrairTagsDeCampos } from "@/lib/tags";
import { REGRAS_TAGS_BARRAGENS } from "./tags-barragens";

describe("tags de barragens", () => {
  test("identifica rejeitos e mineração", () => {
    const tags = extrairTagsDeCampos(
      ["Barragem de disposição de rejeitos da mineração"],
      REGRAS_TAGS_BARRAGENS
    );
    expect(tags).toContain("rejeitos");
    expect(tags).toContain("mineração");
  });

  test("identifica alteamento a montante", () => {
    expect(extrairTagsDeCampos(["Alteamento a montante"], REGRAS_TAGS_BARRAGENS)).toContain(
      "alteamento a montante"
    );
  });

  test("não emite tag quando nenhuma regra casa", () => {
    expect(extrairTagsDeCampos(["Barragem genérica"], REGRAS_TAGS_BARRAGENS)).toEqual([]);
  });
});
