/**
 * @file Testes das facetas do Observatório de Empresas.
 *
 * O QUE GARANTE: o N do botão, o N da barra e o tamanho da lista saem da
 * mesma fonte; URL adulterada cai em "Todas" em vez de lista vazia; e o
 * recorte nunca altera o acervo original (o painel seguinte vê o mesmo array).
 *
 * FONTE: entidades sintéticas deste arquivo. O dado real é
 * `data/empresas-perfil/entidades-completas.json`, coberto pela página e não
 * por este teste — aqui interessa a aritmética das facetas.
 */

import { describe, expect, it } from "vitest";
import type { EntidadeDetalhada } from "./entidades-dados";
import {
  contarPorPais,
  contarPorSetor,
  filtrarPorSetor,
  hrefSetor,
  ordenarPorNome,
  paisDeOrigem,
  setorDaUrl,
} from "./painel";

function entidade(
  slug: string,
  nome: string,
  setor: EntidadeDetalhada["setor"],
  tipo: EntidadeDetalhada["tipo"] = "empresa_nacional",
  bolsa = "B3"
): EntidadeDetalhada {
  return {
    slug,
    nome,
    tipo,
    setor,
    setorRotulo: setor,
    bolsa,
  } as EntidadeDetalhada;
}

const ACERVO: EntidadeDetalhada[] = [
  entidade("vale", "Vale S.A.", "mineracao"),
  entidade("petrobras", "Petrobras", "energia"),
  entidade("blackrock", "BlackRock", "fundos_investimento", "fundo_eua", "NYSE"),
  entidade("teck", "Teck Resources", "mineracao", "empresa_canada", "TSX"),
];

describe("setorDaUrl", () => {
  it("aceita setor conhecido", () => {
    expect(setorDaUrl("mineracao")).toBe("mineracao");
  });

  it("cai em Todas para valor desconhecido, vazio ou ausente", () => {
    expect(setorDaUrl("setor-que-nao-existe")).toBeUndefined();
    expect(setorDaUrl("")).toBeUndefined();
    expect(setorDaUrl(undefined)).toBeUndefined();
  });

  it("usa o primeiro valor quando o parâmetro se repete", () => {
    expect(setorDaUrl(["energia", "mineracao"])).toBe("energia");
  });
});

describe("hrefSetor", () => {
  it("monta a URL do recorte", () => {
    expect(hrefSetor("energia")).toBe("/empresas?setor=energia");
  });

  it("devolve o painel inteiro sem setor válido", () => {
    expect(hrefSetor()).toBe("/empresas");
    expect(hrefSetor("nao-existe")).toBe("/empresas");
  });
});

describe("contarPorSetor", () => {
  it("conta o acervo inteiro e preserva o denominador", () => {
    const facetas = contarPorSetor(ACERVO);
    expect(facetas.reduce((soma, faceta) => soma + faceta.n, 0)).toBe(ACERVO.length);
    expect(facetas.find((faceta) => faceta.slug === "mineracao")?.n).toBe(2);
  });
});

describe("filtrarPorSetor", () => {
  it("recorta sem alterar o acervo original", () => {
    const recorte = filtrarPorSetor(ACERVO, "mineracao");
    expect(recorte).toHaveLength(2);
    expect(ACERVO).toHaveLength(4);
  });

  it("sem setor devolve o acervo inteiro", () => {
    expect(filtrarPorSetor(ACERVO)).toHaveLength(ACERVO.length);
  });
});

describe("origem e ordenação", () => {
  it("deriva o país do tipo e da bolsa", () => {
    expect(paisDeOrigem(ACERVO[0])).toBe("brasil");
    expect(paisDeOrigem(ACERVO[2])).toBe("eua");
    expect(paisDeOrigem(ACERVO[3])).toBe("canada");
  });

  it("conta o país dentro do recorte", () => {
    expect(contarPorPais(ACERVO)).toEqual({ brasil: 2, eua: 1, canada: 1 });
  });

  it("ordena por nome sem mexer no array recebido", () => {
    const ordenado = ordenarPorNome(ACERVO);
    expect(ordenado.map((item) => item.slug)).toEqual(["blackrock", "petrobras", "teck", "vale"]);
    expect(ACERVO[0].slug).toBe("vale");
  });
});
