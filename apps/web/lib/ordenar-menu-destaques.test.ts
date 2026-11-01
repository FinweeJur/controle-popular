/**
 * Testes de `lib/ordenar-menu-destaques.ts` — a regra que põe os itens
 * `destaque: true` no topo de cada eixo do índice da navbar.
 *
 * O que se garante aqui: o grupo destacado sobe inteiro, os demais descem
 * inteiros, e a ordem relativa DENTRO de cada grupo não muda. Essa segunda
 * parte é a que quebraria em silêncio com um `sort` comum (não estável por
 * contrato para todos os motores): a ordem do menu é editorial.
 */
import { describe, expect, it } from "vitest";

import { destacadosPrimeiro } from "./ordenar-menu-destaques";

function rotulos<T extends { rotulo: string }>(itens: T[]): string[] {
  return itens.map((item) => item.rotulo);
}

describe("destacadosPrimeiro", () => {
  it("põe os destacados primeiro e preserva a ordem relativa de cada grupo", () => {
    const entrada = [
      { rotulo: "normal-1" },
      { rotulo: "destaque-1", destaque: true },
      { rotulo: "normal-2" },
      { rotulo: "destaque-2", destaque: true },
      { rotulo: "normal-3" },
      { rotulo: "destaque-3", destaque: true },
    ];

    expect(rotulos(destacadosPrimeiro(entrada))).toEqual([
      "destaque-1",
      "destaque-2",
      "destaque-3",
      "normal-1",
      "normal-2",
      "normal-3",
    ]);
  });

  it("trata `destaque: undefined` e `destaque: false` como grupo normal", () => {
    const entrada = [
      { rotulo: "ausente" },
      { rotulo: "falso", destaque: false },
      { rotulo: "verdadeiro", destaque: true },
      { rotulo: "ausente-2" },
    ];

    expect(rotulos(destacadosPrimeiro(entrada))).toEqual([
      "verdadeiro",
      "ausente",
      "falso",
      "ausente-2",
    ]);
  });

  it("mantém a ordem original quando todos são destacados", () => {
    const entrada = [
      { rotulo: "a", destaque: true },
      { rotulo: "b", destaque: true },
      { rotulo: "c", destaque: true },
    ];

    expect(rotulos(destacadosPrimeiro(entrada))).toEqual(["a", "b", "c"]);
  });

  it("mantém a ordem original quando nenhum é destacado", () => {
    const entrada = [{ rotulo: "a" }, { rotulo: "b", destaque: false }, { rotulo: "c" }];

    expect(rotulos(destacadosPrimeiro(entrada))).toEqual(["a", "b", "c"]);
  });

  it("devolve array novo e não muta a entrada", () => {
    const entrada = [
      { rotulo: "normal", destaque: false },
      { rotulo: "destaque", destaque: true },
    ];
    const copia = [...entrada];

    const saida = destacadosPrimeiro(entrada);

    expect(saida).not.toBe(entrada);
    expect(entrada).toEqual(copia);
    expect(rotulos(saida)).toEqual(["destaque", "normal"]);
  });

  it("aceita array vazio", () => {
    expect(destacadosPrimeiro([])).toEqual([]);
  });
});
