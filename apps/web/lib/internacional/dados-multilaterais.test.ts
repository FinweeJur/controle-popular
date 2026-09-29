/**
 * @file apps/web/lib/internacional/dados-multilaterais.test.ts
 * @description Testes unitarios do modulo de dados multilaterais (ONU, UNESCO, OMS, OMC, Territorios).
 */

import { describe, it, expect } from "vitest";
import {
  COBERTURA_MULTILATERAL,
  obterIndicadoresSociais,
  obterComercioCommodities,
  obterTerritoriosGlobais,
} from "./dados-multilaterais";

describe("dados-multilaterais", () => {
  it("carrega agregados de cobertura multilateral medidos e datados", () => {
    expect(COBERTURA_MULTILATERAL.totalPaisesMapeados).toBe(14);
    expect(COBERTURA_MULTILATERAL.paises).toContain("Brasil");
    expect(COBERTURA_MULTILATERAL.paises).toContain("Alemanha");
    expect(COBERTURA_MULTILATERAL.paises).toContain("China");
    expect(COBERTURA_MULTILATERAL.totalFluxosCommodities).toBe(6);
    expect(COBERTURA_MULTILATERAL.totalTerritoriosIndigenasMapeados).toBe(5);
  });

  it("carrega indicadores sociais com URLs canônicas em 100% dos países", () => {
    const lista = obterIndicadoresSociais();
    expect(lista).toHaveLength(14);

    for (const item of lista) {
      expect(item.pais).toBeTruthy();
      expect(item.codigoIso3).toMatch(/^[A-Z]{3}$/);
      expect(item.idh).toBeGreaterThan(0.5);
      expect(item.gini).toBeGreaterThan(20);
      expect(item.expectativaVida).toBeGreaterThan(60);
      expect(item.urlOficial).toMatch(/^https:\/\//);
    }

    const brasil = lista.find((p) => p.codigoIso3 === "BRA");
    expect(brasil).toBeDefined();
    expect(brasil?.gini).toBe(50.3);
    expect(brasil?.gastoSaudePib).toBe(9.6);
  });

  it("carrega fluxos de commodities e minérios com valores e portos válidos", () => {
    const comercio = obterComercioCommodities();
    expect(comercio.length).toBeGreaterThanOrEqual(5);

    for (const c of comercio) {
      expect(c.mineralOuCommodity).toBeTruthy();
      expect(c.volumeAnualToneladas).toBeGreaterThan(1000);
      expect(c.valorFobUsdMilhoes).toBeGreaterThan(10);
      expect(c.portoEmbarqueBrasil).toBeTruthy();
      expect(c.urlOficial).toMatch(/^https:\/\//);
    }

    const litio = comercio.find((c) => c.mineralOuCommodity.includes("Lítio"));
    expect(litio).toBeDefined();
    expect(litio?.origemPais).toContain("Araçuaí");
  });

  it("carrega territórios globais com órgãos responsáveis e áreas medidas", () => {
    const territorios = obterTerritoriosGlobais();
    expect(territorios).toHaveLength(5);

    for (const t of territorios) {
      expect(t.nomeTerritorio).toBeTruthy();
      expect(t.areaHectares).toBeGreaterThan(100000);
      expect(t.orgaoResponsavel).toBeTruthy();
      expect(t.urlOficial).toMatch(/^https:\/\//);
    }

    const xingu = territorios.find((t) => t.id === "terra-xingu");
    expect(xingu?.pais).toBe("Brasil");
    expect(xingu?.povoOriginario).toContain("Kamaiurá");

    const navajo = territorios.find((t) => t.id === "terra-navajo");
    expect(navajo?.pais).toBe("Estados Unidos");
    expect(navajo?.orgaoResponsavel).toContain("BIA");
  });
});
