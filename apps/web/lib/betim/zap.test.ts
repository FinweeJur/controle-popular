import { describe, expect, it } from "vitest";
import { normalizeWhatsapp, normalizarLinhasZap } from "./zap";

describe("normalizeWhatsapp", () => {
  it("aceita DDD + número com código do país", () => {
    expect(normalizeWhatsapp("5531975709609")).toBe("5531975709609");
  });
  it("adiciona o código do país quando ausente", () => {
    expect(normalizeWhatsapp("31975709609")).toBe("5531975709609");
  });
  it("ignora pontuação e espaços", () => {
    expect(normalizeWhatsapp("(31) 9757-09609")).toBe("5531975709609");
  });
  it("rejeita número curto demais", () => {
    expect(normalizeWhatsapp("31975")).toBeNull();
  });
  it("rejeita número longo demais", () => {
    expect(normalizeWhatsapp("553197570960999")).toBeNull();
  });
  it("rejeita vazio", () => {
    expect(normalizeWhatsapp("")).toBeNull();
  });
});

describe("normalizarLinhasZap", () => {
  it("mantém linha válida e normaliza o número", () => {
    const rows = normalizarLinhasZap([
      { id: "1", nome: "A", whatsapp: "31975709609" } as never,
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.whatsapp).toBe("5531975709609");
  });
  it("descarta linha com whatsapp nulo", () => {
    const rows = normalizarLinhasZap([
      { id: "1", nome: "A", whatsapp: null } as never,
    ]);
    expect(rows).toHaveLength(0);
  });
  it("descarta linha com whatsapp inválido", () => {
    const rows = normalizarLinhasZap([
      { id: "1", nome: "A", whatsapp: "nao-e-numero" } as never,
    ]);
    expect(rows).toHaveLength(0);
  });
  it("preserva as demais propriedades", () => {
    const rows = normalizarLinhasZap([
      { id: "7", nome: "Padaria", whatsapp: "5531975709609", bairro: "Centro", categoria: "alimentacao", descricao: null, cliques: 0 } as never,
    ]);
    expect(rows[0]).toMatchObject({
      id: "7",
      nome: "Padaria",
      bairro: "Centro",
      categoria: "alimentacao",
      descricao: null,
      cliques: 0,
      whatsapp: "5531975709609",
    });
  });
});