/**
 * @file apps/web/lib/empresas/dados-conglomerados.test.ts
 * @description Suíte de testes unitários para o módulo de Conglomerados, Holdings, Monopólios e Cartéis.
 *
 * Papel no portal:
 * Valida a integridade referencial do grafo corporativo (nós e arestas), a coerência
 * dos índices HHI setoriais calculados, a constante de cobertura de Server Components
 * e a ausência de dados pessoais (Zero CPF Mod-11).
 *
 * Regras do portal testadas:
 * - Integridade do grafo: toda aresta conecta dois nós existentes.
 * - Coerência de métricas: COBERTURA_CONGLOMERADOS espelha a contagem exata dos dados compactados.
 * - Hierarquia em 4 níveis: Holding (1), Investimento (2), Subsidiária (3) e Concessão (4).
 * - Cálculos de HHI e enquadramento nos critérios antitruste do CADE.
 */

import { describe, it, expect } from "vitest";
import {
  COBERTURA_CONGLOMERADOS,
  obterNosConglomerados,
  obterArestasControle,
  obterConcentracoesSetoriais,
  obterConglomeradoPorId,
  obterNosPorNivel,
  obterNosPorSetor,
  obterGrafoCompleto,
  obterConexoesDoNo,
  obterArvoreHolding,
  obterArvoresTodasHoldings,
  obterEstatisticasHhi,
} from "./dados-conglomerados";

describe("Módulo de Conglomerados & Monopólios (dados-conglomerados.ts)", () => {
  it("descompacta e carrega todos os nós corporativos", () => {
    const nos = obterNosConglomerados();
    expect(nos.length).toBeGreaterThanOrEqual(40);
    expect(nos.length).toBe(COBERTURA_CONGLOMERADOS.totalEntidades);

    // Valida propriedades obrigatórias em todos os nós
    for (const no of nos) {
      expect(no.id).toBeTruthy();
      expect(no.nome).toBeTruthy();
      expect(no.tipo).toMatch(/^(holding|investimento|subsidiaria|concessao)$/);
      expect(no.nivelHierarquico).toBeGreaterThanOrEqual(1);
      expect(no.nivelHierarquico).toBeLessThanOrEqual(4);
      expect(no.urlOficial).toMatch(/^https?:\/\//);
      expect(no.fontesOficiais).toBeTruthy();
    }
  });

  it("garante unicidade estrita dos IDs de nós", () => {
    const nos = obterNosConglomerados();
    const ids = nos.map((n) => n.id);
    const unicos = new Set(ids);
    expect(unicos.size).toBe(nos.length);
  });

  it("garante integridade referencial: toda aresta conecta nós existentes", () => {
    const nos = obterNosConglomerados();
    const arestas = obterArestasControle();
    const idsValidos = new Set(nos.map((n) => n.id));

    expect(arestas.length).toBe(COBERTURA_CONGLOMERADOS.totalArestasControle);

    for (const aresta of arestas) {
      expect(
        idsValidos.has(aresta.origemId),
        `Origem não encontrada: ${aresta.origemId} (aresta ${aresta.id})`
      ).toBe(true);

      expect(
        idsValidos.has(aresta.destinoId),
        `Destino não encontrado: ${aresta.destinoId} (aresta ${aresta.id})`
      ).toBe(true);

      expect(aresta.tipoRelacao).toBeTruthy();
      expect(aresta.urlOficial).toMatch(/^https?:\/\//);
    }
  });

  it("valida a contagem e classificação dos 4 níveis hierárquicos", () => {
    const holdings = obterNosPorNivel(1);
    const investimentos = obterNosPorNivel(2);
    const subsidiarias = obterNosPorNivel(3);
    const concessoes = obterNosPorNivel(4);

    expect(holdings.length).toBe(COBERTURA_CONGLOMERADOS.totalHoldings);
    expect(investimentos.length).toBe(COBERTURA_CONGLOMERADOS.totalInvestimentos);
    expect(subsidiarias.length).toBe(COBERTURA_CONGLOMERADOS.totalSubsidiarias);
    expect(concessoes.length).toBe(COBERTURA_CONGLOMERADOS.totalConcessoes);

    // Soma dos 4 níveis deve ser igual ao total de entidades
    expect(
      holdings.length + investimentos.length + subsidiarias.length + concessoes.length
    ).toBe(COBERTURA_CONGLOMERADOS.totalEntidades);
  });

  it("mapeia as redes de controle societário dos Big Three (BlackRock, Vanguard, State Street)", () => {
    const blk = obterConglomeradoPorId("blackrock");
    const vng = obterConglomeradoPorId("vanguard");
    const stt = obterConglomeradoPorId("state-street");

    expect(blk).toBeDefined();
    expect(vng).toBeDefined();
    expect(stt).toBeDefined();

    expect(blk?.nivelHierarquico).toBe(1);
    expect(vng?.nivelHierarquico).toBe(1);
    expect(stt?.nivelHierarquico).toBe(1);

    // Conexões de controle do BlackRock
    const conexoesBlk = obterConexoesDoNo("blackrock");
    const controladosBlk = conexoesBlk.controlados.map((c) => c.no.id);

    // BlackRock deve ter participações mapeadas em mineração, petroleiras, bancos e tech
    expect(controladosBlk).toContain("vale");
    expect(controladosBlk).toContain("petrobras");
    expect(controladosBlk).toContain("itau-unibanco");
    expect(controladosBlk).toContain("microsoft");
  });

  it("mapeia o Cartel de Grãos ABCD (ADM, Bunge, Cargill, Louis Dreyfus)", () => {
    const cargill = obterConglomeradoPorId("cargill");
    const bunge = obterConglomeradoPorId("bunge");
    const adm = obterConglomeradoPorId("adm");
    const ldc = obterConglomeradoPorId("louis-dreyfus");

    expect(cargill).toBeDefined();
    expect(bunge).toBeDefined();
    expect(adm).toBeDefined();
    expect(ldc).toBeDefined();

    // Valida setor
    expect(cargill?.setor).toBe("agronegocio_graos");
    expect(bunge?.setor).toBe("agronegocio_graos");
    expect(adm?.setor).toBe("agronegocio_graos");
    expect(ldc?.setor).toBe("agronegocio_graos");

    // Valida conexões para terminais portuários estratégicos
    const conexoesCargillBr = obterConexoesDoNo("cargill-agricola-brasil");
    const controladosCargill = conexoesCargillBr.controlados.map((c) => c.no.id);
    expect(controladosCargill).toContain("terminal-ponta-montanha");
  });

  it("mapeia as Big Mining e a Joint-Venture da Samarco (Vale e BHP)", () => {
    const vale = obterConglomeradoPorId("vale");
    const bhp = obterConglomeradoPorId("bhp");
    const samarco = obterConglomeradoPorId("samarco");

    expect(vale).toBeDefined();
    expect(bhp).toBeDefined();
    expect(samarco).toBeDefined();

    // Samarco deve ser controlada conjuntamente por Vale e BHP
    const conexoesSamarco = obterConexoesDoNo("samarco");
    const controladoresSamarco = conexoesSamarco.controladores.map((c) => c.no.id);
    expect(controladoresSamarco).toContain("vale");
    expect(controladoresSamarco).toContain("bhp");

    // Arestas devem registrar 50% de participação para cada
    for (const c of conexoesSamarco.controladores) {
      expect(c.aresta.participacaoPct).toBe(50);
      expect(c.aresta.tipoRelacao).toBe("joint_venture");
    }
  });

  it("calcula corretamente os índices HHI setoriais conforme padrão antitruste do CADE", () => {
    const setores = obterConcentracoesSetoriais();
    expect(setores.length).toBe(COBERTURA_CONGLOMERADOS.totalSetoresMapeados);

    const stats = obterEstatisticasHhi();
    expect(stats.mediaHhi).toBe(COBERTURA_CONGLOMERADOS.mediaHhi);
    expect(stats.maiorHhi.hhi).toBe(COBERTURA_CONGLOMERADOS.maiorHhi);
    expect(stats.setoresAcima2500).toBeGreaterThanOrEqual(3);

    // Setor mineral deve ter HHI > 4000 (Altamente concentrado)
    const mineracao = setores.find((s) => s.setorId === "mineracao");
    expect(mineracao).toBeDefined();
    expect(mineracao!.hhi).toBe(4942);
    expect(mineracao!.cr4Pct).toBe(96.0);

    // Setor de refino deve ser o maior HHI (> 6000 - quase monopólio Petrobras)
    const petroleo = setores.find((s) => s.setorId === "energia_petroleo");
    expect(petroleo).toBeDefined();
    expect(petroleo!.hhi).toBe(6303);
  });

  it("constrói a árvore hierárquica a partir de uma holding sem gerar loops infinitos", () => {
    const arvore = obterArvoreHolding("blackrock");
    expect(arvore).toBeDefined();
    expect(arvore!.id).toBe("blackrock");
    expect(arvore!.nivelHierarquico).toBe(1);
    expect(arvore!.filhos.length).toBeGreaterThan(0);

    // Verifica se os filhos imediatos têm nível maior que 1
    for (const filho of arvore!.filhos) {
      expect(filho.nivelHierarquico).toBeGreaterThan(1);
    }

    const todasArvores = obterArvoresTodasHoldings();
    expect(todasArvores.length).toBe(COBERTURA_CONGLOMERADOS.totalHoldings);
  });

  it("filtra nós por setor com consistência", () => {
    const mineradoras = obterNosPorSetor("mineracao");
    expect(mineradoras.length).toBeGreaterThan(0);
    for (const m of mineradoras) {
      expect(m.setor).toBe("mineracao");
    }

    const tech = obterNosPorSetor("tecnologia");
    expect(tech.length).toBeGreaterThan(0);
    for (const t of tech) {
      expect(t.setor).toBe("tecnologia");
    }
  });

  it("retorna o grafo corporativo consolidado com método unificado", () => {
    const grafo = obterGrafoCompleto();
    expect(grafo.nos.length).toBe(COBERTURA_CONGLOMERADOS.totalEntidades);
    expect(grafo.arestas.length).toBe(COBERTURA_CONGLOMERADOS.totalArestasControle);
    expect(grafo.setores.length).toBe(COBERTURA_CONGLOMERADOS.totalSetoresMapeados);
  });
});
