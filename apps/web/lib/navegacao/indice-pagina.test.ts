import { describe, it, expect } from "vitest";
import { coletarSecoes, slugDeTitulo } from "./indice-pagina";

/**
 * O slug do sumário é o que o link `#ancora` usa. Testa a função REAL do
 * componente `IndicePagina` (antes este arquivo reimplementava o slug inline —
 * teste que passava sem exercitar o código).
 */
describe("slugDeTitulo — âncora do sumário de página", () => {
  it("gera slugs sem acentos e válidos para âncoras HTML", () => {
    expect(slugDeTitulo("1. Gráficos de Distribuição Regional", 0)).toBe(
      "1-graficos-de-distribuicao-regional"
    );
    expect(slugDeTitulo("Quem tem direito à indenização?", 1)).toBe(
      "quem-tem-direito-a-indenizacao"
    );
    expect(slugDeTitulo("Vulnerabilidade & Risco (BATER / CEMADEN)", 2)).toBe(
      "vulnerabilidade-risco-bater-cemaden"
    );
  });

  it("garante fallback numérico para títulos com apenas símbolos", () => {
    expect(slugDeTitulo("???", 5)).toBe("secao-5");
    expect(slugDeTitulo("", 3)).toBe("secao-3");
  });
});

/**
 * Testa `coletarSecoes` com um DOM falso mínimo — o vitest daqui roda em
 * `environment: "node"` (sem jsdom, e sem adicionar dependência para isto).
 * O objeto falso entrega só o que a função toca: tagName, textContent, id e
 * closest(). A regra guardada aqui é a quebra silenciosa possível: heading
 * do próprio sumário ou do header inicial entrando na lista e virando
 * link que aponta para o título errado.
 */
function falsoHeading(
  tag: "h2" | "h3",
  texto: string,
  opcoes: { id?: string; noSumario?: boolean; noHeader?: boolean; noBoilerplate?: boolean } = {}
) {
  return {
    tagName: tag.toUpperCase(),
    textContent: texto,
    id: opcoes.id ?? "",
    closest(seletor: string) {
      if (seletor.includes("Sum") && opcoes.noSumario) {
        return {};
      }
      if (seletor === "header" && opcoes.noHeader) {
        return {};
      }
      if (seletor.includes("data-ignorar-indice") && opcoes.noBoilerplate) {
        return {};
      }
      return null;
    },
  };
}

function falsoContainer(headings: ReturnType<typeof falsoHeading>[]) {
  return {
    querySelectorAll() {
      return headings;
    },
  } as unknown as ParentNode;
}

describe("coletarSecoes — coleta compartilhada do sumário e dos Capítulos", () => {
  it("lista h2 e h3 em ordem de documento, com nivel correto", () => {
    const c = falsoContainer([
      falsoHeading("h2", "Dados do licenciamento"),
      falsoHeading("h3", "Licenças ativas"),
      falsoHeading("h2", "Taxas de expedição"),
    ]);
    const itens = coletarSecoes(c);
    expect(itens).toEqual([
      { id: "dados-do-licenciamento", titulo: "Dados do licenciamento", nivel: 2 },
      { id: "licencas-ativas", titulo: "Licenças ativas", nivel: 3 },
      { id: "taxas-de-expedicao", titulo: "Taxas de expedição", nivel: 2 },
    ]);
  });

  it("grava id no heading que não tinha e reutiliza o id que já existia", () => {
    const semId = falsoHeading("h2", "Orçamento");
    const comId = falsoHeading("h2", "Despesas", { id: "custom" });
    const itens = coletarSecoes(falsoContainer([semId, comId]));
    expect(semId.id).toBe("orcamento");
    expect(comId.id).toBe("custom");
    expect(itens.map((i) => i.id)).toEqual(["orcamento", "custom"]);
  });

  it("ignora heading dentro do sumário e o header inicial (idx 0)", () => {
    // O sumário é ignorado SEMPRE (closest do nav); o header só na PRIMEIRA
    // posição (idx 0) — h2 de header depois do conteúdo é conteúdo de verdade.
    const c = falsoContainer([
      falsoHeading("h2", "Título do site", { noHeader: true }),
      falsoHeading("h2", "Sumário desta página", { noSumario: true }),
      falsoHeading("h2", "Conteúdo de verdade"),
    ]);
    const itens = coletarSecoes(c);
    expect(itens).toEqual([
      { id: "conteudo-de-verdade", titulo: "Conteúdo de verdade", nivel: 2 },
    ]);
  });

  it("ignora heading de seção marcada com data-ignorar-indice (boilerplate)", () => {
    // Defeito medido 14/10/2026: "As outras frentes"/"Contatos úteis"/
    // "Explore o portal" (títulos iguais em 10–15 páginas) entravam nos
    // capítulos e viravam "capítulo genérico".
    const c = falsoContainer([
      falsoHeading("h2", "Conteúdo desta página"),
      falsoHeading("h2", "As outras frentes", { noBoilerplate: true }),
      falsoHeading("h3", "Quem ocupa, quem indicou", { noBoilerplate: true }),
      falsoHeading("h2", "Conteúdo específico"),
    ]);
    const itens = coletarSecoes(c);
    expect(itens).toEqual([
      { id: "conteudo-desta-pagina", titulo: "Conteúdo desta página", nivel: 2 },
      { id: "conteudo-especifico", titulo: "Conteúdo específico", nivel: 2 },
    ]);
  });
});
