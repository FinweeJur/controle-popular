/**
 * @file apps/web/lib/internacional/canada-geo.test.ts
 * @description Suíte de testes unitários para o acervo geoespacial e compacto do Canadá.
 *
 * Papel no portal:
 * Garante a integridade do arquivo GeoJSON do Globo 3D (`sedes-mineracao-canada.geojson`),
 * do dataset compacto (`canada-geo.compact.json`) e da função de consumo tipado `obterPontosGeoCanada()`.
 *
 * Decisões técnicas e restrições (AGENTS.md §5.2, §5.9, §8):
 * - Valida conformidade WGS84 e delimitação geográfica do Canadá.
 * - Garante ausência total de CPFs e dados pessoais.
 * - Verifica o limite estrito de 180 caracteres para descrições.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { COBERTURA_CANADA, obterPontosGeoCanada } from "./dados-canada";

const CAMINHO_GEOJSON = path.resolve(
  __dirname,
  "../../public/terras/globo/dados/camadas/sedes-mineracao-canada.geojson"
);

describe("canada-geo (GeoJSON e Acervo Compacto)", () => {
  it("carrega 24 pontos georreferenciados via obterPontosGeoCanada()", () => {
    const pontos = obterPontosGeoCanada();
    expect(pontos.length).toBe(COBERTURA_CANADA.pontosGeoespaciais);
    expect(pontos.length).toBe(24);
  });

  it("arquivo GeoJSON oficial existe e é um FeatureCollection WGS84 válido", () => {
    expect(fs.existsSync(CAMINHO_GEOJSON)).toBe(true);

    const conteudo = fs.readFileSync(CAMINHO_GEOJSON, "utf-8");
    const geojson = JSON.parse(conteudo);

    expect(geojson.type).toBe("FeatureCollection");
    expect(geojson.features).toBeInstanceOf(Array);
    expect(geojson.features.length).toBe(24);
    expect(geojson.metadata.totalPontos).toBe(24);
  });

  it("todas as feições possuem coordenadas válidas dentro do território do Canadá", () => {
    const geojson = JSON.parse(fs.readFileSync(CAMINHO_GEOJSON, "utf-8"));

    for (const feature of geojson.features) {
      expect(feature.type).toBe("Feature");
      expect(feature.geometry.type).toBe("Point");

      const [lon, lat] = feature.geometry.coordinates;
      expect(typeof lon).toBe("number");
      expect(typeof lat).toBe("number");

      // Limites geográficos do Canadá (WGS84 decimal):
      // Latitude: entre 41° N (sul de Ontário) e 84° N (norte ártico)
      // Longitude: entre -141° W (fronteira com Alasca/Yukon) e -52° W (Newfoundland & Labrador)
      expect(lat).toBeGreaterThanOrEqual(41);
      expect(lat).toBeLessThanOrEqual(84);
      expect(lon).toBeGreaterThanOrEqual(-141);
      expect(lon).toBeLessThanOrEqual(-52);
    }
  });

  it("todas as feições possuem as propriedades obrigatórias e tipos estritos", () => {
    const pontos = obterPontosGeoCanada();
    const tiposValidos = ["sede_corporativa", "mina_operacao", "bolsa_valores", "orgao_regulador"];

    for (const p of pontos) {
      expect(p.id).toMatch(/^ca-/);
      expect(p.nome.length).toBeGreaterThan(5);
      expect(p.empresa.length).toBeGreaterThan(2);
      expect(tiposValidos).toContain(p.tipo);
      expect(p.mineralPrincipal.length).toBeGreaterThan(2);
      expect(p.cidade.length).toBeGreaterThan(2);
      expect(p.provincia.length).toBeGreaterThan(2);
      expect(["TSX", "TSX-V", "NYSE"]).toContain(p.bolsaListada);
      expect(p.fonteOficial).toMatch(/^https?:\/\//);
      expect(p.descricao.length).toBeGreaterThan(20);
      expect(p.descricao.length).toBeLessThanOrEqual(180);
    }
  });

  it("contém representatividade dos principais polos cívicos e industriais", () => {
    const pontos = obterPontosGeoCanada();
    const cidades = new Set(pontos.map((p) => p.cidade));
    const empresas = new Set(pontos.map((p) => p.empresa));

    // Polos essenciais
    expect(cidades.has("Toronto")).toBe(true);
    expect(cidades.has("Vancouver")).toBe(true);
    expect(cidades.has("Ottawa")).toBe(true);
    expect(cidades.has("Greater Sudbury")).toBe(true);
    expect(cidades.has("Calgary")).toBe(true);

    // Mineradoras de impacto direto no Brasil e América Latina
    expect(empresas.has("Vale Canada Limited (Vale S.A.)")).toBe(true);
    expect(empresas.has("Kinross Gold Corporation")).toBe(true);
    expect(empresas.has("Sigma Lithium Corporation")).toBe(true);
    expect(empresas.has("Lundin Mining Corporation")).toBe(true);
    expect(empresas.has("Belo Sun Mining Corp. (Forbes & Manhattan)")).toBe(true);
    expect(empresas.has("Equinox Gold Corp.")).toBe(true);
    expect(empresas.has("Ero Copper Corp.")).toBe(true);
    expect(empresas.has("Teck Resources Limited")).toBe(true);
    expect(empresas.has("Barrick Gold Corporation")).toBe(true);
  });

  it("zero ocorrência de padrões de CPF ou dados pessoais (AGENTS.md §5.2)", () => {
    const conteudoGeoJson = fs.readFileSync(CAMINHO_GEOJSON, "utf-8");
    const conteudoCompacto = fs.readFileSync(
      path.resolve(__dirname, "../../data/internacional/canada-geo.compact.json"),
      "utf-8"
    );

    // Regex de busca por CPFs formatados ou brutos de 11 dígitos contíguos
    const regexCpf = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b/;
    expect(regexCpf.test(conteudoGeoJson)).toBe(false);
    expect(regexCpf.test(conteudoCompacto)).toBe(false);
  });
});
