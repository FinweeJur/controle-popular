import { describe, expect, test } from "vitest";
import { barrasDither, LARGURA_MAXIMA, SerieDither } from "./dither";

const serie: SerieDither[] = [
  { valor: "Ativa", total: 100 },
  { valor: "Inativa", total: 50 },
  { valor: "Em Construção", total: 1 },
  { valor: "Zerada", total: 0 },
];

test("a maior barra ocupa a largura maxima", () => {
  const barras = barrasDither(serie);
  expect(barras[0].pontos).toBe(LARGURA_MAXIMA);
});

test("as demais escalam por razao", () => {
  const barras = barrasDither(serie);
  expect(barras[1].pontos).toBe(Math.round((50 / 100) * LARGURA_MAXIMA));
});

test("barra com valor maior que zero nunca recebe zero pontos", () => {
  // Serie mista: 1 de 100 arredonda para 0, mas o piso de 1 ponto evita
  // barra invisivel com valor maior que zero.
  const barras = barrasDither([
    { valor: "Ativa", total: 100 },
    { valor: "Em Construção", total: 1 },
  ]);
  expect(barras[1].pontos).toBe(1);
  expect(barras[0].pontos).toBe(LARGURA_MAXIMA);
});

test("barra com zero valor recebe zero pontos", () => {
  const barras = barrasDither([{ valor: "Zerada", total: 0 }]);
  expect(barras[0].pontos).toBe(0);
});

test("serie vazia devolve lista vazia", () => {
  expect(barrasDither([])).toEqual([]);
});
