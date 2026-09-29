/**
 * @file arvore-galhos.test.ts
 * @description Testes unitários para o módulo de galhos da árvore e conexões do portal.
 */

import { describe, it, expect } from "vitest";
import {
  NOS_ARVORE,
  ARESTAS_ARVORE,
  EIXOS_PORTAL,
  identificarNoPorRota,
  obterLinksRelacionadosGalho,
} from "./arvore-galhos";

describe("Árvore de Galhos & Grafo do Portal", () => {
  it("deve conter os 4 grandes eixos cadastrados com dados canônicos", () => {
    expect(EIXOS_PORTAL.direitos).toBeDefined();
    expect(EIXOS_PORTAL.territorios).toBeDefined();
    expect(EIXOS_PORTAL.estado).toBeDefined();
    expect(EIXOS_PORTAL.central).toBeDefined();
    expect(EIXOS_PORTAL.direitos.nome).toBe("Direitos em Movimento");
    expect(EIXOS_PORTAL.territorios.nome).toBe("Terra e Territórios");
    expect(EIXOS_PORTAL.estado.nome).toBe("Estado e Economia");
  });

  it("todas as arestas devem apontar para nós válidos e existentes", () => {
    const idsValidos = new Set(NOS_ARVORE.map((n) => n.id));
    for (const aresta of ARESTAS_ARVORE) {
      expect(idsValidos.has(aresta.fonte), `Nó fonte inexistente: ${aresta.fonte}`).toBe(true);
      expect(idsValidos.has(aresta.alvo), `Nó alvo inexistente: ${aresta.alvo}`).toBe(true);
    }
  });

  it("identifica nó correspondente a partir de rotas exatas ou aproximadas", () => {
    const noBetim = identificarNoPorRota("/betim");
    expect(noBetim).toBeDefined();
    expect(noBetim?.id).toBe("ter-betim");
    expect(noBetim?.eixoId).toBe("territorios");

    const noBarragens = identificarNoPorRota("/ambiental/barragens");
    expect(noBarragens).toBeDefined();
    expect(noBarragens?.id).toBe("ter-barragens");

    const noTjmg = identificarNoPorRota("/judiciario/instituicoes/tjmg");
    expect(noTjmg).toBeDefined();
    expect(noTjmg?.eixoId).toBe("estado");

    const noLab = identificarNoPorRota("/laboratorio");
    expect(noLab).toBeDefined();
    expect(noLab?.eixoId).toBe("central");
  });

  it("retorna links relacionados do mesmo galho sem auto-referência", () => {
    const galhoBetim = obterLinksRelacionadosGalho("/betim", 4);
    expect(galhoBetim).toBeDefined();
    expect(galhoBetim?.eixoId).toBe("territorios");
    expect(galhoBetim?.links.length).toBeGreaterThan(0);
    // Não deve conter a própria rota pesquisada
    const contemBetim = galhoBetim?.links.some((l) => l.href === "/betim");
    expect(contemBetim).toBe(false);

    const galhoBarragens = obterLinksRelacionadosGalho("/ambiental/barragens", 4);
    expect(galhoBarragens).toBeDefined();
    expect(galhoBarragens?.eixoId).toBe("territorios");
    expect(galhoBarragens?.links.length).toBeGreaterThan(0);
    const contemBarragens = galhoBarragens?.links.some((l) => l.href === "/ambiental/barragens");
    expect(contemBarragens).toBe(false);

    const galhoTjmg = obterLinksRelacionadosGalho("/judiciario/instituicoes/tjmg", 4);
    expect(galhoTjmg).toBeDefined();
    expect(galhoTjmg?.eixoId).toBe("estado");
    expect(galhoTjmg?.links.length).toBeGreaterThan(0);
  });
});
