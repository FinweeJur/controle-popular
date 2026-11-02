/**
 * @file Testes da lógica do painel `/congresso/analises`.
 *
 * O QUE PROTEGE: o botão da faceta, a barra de tema e a lista leem a MESMA
 * contagem. Se `filtrarPorRecorte`, `contarPorTema` ou `paginar` divergirem,
 * o painel publica número que não fecha — e o leitor não tem como conferir.
 *
 * FONTE dos casos: o contrato de `Destaque` em `lib/congresso/destaques.ts` e
 * a rubrica em `rubrica/temas.json`; os valores são sintéticos de propósito
 * (teste não depende de banco).
 */

import { describe, expect, it } from "vitest";
import type { Destaque } from "@/lib/congresso/destaques";
import {
  contarPorTema,
  filtrarPorRecorte,
  filtrarPorTema,
  hrefAnalises,
  montarVisao,
  paginaDoParam,
  paginar,
  recortePorSlug,
  restringe,
  semDuplicatas,
  temaDoParam,
} from "./analises";

/** Destaque mínimo: só os campos que o recorte e a contagem leem. */
function destaque(parcial: Partial<Destaque> & { id: string }): Destaque {
  return {
    identificacao: parcial.id.toUpperCase(),
    ementa: null,
    keywords: null,
    temas_oficiais: null,
    orgao_atual: null,
    data_apresentacao: null,
    score: 0,
    rotulo: "neutro",
    clausula_petrea: false,
    vedacao_retrocesso: false,
    resumo_neutro: null,
    modelo: null,
    analisadaEm: null,
    direitos: [],
    principal: null,
    ...parcial,
  };
}

const RESTRINGE_1 = destaque({ id: "r1", rotulo: "reducionista_forte", direitos: ["saude", "trabalho"] });
const RESTRINGE_2 = destaque({
  id: "r2",
  rotulo: "reducionista",
  direitos: ["trabalho", "seguranca_publica"],
});
const AMPLIA_1 = destaque({ id: "a1", rotulo: "garantista_forte", direitos: ["saude"] });
const AMPLIA_2 = destaque({ id: "a2", rotulo: "garantista" });
const ACERVO = [RESTRINGE_1, RESTRINGE_2, AMPLIA_1, AMPLIA_2];

describe("leitura dos parâmetros da URL", () => {
  it("aceita os dois recortes e cai em 'todas' no resto", () => {
    expect(recortePorSlug("restringem")).toBe("restringem");
    expect(recortePorSlug("ampliam")).toBe("ampliam");
    expect(recortePorSlug(undefined)).toBe("todas");
    expect(recortePorSlug("qualquer-coisa")).toBe("todas");
    expect(recortePorSlug(["ampliam", "restringem"])).toBe("ampliam");
  });

  it("tema inventado não filtra e tema real é reconhecido", () => {
    expect(temaDoParam("saude")?.slug).toBe("saude");
    expect(temaDoParam("tema-que-nao-existe")).toBeUndefined();
    expect(temaDoParam(undefined)).toBeUndefined();
  });

  it("página inválida vira 1", () => {
    expect(paginaDoParam("3")).toBe(3);
    expect(paginaDoParam("0")).toBe(1);
    expect(paginaDoParam("-2")).toBe(1);
    expect(paginaDoParam("abc")).toBe(1);
    expect(paginaDoParam(undefined)).toBe(1);
  });
});

describe("recorte por sentido do rótulo", () => {
  it("reconhece os dois lados da rubrica", () => {
    expect(restringe("reducionista")).toBe(true);
    expect(restringe("reducionista_forte")).toBe(true);
    expect(restringe("garantista")).toBe(false);
    expect(restringe(null)).toBe(false);
  });

  it("'todas' preserva o acervo inteiro e a ordem recebida", () => {
    expect(filtrarPorRecorte(ACERVO, "todas")).toEqual(ACERVO);
  });

  it("restringem e ampliam são complementares aqui — nenhum item some", () => {
    const restringem = filtrarPorRecorte(ACERVO, "restringem");
    const ampliam = filtrarPorRecorte(ACERVO, "ampliam");
    expect(restringem.map((d) => d.id)).toEqual(["r1", "r2"]);
    expect(ampliam.map((d) => d.id)).toEqual(["a1", "a2"]);
    expect(restringem.length + ampliam.length).toBe(ACERVO.length);
  });

  it("filtro de tema é aplicado depois do recorte, sem reordenar", () => {
    const tema = temaDoParam("saude");
    expect(filtrarPorTema(ACERVO, tema).map((d) => d.id)).toEqual(["r1", "a1"]);
    expect(filtrarPorTema(ACERVO, undefined)).toEqual(ACERVO);
  });
});

describe("contagem por tema", () => {
  it("conta o recorte e ordena do maior para o menor", () => {
    const barras = contarPorTema(ACERVO);
    expect(barras[0].n).toBe(Math.max(...barras.map((b) => b.n)));
    expect(barras.find((b) => b.slug === "saude")?.n).toBe(2);
    expect(barras.find((b) => b.slug === "economia")?.n).toBe(2);
  });

  it("tema sem ocorrência não vira barra de zero", () => {
    const barras = contarPorTema([RESTRINGE_2]);
    expect(barras.every((b) => b.n > 0)).toBe(true);
  });

  it("a soma das barras pode passar do total: uma proposição pode ter dois temas", () => {
    const barras = contarPorTema(ACERVO);
    const soma = barras.reduce((acc, b) => acc + b.n, 0);
    expect(soma).toBeGreaterThan(ACERVO.length);
  });
});

describe("uma proposição, um cartão", () => {
  it("duas análises da mesma proposição viram uma, a mais recente", () => {
    const antiga = destaque({
      id: "x",
      rotulo: "reducionista",
      analisadaEm: "2026-08-01",
      score: -1,
    });
    const nova = destaque({
      id: "x",
      rotulo: "garantista",
      analisadaEm: "2026-09-01",
      score: 2,
    });
    expect(semDuplicatas([antiga, RESTRINGE_2, nova])).toEqual([nova, RESTRINGE_2]);
  });

  it("ordem de primeira aparição é preservada", () => {
    const a = destaque({ id: "a", analisadaEm: "2026-01-01" });
    const b = destaque({ id: "b", analisadaEm: "2026-01-01" });
    expect(semDuplicatas([b, a]).map((d) => d.id)).toEqual(["b", "a"]);
  });
});

describe("visão do painel: um recorte alimenta todos os blocos", () => {
  const cobertura = { analisadas: 6, total: 10 };

  it("o N do botão de recorte é o tamanho da lista entregue", () => {
    const visao = montarVisao({
      restringem: [RESTRINGE_1, RESTRINGE_2],
      ampliam: [AMPLIA_1, AMPLIA_2],
      cobertura,
      recorte: "restringem",
      pagina: 1,
    });
    expect(visao.facetasDeRecorte.find((f) => f.slug === "restringem")?.n).toBe(
      visao.pagina.total
    );
    expect(visao.pagina.total).toBe(2);
    expect(visao.foraDoPainel).toBe(2);
  });

  it("tema e recorte se condicionam sem perder o denominador", () => {
    const visao = montarVisao({
      restringem: [RESTRINGE_1, RESTRINGE_2],
      ampliam: [AMPLIA_1, AMPLIA_2],
      cobertura,
      recorte: "restringem",
      tema: temaDoParam("saude"),
      pagina: 1,
    });
    expect(visao.totalNoRecorte).toBe(1);
    expect(visao.facetasDeRecorte.find((f) => f.slug === "restringem")?.n).toBe(1);
    expect(visao.facetasDeTema.find((f) => f.slug === "saude")?.n).toBe(1);
    expect(visao.barras.reduce((soma, b) => soma + b.n, 0)).toBeGreaterThanOrEqual(1);
  });
});

describe("paginação", () => {
  const lista = Array.from({ length: 41 }, (_, i) => i + 1);

  it("corta em páginas de 20 e informa os limites", () => {
    const primeira = paginar(lista, 1);
    expect(primeira.itens).toHaveLength(20);
    expect(primeira).toMatchObject({ pagina: 1, totalPaginas: 3, inicio: 1, fim: 20, total: 41 });

    const ultima = paginar(lista, 3);
    expect(ultima.itens).toEqual([41]);
    expect(ultima).toMatchObject({ pagina: 3, inicio: 41, fim: 41 });
  });

  it("página fora do intervalo é presa na borda, não devolve tela vazia", () => {
    expect(paginar(lista, 99)).toMatchObject({ pagina: 3, inicio: 41, fim: 41 });
    expect(paginar(lista, -1)).toMatchObject({ pagina: 1, inicio: 1 });
  });

  it("lista vazia tem uma página e nenhum item", () => {
    expect(paginar([], 1)).toMatchObject({
      itens: [],
      pagina: 1,
      totalPaginas: 1,
      inicio: 0,
      fim: 0,
      total: 0,
    });
  });
});

describe("URL do recorte", () => {
  it("o padrão é a rota canônica, sem query", () => {
    expect(hrefAnalises()).toBe("/congresso/analises");
    expect(hrefAnalises({ recorte: "todas", pagina: 1 })).toBe("/congresso/analises");
  });

  it("carrega o recorte, o tema e a página", () => {
    expect(hrefAnalises({ recorte: "ampliam" })).toBe("/congresso/analises?recorte=ampliam");
    expect(hrefAnalises({ recorte: "ampliam", tema: "saude" })).toBe(
      "/congresso/analises?recorte=ampliam&tema=saude"
    );
    expect(hrefAnalises({ recorte: "restringem", tema: "saude", pagina: 2 })).toBe(
      "/congresso/analises?recorte=restringem&tema=saude&pagina=2"
    );
  });

  it("trocar de faceta volta para a primeira página", () => {
    const href = hrefAnalises({ recorte: "ampliam", tema: "saude" });
    expect(href).not.toContain("pagina");
  });
});
