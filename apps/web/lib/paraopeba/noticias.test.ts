/**
 * @file Teste da dimensão do painel de notícias do Paraopeba.
 *
 * O QUE PROTEGE: que o painel nunca caia num recorte inexistente e que a URL
 * canônica carregue `?fonte=` mesmo no padrão. Se o padrão virasse a URL nua,
 * o canonical competiria com o recorte anunciado no sitemap — o mesmo defeito
 * que o painel de serviços evita.
 */

import { describe, it, expect } from "vitest";
import { FONTES_NOTICIA, FONTE_PADRAO, fontePorSlug, hrefNoticia } from "./noticias";

describe("painel de notícias do Paraopeba", () => {
  it("tem exatamente os dois recortes medidos", () => {
    expect(FONTES_NOTICIA.map((f) => f.slug)).toEqual(["bacia", "vale"]);
  });

  it("sem query cai no recorte padrão", () => {
    expect(fontePorSlug(undefined).slug).toBe(FONTE_PADRAO);
    expect(fontePorSlug("").slug).toBe(FONTE_PADRAO);
  });

  it("query desconhecida não inventa recorte", () => {
    expect(fontePorSlug("folha").slug).toBe(FONTE_PADRAO);
    expect(fontePorSlug(["vale", "bacia"]).slug).toBe("vale");
  });

  it("a URL sempre nomeia o recorte, inclusive no padrão", () => {
    expect(hrefNoticia(undefined)).toBe(`/paraopeba/noticias?fonte=${FONTE_PADRAO}`);
    expect(hrefNoticia("vale")).toBe("/paraopeba/noticias?fonte=vale");
  });
});
