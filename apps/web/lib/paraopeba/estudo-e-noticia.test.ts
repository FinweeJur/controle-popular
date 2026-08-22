import { describe, expect, test } from "vitest";

import { CASAMENTOS_ESTUDO_NOTICIA, COBERTURA_CASAMENTO_ESTUDO } from "./estudo-e-noticia";

/**
 * Contrato do casamento notícia-de-ATI × documento-do-acervo (Tarefa 1,
 * `cp-acordos-mg`). O que trava aqui não é "achamos 13 notícias de estudo" —
 * é a REGRA: toda notícia listada tem evidência (nunca tema em comum), todo
 * `documento: null` tem `motivo` escrito, e o número de casamentos FORTES não
 * cai por baixo do medido. Se cair, alguém afrouxou a régua de evidência sem
 * perceber — ver o cabeçalho de `estudo-e-noticia.ts` para a régua completa.
 */
describe("casamento estudo × notícia das ATIs", () => {
  test("são as 13 notícias medidas, uma vez cada", () => {
    expect(CASAMENTOS_ESTUDO_NOTICIA.length).toBe(13);
    const ids = CASAMENTOS_ESTUDO_NOTICIA.map((c) => c.noticia.id);
    expect(new Set(ids).size).toBe(13);
  });

  test("cobertura medida bate com o array — número não foi digitado à mão", () => {
    expect(COBERTURA_CASAMENTO_ESTUDO.total).toBe(CASAMENTOS_ESTUDO_NOTICIA.length);
    expect(COBERTURA_CASAMENTO_ESTUDO.fortes + COBERTURA_CASAMENTO_ESTUDO.medias + COBERTURA_CASAMENTO_ESTUDO.nulas).toBe(
      COBERTURA_CASAMENTO_ESTUDO.total
    );
  });

  /**
   * A trava pedida pela tarefa: "trave em teste o número de casamentos
   * fortes — se cair, alguém afrouxou a régua". Medido em 21/08/2026: 5
   * fortes (er05→Revista Cinco Anos, pj11→Resumo da perícia UFMG,
   * ra02/ra04/ra05→Informes AECOM da biblioteca), 1 média (pj05→Dossiê
   * Acesso à Justiça), 7 nulas (o resto — ver `motivo` de cada uma).
   */
  test("casamentos fortes não caem abaixo de 5", () => {
    expect(COBERTURA_CASAMENTO_ESTUDO.fortes).toBe(5);
  });

  test("toda notícia sem documento tem motivo escrito — null nunca é silencioso", () => {
    for (const c of CASAMENTOS_ESTUDO_NOTICIA) {
      if (c.documento === null) {
        expect(c.forca, `${c.noticia.id}: documento null tem que ser força "nula"`).toBe("nula");
        expect(c.motivo, `${c.noticia.id}: documento null sem motivo`).toBeTruthy();
        expect(c.motivo!.length).toBeGreaterThan(20);
      } else {
        expect(c.forca, `${c.noticia.id}: documento presente não pode ser força "nula"`).not.toBe("nula");
      }
    }
  });

  test("toda evidência é um fato, nunca só o nome do tema", () => {
    for (const c of CASAMENTOS_ESTUDO_NOTICIA) {
      expect(c.evidencia.length, `${c.noticia.id}: evidência vazia ou curta demais`).toBeGreaterThan(30);
      // A armadilha que relacionados.ts já evita: "mesmo tema" sozinho não é evidência.
      expect(c.evidencia.trim().toLowerCase()).not.toBe("mesmo tema");
    }
  });

  test("documento casado sempre tem url e fonte válidas", () => {
    for (const c of CASAMENTOS_ESTUDO_NOTICIA) {
      if (c.documento) {
        expect(["pericia-ufmg", "biblioteca-ati"]).toContain(c.documento.fonte);
        expect(c.documento.url.startsWith("http")).toBe(true);
        expect(c.documento.titulo.length).toBeGreaterThan(0);
      }
    }
  });

  /**
   * O cruzamento mais valioso do acervo (apontado na tarefa): duas notícias
   * do Guaicuy falam de "resultado da UFMG" — só uma casa (pj11, com os 7
   * documentos de nov/2025), a outra (er04) revela uma lacuna real (estudo de
   * 2023 ausente do acervo raspado). As duas têm que continuar existindo e
   * continuar com `ati: "guaicuy"`, senão o achado desaparece sem ninguém notar.
   */
  test("pj11 e er04 são as duas notícias do Guaicuy sobre resultado da UFMG", () => {
    const pj11 = CASAMENTOS_ESTUDO_NOTICIA.find((c) => c.noticia.id === "pj11");
    const er04 = CASAMENTOS_ESTUDO_NOTICIA.find((c) => c.noticia.id === "er04");
    expect(pj11?.noticia.ati).toBe("guaicuy");
    expect(er04?.noticia.ati).toBe("guaicuy");
    expect(pj11?.documento?.fonte).toBe("pericia-ufmg");
    expect(er04?.documento).toBeNull();
  });

  /**
   * Achado secundário, travado para não se perder numa edição futura:
   * pj08 e in01 apontam para a MESMA url em `clipping-ati.ts`, apesar de
   * datas e resumos diferentes — provável duplicidade no painel-fonte
   * original. Se algum dia isso for corrigido lá, este teste avisa aqui.
   */
  test("pj08 e in01 (NACAB) compartilham a mesma url-fonte", () => {
    const pj08 = CASAMENTOS_ESTUDO_NOTICIA.find((c) => c.noticia.id === "pj08");
    const in01 = CASAMENTOS_ESTUDO_NOTICIA.find((c) => c.noticia.id === "in01");
    expect(pj08?.noticia.url).toBe(in01?.noticia.url);
  });

  test("nenhuma notícia do NACAB casa com a biblioteca — buraco do dado-fonte, não da busca", () => {
    const nacab = CASAMENTOS_ESTUDO_NOTICIA.filter((c) => c.noticia.ati === "nacab");
    expect(nacab.length).toBeGreaterThan(0);
    for (const c of nacab) {
      expect(c.documento, `${c.noticia.id}: NACAB não deveria casar com biblioteca-ati (zero itens de NACAB nela)`).toBeNull();
    }
  });
});
