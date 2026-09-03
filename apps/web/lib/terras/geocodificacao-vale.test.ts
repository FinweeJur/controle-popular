import { describe, it, expect } from "vitest";
import {
  PONTOS_MONITORAMENTO_VALE,
  gerarGeoJsonMonitoramentoVale,
  cruzarInvestimentosValeComIbge,
  CODIGOS_IBGE_BACIA_PARAOPEBA,
} from "./geocodificacao-vale";

describe("geocodificação de dados da Vale e Acordo de Reparação (PLANO-GEOCODIFICACAO.md)", () => {
  it("valida pontos de monitoramento com latitude e longitude válidas no fuso WGS84", () => {
    for (const p of PONTOS_MONITORAMENTO_VALE) {
      expect(p.lat).toBeLessThan(0); // Hemisfério Sul
      expect(p.lng).toBeLessThan(0); // Hemisfério Oeste
      expect(p.lat).toBeGreaterThan(-23); // Minas Gerais
      expect(p.lat).toBeLessThan(-18);
      expect(p.ibge).toMatch(/^\d{7}$/); // 7 dígitos IBGE
    }
  });

  it("gera FeatureCollection GeoJSON válida com propriedades completas", () => {
    const geojson = gerarGeoJsonMonitoramentoVale();
    expect(geojson.type).toBe("FeatureCollection");
    expect(geojson.features.length).toBe(PONTOS_MONITORAMENTO_VALE.length);

    for (const f of geojson.features) {
      expect(f.type).toBe("Feature");
      expect(f.geometry.type).toBe("Point");
      expect(f.geometry.coordinates.length).toBe(2);
      expect(f.properties.id).toBeDefined();
      expect(f.properties.municipio).toBeDefined();
      expect(f.properties.id_municipio).toMatch(/^\d{7}$/);
    }
  });

  it("cruza os investimentos dos municípios da bacia com código IBGE sem perder registros", () => {
    const cruzados = cruzarInvestimentosValeComIbge();
    expect(cruzados.length).toBe(26);

    for (const item of cruzados) {
      expect(item.id_municipio).toBeDefined();
      expect(item.id_municipio).not.toBeNull();
      expect(item.acordoAtual).toBeGreaterThan(0);
      expect(item.taxaEmpenhoPct).toBeGreaterThanOrEqual(0);
      expect(item.taxaEmpenhoPct).toBeLessThanOrEqual(100);
    }
  });
});
