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

  it("retorna null para perguntas arbitrárias que exigem busca profunda RAG / IA", () => {
    const res = avaliarEscadaDeterminista("qual foi o total gasto em combustivel no contrato xyz em 2023?");
    expect(res).toBeNull();
  });
});

