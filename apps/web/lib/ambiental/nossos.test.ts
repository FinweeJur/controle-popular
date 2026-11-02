/**
 * @file Teste da dimensão do painel da Coleção Nossos.
 *
 * O QUE PROTEGE: o número que aparece no botão da faceta e o tamanho da lista
 * saem da MESMA função (`lugaresDoRecorte`). Se alguém filtrar a página por
 * fora desta lib, o N do botão passa a discordar do cartão — e o leitor não
 * tem como saber qual dos dois está certo.
 *
 * Também trava duas decisões editoriais: recorte desconhecido na URL não vira
 * 404 (mostra a união) e a união É a soma das facetas, sem ficha contada duas
 * vezes.
 */

import { describe, it, expect } from "vitest";
import {
  RECORTES_NOSSOS,
  contarRecorte,
  facetasNossos,
  hrefColecao,
  lugaresDoRecorte,
  recortePorSlug,
} from "./nossos";

describe("painel da Coleção Nossos", () => {
  it("a união é exatamente a soma das facetas, sem sobreposição", () => {
    const soma = RECORTES_NOSSOS.reduce((total, recorte) => total + contarRecorte(recorte), 0);
    expect(lugaresDoRecorte()).toHaveLength(soma);
    expect(facetasNossos().reduce((total, faceta) => total + faceta.n, 0)).toBe(soma);
  });

  it("cada faceta tem ao menos uma ficha (botão vazio não se publica)", () => {
    for (const faceta of facetasNossos()) {
      expect(faceta.n, `faceta sem ficha: ${faceta.slug}`).toBeGreaterThan(0);
    }
  });

  it("o recorte devolve só os tipos dele", () => {
    for (const recorte of RECORTES_NOSSOS) {
      const tipos = new Set(recorte.tipos);
      for (const lugar of lugaresDoRecorte(recorte)) {
        expect(tipos.has(lugar.tipo)).toBe(true);
      }
    }
  });

  it("slug válido acha o recorte; desconhecido devolve undefined", () => {
    expect(recortePorSlug("rios")?.slug).toBe("rios");
    expect(recortePorSlug(["serras"])?.slug).toBe("serras");
    expect(recortePorSlug("lagos")).toBeUndefined();
    expect(recortePorSlug()).toBeUndefined();
  });

  it("a URL do recorte é a mesma que o botão usa", () => {
    expect(hrefColecao()).toBe("/ambiental/nossos");
    for (const recorte of RECORTES_NOSSOS) {
      expect(hrefColecao(recorte.slug)).toBe(`/ambiental/nossos?colecao=${recorte.slug}`);
    }
  });
});
