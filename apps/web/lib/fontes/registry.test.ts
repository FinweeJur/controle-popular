import { describe, it, expect } from "vitest";
import {
  REGISTRY_FONTES,
  obterFonte,
  listarFontesPorFrente,
  listarTodasFontes,
  obterEstatisticasFontes,
  type FrenteSlug,
} from "./registry";

describe("Registry Central de Fontes", () => {
  it("deve carregar todas as fontes com atributos obrigatórios válidos", () => {
    const fontes = listarTodasFontes();
    expect(fontes.length).toBeGreaterThanOrEqual(18);

    for (const f of fontes) {
      expect(f.slug).toBeTruthy();
      expect(f.nome).toBeTruthy();
      expect(f.orgao).toBeTruthy();
      expect(f.urlOficial.startsWith("http")).toBe(true);
      expect(["dominio-publico", "cc-by", "cc-by-sa", "cc-by-nd", "dados-abertos-gov", "lei-acesso-informacao", "termo-restrito-sem-derivados"]).toContain(f.licenca);
      expect(["data-json", "public-assets", "banco", "ao-vivo"]).toContain(f.camada);
      expect(["cidades", "congresso", "judiciario", "terras", "paraopeba", "ambiental", "empresas", "transversal"]).toContain(f.frente);
    }
  });

  it("deve encontrar fonte específica por slug", () => {
    const sigbm = obterFonte("sigbm-barragens");
    expect(sigbm).toBeDefined();
    expect(sigbm?.orgao).toBe("Agência Nacional de Mineração (ANM)");
    expect(sigbm?.frente).toBe("ambiental");

    const desconhecida = obterFonte("fonte-nao-existente");
    expect(desconhecida).toBeUndefined();
  });

  it("deve filtrar corretamente por cada frente do portal", () => {
    const frentes: FrenteSlug[] = [
      "cidades",
      "congresso",
      "judiciario",
      "terras",
      "paraopeba",
      "ambiental",
      "empresas",
    ];

    for (const frente of frentes) {
      const fontesDaFrente = listarFontesPorFrente(frente);
      expect(fontesDaFrente.length).toBeGreaterThan(0);
      for (const f of fontesDaFrente) {
        expect(f.frente).toBe(frente);
      }
    }
  });

  it("deve calcular estatísticas coerentes de cobertura", () => {
    const stats = obterEstatisticasFontes();
    expect(stats.total).toBe(Object.keys(REGISTRY_FONTES).length);
    expect(stats.porCamada["data-json"]).toBeGreaterThan(0);
    expect(stats.porCamada["public-assets"]).toBeGreaterThan(0);
    expect(stats.porFrente.ambiental).toBeGreaterThan(0);
    expect(stats.porFrente.cidades).toBeGreaterThan(0);
  });
});
