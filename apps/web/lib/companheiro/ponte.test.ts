/**
 * @file ponte.test.ts
 * @description Testes da ponte responsiva: geometria pura, sem DOM. Garante
 * que a coordenada é medida/arredondada na hora e que alvo fora da tela não
 * viaja no pacote — o bichinho só aponta para o que a pessoa vê.
 */

import { describe, it, expect } from "vitest";
import {
  normalizarRetangulo,
  estaVisivel,
  montarAlvos,
  montarPacotePonte,
  origemNaTela,
  type AlvoGeometrico,
  type Viewport,
} from "./ponte";

const VIEWPORT: Viewport = { largura: 400, altura: 800 };

describe("normalizarRetangulo", () => {
  it("arredonda a caixa do DOM para inteiros", () => {
    const r = normalizarRetangulo({ left: 10.4, top: 20.6, width: 30.5, height: 9.2 }, VIEWPORT);
    expect(r).toEqual({ x: 10, y: 21, largura: 31, altura: 9 });
  });
});

describe("estaVisivel", () => {
  it("verdadeiro dentro do viewport", () => {
    expect(estaVisivel({ x: 10, y: 10, largura: 20, altura: 20 }, VIEWPORT)).toBe(true);
  });

  it("falso quando totalmente fora da tela", () => {
    expect(estaVisivel({ x: 500, y: 10, largura: 20, altura: 20 }, VIEWPORT)).toBe(false);
    expect(estaVisivel({ x: 10, y: -50, largura: 20, altura: 20 }, VIEWPORT)).toBe(false);
  });

  it("falso quando a caixa é degenerada", () => {
    expect(estaVisivel({ x: 10, y: 10, largura: 0, altura: 20 }, VIEWPORT)).toBe(false);
    expect(estaVisivel({ x: 10, y: 10, largura: 20, altura: 0 }, VIEWPORT)).toBe(false);
  });

  it("verdadeiro quando encosta na borda", () => {
    expect(estaVisivel({ x: -5, y: 10, largura: 20, altura: 20 }, VIEWPORT)).toBe(true);
  });
});

describe("montarAlvos", () => {
  it("preserva tipo, índice e calcula visibilidade", () => {
    const itens: AlvoGeometrico[] = [
      { tipo: "fonte", indice: 1, caixa: { left: 10, top: 10, width: 16, height: 16 } },
      { tipo: "abrir-pagina", caixa: { left: 10, top: 900, width: 80, height: 24 } },
    ];
    const alvos = montarAlvos(itens, VIEWPORT);
    expect(alvos[0]).toMatchObject({ tipo: "fonte", indice: 1, visivel: true });
    expect(alvos[1]).toMatchObject({ tipo: "abrir-pagina", visivel: false });
  });
});

describe("origemNaTela", () => {
  it("soma o cromo do navegador ao canto da janela", () => {
    const o = origemNaTela({
      screenX: 100,
      screenY: 50,
      outerWidth: 1000,
      outerHeight: 800,
      innerWidth: 1000,
      innerHeight: 700,
    });
    expect(o).toEqual({ x: 100, y: 150 });
  });

  it("centraliza a borda lateral quando a largura difere", () => {
    const o = origemNaTela({
      screenX: 0,
      screenY: 0,
      outerWidth: 1004,
      outerHeight: 700,
      innerWidth: 1000,
      innerHeight: 700,
    });
    expect(o).toEqual({ x: 2, y: 0 });
  });
});

describe("montarPacotePonte", () => {
  it("descarta alvos invisíveis e preenche dpr padrão", () => {
    const alvos = montarAlvos(
      [
        { tipo: "fonte", indice: 2, caixa: { left: 10, top: 10, width: 16, height: 16 } },
        { tipo: "fonte", indice: 3, caixa: { left: 10, top: 2000, width: 16, height: 16 } },
      ],
      VIEWPORT
    );
    const pacote = montarPacotePonte({
      sessaoId: "s1",
      url: "https://www.controlepopular.com.br/betim",
      origem: { x: 10, y: 90 },
      viewport: VIEWPORT,
      alvos,
      em: 123,
    });
    expect(pacote.sessaoId).toBe("s1");
    expect(pacote.viewport).toEqual({ largura: 400, altura: 800, dpr: 1 });
    expect(pacote.alvos).toHaveLength(1);
    expect(pacote.alvos[0].indice).toBe(2);
    expect(pacote.origem).toEqual({ x: 10, y: 90 });
    expect(pacote.url).toBe("https://www.controlepopular.com.br/betim");
    expect(pacote.em).toBe(123);
  });

  it("leva o dpr informado (tela de alta densidade)", () => {
    const pacote = montarPacotePonte({
      url: "https://x",
      origem: { x: 0, y: 0 },
      viewport: VIEWPORT,
      dpr: 2,
      alvos: [],
    });
    expect(pacote.viewport.dpr).toBe(2);
    expect(pacote.alvos).toEqual([]);
  });
});
