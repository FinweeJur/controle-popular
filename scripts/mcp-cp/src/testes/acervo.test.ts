import path from "node:path";

import { describe, expect, it } from "vitest";

import { ARQUIVOS, acharDiretorioDados, carregarAcervo, lerEditais } from "../acervo.js";

describe("carregarAcervo", () => {
  it("não derruba o servidor quando o diretório não tem os arquivos", () => {
    const acervo = carregarAcervo(path.join(process.cwd(), "diretorio-que-nao-existe"));
    expect(acervo.editais).toEqual([]);
    expect(acervo.barragens).toEqual([]);
    expect(acervo.fontes).toEqual([]);
    expect(acervo.avisos).toHaveLength(5);
    expect(acervo.avisos[0]).toContain(ARQUIVOS.editais);
  });

  it("trata JSON ilegível como aviso, não como exceção", () => {
    // O diretório de fixtures não tem os nomes esperados: tudo vira aviso.
    const acervo = carregarAcervo(path.join(import.meta.dirname, "fixtures"));
    expect(acervo.avisos.length).toBe(5);
    expect(acervo.fontes).toEqual([]);
  });
});

describe("acharDiretorioDados", () => {
  it("acha apps/web/data subindo a partir do pacote", () => {
    const diretorio = acharDiretorioDados();
    expect(diretorio.endsWith(path.join("apps", "web", "data"))).toBe(true);
  });
});

describe("lerEditais", () => {
  it("aceita lista solta e objeto com itens", () => {
    const item = { id: "x", titulo: "Título" };
    expect(lerEditais([item])).toHaveLength(1);
    expect(lerEditais({ itens: [item] })).toHaveLength(1);
    expect(lerEditais({ nada: [] })).toEqual([]);
    expect(lerEditais(null)).toEqual([]);
    expect(lerEditais("texto")).toEqual([]);
  });
});
