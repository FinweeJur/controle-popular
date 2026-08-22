import { describe, expect, test } from "vitest";
import {
  COBERTURA_EMPRESAS_SANCIONADAS,
  EMPRESAS_SANCIONADAS_MG,
  SANCIONADAS_POR_DECISAO,
  SANCIONADAS_POR_ORGAO_LESADO,
} from "./ckan-mg-sancionadas";

/**
 * `ckan-mg-sancionadas.ts` é GERADO por `scripts/coletar-ckan-mg.mts --conjunto=sancionadas`
 * a partir do CKAN do `dados.mg.gov.br`, dataset `empresas_sancionadas`
 * (Controladoria-Geral do Estado, Lei 12.846/2013).
 */
describe("empresas sancionadas pela Lei Anticorrupção em MG", () => {
  test("52 empresas medidas em 21/08/2026 — número pequeno, cravado com data", () => {
    expect(EMPRESAS_SANCIONADAS_MG.length).toBe(52);
    expect(COBERTURA_EMPRESAS_SANCIONADAS.empresas).toBe(52);
  });

  test("valorMultaAplicada é null quando a fonte não traz valor, nunca 0 inventado", () => {
    // Arquivamento não tem multa. Tratar ausência como zero faria uma decisão
    // sem condenação parecer "multa de R$ 0,00", que é outra coisa.
    for (const e of EMPRESAS_SANCIONADAS_MG) {
      if (e.decisao.toLowerCase().includes("arquivamento")) {
        expect(e.valorMultaAplicada, `${e.sei} ${e.empresa}`).toBeNull();
      }
    }
    expect(COBERTURA_EMPRESAS_SANCIONADAS.comMulta).toBeLessThan(EMPRESAS_SANCIONADAS_MG.length);
  });

  test("cnpj é null quando não passa no dígito verificador — 1 caso medido em 21/08/2026, não é CPF", () => {
    expect(COBERTURA_EMPRESAS_SANCIONADAS.cnpjInvalidos).toBe(1);
    const invalidos = EMPRESAS_SANCIONADAS_MG.filter((e) => e.cnpj === null);
    expect(invalidos.length).toBeGreaterThanOrEqual(1);
  });

  test("a cobertura bate com o array — nada digitado à mão", () => {
    const A = EMPRESAS_SANCIONADAS_MG;
    const C = COBERTURA_EMPRESAS_SANCIONADAS;
    expect(C.empresas).toBe(A.length);
    expect(C.comMulta).toBe(A.filter((e) => e.valorMultaAplicada !== null).length);
    expect(C.valorMultaTotal).toBeCloseTo(
      A.reduce((t, e) => t + (e.valorMultaAplicada ?? 0), 0),
      2,
    );
    expect(C.anoInicial).toBe(Math.min(...A.map((e) => e.ano)));
    expect(C.anoFinal).toBe(Math.max(...A.map((e) => e.ano)));
  });

  test("os agregados somam o mesmo total de linhas que a base", () => {
    expect(SANCIONADAS_POR_DECISAO.reduce((t, d) => t + d.empresas, 0)).toBe(EMPRESAS_SANCIONADAS_MG.length);
    expect(SANCIONADAS_POR_ORGAO_LESADO.reduce((t, o) => t + o.empresas, 0)).toBe(EMPRESAS_SANCIONADAS_MG.length);
  });

  test("valorMultaAplicada, quando existe, é finito e não negativo", () => {
    for (const e of EMPRESAS_SANCIONADAS_MG) {
      if (e.valorMultaAplicada !== null) {
        expect(Number.isFinite(e.valorMultaAplicada), e.sei).toBe(true);
        expect(e.valorMultaAplicada).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
