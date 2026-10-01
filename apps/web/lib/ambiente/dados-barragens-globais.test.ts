/**
 * @file apps/web/lib/ambiente/dados-barragens-globais.test.ts
 * @description Suíte de testes unitários para o acervo de Grandes Barragens Mundiais.
 *
 * Papel no portal:
 * Garante a integridade referencial, geográfica, metodológica e de privacidade
 * dos dados de grandes barragens mundiais decodificados a partir do acervo compacto.
 *
 * Regras verificadas:
 * - Quantidade mínima: mais de 50 barragens mundiais catalogadas (AGENTS.md).
 * - Coordenadas válidas no datum WGS84 para todas as estruturas.
 * - Coerência matemática dos agregados de COBERTURA_BARRAGENS_GLOBAIS.
 * - Hiperlinks oficiais diretos verificáveis (começando com http:// ou https://).
 * - Zero dados pessoais / sem CPFs no acervo.
 */

import { describe, it, expect } from "vitest";
import {
  obterBarragensGlobais,
  obterBarragensGlobaisGeolocalizadas,
  obterBarragemGlobalPorId,
  obterBarragensPorTipo,
  obterBarragensPorPais,
  COBERTURA_BARRAGENS_GLOBAIS,
} from "./dados-barragens-globais";

describe("Acervo de Grandes Barragens Mundiais (lib/ambiente/dados-barragens-globais)", () => {
  it("deve carregar mais de 50 barragens emblemáticas em todo o mundo", () => {
    const barragens = obterBarragensGlobais();
    expect(barragens.length).toBeGreaterThanOrEqual(50);
    expect(barragens.length).toBe(COBERTURA_BARRAGENS_GLOBAIS.totalBarragens);
  });

  it("deve conter todos os campos obrigatórios preenchidos para cada barragem", () => {
    const barragens = obterBarragensGlobais();

    for (const b of barragens) {
      expect(b.id).toBeDefined();
      expect(b.id.trim().length).toBeGreaterThan(0);
      expect(b.nome).toBeDefined();
      expect(b.nome.trim().length).toBeGreaterThan(0);
      expect(b.tipoBarragem).toMatch(/^(rejeitos_mineracao|hidreletrica|abastecimento_multiuso|controle_cheias)$/);
      expect(b.tipoEstrutura.trim().length).toBeGreaterThan(0);
      expect(b.pais.trim().length).toBeGreaterThan(0);
      expect(b.continente).toMatch(/^(América do Sul|América do Norte|Europa|Ásia|África|Oceania)$/);
      expect(b.rioOuBacia.trim().length).toBeGreaterThan(0);
      expect(typeof b.alturaMetros).toBe("number");
      expect(b.alturaMetros).toBeGreaterThan(0);
      expect(typeof b.volumeCapacidadeMm3).toBe("number");
      expect(b.volumeCapacidadeMm3).toBeGreaterThan(0);
      expect(b.operador.trim().length).toBeGreaterThan(0);
      expect(b.classificacaoRiscoOuHazard.trim().length).toBeGreaterThan(0);
      expect(b.statusOperacional).toMatch(/^(em_operacao|desativada_descaracterizacao|rompida_historico|em_construcao)$/);
      expect(typeof b.anoConclusao).toBe("number");
      expect(b.anoConclusao).toBeGreaterThan(1800);
      expect(b.resumoCivico.trim().length).toBeGreaterThan(15);
      expect(b.orgaoReguladorOuBase.trim().length).toBeGreaterThan(0);
      expect(b.linkFonteOficial).toMatch(/^https?:\/\//);
      expect(Array.isArray(b.tags)).toBe(true);
      expect(b.tags.length).toBeGreaterThan(0);
    }
  });

  it("deve conter coordenadas geográficas WGS84 válidas para todas as estruturas", () => {
    const geo = obterBarragensGlobaisGeolocalizadas();
    expect(geo.length).toBe(COBERTURA_BARRAGENS_GLOBAIS.totalBarragens);

    for (const b of geo) {
      expect(b.latitude).toBeGreaterThanOrEqual(-90);
      expect(b.latitude).toBeLessThanOrEqual(90);
      expect(b.longitude).toBeGreaterThanOrEqual(-180);
      expect(b.longitude).toBeLessThanOrEqual(180);
    }
  });

  it("deve refletir a distribuição correta nas constantes agregadas COBERTURA_BARRAGENS_GLOBAIS", () => {
    const {
      totalBarragens,
      totalPaises,
      totalContinentes,
      totalRejeitos,
      totalHidreletricas,
      totalAbastecimentoMultiuso,
      totalControleCheias,
      totalRompidaHistorico,
      totalDescaracterizacao,
      totalEmOperacao,
      totalEmConstrucao,
      volumeTotalMm3,
      maiorAlturaMetros,
      maiorVolumeMm3,
      continentes,
    } = COBERTURA_BARRAGENS_GLOBAIS;

    expect(totalBarragens).toBeGreaterThanOrEqual(50);
    expect(totalPaises).toBeGreaterThanOrEqual(10);
    expect(totalContinentes).toBe(6);
    expect(continentes).toEqual(
      expect.arrayContaining([
        "América do Sul",
        "América do Norte",
        "Europa",
        "Ásia",
        "África",
        "Oceania",
      ])
    );

    // Soma das frentes deve totalizar 100% dos registros
    const somaTipos = totalRejeitos + totalHidreletricas + totalAbastecimentoMultiuso + totalControleCheias;
    expect(somaTipos).toBe(totalBarragens);

    // Soma dos status operacionais deve totalizar 100% dos registros
    const somaStatus = totalRompidaHistorico + totalDescaracterizacao + totalEmOperacao + totalEmConstrucao;
    expect(somaStatus).toBe(totalBarragens);

    expect(volumeTotalMm3).toBeGreaterThan(500000);
    expect(maiorAlturaMetros).toBeGreaterThanOrEqual(300); // Nurek / Rogun
    expect(maiorVolumeMm3).toBeGreaterThanOrEqual(150000); // Kariba
  });

  it("deve encontrar barragens emblemáticas pelo ID canônico", () => {
    const fundao = obterBarragemGlobalPorId("BAR-BR-FUNDAO");
    expect(fundao).toBeDefined();
    expect(fundao?.nome).toContain("Fundão");
    expect(fundao?.pais).toBe("Brasil");
    expect(fundao?.statusOperacional).toBe("rompida_historico");

    const threeGorges = obterBarragemGlobalPorId("BAR-CN-THREE-GORGES");
    expect(threeGorges).toBeDefined();
    expect(threeGorges?.nome).toContain("Três Gargantas");
    expect(threeGorges?.pais).toBe("China");
    expect(threeGorges?.tipoBarragem).toBe("hidreletrica");

    const oroville = obterBarragemGlobalPorId("BAR-US-OROVILLE");
    expect(oroville).toBeDefined();
    expect(oroville?.nome).toContain("Oroville");
    expect(oroville?.pais).toBe("Estados Unidos");

    const inexistente = obterBarragemGlobalPorId("BAR-INEXISTENTE-999");
    expect(inexistente).toBeUndefined();
  });

  it("deve filtrar corretamente por tipo e por país", () => {
    const rejeitos = obterBarragensPorTipo("rejeitos_mineracao");
    expect(rejeitos.length).toBe(COBERTURA_BARRAGENS_GLOBAIS.totalRejeitos);
    expect(rejeitos.every((b) => b.tipoBarragem === "rejeitos_mineracao")).toBe(true);

    const brasil = obterBarragensPorPais("Brasil");
    expect(brasil.length).toBeGreaterThanOrEqual(10);
    expect(brasil.every((b) => b.pais === "Brasil")).toBe(true);
  });

  it("não deve conter CPFs ou números sensíveis de documentos nos textos", () => {
    const barragens = obterBarragensGlobais();
    const regexCpf = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/;

    for (const b of barragens) {
      expect(regexCpf.test(b.nome)).toBe(false);
      expect(regexCpf.test(b.resumoCivico)).toBe(false);
      expect(regexCpf.test(b.operador)).toBe(false);
      expect(regexCpf.test(b.rioOuBacia)).toBe(false);
    }
  });
});
