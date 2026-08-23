import { describe, expect, test } from "vitest";
import DATASET, { SLUGS_PRIORITARIOS, VERIFICADO_EM, type ItemLegislacao } from "./dados";
import {
  contagemPorStatus,
  ehPrioritario,
  filtrarPorStatus,
  itensDaCidade,
  linhaDaTabela,
  linhasDaTabela,
  linkDoItem,
} from "./logica";

describe("itensDaCidade / linhasDaTabela", () => {
  test("os cinco instrumentos aparecem SEMPRE, em ordem fixa, mesmo sem dado", () => {
    const linhas = linhasDaTabela("cidade-que-nao-existe-no-dataset");
    expect(linhas.map((l) => l.chave)).toEqual([
      "lei_organica",
      "plano_diretor",
      "zoneamento",
      "codigo_tributario",
      "codigo_obras_posturas",
    ]);
    expect(linhas.every((l) => l.status === "nao_verificado")).toBe(true);
  });

  test("municipio prioritario tem os cinco instrumentos cobertos", () => {
    for (const slug of SLUGS_PRIORITARIOS) {
      const itens = itensDaCidade(slug);
      expect(itens).toHaveLength(5);
      expect(new Set(itens.map((i) => i.chave)).size).toBe(5);
    }
  });

  test("ehPrioritario reconhece os slugs do plano e recusa o resto", () => {
    expect(ehPrioritario("betim")).toBe(true);
    expect(ehPrioritario("bh")).toBe(true);
    expect(ehPrioritario("contagem")).toBe(false);
  });
});

describe("linkDoItem - a promessa editorial em codigo", () => {
  test("status encontrado devolve a URL oficial", () => {
    const item: ItemLegislacao = DATASET.betim.find((i) => i.chave === "lei_organica")!;
    expect(item.status).toBe("encontrado");
    expect(linkDoItem(item)).toContain("betim.mg.gov.br");
  });

  test("nao_encontrado e nao_verificado NUNCA têm link - nem se a URL escapar no dado", () => {
    const comUrlEscapada: ItemLegislacao = {
      chave: "plano_diretor",
      status: "nao_verificado",
      url: "https://exemplo.gov.br/nao-deveria-aparecer.pdf",
    };
    expect(linkDoItem(comUrlEscapada)).toBeNull();
    const negativo: ItemLegislacao = {
      chave: "zoneamento",
      status: "nao_encontrado",
      nota: "procurado em X e Y",
    };
    expect(linkDoItem(negativo)).toBeNull();
  });
});

describe("invariantes do dataset inteiro", () => {
  test("encontrado => url http(s) .gov.br; negativo => nota explicando onde procurar", () => {
    for (const [slug, itens] of Object.entries(DATASET)) {
      for (const item of itens) {
        if (item.status === "encontrado") {
          expect(item.url, `${slug}/${item.chave}`).toMatch(/^https?:\/\/[a-z.]*\.gov\.br/i);
          expect(item.fonteLabel, `${slug}/${item.chave}`).toBeTruthy();
        } else {
          expect(item.nota, `${slug}/${item.chave} precisa de nota`).toBeTruthy();
        }
        // Encontrado sem URL é contradição — o teste pega na hora.
        if (item.status === "encontrado" && !item.url) {
          throw new Error(`${slug}/${item.chave}: encontrado sem url`);
        }
      }
    }
  });

  test("data de verificacao presente e colada aos numeros da tela", () => {
    expect(VERIFICADO_EM).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("filtrarPorStatus + contagemPorStatus", () => {
  const linhas = linhasDaTabela("betim");

  test("filtro vazio devolve tudo; filtro por status devolve so aquele grupo", () => {
    const total = filtrarPorStatus(linhas, "");
    expect(total).toHaveLength(5);
    const encontrados = filtrarPorStatus(linhas, "encontrado");
    expect(encontrados.length).toBeGreaterThan(0);
    expect(encontrados.every((l) => l.status === "encontrado")).toBe(true);
    const verificados = filtrarPorStatus(linhas, "nao_verificado");
    expect(verificados.every((l) => l.status === "nao_verificado")).toBe(true);
  });

  test("contagens somam o total da cidade", () => {
    const c = contagemPorStatus(linhas);
    expect(c.encontrado + c.nao_encontrado + c.nao_verificado).toBe(5);
  });

  test("linhaDaTabela: href espelha o status (encontrado tem, demais nao)", () => {
    for (const item of itensDaCidade("betim")) {
      const linha = linhaDaTabela(item);
      if (item.status === "encontrado") expect(linha.href).not.toBeNull();
      else expect(linha.href).toBeNull();
    }
  });
});
