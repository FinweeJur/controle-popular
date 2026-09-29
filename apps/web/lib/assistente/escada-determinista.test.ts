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
  });

  it("retorna resposta curada para perguntas do acervo", () => {
    const res = avaliarEscadaDeterminista("como funciona o acordo de mariana");
    expect(res).not.toBeNull();
    expect(res?.tipo).toBe("curada");
    expect(res?.texto.length).toBeGreaterThan(10);
  });

  it("retorna null para perguntas gerais que exigem RAG / IA", () => {
    const res = avaliarEscadaDeterminista("qual foi o total gasto em combustivel no contrato xyz em 2023?");
    expect(res).toBeNull();
  });
});
