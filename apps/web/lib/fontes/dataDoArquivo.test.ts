import { describe, expect, it } from "vitest";
import { dataDoAcervo, formatarDataBR } from "./dataDoArquivo";

/**
 * Guarda do extrator de data de coleta (PLANO-DATA-DO-DADO).
 * Pina os formatos realmente medidos nos JSONs do repo em 15/10/2026 —
 * se um coletor mudar o nome do campo, este teste avisa antes da tela
 * mostrar data errada ou nenhuma.
 */
describe("dataDoAcervo", () => {
  it("lê os apelados medidos no repo, na ordem de confiança", () => {
    expect(dataDoAcervo({ geradoEm: "2026-08-15T19:30:00Z" })).toBe("2026-08-15T19:30:00Z");
    expect(dataDoAcervo({ gerado_em: "2026-10-01T02:00:00Z" })).toBe("2026-10-01T02:00:00Z");
    expect(dataDoAcervo({ atualizado_em: "2026-09-28" })).toBe("2026-09-28");
    expect(dataDoAcervo({ ultimaColeta: "2026-08-20T00:00:00Z" })).toBe("2026-08-20T00:00:00Z");
    expect(dataDoAcervo({ coletadoEm: "2026-08-11" })).toBe("2026-08-11");
    expect(dataDoAcervo({ ultima_atualizacao: "2026-08-30" })).toBe("2026-08-30");
    expect(dataDoAcervo({ atualizado_na_fonte: "2026-08-11" })).toBe("2026-08-11");
  });

  it("geradoEm vence atualizadoEm (a coleta é o que importa)", () => {
    const acervo = { atualizadoEm: "2026-01-01", geradoEm: "2026-08-15T19:30:00Z" };
    expect(dataDoAcervo(acervo)).toBe("2026-08-15T19:30:00Z");
  });

  it("sem data honesta, devolve null — a tela não promete nada", () => {
    expect(dataDoAcervo(null)).toBeNull();
    expect(dataDoAcervo({})).toBeNull();
    expect(dataDoAcervo({ geradoEm: "ontem" })).toBeNull();
    expect(dataDoAcervo([1, 2, 3])).toBeNull();
  });
});

describe("formatarDataBR", () => {
  it("reordena sem fuso: a data é o dia da coleta, não o dia do servidor", () => {
    expect(formatarDataBR("2026-08-15T19:30:00Z")).toBe("15/08/2026");
    expect(formatarDataBR("2026-08-15")).toBe("15/08/2026");
  });

  it("deixa passar o que não é data (honesto, não inventa)", () => {
    expect(formatarDataBR("registro interno")).toBe("registro interno");
  });
});
