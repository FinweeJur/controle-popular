/**
 * @file apps/web/lib/universidades/filtros.test.ts
 * @description Testes dos filtros do painel universitário.
 *
 * Protege o que o leitor vê: eixo vazio não filtra, termo com acento casa,
 * UF resolve pela instituição, ano usa o campo certo em cada tipo e ninguém
 * some da lista por engano.
 */

import { describe, expect, it } from "vitest";
import { filtrarGrupos, filtrarProjetos, type FiltroPainel } from "./filtros";
import type {
  GrupoPesquisa,
  Instituicao,
  ProjetoExtensao,
} from "./tipos";

const INSTITUICOES: Instituicao[] = [
  {
    sigla: "UFVJM",
    nome: "Universidade Federal dos Vales do Jequitinhonha e Mucuri",
    tipo: "federal",
    uf: "MG",
    municipios: ["Diamantina"],
    site: "https://ufvjm.edu.br",
    links: [],
    fonteUrl: "https://ufvjm.edu.br",
    dataAcesso: "2026-10-31",
  },
  {
    sigla: "UFRGS",
    nome: "Universidade Federal do Rio Grande do Sul",
    tipo: "federal",
    uf: "RS",
    municipios: ["Porto Alegre"],
    site: "https://ufrgs.br",
    links: [],
    fonteUrl: "https://ufrgs.br",
    dataAcesso: "2026-10-31",
  },
];

const porSigla = new Map(INSTITUICOES.map((i) => [i.sigla, i]));

const base: FiltroPainel = { termos: [], instituicoesPorSigla: porSigla };

const GRUPOS: GrupoPesquisa[] = [
  {
    instituicao: "UFVJM",
    nome: "Grupo de Estudos em Saúde Coletiva",
    area: "Saúde Coletiva",
    areaConhecimento: "Ciências da Saúde",
    areaTematica: ["saude"],
    lider: "Ana Souza",
    anoReferencia: 2026,
    fonteUrl: "https://exemplo.test/1",
    dataAcesso: "2026-10-31",
  },
  {
    instituicao: "UFRGS",
    nome: "Núcleo de Agroecologia",
    area: "Agronomia",
    areaConhecimento: "Ciências Agrárias",
    areaTematica: ["agroecologia"],
    lider: "João Lima",
    anoReferencia: 2026,
    fonteUrl: "https://exemplo.test/2",
    dataAcesso: "2026-10-31",
  },
];

const PROJETOS: ProjetoExtensao[] = [
  {
    instituicao: "UFVJM",
    nome: "Fisioterapia Aquática para Fibromialgia",
    area: "Ciências da Saúde",
    areaTematica: ["saude"],
    areaTematicaFonte: "Saúde",
    coordenador: "Maria Pereira",
    inicio: "2024-09-20",
    fim: "2026-12-31",
    url: "https://exemplo.test/p1",
    plataforma: "SIEXC",
    fonteUrl: "https://exemplo.test",
    dataAcesso: "2026-10-31",
  },
];

describe("filtrarGrupos", () => {
  it("sem filtro devolve tudo, em ordem de nome", () => {
    const saida = filtrarGrupos(GRUPOS, base);
    expect(saida.map((g) => g.nome)).toEqual([
      "Grupo de Estudos em Saúde Coletiva",
      "Núcleo de Agroecologia",
    ]);
  });

  it("filtra por UF resolvida pela instituição", () => {
    expect(filtrarGrupos(GRUPOS, { ...base, uf: "RS" })).toHaveLength(1);
  });

  it("filtra por tema e por ano", () => {
    expect(filtrarGrupos(GRUPOS, { ...base, tema: "saude" })).toHaveLength(1);
    expect(filtrarGrupos(GRUPOS, { ...base, ano: "2025" })).toHaveLength(0);
  });

  it("busca tolera acento no texto do registro", () => {
    expect(filtrarGrupos(GRUPOS, { ...base, termos: ["saude"] })).toHaveLength(1);
  });
});

describe("filtrarProjetos", () => {
  it("busca por coordenador", () => {
    expect(
      filtrarProjetos(PROJETOS, { ...base, termos: ["maria"] }),
    ).toHaveLength(1);
  });

  it("filtra pelo ano de início", () => {
    expect(filtrarProjetos(PROJETOS, { ...base, ano: "2024" })).toHaveLength(1);
    expect(filtrarProjetos(PROJETOS, { ...base, ano: "2026" })).toHaveLength(0);
  });

  it("UF de outra instituição não casa", () => {
    expect(filtrarProjetos(PROJETOS, { ...base, uf: "RS" })).toHaveLength(0);
  });
});
