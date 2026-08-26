import { describe, expect, test } from "vitest";

import {
  ATI_BIBLIOTECA_LABEL,
  bibliotecaAti,
  coberturaBiblioteca,
  ehItemBloqueadoPelaTriagem,
  fontesBiblioteca,
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
  test("o acervo foi coletado e tem tamanho plausível", async () => {
    const [itens, cobertura] = await Promise.all([bibliotecaAti(), coberturaBiblioteca()]);
    expect(cobertura.geradoEm).not.toBe("");
    expect(itens.length).toBeGreaterThan(400);
    expect(cobertura.publicados).toBe(itens.length);
  });

  test("id e URL são únicos — coleta que duplica infla a contagem", async () => {
    const itens = await bibliotecaAti();
    expect(new Set(itens.map((i) => i.id)).size).toBe(itens.length);
    expect(new Set(itens.map((i) => i.url)).size).toBe(itens.length);
  });

  /**
   * A regra que dá nome ao acervo. `docs/FONTES-BRUMADINHO-UFMG.md`: "linkar,
   * não copiar". Um link direto para `.pdf`/`.docx` faria a tela entregar o
   * arquivo sem passar pela fonte — que é quem responde por ele e pode
   * corrigi-lo — e valeria como redistribuição de obra sem licença declarada.
   *
   * Exceção documentada: o NACAB não publica uma página individual por item —
   * sua biblioteca é uma única página de listagem com links diretos para os
   * PDFs. Para essa fonte, a URL do arquivo é a única referência honesta; o
   * portal continua não hospedando o arquivo, apenas linkando para ele.
   */
  test("nenhum item aponta para o arquivo, só para a página da fonte (exceto NACAB)", async () => {
    const itens = await bibliotecaAti();
    const arquivos = itens.filter(
      (i) => i.ati !== "nacab" && /\.(pdf|docx?|xlsx?|pptx?|zip)(\?|#|$)/i.test(i.url)
    );
    expect(arquivos).toEqual([]);
    // Garante que a exceção não esvaziou o NACAB por engano.
    const nacab = itens.filter((i) => i.ati === "nacab");
    expect(nacab.length).toBeGreaterThan(0);
    expect(nacab.every((i) => i.url.startsWith("https://nacab.org.br/"))).toBe(true);
  });

  test("todo item aponta para o domínio da própria ATI, em https", async () => {
    const itens = await bibliotecaAti();
    const dominio: Record<string, string> = {
      aedas: "https://aedasmg.org/",
      guaicuy: "https://guaicuy.org.br/",
      nacab: "https://nacab.org.br/",
    };
    const fora = itens.filter((i) => !i.url.startsWith(dominio[i.ati] ?? "\0"));
    expect(fora).toEqual([]);
  });

  /**
   * Não existe campo de resumo, e isso é estrutural: nenhuma das duas fontes
   * publica `excerpt`, então qualquer texto descritivo aqui teria sido escrito
   * por este portal sobre obra de terceiro. Se alguém acrescentar o campo, que
   * seja com a autoria da fonte declarada — e este teste caindo é o aviso.
   */
  test("nenhum item carrega resumo, descrição ou corpo de texto", async () => {
    const itens = await bibliotecaAti();
    const proibidos = ["resumo", "descricao", "conteudo", "excerpt", "citacao"];
    const comTexto = itens.filter((i) =>
      proibidos.some((c) => c in (i as unknown as Record<string, unknown>))
    );
    expect(comTexto).toEqual([]);
  });

  test("a triagem de dado pessoal rodou e nada que ela aponta foi publicado", async () => {
    const [itens, cobertura] = await Promise.all([bibliotecaAti(), coberturaBiblioteca()]);
    expect(itens.filter(ehItemBloqueadoPelaTriagem)).toEqual([]);
    expect(cobertura.barradosPelaTriagem).toBeGreaterThanOrEqual(0);
  });

  test("toda fonte declara licença e método — sem isso o acervo não é auditável", async () => {
    const [itens, fontes] = await Promise.all([bibliotecaAti(), fontesBiblioteca()]);
    expect(fontes.length).toBeGreaterThan(0);
    for (const f of fontes) {
      expect(f.licenca).not.toBe("");
      expect(f.metodo).not.toBe("");
      expect(f.itens).toBeGreaterThan(0);
      expect(itens.filter((i) => i.fonte_id === f.id).length).toBe(f.itens);
    }
  });

  test("toda ATI presente tem rótulo, e o período sai das datas reais", async () => {
    const [itens, cobertura] = await Promise.all([bibliotecaAti(), coberturaBiblioteca()]);
    for (const ati of new Set(itens.map((i) => i.ati))) {
      expect(ATI_BIBLIOTECA_LABEL[ati]).toBeTruthy();
    }
    expect(cobertura.periodo.de <= cobertura.periodo.ate).toBe(true);
    expect(cobertura.periodo.de).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("os vocabulários de filtro não têm entrada vazia", async () => {
    const itens = await bibliotecaAti();
    expect(tiposDaBiblioteca(itens).filter((t) => !t.trim())).toEqual([]);
    expect(temasDaBiblioteca(itens).filter((t) => !t.trim())).toEqual([]);
  });
});
