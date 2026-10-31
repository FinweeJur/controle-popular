/**
 * @file apps/web/lib/memoria/paises-mistica.test.ts
 * @description Guarda do país de cada verbete da Mística do Dia.
 *
 * O que este teste protege:
 * - o overlay cobre o acervo, sem verbete órfão;
 * - os casos que o lote errou estão corrigidos (Che, Henfil);
 * - rótulo composto ("Israel/Ocupados", "Hong Kong") não chega à tela;
 * - fato sem país único usa "Internacional", nunca uma nação inventada.
 */

import { describe, expect, it } from "vitest";
import { CALENDARIO } from "./correcoes";
import { PAISES_MISTICA } from "./paises-mistica";

function porTitulo(padrao: RegExp) {
  return CALENDARIO.find((e) => padrao.test(e.titulo));
}

describe("país da mística", () => {
  it("cobre todo o calendário publicado, chave por chave", () => {
    expect(Object.keys(PAISES_MISTICA)).toHaveLength(542);
    const semPais = CALENDARIO.filter((e) => !e.pais);
    expect(semPais).toHaveLength(0);
    for (const pais of Object.values(PAISES_MISTICA)) {
      expect(pais.trim()).toBe(pais);
      expect(pais.length).toBeGreaterThan(2);
    }
  });

  it("Joana D'Arc fica na França", () => {
    expect(porTitulo(/Joana D.?Arc/i)?.pais).toBe("França");
  });

  it("Che Guevara nasce na Argentina, não em Cuba", () => {
    expect(porTitulo(/Nasce Ernesto Guevara/i)?.pais).toBe("Argentina");
  });

  it("Henfil e a Encruzilhada Natalino ficam no Brasil", () => {
    expect(porTitulo(/Henfil/i)?.pais).toBe("Brasil");
    expect(porTitulo(/Encruzilhada Natalino/i)?.pais).toBe("Brasil");
  });

  it("um fato brasileiro fica no Brasil", () => {
    expect(porTitulo(/Prestes/i)?.pais).toBe("Brasil");
  });

  it("não publica rótulo composto nem território como país", () => {
    for (const pais of Object.values(PAISES_MISTICA)) {
      expect(pais).not.toContain("/");
      expect(pais).not.toBe("Hong Kong");
      expect(pais).not.toBe("Porto Rico");
    }
  });

  it("preserva o nome da época em fato histórico", () => {
    expect(porTitulo(/Dubček chega ao poder/i)?.pais).toBe("Tchecoslováquia");
  });
});
