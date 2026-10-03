/**
 * Testes da agregação de fontes da memória.
 *
 * Travam a regra do dono (03/10/2026): a lista de fontes da `/memoria` é
 * reduzida a cinco rótulos, cada verbete cai em exatamente um deles, e o
 * número exibido é a contagem real do acervo — nunca digitado à mão.
 */

import { describe, expect, it } from "vitest";
import { CALENDARIO } from "./correcoes";
import {
  FONTES_CATALOGO,
  agregarFontes,
  rotuloDaFonte,
} from "./fontes-agregadas";

describe("rotuloDaFonte", () => {
  it("reconhece a Wikipédia (e o Wikidata) como fonte terciária", () => {
    expect(rotuloDaFonte("Wikipédia, Confederação dos Tamoios")).toBe("Wikipédia");
    expect(rotuloDaFonte("Wikidata, item estruturado")).toBe("Wikipédia");
  });

  it("não troca a ponte pela fonte: 'Wikipédia, APIB' continua Wikipédia", () => {
    expect(rotuloDaFonte("Wikipédia, APIB")).toBe("Wikipédia");
  });

  it("classifica MAB, MST, APIB e o Blog Aos que Virão", () => {
    expect(rotuloDaFonte("MAB — Movimento dos Atingidos por Barragens")).toBe("MAB");
    expect(rotuloDaFonte("Calendário Histórico das Trabalhadoras/es, MST, 2009")).toBe("MST");
    expect(rotuloDaFonte("APIB — Articulação dos Povos Indígenas do Brasil")).toBe("APIB");
    expect(rotuloDaFonte("Calendário Insurgente, Blog Aos que Virão, 2020")).toBe("Aos que Virão");
  });
});

describe("agregarFontes", () => {
  it("devolve os cinco rótulos na ordem do catálogo", () => {
    const rotulos = FONTES_CATALOGO.map((f) => f.rotulo);
    expect(rotulos).toEqual(["MST", "MAB", "APIB", "Aos que Virão", "Wikipédia"]);
  });

  it("soma todos os verbetes do acervo, sem perder nem duplicar", () => {
    const agregado = agregarFontes(CALENDARIO.map((e) => e.fonteCurta ?? ""));
    const soma = agregado.reduce((acc, f) => acc + f.total, 0);
    expect(soma).toBe(CALENDARIO.length);
  });

  it("toda fonte do acervo cai em um rótulo conhecido", () => {
    const conhecidos = new Set(FONTES_CATALOGO.map((f) => f.rotulo));
    for (const e of CALENDARIO) {
      expect(conhecidos.has(rotuloDaFonte(e.fonteCurta ?? ""))).toBe(true);
    }
  });

  it("reconhece EXPLICITAMENTE cada fonte (nada cai no default MST por engano)", () => {
    // O `rotuloDaFonte` tem o MST como default; sem esta guarda, uma fonte
    // nova (ex.: FUNAI) entraria como MST em silêncio. Aqui ela quebra.
    const reconhecida =
      /wikip|wikidata|MAB|Atingidos por Barragens|APIB|Povos Indígenas do Brasil|insurgente|Aos que Virão|Calendário Histórico|MST/i;
    for (const e of CALENDARIO) {
      expect(
        reconhecida.test(e.fonteCurta ?? ""),
        `fonte não reconhecida pela classificação: ${e.fonteCurta}`,
      ).toBe(true);
    }
  });

  it("a APIB entra no acervo com pelo menos um marco do ATL", () => {
    const agregado = agregarFontes(CALENDARIO.map((e) => e.fonteCurta ?? ""));
    const apib = agregado.find((f) => f.definicao.rotulo === "APIB");
    expect(apib?.total ?? 0).toBeGreaterThan(0);
  });

  it("Wikipédia aparece agregada (um só rótulo para todos os verbetes)", () => {
    const wiki = agregarFontes(CALENDARIO.map((e) => e.fonteCurta ?? "")).find(
      (f) => f.definicao.rotulo === "Wikipédia",
    );
    expect((wiki?.total ?? 0)).toBeGreaterThan(0);
  });
});
