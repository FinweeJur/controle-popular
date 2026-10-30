/**
 * @file apps/web/lib/universidades/dados.test.ts
 * @description Guarda de integridade do índice universitário.
 *
 * O que este teste protege (QUALIDADES-DA-INFORMACAO.md):
 * - nenhum registro sem fonte e sem data de acesso;
 * - cartão de topo igual à lista (total calculado, não digitado);
 * - busca sem acento funcionando;
 * - nenhum dado pessoal sensível (CPF) escondido na base.
 *
 * Ele NÃO prova que o link responde — isso é a conferência HTTP da coleta,
 * registrada em `dataAcesso`. O teste pega o erro de digitação e a regressão
 * de estrutura.
 */

import { describe, expect, it } from "vitest";
import {
  GRUPOS,
  INSTITUICOES,
  PROJETOS,
  UNIDADES,
  agruparGruposPorArea,
  areasDisponiveis,
  dataMaisRecente,
  listarGrupos,
  listarProjetos,
  listarUnidades,
  obterInstituicao,
  resumirUniversidades,
} from "./index";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const HTTP = /^https?:\/\//;

describe("universidades — instituições", () => {
  it("tem sigla única e campos mínimos", () => {
    const siglas = INSTITUICOES.map((i) => i.sigla);
    expect(new Set(siglas).size).toBe(siglas.length);
    for (const i of INSTITUICOES) {
      expect(i.nome.length).toBeGreaterThan(3);
      expect(i.uf).toMatch(/^[A-Z]{2}$/);
      expect(i.site).toMatch(HTTP);
      expect(i.fonteUrl).toMatch(HTTP);
      expect(i.dataAcesso).toMatch(ISO);
      expect(i.links.length).toBeGreaterThan(0);
      for (const l of i.links) expect(l.url).toMatch(HTTP);
    }
  });

  it("acha a instituição sem diferenciar caixa", () => {
    expect(obterInstituicao("ufvjm")?.sigla).toBe("UFVJM");
    expect(obterInstituicao("UFVJM")?.sigla).toBe("UFVJM");
    expect(obterInstituicao("nao-existe")).toBeUndefined();
  });
});

describe("universidades — unidades", () => {
  it("pertencem a instituição conhecida e têm sigla única", () => {
    for (const u of UNIDADES) {
      expect(obterInstituicao(u.instituicao)).toBeDefined();
      expect(u.sigla.length).toBeGreaterThan(1);
      expect(u.nome.length).toBeGreaterThan(3);
      if (u.site) expect(u.site).toMatch(HTTP);
    }
    const daUfvjm = listarUnidades("UFVJM");
    const siglas = daUfvjm.map((u) => u.sigla);
    expect(new Set(siglas).size).toBe(siglas.length);
  });
});

describe("universidades — grupos de pesquisa", () => {
  it("tem procedência completa em cada grupo", () => {
    expect(GRUPOS.length).toBeGreaterThan(0);
    for (const g of GRUPOS) {
      expect(obterInstituicao(g.instituicao)).toBeDefined();
      expect(g.nome.trim().length).toBeGreaterThan(2);
      expect(g.area.trim().length).toBeGreaterThan(2);
      expect(g.lider.trim().length).toBeGreaterThan(3);
      expect(g.anoReferencia).toBeGreaterThan(2000);
      expect(g.fonteUrl).toMatch(HTTP);
      expect(g.dataAcesso).toMatch(ISO);
    }
  });

  it("não repete o mesmo grupo da mesma instituição", () => {
    const chaves = GRUPOS.map((g) => `${g.instituicao}|${g.nome}`);
    expect(new Set(chaves).size).toBe(chaves.length);
  });

  it("filtra por área sem acento", () => {
    const saude = listarGrupos({ area: "saude coletiva" });
    expect(saude.length).toBeGreaterThan(0);
    expect(saude.every((g) => g.area === "Saúde Coletiva")).toBe(true);
  });

  it("busca por termo dentro do nome, da área e do líder", () => {
    const campesinato = listarGrupos({ busca: "campesinato" });
    expect(campesinato.some((g) => g.nome.includes("NAC"))).toBe(true);

    const geografia = listarGrupos({ busca: "geografia" });
    expect(geografia.some((g) => g.nome.includes("Observatório"))).toBe(true);
  });

  it("devolve lista vazia honesta quando nada casa", () => {
    expect(listarGrupos({ busca: "termo-que-nao-existe-xyz" })).toEqual([]);
  });

  it("agrupa por área sem perder nem duplicar grupo", () => {
    const grupos = agruparGruposPorArea();
    const total = grupos.reduce((s, a) => s + a.grupos.length, 0);
    expect(total).toBe(GRUPOS.length);
    const areas = grupos.map((a) => a.area);
    expect([...areas].sort((a, b) => a.localeCompare(b, "pt-BR"))).toEqual(areas);
  });

  it("expõe as áreas em ordem alfabética", () => {
    const areas = areasDisponiveis();
    expect(areas.length).toBeGreaterThan(0);
    expect([...areas].sort((a, b) => a.localeCompare(b, "pt-BR"))).toEqual(areas);
  });
});

describe("universidades — extensão", () => {
  it("só publica projeto com página específica e plataforma", () => {
    expect(PROJETOS.length).toBeGreaterThan(0);
    for (const p of PROJETOS) {
      expect(obterInstituicao(p.instituicao)).toBeDefined();
      expect(p.nome.trim().length).toBeGreaterThan(2);
      expect(p.url).toMatch(HTTP);
      expect(p.fonteUrl).toMatch(HTTP);
      expect(p.plataforma.trim().length).toBeGreaterThan(1);
      expect(p.dataAcesso).toMatch(ISO);
    }
  });

  it("filtra por instituição e por busca", () => {
    expect(listarProjetos({ instituicao: "UFVJM" }).length).toBe(PROJETOS.length);
    expect(listarProjetos({ busca: "fibromialgia" }).length).toBe(1);
  });
});

describe("universidades — agregados", () => {
  it("o cartão de topo bate com os arrays", () => {
    const r = resumirUniversidades();
    expect(r.instituicoes).toBe(INSTITUICOES.length);
    expect(r.unidades).toBe(UNIDADES.length);
    expect(r.grupos).toBe(GRUPOS.length);
    expect(r.projetos).toBe(PROJETOS.length);
    expect(r.areas).toBe(areasDisponiveis().length);
    expect(r.ufs).toBe(new Set(INSTITUICOES.map((i) => i.uf)).size);
    expect(r.verificadoEm).toMatch(ISO);
  });

  it("a data de verificação é a mais recente do acervo", () => {
    const todas = [
      ...INSTITUICOES.map((i) => i.dataAcesso),
      ...GRUPOS.map((g) => g.dataAcesso),
      ...PROJETOS.map((p) => p.dataAcesso),
    ].sort();
    expect(dataMaisRecente()).toBe(todas[todas.length - 1]);
  });
});

describe("universidades — privacidade", () => {
  it("não carrega sequência de 11 dígitos (CPF) no acervo", () => {
    const texto = JSON.stringify({ INSTITUICOES, UNIDADES, GRUPOS, PROJETOS });
    expect(texto).not.toMatch(/\d{11}/);
  });
});
