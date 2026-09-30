/**
 * @file apps/web/lib/internacional/dados-eua-geo.test.ts
 * @description Suíte de testes para o acervo geoespacial e compacto dos Estados Unidos (/eua).
 *
 * Papel no portal:
 * Garante a integridade e precisão das feições georreferenciadas dos EUA (sedes corporativas, fundos,
 * bolsas de valores, órgãos reguladores e minas estratégicas), verificando conformidade de datum WGS84,
 * ausência de CPFs/dados pessoais e consistência do formato compacto.
 */

import { describe, it, expect } from "vitest";
import {
  COBERTURA_EUA,
  obterPontosGeoEua,
  obterPontoGeoEuaPorId,
  type TipoPontoEua,
} from "./dados-eua";

describe("dados-eua-geo.test.ts — Acervo Geoespacial dos EUA", () => {
  it("carrega todos os 29 pontos georreferenciados cadastrados na constante COBERTURA_EUA", () => {
    const pontos = obterPontosGeoEua();
    expect(pontos.length).toBe(COBERTURA_EUA.sedesCapitaisGeo);
    expect(pontos.length).toBe(29);
  });

  it("todos os pontos possuem atributos obrigatórios e coordenadas WGS84 válidas nos EUA", () => {
    const pontos = obterPontosGeoEua();

    for (const p of pontos) {
      expect(p.id).toBeTruthy();
      expect(p.nome).toBeTruthy();
      expect(p.entidade).toBeTruthy();
      expect(p.tipo).toBeTruthy();
      expect(p.setor).toBeTruthy();
      expect(p.cidade).toBeTruthy();
      expect(p.estadoUsa).toBeTruthy();
      expect(p.regulador).toBeTruthy();
      expect(p.fonteOficial).toBeTruthy();
      expect(p.descricao).toBeTruthy();

      // Coordenadas válidas no território continental dos EUA
      // Longitude ocidental (negativa entre -130 e -65)
      // Latitude setentrional (positiva entre 20 e 50)
      expect(p.latitude).toBeGreaterThanOrEqual(20);
      expect(p.latitude).toBeLessThanOrEqual(50);
      expect(p.longitude).toBeGreaterThanOrEqual(-130);
      expect(p.longitude).toBeLessThanOrEqual(-65);
    }
  });

  it("contempla os 5 tipos estratégicos requeridos pela especificação do Globo 3D", () => {
    const pontos = obterPontosGeoEua();
    const tiposEncontrados = new Set(pontos.map((p) => p.tipo));

    const tiposObrigatorios: TipoPontoEua[] = [
      "sede_corporativa",
      "fundo_investimento",
      "bolsa_valores",
      "orgao_regulador",
      "mina_estrategica",
    ];

    for (const tipo of tiposObrigatorios) {
      expect(tiposEncontrados.has(tipo)).toBe(true);
    }

    // Contagem mínima por categoria
    expect(pontos.filter((p) => p.tipo === "sede_corporativa").length).toBeGreaterThanOrEqual(5);
    expect(pontos.filter((p) => p.tipo === "fundo_investimento").length).toBeGreaterThanOrEqual(5);
    expect(pontos.filter((p) => p.tipo === "bolsa_valores").length).toBeGreaterThanOrEqual(2);
    expect(pontos.filter((p) => p.tipo === "orgao_regulador").length).toBeGreaterThanOrEqual(5);
    expect(pontos.filter((p) => p.tipo === "mina_estrategica").length).toBeGreaterThanOrEqual(5);
  });

  it("recupera pontos estratégicos por ID com fidelidade às fontes oficiais", () => {
    const nyse = obterPontoGeoEuaPorId("eua-nyse");
    expect(nyse).toBeDefined();
    expect(nyse?.tipo).toBe("bolsa_valores");
    expect(nyse?.cidade).toBe("Nova York");

    const sec = obterPontoGeoEuaPorId("eua-sec-dc");
    expect(sec).toBeDefined();
    expect(sec?.tipo).toBe("orgao_regulador");
    expect(sec?.cidade).toBe("Washington");

    const blackrock = obterPontoGeoEuaPorId("eua-blackrock-ny");
    expect(blackrock).toBeDefined();
    expect(blackrock?.tipo).toBe("fundo_investimento");

    const freeport = obterPontoGeoEuaPorId("eua-freeport-phoenix");
    expect(freeport).toBeDefined();
    expect(freeport?.tipo).toBe("sede_corporativa");
    expect(freeport?.cidade).toBe("Phoenix");

    const morenci = obterPontoGeoEuaPorId("eua-mina-morenci-cobre");
    expect(morenci).toBeDefined();
    expect(morenci?.tipo).toBe("mina_estrategica");

    const inexistente = obterPontoGeoEuaPorId("id-ficticio");
    expect(inexistente).toBeUndefined();
  });

  it("assegura que nenhuma descrição contém padrão de CPF ou dados pessoais sensíveis", () => {
    const pontos = obterPontosGeoEua();
    const regexCpf = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/;

    for (const p of pontos) {
      expect(regexCpf.test(p.descricao)).toBe(false);
      expect(regexCpf.test(p.nome)).toBe(false);
      expect(regexCpf.test(p.entidade)).toBe(false);
    }
  });
});
