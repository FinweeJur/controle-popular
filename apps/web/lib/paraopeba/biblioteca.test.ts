import { describe, expect, test } from "vitest";

import {
  ATI_BIBLIOTECA_LABEL,
  BIBLIOTECA_ATI,
  COBERTURA_BIBLIOTECA,
  FONTES_BIBLIOTECA,
  ehItemBloqueadoPelaTriagem,
  temasDaBiblioteca,
  tiposDaBiblioteca,
} from "./biblioteca";

/**
 * Contrato da biblioteca das ATIs — gerada por
 * `scripts/coletar-biblioteca-ati.py` a partir das APIs vivas da AEDAS e do
 * Guaicuy.
 *
 * O que estes testes travam não é o número (ele cresce quando as ATIs
 * publicam), é a REGRA: nada de arquivo, nada de resumo, nada que a triagem
 * aponte, e todo item com link para a fonte. Uma coleta futura que quebre
 * qualquer uma dessas quatro coisas vira erro aqui e não vira página.
 */
describe("biblioteca das ATIs", () => {
  test("o acervo foi coletado e tem tamanho plausível", () => {
    expect(COBERTURA_BIBLIOTECA.geradoEm).not.toBe("");
    expect(BIBLIOTECA_ATI.length).toBeGreaterThan(400);
    expect(COBERTURA_BIBLIOTECA.publicados).toBe(BIBLIOTECA_ATI.length);
  });

  test("id e URL são únicos — coleta que duplica infla a contagem", () => {
    expect(new Set(BIBLIOTECA_ATI.map((i) => i.id)).size).toBe(BIBLIOTECA_ATI.length);
    expect(new Set(BIBLIOTECA_ATI.map((i) => i.url)).size).toBe(BIBLIOTECA_ATI.length);
  });

  /**
   * A regra que dá nome ao acervo. `docs/FONTES-BRUMADINHO-UFMG.md`: "linkar,
   * não copiar". Um link direto para `.pdf`/`.docx` faria a tela entregar o
   * arquivo sem passar pela fonte — que é quem responde por ele e pode
   * corrigi-lo — e valeria como redistribuição de obra sem licença declarada.
   */
  test("nenhum item aponta para o arquivo, só para a página da fonte", () => {
    const arquivos = BIBLIOTECA_ATI.filter((i) =>
      /\.(pdf|docx?|xlsx?|pptx?|zip)(\?|#|$)/i.test(i.url)
    );
    expect(arquivos).toEqual([]);
  });

  test("todo item aponta para o domínio da própria ATI, em https", () => {
    const dominio: Record<string, string> = {
      aedas: "https://aedasmg.org/",
      guaicuy: "https://guaicuy.org.br/",
    };
    const fora = BIBLIOTECA_ATI.filter((i) => !i.url.startsWith(dominio[i.ati] ?? "\0"));
    expect(fora).toEqual([]);
  });

  /**
   * Não existe campo de resumo, e isso é estrutural: nenhuma das duas fontes
   * publica `excerpt`, então qualquer texto descritivo aqui teria sido escrito
   * por este portal sobre obra de terceiro. Se alguém acrescentar o campo, que
   * seja com a autoria da fonte declarada — e este teste caindo é o aviso.
   */
  test("nenhum item carrega resumo, descrição ou corpo de texto", () => {
    const proibidos = ["resumo", "descricao", "conteudo", "excerpt", "citacao"];
    const comTexto = BIBLIOTECA_ATI.filter((i) =>
      proibidos.some((c) => c in (i as unknown as Record<string, unknown>))
    );
    expect(comTexto).toEqual([]);
  });

  test("a triagem de dado pessoal rodou e nada que ela aponta foi publicado", () => {
    expect(BIBLIOTECA_ATI.filter(ehItemBloqueadoPelaTriagem)).toEqual([]);
    expect(COBERTURA_BIBLIOTECA.barradosPelaTriagem).toBeGreaterThanOrEqual(0);
  });

  test("toda fonte declara licença e método — sem isso o acervo não é auditável", () => {
    expect(FONTES_BIBLIOTECA.length).toBeGreaterThan(0);
    for (const f of FONTES_BIBLIOTECA) {
      expect(f.licenca).not.toBe("");
      expect(f.metodo).not.toBe("");
      expect(f.itens).toBeGreaterThan(0);
      expect(BIBLIOTECA_ATI.filter((i) => i.fonte_id === f.id).length).toBe(f.itens);
    }
  });

  test("toda ATI presente tem rótulo, e o período sai das datas reais", () => {
    for (const ati of new Set(BIBLIOTECA_ATI.map((i) => i.ati))) {
      expect(ATI_BIBLIOTECA_LABEL[ati]).toBeTruthy();
    }
    expect(COBERTURA_BIBLIOTECA.periodo.de <= COBERTURA_BIBLIOTECA.periodo.ate).toBe(true);
    expect(COBERTURA_BIBLIOTECA.periodo.de).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("os vocabulários de filtro não têm entrada vazia", () => {
    expect(tiposDaBiblioteca().filter((t) => !t.trim())).toEqual([]);
    expect(temasDaBiblioteca().filter((t) => !t.trim())).toEqual([]);
  });
});
