/**
 * @file escada-determinista.test.ts
 * @description Testes unitários para o módulo de escada determinística do assistente.
 */

import { describe, it, expect } from "vitest";
import { avaliarEscadaDeterminista } from "./escada-determinista";

describe("avaliarEscadaDeterminista", () => {
  it("retorna cartão de laboratório para palavras-chave de laboratório e bi", () => {
    const res1 = avaliarEscadaDeterminista("laboratorio");
    expect(res1).not.toBeNull();
    expect(res1?.tipo).toBe("laboratorio");
    expect(res1?.atalhos.some((a) => a.href === "/laboratorio")).toBe(true);

    const res2 = avaliarEscadaDeterminista("quero cruzar dados e ver powerbi");
    expect(res2?.tipo).toBe("laboratorio");

    const res3 = avaliarEscadaDeterminista("comparador de graficos");
    expect(res3?.tipo).toBe("laboratorio");

    const arvore = avaliarEscadaDeterminista("arvore obsidian");
    expect(arvore?.tipo).toBe("laboratorio");
    expect(arvore?.atalhos.some((a) => a.href === "/laboratorio/arvore")).toBe(true);
  });

  it("retorna cartão de comandos diretos para tabelas, licenças, convênios e leis", () => {
    const lic = avaliarEscadaDeterminista("licenciamento ambiental");
    expect(lic?.tipo).toBe("pagina");
    expect(lic?.atalhos.some((a) => a.href.includes("/ambiental/licenciamento"))).toBe(true);

    const conv = avaliarEscadaDeterminista("convenios");
    expect(conv?.tipo).toBe("pagina");
    expect(conv?.atalhos.some((a) => a.href === "/ambiental/convenios")).toBe(true);

    const lei = avaliarEscadaDeterminista("legislacao ambiental");
    expect(lei?.tipo).toBe("pagina");
    expect(lei?.atalhos.some((a) => a.href === "/ambiental/legislacao")).toBe(true);

    const cond = avaliarEscadaDeterminista("condicionantes");
    expect(cond?.tipo).toBe("pagina");
    expect(cond?.atalhos.some((a) => a.href === "/ambiental/condicionantes")).toBe(true);
  });

  it("o termo depois de 'licenciamento' vira busca dentro da tabela", () => {
    // O cartão de licenciamento é o único da escada que VARIA com a pergunta:
    // o que vem depois da palavra vira `?q=` na URL. Caso trave aqui, a
    // comparação com o `if` original (provada em 09/10/2026) deixa de valer.
    const comTermo = avaliarEscadaDeterminista("licenciamento de rios");
    expect(comTermo?.titulo).toBe("Licenciamento Ambiental: rios");
    expect(comTermo?.atalhos[0].href).toBe("/ambiental/licenciamento?q=rios");

    const semTermo = avaliarEscadaDeterminista("licenciamento ambiental");
    expect(semTermo?.titulo).toBe("Licenciamento Ambiental de Minas Gerais");
    expect(semTermo?.atalhos[0].href).toBe("/ambiental/licenciamento");
  });

  it("duas siglas de justiça juntas = comparativo; uma sigla = ficha", () => {
    // Regressão de 06/10/2026: a pergunta do comparativo atravessava a escada
    // e caía no degrau de notícias. A regra mora ANTES da tabela em
    // `escada-justica.ts` — se alguém puder a ordem, este teste falha.
    const comparativo = avaliarEscadaDeterminista(
      "orcamento do tjmg do mpmg e do dpmg e a disparidade entre eles"
    );
    expect(comparativo?.titulo).toBe("Instituições de Justiça de Minas Gerais");
    expect(comparativo?.atalhos.some((a) => a.href === "/judiciario/instituicoes/tjmg")).toBe(true);

    const ficha = avaliarEscadaDeterminista("tjmg");
    expect(ficha?.titulo).toBe("TJMG — Tribunal de Justiça de Minas Gerais");
  });

  it("retorna cartão de cidade para cidades específicas", () => {
    const betim = avaliarEscadaDeterminista("betim");
    expect(betim?.tipo).toBe("cidade");
    expect(betim?.titulo).toContain("Betim");
    expect(betim?.atalhos.some((a) => a.href === "/betim")).toBe(true);

    const bh = avaliarEscadaDeterminista("bh");
    expect(bh?.tipo).toBe("cidade");
    expect(bh?.titulo).toContain("Belo Horizonte");

    const diamantina = avaliarEscadaDeterminista("diamantina");
    expect(diamantina?.tipo).toBe("cidade");
    expect(diamantina?.titulo).toContain("Diamantina");

    const aracuai = avaliarEscadaDeterminista("aracuai");
    expect(aracuai?.tipo).toBe("cidade");
    expect(aracuai?.titulo).toContain("Araçuaí");

    const itinga = avaliarEscadaDeterminista("itinga");
    expect(itinga?.tipo).toBe("cidade");
    expect(itinga?.titulo).toContain("Itinga");

    const sp = avaliarEscadaDeterminista("sp");
    expect(sp?.tipo).toBe("cidade");
    expect(sp?.titulo).toContain("São Paulo");

    const cidades = avaliarEscadaDeterminista("199 cidades");
    expect(cidades?.tipo).toBe("cidade");
    expect(cidades?.atalhos.some((a) => a.href === "/cidades")).toBe(true);
  });

  it("retorna cartão de empresa para grandes corporações e mineradoras", () => {
    const vale = avaliarEscadaDeterminista("vale");
    expect(vale?.tipo).toBe("empresa");
    expect(vale?.titulo).toContain("Vale");

    const sigma = avaliarEscadaDeterminista("sigma lithium");
    expect(sigma?.tipo).toBe("empresa");
    expect(sigma?.titulo).toContain("Sigma");

    const csn = avaliarEscadaDeterminista("csn");
    expect(csn?.tipo).toBe("empresa");
    expect(csn?.titulo).toContain("CSN");

    const cemig = avaliarEscadaDeterminista("cemig");
    expect(cemig?.tipo).toBe("empresa");
    expect(cemig?.titulo).toContain("CEMIG");

    const copasa = avaliarEscadaDeterminista("copasa");
    expect(copasa?.tipo).toBe("empresa");
    expect(copasa?.titulo).toContain("COPASA");

    const empresas = avaliarEscadaDeterminista("empresas");
    expect(empresas?.tipo).toBe("empresa");
    expect(empresas?.atalhos.some((a) => a.href === "/empresas")).toBe(true);
  });

  it("retorna cartão de ferramenta para as utilidades e seções da central", () => {
    const busca = avaliarEscadaDeterminista("busca");
    expect(busca?.tipo).toBe("ferramenta");
    expect(busca?.atalhos.some((a) => a.href === "/busca")).toBe(true);

    const editais = avaliarEscadaDeterminista("editais");
    expect(editais?.tipo).toBe("ferramenta");
    expect(editais?.atalhos.some((a) => a.href === "/editais")).toBe(true);

    const biblioteca = avaliarEscadaDeterminista("biblioteca");
    expect(biblioteca?.tipo).toBe("ferramenta");
    expect(biblioteca?.atalhos.some((a) => a.href === "/biblioteca")).toBe(true);

    const imprensa = avaliarEscadaDeterminista("imprensa");
    expect(imprensa?.tipo).toBe("ferramenta");
    expect(imprensa?.atalhos.some((a) => a.href === "/imprensa")).toBe(true);

    const indice = avaliarEscadaDeterminista("indice");
    expect(indice?.tipo).toBe("ferramenta");
    expect(indice?.atalhos.some((a) => a.href === "/indice")).toBe(true);

    const doc = avaliarEscadaDeterminista("documentacao");
    expect(doc?.tipo).toBe("ferramenta");
    expect(doc?.atalhos.some((a) => a.href === "/documentacao")).toBe(true);

    const fontes = avaliarEscadaDeterminista("fontes estados");
    expect(fontes?.tipo).toBe("ferramenta");
    expect(fontes?.atalhos.some((a) => a.href === "/fontes-estados")).toBe(true);

    const sobre = avaliarEscadaDeterminista("sobre");
    expect(sobre?.tipo).toBe("ferramenta");
    expect(sobre?.atalhos.some((a) => a.href === "/sobre")).toBe(true);

    const comunicabr = avaliarEscadaDeterminista("comunicabr");
    expect(comunicabr?.tipo).toBe("ferramenta");
    expect(comunicabr?.atalhos.some((a) => a.href === "/dados/comunicabr")).toBe(true);
  });

  it("retorna cartão de notícia ou blog quando solicitado", () => {
    const noticias = avaliarEscadaDeterminista("noticias");
    expect(noticias?.tipo).toBe("noticia");
    expect(noticias?.atalhos.some((a) => a.href === "/noticias")).toBe(true);

    const tarifa = avaliarEscadaDeterminista("tarifa social de energia");
    expect(tarifa).not.toBeNull();
    expect(tarifa?.atalhos.some((a) => a.href.includes("tarifa-social"))).toBe(true);
  });

  it("retorna resposta curada para perguntas do acervo", () => {
    const res = avaliarEscadaDeterminista("como funciona o acordo de mariana");
    expect(res).not.toBeNull();
    expect(res?.tipo).toBe("curada");
    expect(res?.texto.length).toBeGreaterThan(10);
  });

  it("enriquece as respostas determinísticas com galho relacionado da árvore do site", () => {
    const betim = avaliarEscadaDeterminista("betim");
    expect(betim).not.toBeNull();
    expect(betim?.galhoRelacionado).toBeDefined();
    expect(betim?.galhoRelacionado?.eixoId).toBe("territorios");
    expect(betim?.galhoRelacionado?.links.length).toBeGreaterThan(0);

    const lab = avaliarEscadaDeterminista("laboratorio");
    expect(lab).not.toBeNull();
    expect(lab?.galhoRelacionado).toBeDefined();
    expect(lab?.galhoRelacionado?.eixoId).toBe("central");

    const tjmg = avaliarEscadaDeterminista("tjmg");
    expect(tjmg).not.toBeNull();
    expect(tjmg?.galhoRelacionado).toBeDefined();
    expect(tjmg?.galhoRelacionado?.eixoId).toBe("estado");
  });

  it("reconhece perguntas com erros de português e digitação comuns", () => {
    const licComErro = avaliarEscadaDeterminista("licensiamento ambiental");
    expect(licComErro).not.toBeNull();
    expect(licComErro?.tipo).toBe("pagina");
    expect(licComErro?.atalhos.some((a) => a.href.includes("/ambiental/licenciamento"))).toBe(true);

    const betin = avaliarEscadaDeterminista("betin");
    expect(betin).not.toBeNull();
    expect(betin?.tipo).toBe("cidade");
    expect(betin?.titulo).toContain("Betim");

    const obsidiam = avaliarEscadaDeterminista("obsidiam");
    expect(obsidiam).not.toBeNull();
    expect(obsidiam?.tipo).toBe("laboratorio");
    expect(obsidiam?.atalhos.some((a) => a.href === "/laboratorio/arvore")).toBe(true);

    const conveino = avaliarEscadaDeterminista("conveinos");
    expect(conveino).not.toBeNull();
    expect(conveino?.tipo).toBe("pagina");

    const orcameto = avaliarEscadaDeterminista("orcameto");
    expect(orcameto).not.toBeNull();
  });

  it("retorna null para perguntas arbitrárias que exigem busca profunda RAG / IA", () => {
    const res = avaliarEscadaDeterminista("qual foi o total gasto em combustivel no contrato xyz em 2023?");
    expect(res).toBeNull();
  });

  /**
   * Regressão do achado de 06/10/2026: o cartão da home "Orçamento TJMG, MPMG e
   * DPMG" devolvia a resposta de ENERGIA (assimetria tarifária). O casamento
   * pontuava palavras de função ("o", "e", "entre") e a pergunta atravessava a
   * escada até o degrau de notícias, que casava pela palavra "orçamento" no
   * título de uma reportagem sobre IPCA/Selic.
   */
  it("orçamento das instituições de justiça responde sobre justiça, não energia", () => {
    const res = avaliarEscadaDeterminista(
      "Qual o orçamento anual do TJMG, MPMG e DPMG e a disparidade entre eles?"
    );
    expect(res).not.toBeNull();
    expect(res?.titulo).toMatch(/Instituições de Justiça/i);
    expect(res?.atalhos.some((a) => a.href === "/judiciario/instituicoes")).toBe(true);
    expect(`${res?.titulo} ${res?.texto}`).not.toMatch(/kwh|energia|tarifa/i);
  });

  it("pergunta de energia continua recebendo a resposta de energia", () => {
    const res = avaliarEscadaDeterminista(
      "O que é a assimetria tarifária entre o cidadão e a grande indústria?"
    );
    expect(res?.texto).toMatch(/kWh/);
    expect(res?.atalhos.some((a) => a.href === "/recursos/estados")).toBe(true);
  });
});

