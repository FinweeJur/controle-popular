import { describe, expect, test } from "vitest";
import {
  COBERTURA_PNCP_MG,
  ORGAOS_AMBIENTAIS_PNCP_MG,
  PNCP_MG_CONTRATOS,
  PNCP_MG_CONTRATOS_POR_ORGAO_E_ANO,
  PNCP_MG_LICITACOES_POR_ORGAO,
} from "./pncp-mg";

/**
 * `pncp-mg.ts` é GERADO por `scripts/coletar-pncp-mg.mts` (PNCP, 4 órgãos
 * ambientais do Estado de MG — SEMAD, FEAM, IEF, IGAM).
 *
 * ═══ ESTADO ATUAL: COLETA PENDENTE ═══
 *
 * A API do PNCP ficou indisponível (504/timeout) durante toda a sessão de
 * 2026-08-21 em que este coletor foi escrito — confirmado em dezenas de
 * tentativas espaçadas, em `/v1/contratos` e `/v1/contratacoes/publicacao`,
 * com CNPJs e janelas de data diferentes. `etl/betim/dados/pncp-mg.json` é
 * hoje um placeholder escrito à mão (`coletaPendente: true`), não uma saída
 * real do coletor — que tem trava de sanidade e recusa gravar sobre 0
 * resultados reais. Os testes abaixo travam DUAS coisas ao mesmo tempo: que o
 * estado pendente está declarado (não escondido atrás de zeros mudos) e que,
 * quando alguém rodar o coletor de verdade, os invariantes estruturais
 * continuam valendo.
 */
describe("PNCP — 4 órgãos ambientais de MG (SEMAD, FEAM, IEF, IGAM)", () => {
  test("os 4 órgãos e seus CNPJs (14 dígitos, verificados via BrasilAPI/Receita Federal em 2026-08-21)", () => {
    expect(ORGAOS_AMBIENTAIS_PNCP_MG.map((o) => o.sigla).sort()).toEqual(["FEAM", "IEF", "IGAM", "SEMAD"]);
    for (const o of ORGAOS_AMBIENTAIS_PNCP_MG) {
      expect(o.cnpj, o.sigla).toMatch(/^\d{14}$/);
    }
    const cnpjs = new Map(ORGAOS_AMBIENTAIS_PNCP_MG.map((o) => [o.sigla, o.cnpj]));
    // Matriz na Cidade Administrativa (Belo Horizonte) — não a filial isolada
    // que aparece em buscas rasas para o IGAM (17.387.481/0003-02, em São
    // João do Paraíso).
    expect(cnpjs.get("SEMAD")).toBe("00957404000178");
    expect(cnpjs.get("FEAM")).toBe("25455858000171");
    expect(cnpjs.get("IEF")).toBe("18746164000128");
    expect(cnpjs.get("IGAM")).toBe("17387481000132");
  });

  test("estado pendente é declarado, não zeros mudos", () => {
    // Se isto virar `false` um dia é porque o coletor rodou de verdade — o
    // teste seguinte cobre esse caso. Enquanto for `true`, `motivoPendencia`
    // tem que explicar por quê, para a tela nunca mostrar "0 contratos" como
    // se fosse medido.
    if (COBERTURA_PNCP_MG.coletaPendente) {
      expect(COBERTURA_PNCP_MG.motivoPendencia).toBeTruthy();
      expect(COBERTURA_PNCP_MG.coletadoEm).toBeNull();
      expect(COBERTURA_PNCP_MG.contratos.total).toBe(0);
      expect(COBERTURA_PNCP_MG.licitacoes.total).toBe(0);
    } else {
      expect(COBERTURA_PNCP_MG.motivoPendencia).toBeNull();
      expect(COBERTURA_PNCP_MG.coletadoEm).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test("linha crua e agregados nunca se contradizem", () => {
    const C = COBERTURA_PNCP_MG;
    if (C.contratos.linhaCruaOmitida) {
      // Omitida por passar do teto (2.000) — a linha crua fica vazia de
      // propósito, mas o total e os agregados continuam valendo.
      expect(PNCP_MG_CONTRATOS.length).toBe(0);
      expect(C.contratos.total).toBeGreaterThan(0);
    } else {
      expect(PNCP_MG_CONTRATOS.length).toBe(C.contratos.total);
    }
    // Agregado nunca soma mais do que o total declarado.
    const somaAgregado = PNCP_MG_CONTRATOS_POR_ORGAO_E_ANO.reduce((t, a) => t + a.quantidade, 0);
    expect(somaAgregado).toBe(C.contratos.total);
  });

  test("todo contrato pertence a um dos 4 órgãos, e o valor bate com o agregado", () => {
    const siglas = new Set(ORGAOS_AMBIENTAIS_PNCP_MG.map((o) => o.sigla));
    for (const c of PNCP_MG_CONTRATOS) {
      expect(siglas.has(c.orgaoSigla), c.numeroControlePncp).toBe(true);
    }
    const somaValor = PNCP_MG_CONTRATOS_POR_ORGAO_E_ANO.reduce((t, a) => t + a.valorTotal, 0);
    expect(somaValor).toBeCloseTo(COBERTURA_PNCP_MG.contratos.valorGlobalTotal, 2);
  });

  test("licitações são amostra parcial declarada — nunca 'o total real'", () => {
    // A docstring do módulo e o campo `escopoLicitacoes` têm que deixar claro
    // que é só modalidade 6, ano corrente, filtrado a partir de Belo
    // Horizonte — nunca lido como cobertura completa dos 4 órgãos.
    expect(COBERTURA_PNCP_MG.escopoLicitacoes.toLowerCase()).toContain("parcial");
    const somaLicitacoes = PNCP_MG_LICITACOES_POR_ORGAO.reduce((t, a) => t + a.quantidade, 0);
    expect(somaLicitacoes).toBe(COBERTURA_PNCP_MG.licitacoes.total);
  });

  test("nenhum CPF/CNPJ de fornecedor com menos de 11 dígitos (zero à esquerda perdido)", () => {
    for (const c of PNCP_MG_CONTRATOS) {
      if (c.fornecedorCnpjCpf) {
        expect([11, 14], `${c.numeroControlePncp}: ${c.fornecedorCnpjCpf}`).toContain(c.fornecedorCnpjCpf.length);
      }
    }
  });
});
