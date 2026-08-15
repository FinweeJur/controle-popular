import { describe, it, expect } from "vitest";
import { textoAtualDaRota } from "./texto-atual";

describe("textoAtualDaRota", () => {
  it("le o titulo literal de uma pagina ligada", () => {
    const t = textoAtualDaRota("/paraopeba/entenda");
    expect(t.rota).toBe("/paraopeba/entenda");
    expect(t.titulo).toBe("Entenda o caso — Paraopeba | Controle Popular");
  });

  it("marca calculado quando a descricao tem template com ${}", () => {
    const t = textoAtualDaRota("/paraopeba/entenda");
    expect(t.descricao).toBeNull();
    expect(t.calculado).toBe(true);
  });

  it("rota que nao existe devolve texto desconhecido, sem lancar", () => {
    const t = textoAtualDaRota("/nao-existe");
    expect(t.titulo).toBeNull();
    expect(t.descricao).toBeNull();
    expect(t.calculado).toBe(false);
  });

  it("pagina com metadata sem metadataEditavel devolve desconhecido", () => {
    const t = textoAtualDaRota("/[municipio]");
    expect(t.titulo).toBeNull();
    expect(t.calculado).toBe(false);
  });
});