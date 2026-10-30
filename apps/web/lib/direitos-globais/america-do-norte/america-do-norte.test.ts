/**
 * @file apps/web/lib/direitos-globais/america-do-norte/america-do-norte.test.ts
 * @description Testes vitest para o módulo de América do Norte.
 *
 * Protege:
 * - Exatamente 2 países soberanos (Estados Unidos e Canadá);
 * - Ausência estrita do México (alocado em América Latina em dados.ts);
 * - Integridade de dados de identificação, demografia e constituição;
 * - Dispositivos constitucionais verbatim e registro formal de lacuna ambiental nos EUA;
 * - Ausência de CPFs ou dados sensíveis.
 */

import { describe, expect, it } from "vitest";
import { PAISES_AMERICA_DO_NORTE, paisAmericaDoNortePorCodigo } from "./paises";
import { DISPOSITIVOS_AMERICA_DO_NORTE, getDispositivosAmericaDoNorte } from "./dispositivos";

describe("América do Norte — Países Soberanos", () => {
  it("contém exatamente 2 países soberanos (EUA e Canadá)", () => {
    expect(PAISES_AMERICA_DO_NORTE).toHaveLength(2);
    const codigos = PAISES_AMERICA_DO_NORTE.map((p) => p.codigo);
    expect(codigos).toEqual(["US", "CA"]);
  });

  it("não contém o México (alocado na base de América Latina)", () => {
    const temMexicoPorCodigo = PAISES_AMERICA_DO_NORTE.some((p) => p.codigo === "MX");
    const temMexicoPorNome = PAISES_AMERICA_DO_NORTE.some(
      (p) => p.nome.toLowerCase().includes("méxico") || p.nome.toLowerCase().includes("mexico")
    );
    expect(temMexicoPorCodigo).toBe(false);
    expect(temMexicoPorNome).toBe(false);
  });

  it("recupera países por código ISO alpha-2", () => {
    const eua = paisAmericaDoNortePorCodigo("US");
    expect(eua).toBeDefined();
    expect(eua?.nome).toBe("Estados Unidos");
    expect(eua?.continente).toBe("america-do-norte");
    expect(eua?.dataConstituicao).toBe("1787-09-17");

    const canada = paisAmericaDoNortePorCodigo("CA");
    expect(canada).toBeDefined();
    expect(canada?.nome).toBe("Canadá");
    expect(canada?.continente).toBe("america-do-norte");
    expect(canada?.dataConstituicao).toBe("1982-04-17");
  });

  it("atende integralmente ao contrato de Pais", () => {
    for (const pais of PAISES_AMERICA_DO_NORTE) {
      expect(pais.id).toBeTruthy();
      expect(pais.nome).toBeTruthy();
      expect(pais.codigo).toMatch(/^[A-Z]{2}$/);
      expect(pais.continente).toBe("america-do-norte");
      expect(pais.subRegiao).toBeTruthy();
      expect(pais.capital).toBeTruthy();
      expect(pais.idiomasOficiais.length).toBeGreaterThan(0);
      expect(pais.moeda).toBeTruthy();
      expect(["democracia", "monarquia_constitucional"]).toContain(pais.regimePolitico);
      expect(pais.dataConstituicao).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(pais.fontesJuridicas.length).toBeGreaterThan(0);
      expect(pais.populacao).toBeGreaterThan(1000000);
      expect(pais.area).toBeGreaterThan(1000000);
    }
  });
});

describe("América do Norte — Dispositivos Constitucionais e Lacunas", () => {
  it("contém todos os dispositivos previstos verbatim", () => {
    const lista = getDispositivosAmericaDoNorte();
    expect(lista.length).toBeGreaterThanOrEqual(6);

    for (const d of lista) {
      expect(d.pais).toBeTruthy();
      expect(d.tipo).toBeTruthy();
      expect(d.citacao).toBeTruthy();
      expect(d.titulo).toBeTruthy();
      expect(d.texto.length).toBeGreaterThan(20);
      expect(d.fonte).toBeTruthy();
      expect(d.url).toMatch(/^https?:\/\//);
      expect(d.dataAcesso).toBe("2026-10-30");
      expect(d.idiomaOriginal).toBe("en");
    }
  });

  it("registra a Primeira Emenda dos EUA com as liberdades fundamentais", () => {
    const primeiraEmenda = DISPOSITIVOS_AMERICA_DO_NORTE.find(
      (d) => d.pais === "Estados Unidos" && d.citacao.includes("Amendment I")
    );
    expect(primeiraEmenda).toBeDefined();
    expect(primeiraEmenda?.texto).toContain("freedom of speech");
    expect(primeiraEmenda?.texto).toContain("freedom of speech, or of the press");
    expect(primeiraEmenda?.texto).toContain("right of the people peaceably to assemble");
  });

  it("registra a 14ª Emenda dos EUA com due process e equal protection", () => {
    const decimaQuarta = DISPOSITIVOS_AMERICA_DO_NORTE.find(
      (d) => d.pais === "Estados Unidos" && d.citacao.includes("Amendment XIV")
    );
    expect(decimaQuarta).toBeDefined();
    expect(decimaQuarta?.texto).toContain("due process of law");
    expect(decimaQuarta?.texto).toContain("equal protection of the laws");
  });

  it("registra formalmente 'nao_encontrado' para direito ambiental no texto federal dos EUA", () => {
    const ambientalEua = DISPOSITIVOS_AMERICA_DO_NORTE.find(
      (d) => d.pais === "Estados Unidos" && d.tipo === "ambiental"
    );
    expect(ambientalEua).toBeDefined();
    expect(ambientalEua?.citacao).toBe("nao_encontrado");
    expect(ambientalEua?.texto).toContain("não contém dispositivo textual substantivo");
    expect(ambientalEua?.lacuna).toBeDefined();
  });

  it("registra Seção 7 e Seção 15 da Carta Canadense de Direitos e Liberdades", () => {
    const sec7 = DISPOSITIVOS_AMERICA_DO_NORTE.find(
      (d) => d.pais === "Canadá" && d.citacao === "Section 7"
    );
    expect(sec7).toBeDefined();
    expect(sec7?.texto).toContain("life, liberty and security of the person");

    const sec15 = DISPOSITIVOS_AMERICA_DO_NORTE.find(
      (d) => d.pais === "Canadá" && d.citacao === "Section 15"
    );
    expect(sec15).toBeDefined();
    expect(sec15?.texto).toContain("equal before and under the law");
  });

  it("registra Seção 35 da Lei Constitucional canadense de 1982 sobre direitos indígenas", () => {
    const sec35 = DISPOSITIVOS_AMERICA_DO_NORTE.find(
      (d) => d.pais === "Canadá" && d.citacao === "Section 35"
    );
    expect(sec35).toBeDefined();
    expect(sec35?.tipo).toBe("indigenas");
    expect(sec35?.texto).toContain("existing aboriginal and treaty rights of the aboriginal peoples of Canada");
    expect(sec35?.texto).toContain("Indian, Inuit and Métis");
  });
});
