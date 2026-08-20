import { describe, expect, test } from "vitest";
import { AUDITORIA_AJRI } from "./auditoria-ajri";
import { relacionadosDaFicha, MAX_ITENS_POR_ACERVO } from "./relacionados";

/**
 * A régua de relacionado é fixa (mesmo tema, até 180 dias, no máximo 3 por
 * acervo, os mais próximos no tempo) e este teste pinça os números MEDIDOS
 * em 15/08/2026 sobre os quatro acervos — mesmo padrão de `alertas.test.ts`:
 * se a fonte mudar (ficha nova, notícia nova), o teste quebra de propósito,
 * e quem atualiza vê o que mudou.
 *
 * Medição (probe-final.mts, 15/08/2026, antes deste arquivo existir):
 *   · 467 fichas, 100% de cobertura (todas com ao menos um relacionado);
 *   · média 5,58 relacionados por ficha, máximo 12 (3 × 4 acervos);
 *   · somas por acervo: 1.399 fichas do catálogo, 682 notícias de ATI, 317
 *     de instituições de justiça, 210 da imprensa.
 */

describe("relacionados da ficha AJRI", () => {
  test("a régua é determinística: a mesma ficha devolve a mesma lista", () => {
    const doc = AUDITORIA_AJRI.find((d) => d.id === 1204)!;
    const a = relacionadosDaFicha(doc);
    const b = relacionadosDaFicha(doc);
    expect(a.mesmosTemas.map((x) => x.id)).toEqual(b.mesmosTemas.map((x) => x.id));
    expect(a.noticiasAti.map((x) => x.id)).toEqual(b.noticiasAti.map((x) => x.id));
    expect(a.noticiasIj.map((x) => x.id)).toEqual(b.noticiasIj.map((x) => x.id));
    expect(a.noticiasImprensa.map((x) => x.id)).toEqual(b.noticiasImprensa.map((x) => x.id));
  });

  test("nenhum acervo passa do teto de 3 por ficha", () => {
    for (const d of AUDITORIA_AJRI) {
      const r = relacionadosDaFicha(d);
      expect(r.mesmosTemas.length).toBeLessThanOrEqual(MAX_ITENS_POR_ACERVO);
      expect(r.noticiasAti.length).toBeLessThanOrEqual(MAX_ITENS_POR_ACERVO);
      expect(r.noticiasIj.length).toBeLessThanOrEqual(MAX_ITENS_POR_ACERVO);
      expect(r.noticiasImprensa.length).toBeLessThanOrEqual(MAX_ITENS_POR_ACERVO);
    }
  });

  test("agregado medido em 15/08: 467 fichas, cobertura total, média 5,58, máximo 12", () => {
    const somas = { mesmos: 0, ati: 0, ij: 0, imprensa: 0 };
    let comQualquer = 0;
    let maxRel = 0;
    for (const d of AUDITORIA_AJRI) {
      const r = relacionadosDaFicha(d);
      somas.mesmos += r.mesmosTemas.length;
      somas.ati += r.noticiasAti.length;
      somas.ij += r.noticiasIj.length;
      somas.imprensa += r.noticiasImprensa.length;
      const total =
        r.mesmosTemas.length + r.noticiasAti.length + r.noticiasIj.length + r.noticiasImprensa.length;
      if (total > 0) comQualquer++;
      if (total > maxRel) maxRel = total;
    }
    expect(comQualquer).toBe(467);
    expect(maxRel).toBe(12);
    expect(somas).toEqual({ mesmos: 1399, ati: 682, ij: 317, imprensa: 210 });
  });

  test("ficha 1204: as 3 fichas mais próximas do mesmo tema, sem notícias ligadas", () => {
    const doc = AUDITORIA_AJRI.find((d) => d.id === 1204)!;
    const r = relacionadosDaFicha(doc);
    // Sistema de abastecimento de água + segurança hídrica: a PONTE não liga
    // esses temas a nenhum tema de ATI/IJ nem a tag de imprensa — as 3 mais
    // próximas no tempo do catálogo vencem.
    expect(r.mesmosTemas.map((x) => x.id)).toEqual([1197, 1180, 1133]);
    expect(r.mesmosTemas[0].data).toBe("2026-06-30");
    expect(r.noticiasAti).toHaveLength(0);
    expect(r.noticiasIj).toHaveLength(0);
    expect(r.noticiasImprensa).toHaveLength(0);
  });

  test("ficha 1200 (segurança do alimento): a ATI ligada pela ponte ershre aparece", () => {
    const doc = AUDITORIA_AJRI.find((d) => d.temas.includes("seguranca-do-alimento"))!;
    expect(doc.id).toBe(1200);
    const r = relacionadosDaFicha(doc);
    expect(r.noticiasAti.map((n) => n.id)).toEqual(["er08"]);
    expect(r.noticiasIj).toHaveLength(0);
    expect(r.noticiasImprensa).toHaveLength(0);
  });

  test("ficha 982 (14 temas): os 4 acervos chegam ao teto sem estourar", () => {
    const doc = AUDITORIA_AJRI.find((d) => d.id === 982)!;
    const r = relacionadosDaFicha(doc);
    expect(r.mesmosTemas).toHaveLength(3);
    expect(r.noticiasAti).toHaveLength(2);
    expect(r.noticiasIj).toHaveLength(3);
    expect(r.noticiasImprensa).toHaveLength(3);
  });
});
/**
 * A perícia da UFMG é a segunda fatia da ponte: entrou porque ganhou tema
 * estruturado (`temas-acervo.ts`), e entrou SEM a janela de 180 dias. Estes
 * testes travam a divergência de propósito — se alguém "uniformizar" a régua
 * aplicando a janela aqui, a ligação mais útil da página some em silêncio.
 */
describe("estudos da perícia como relacionados", () => {
  test("liga por tema mesmo com anos de distância — a janela não vale aqui", () => {
    // Os 7 resultados saíram todos em nov/2025; as fichas cobrem 2019–2026.
    // Uma ficha antiga sobre um eixo coberto pela perícia PRECISA ver o estudo.
    const antiga = AUDITORIA_AJRI.filter((d) => d.data < "2021-01-01").find((d) =>
      d.temas.some((t) =>
        ["risco-saude-publica", "qualidade-da-agua", "solos-e-sedimentos"].includes(t),
      ),
    );
    expect(antiga, "não há ficha anterior a 2021 nos eixos da perícia").toBeDefined();
    expect(relacionadosDaFicha(antiga!).estudosPericia.length).toBeGreaterThan(0);
  });

  test("respeita o teto por acervo", () => {
    for (const doc of AUDITORIA_AJRI) {
      expect(relacionadosDaFicha(doc).estudosPericia.length).toBeLessThanOrEqual(
        MAX_ITENS_POR_ACERVO,
      );
    }
  });

  test("todo estudo devolvido compartilha tema com a ficha — nunca por proximidade de texto", () => {
    for (const doc of AUDITORIA_AJRI.slice(0, 120)) {
      for (const estudo of relacionadosDaFicha(doc).estudosPericia) {
        expect(estudo.temas.some((t) => doc.temas.includes(t))).toBe(true);
      }
    }
  });

  test("é estável entre chamadas — a lista não dança entre builds", () => {
    const doc = AUDITORIA_AJRI.find(
      (d) => relacionadosDaFicha(d).estudosPericia.length > 1,
    );
    expect(doc).toBeDefined();
    expect(relacionadosDaFicha(doc!).estudosPericia.map((e) => e.url)).toEqual(
      relacionadosDaFicha(doc!).estudosPericia.map((e) => e.url),
    );
  });

  test("ficha de eixo que a perícia não cobre não inventa ligação", () => {
    const semCobertura = AUDITORIA_AJRI.find(
      (d) => d.temas.length > 0 && d.temas.every((t) => t === "cronograma"),
    );
    if (semCobertura) {
      expect(relacionadosDaFicha(semCobertura).estudosPericia).toEqual([]);
    }
  });
});
