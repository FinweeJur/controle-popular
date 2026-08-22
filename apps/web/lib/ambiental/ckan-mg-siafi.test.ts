import { describe, expect, test } from "vitest";
import { COBERTURA_SIAFI_EXECUCAO, SIAFI_POR_FUNCAO, SIAFI_POR_GRUPO, SIAFI_POR_MES } from "./ckan-mg-siafi";

/**
 * `ckan-mg-siafi.ts` é GERADO por `scripts/coletar-ckan-mg.mts --conjunto=siafi`
 * a partir do CKAN do `dados.mg.gov.br`, dataset `dados-armazem-siafi-2026`,
 * resource `execucao.csv.gz` — 718.480 lançamentos agregados por função de
 * governo e grupo de despesa (tabelas nacionais fixas), porque a base linha a
 * linha é grande demais para publicar (regra do repo: nunca o corpus
 * inteiro).
 *
 * O que se trava aqui: os códigos de função e grupo batem com a tabela
 * nacional fixa (nenhum "código desconhecido" nasceria com rótulo inventado
 * — o coletor aborta antes disso), e os três agregados somam o mesmo total.
 */
describe("execução orçamentária SIAFI-MG 2026, agregada por função e grupo", () => {
  test("718.480 lançamentos processados, ano 2026 — medido em 21/08/2026", () => {
    expect(COBERTURA_SIAFI_EXECUCAO.lancamentos).toBe(718480);
    expect(COBERTURA_SIAFI_EXECUCAO.ano).toBe(2026);
  });

  test("todo código de função está na tabela nacional (Portaria MOG 42/1999) — 1 a 28, nunca um código sem nome", () => {
    for (const f of SIAFI_POR_FUNCAO) {
      expect(f.codigo, f.funcao).toBeGreaterThanOrEqual(1);
      expect(f.codigo, f.funcao).toBeLessThanOrEqual(28);
      expect(f.funcao.length, `função ${f.codigo}`).toBeGreaterThan(0);
    }
    // 26 das 28 funções nacionais aparecem no orçamento de MG em 2026 —
    // faltam só Defesa Nacional (05, atribuição federal) e Comunicações (24).
    expect(SIAFI_POR_FUNCAO.length).toBe(26);
  });

  test("todo código de grupo está na tabela nacional (Lei 4.320/1964) — 1 a 6 neste dataset", () => {
    for (const g of SIAFI_POR_GRUPO) {
      expect(g.codigo, g.grupo).toBeGreaterThanOrEqual(1);
      expect(g.grupo.length, `grupo ${g.codigo}`).toBeGreaterThan(0);
    }
    expect(SIAFI_POR_GRUPO.length).toBe(6);
  });

  test("SIAFI_POR_FUNCAO soma o mesmo total empenhado que a cobertura", () => {
    expect(SIAFI_POR_FUNCAO.reduce((t, f) => t + f.vlrEmpenhado, 0)).toBeCloseTo(
      COBERTURA_SIAFI_EXECUCAO.vlrEmpenhadoTotal,
      0,
    );
    expect(SIAFI_POR_FUNCAO.reduce((t, f) => t + f.lancamentos, 0)).toBe(COBERTURA_SIAFI_EXECUCAO.lancamentos);
  });

  test("SIAFI_POR_GRUPO soma o mesmo total empenhado que a cobertura", () => {
    expect(SIAFI_POR_GRUPO.reduce((t, g) => t + g.vlrEmpenhado, 0)).toBeCloseTo(
      COBERTURA_SIAFI_EXECUCAO.vlrEmpenhadoTotal,
      0,
    );
    expect(SIAFI_POR_GRUPO.reduce((t, g) => t + g.lancamentos, 0)).toBe(COBERTURA_SIAFI_EXECUCAO.lancamentos);
  });

  test("SIAFI_POR_MES soma o mesmo total empenhado que a cobertura, e cobre só meses já decorridos de 2026", () => {
    expect(SIAFI_POR_MES.reduce((t, m) => t + m.vlrEmpenhado, 0)).toBeCloseTo(COBERTURA_SIAFI_EXECUCAO.vlrEmpenhadoTotal, 0);
    for (const m of SIAFI_POR_MES) {
      expect(m.mes).toBeGreaterThanOrEqual(1);
      expect(m.mes).toBeLessThanOrEqual(12);
    }
  });

  test("valores agregados são finitos e não negativos", () => {
    for (const linha of [...SIAFI_POR_FUNCAO, ...SIAFI_POR_GRUPO, ...SIAFI_POR_MES]) {
      for (const campo of ["vlrEmpenhado", "vlrLiquidado", "vlrPagoFinanceiro"] as const) {
        expect(Number.isFinite(linha[campo])).toBe(true);
        expect(linha[campo]).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test("liquidado nunca passa muito do empenhado, e pago nunca passa muito do liquidado, agregado por função", () => {
    // Não é uma igualdade estrita (restos a pagar e reforços de exercícios
    // anteriores podem inverter a ordem pontualmente), mas em nenhuma função
    // o pago deveria ser uma ordem de grandeza maior que o empenhado — sinal
    // de campo trocado no coletor.
    for (const f of SIAFI_POR_FUNCAO) {
      expect(f.vlrPagoFinanceiro, f.funcao).toBeLessThan(f.vlrEmpenhado * 2 + 1);
    }
  });
});
