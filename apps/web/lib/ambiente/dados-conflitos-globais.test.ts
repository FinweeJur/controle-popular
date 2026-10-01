/**
 * @file apps/web/lib/ambiente/dados-conflitos-globais.test.ts
 * @description Suíte de testes unitários para o acervo de conflitos socioambientais globais.
 */

import { describe, it, expect } from "vitest";
import {
  COBERTURA_CONFLITOS_GLOBAIS,
  obterConflitosGlobais,
  obterConflitoPorId,
  filtrarConflitosGlobais,
  obterContinentesConflitos,
  obterPaisesConflitos,
  obterCommoditiesConflitos,
  obterEstatisticasConflitos,
} from "./dados-conflitos-globais";
import { semAcento } from "../busca/normalizar";

describe("dados-conflitos-globais", () => {
  it("carrega a constante agregada COBERTURA_CONFLITOS_GLOBAIS com totais medidos e datados", () => {
    expect(COBERTURA_CONFLITOS_GLOBAIS.dataMedicao).toBe("2026-10-01");
    expect(COBERTURA_CONFLITOS_GLOBAIS.totalConflitos).toBeGreaterThanOrEqual(50);
    expect(COBERTURA_CONFLITOS_GLOBAIS.totalPaises).toBeGreaterThanOrEqual(20);
    expect(COBERTURA_CONFLITOS_GLOBAIS.totalContinentes).toBeGreaterThanOrEqual(5);
    expect(COBERTURA_CONFLITOS_GLOBAIS.continentes).toContain("América do Sul");
    expect(COBERTURA_CONFLITOS_GLOBAIS.continentes).toContain("África");
    expect(COBERTURA_CONFLITOS_GLOBAIS.continentes).toContain("Europa");
    expect(COBERTURA_CONFLITOS_GLOBAIS.fontesMonitoradas).toContain("EJAtlas (Atlas Global de Justiça Ambiental)");
  });

  it("descompacta todos os conflitos com campos obrigatórios íntegros e links oficiais canônicos", () => {
    const conflitos = obterConflitosGlobais();
    expect(conflitos.length).toBeGreaterThanOrEqual(50);

    for (const c of conflitos) {
      expect(c.id).toBeTruthy();
      expect(c.nome).toBeTruthy();
      expect(c.pais).toBeTruthy();
      expect(c.continente).toBeTruthy();
      expect(c.localidade).toBeTruthy();
      expect(c.commodities).toBeTruthy();
      expect(c.comunidades).toBeTruthy();
      expect(c.empresas).toBeTruthy();
      expect(c.tipoDano).toBeTruthy();
      expect(c.status).toBeTruthy();
      expect(c.resumo).toBeTruthy();

      // Coordenadas geográficas válidas WGS84
      expect(c.latitude).toBeGreaterThanOrEqual(-90);
      expect(c.latitude).toBeLessThanOrEqual(90);
      expect(c.longitude).toBeGreaterThanOrEqual(-180);
      expect(c.longitude).toBeLessThanOrEqual(180);

      // Links canônicos e fontes
      expect(c.linkOficial).toMatch(/^https:\/\//);
      expect(c.fonteOficial).toBeTruthy();
    }
  });

  it("mapeia com precisão todos os casos emblemáticos mundiais exigidos", () => {
    // 1. Mariana (Brasil)
    const mariana = obterConflitoPorId("br-mariana-rio-doce");
    expect(mariana).toBeDefined();
    expect(mariana?.pais).toBe("Brasil");
    expect(mariana?.empresas).toContain("Samarco");
    expect(mariana?.empresas).toContain("Vale");
    expect(mariana?.empresas).toContain("BHP");

    // 2. Brumadinho (Brasil)
    const brumadinho = obterConflitoPorId("br-brumadinho-paraopeba");
    expect(brumadinho).toBeDefined();
    expect(brumadinho?.pais).toBe("Brasil");
    expect(brumadinho?.empresas).toContain("Vale");

    // 3. Chevron / Texaco (Equador)
    const chevron = obterConflitoPorId("ec-chevron-texaco");
    expect(chevron).toBeDefined();
    expect(chevron?.pais).toBe("Equador");
    expect(chevron?.commodities).toContain("Petróleo");

    // 4. Standing Rock (EUA)
    const standingRock = obterConflitoPorId("us-standing-rock-dapl");
    expect(standingRock).toBeDefined();
    expect(standingRock?.pais).toBe("Estados Unidos");
    expect(standingRock?.comunidades).toContain("Sioux");

    // 5. Doe Run / La Oroya (Peru)
    const laOroya = obterConflitoPorId("pe-doe-run-la-oroya");
    expect(laOroya).toBeDefined();
    expect(laOroya?.pais).toBe("Peru");
    expect(laOroya?.commodities).toContain("Chumbo");

    // 6. Grasberg (Indonésia)
    const grasberg = obterConflitoPorId("id-grasberg-west-papua");
    expect(grasberg).toBeDefined();
    expect(grasberg?.pais).toBe("Indonésia");
    expect(grasberg?.empresas).toContain("Freeport");

    // 7. Panguna / Rio Tinto em Bougainville (Papua Nova Guiné)
    const bougainville = obterConflitoPorId("pg-panguna-bougainville");
    expect(bougainville).toBeDefined();
    expect(bougainville?.pais).toBe("Papua Nova Guiné");
    expect(bougainville?.empresas).toContain("Rio Tinto");

    // 8. Shell no Delta do Níger (Nigéria)
    const nigerDelta = obterConflitoPorId("ng-shell-niger-delta");
    expect(nigerDelta).toBeDefined();
    expect(nigerDelta?.pais).toBe("Nigéria");
    expect(nigerDelta?.empresas).toContain("Shell");
  });

  it("filtra conflitos por texto, continente, país e commodity", () => {
    // Busca textual
    const buscaMariana = filtrarConflitosGlobais({ busca: "Samarco" });
    expect(buscaMariana.some((c) => c.id === "br-mariana-rio-doce")).toBe(true);

    // Filtro por continente
    const conflitosAfrica = filtrarConflitosGlobais({ continente: "África" });
    expect(conflitosAfrica.length).toBeGreaterThanOrEqual(8);
    for (const c of conflitosAfrica) {
      expect(c.continente).toBe("África");
    }

    // Filtro por país
    const conflitosBrasil = filtrarConflitosGlobais({ pais: "Brasil" });
    expect(conflitosBrasil.length).toBeGreaterThanOrEqual(8);
    for (const c of conflitosBrasil) {
      expect(c.pais).toBe("Brasil");
    }

    // Filtro por commodity
    const conflitosLitio = filtrarConflitosGlobais({ commodity: "Lítio" });
    expect(conflitosLitio.length).toBeGreaterThanOrEqual(2);
    for (const c of conflitosLitio) {
      expect(c.commodities.toLowerCase()).toContain("lítio");
    }
  });

  it("retorna listagens únicas de continentes, países e commodities", () => {
    const continentes = obterContinentesConflitos();
    expect(continentes).toContain("América do Sul");
    expect(continentes).toContain("África");
    expect(continentes).toContain("Europa");

    const paises = obterPaisesConflitos();
    expect(paises).toContain("Brasil");
    expect(paises).toContain("Canadá");
    expect(paises).toContain("Índia");
    expect(paises).toContain("Nigéria");

    const commodities = obterCommoditiesConflitos();
    expect(commodities.length).toBeGreaterThanOrEqual(10);
  });

  it("busca tolerante a acentos: 'colombia' acha 'Colômbia' (Parte 24)", () => {
    // Regressão da revisão de 01/10/2026: a busca fazia só toLowerCase, e
    // "colombia" devolvia 0 contra uma base que traz "Colômbia".
    const alvo = obterConflitosGlobais().find((c) => /[^\x00-\x7F]/.test(c.pais));
    expect(alvo, "a base tem país com acento").toBeTruthy();

    const achados = filtrarConflitosGlobais({ busca: semAcento(alvo!.pais) });
    expect(achados.length, "busca sem acento deve achar").toBeGreaterThan(0);
  });

  it("busca tolerante a acentos: 'litio' acha a commodity 'Lítio'", () => {
    const achados = filtrarConflitosGlobais({ commodity: "litio" });
    expect(achados.length, "facet commodity sem acento deve achar").toBeGreaterThan(0);
  });

  it("calcula estatísticas agregadas consistentes", () => {
    const stats = obterEstatisticasConflitos();
    expect(stats.totalConflitos).toBeGreaterThanOrEqual(50);
    expect(stats.totalPaises).toBeGreaterThanOrEqual(20);
    expect(stats.totalContinentes).toBeGreaterThanOrEqual(5);
    expect(stats.conflitosPorContinente["América do Sul"]).toBeGreaterThanOrEqual(15);
  });
});
