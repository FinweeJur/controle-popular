import { describe, expect, it } from "vitest";
import {
  PUBLICACOES_BARRAGENS,
  empreendimentosComPublicacoes,
  publicacoesDe,
  referenciaAbnt,
} from "./publicacoes-barragens";

describe("publicacoes-barragens", () => {
  it("cobre Irapé e Setúbal no piloto", () => {
    expect(empreendimentosComPublicacoes()).toEqual(["Irapé", "Setúbal"]);
  });

  it("toda URL é direta (não home genérica)", () => {
    for (const p of PUBLICACOES_BARRAGENS) {
      expect(p.url).toMatch(/^https?:\/\//);
      // host com caminho além da raiz, ou path com arquivos/departamento
      const u = new URL(p.url);
      expect(u.pathname.length).toBeGreaterThan(1);
    }
  });

  it("ordenado por ano desc dentro do empreendimento", () => {
    const irape = publicacoesDe("Irapé");
    expect(irape.length).toBeGreaterThanOrEqual(5);
    for (let i = 1; i < irape.length; i++) {
      expect(irape[i - 1].ano).toBeGreaterThanOrEqual(irape[i].ano);
    }
  });

  it("referência ABNT traz autor, título e ano", () => {
    const p = publicacoesDe("Irapé")[0];
    const ref = referenciaAbnt(p);
    expect(ref).toContain(String(p.ano));
    expect(ref).toContain(p.autores.split(",")[0]);
  });

  it("empreendimento desconhecido devolve lista vazia", () => {
    expect(publicacoesDe("Xique-Xique")).toEqual([]);
  });
});
