import { describe, expect, test } from "vitest";
import {
  COBERTURA_ACORDO_RIO_DOCE,
  lerEmpenhosAcordoRioDoce,
  RIO_DOCE_POR_ANO,
  RIO_DOCE_POR_INICIATIVA,
  RIO_DOCE_POR_ORGAO,
} from "./ckan-mg-mariana";

/**
 * `ckan-mg-mariana.ts` é GERADO por `scripts/coletar-ckan-mg.mts --conjunto=mariana`
 * a partir do CKAN do `dados.mg.gov.br`, dataset `portal_mariana`.
 *
 * O que se trava aqui: nenhum CPF real sobrevive no campo `documento`, e o
 * total que somamos dos empenhos bate com o total que a própria fonte já
 * publica agregado por órgão (orgao.csv) — a mesma checagem cruzada de
 * `execucao-fgv.test.ts`.
 */
describe("empenhos do Acordo Judicial de Reparação do Vale do Rio Doce", () => {
  const EMPENHOS_ACORDO_RIO_DOCE = lerEmpenhosAcordoRioDoce();

  test("nenhum CPF sobrevive no campo documento — só CNPJ ou null (medido 21/08/2026: 37 CPF em 532 empenhos)", () => {
    for (const e of EMPENHOS_ACORDO_RIO_DOCE) {
      if (e.documento !== null) {
        expect(e.documento, `empenho ${e.numEmpenho}`).toMatch(/^\d{14}$/);
      }
    }
    expect(COBERTURA_ACORDO_RIO_DOCE.cpfRedigidos).toBe(37);
  });

  test("a cobertura bate com o array — nada digitado à mão", () => {
    const A = EMPENHOS_ACORDO_RIO_DOCE;
    const C = COBERTURA_ACORDO_RIO_DOCE;
    expect(C.empenhos).toBe(A.length);
    expect(C.valorEmpenhadoTotal).toBeCloseTo(A.reduce((t, e) => t + e.valorEmpenhado, 0), 2);
    expect(C.valorLiquidadoTotal).toBeCloseTo(A.reduce((t, e) => t + e.valorLiquidado, 0), 2);
    expect(C.valorPagoTotal).toBeCloseTo(A.reduce((t, e) => t + e.valorPagoFinanceiro, 0), 2);
  });

  test("nosso total empenhado bate com o total que a própria fonte já publica agregado por órgão", () => {
    // orgao.csv (a fonte) já publica um agregado por órgão — comparar com a
    // nossa soma de empenho.csv é o mesmo princípio de `execucao-fgv.ts`:
    // total declarado pela fonte ao lado da nossa soma, nunca só a nossa
    // soma sozinha. Medido em 21/08/2026: as duas batem ao centavo.
    expect(COBERTURA_ACORDO_RIO_DOCE.valorEmpenhadoDeclaradoPelaFonte).toBeCloseTo(
      COBERTURA_ACORDO_RIO_DOCE.valorEmpenhadoTotal,
      2,
    );
  });

  test("por iniciativa: prometido (Anexo do acordo) e empenhado (execução) coexistem sem confundir um com o outro", () => {
    // A tentação é publicar só "valorPrometido" e chamar de "quanto foi
    // gasto" — os dois precisam aparecer lado a lado, nunca um no lugar do
    // outro.
    expect(RIO_DOCE_POR_INICIATIVA.length).toBe(COBERTURA_ACORDO_RIO_DOCE.iniciativas);
    for (const i of RIO_DOCE_POR_INICIATIVA) {
      expect(i.valorPrometido, i.iniciativa).toBeGreaterThanOrEqual(0);
      expect(i.valorEmpenhado, i.iniciativa).toBeGreaterThanOrEqual(0);
    }
    expect(
      RIO_DOCE_POR_INICIATIVA.reduce((t, i) => t + i.valorEmpenhado, 0),
    ).toBeCloseTo(COBERTURA_ACORDO_RIO_DOCE.valorEmpenhadoTotal, 0);
  });

  test("por ano soma o mesmo total que a cobertura", () => {
    expect(RIO_DOCE_POR_ANO.reduce((t, a) => t + a.empenhos, 0)).toBe(COBERTURA_ACORDO_RIO_DOCE.empenhos);
    expect(RIO_DOCE_POR_ANO.reduce((t, a) => t + a.valorEmpenhado, 0)).toBeCloseTo(
      COBERTURA_ACORDO_RIO_DOCE.valorEmpenhadoTotal,
      2,
    );
  });

  test("por órgão soma o mesmo total que a cobertura", () => {
    expect(RIO_DOCE_POR_ORGAO.reduce((t, o) => t + o.valorEmpenhado, 0)).toBeCloseTo(
      COBERTURA_ACORDO_RIO_DOCE.valorEmpenhadoTotal,
      2,
    );
  });

  test("valores são finitos e não negativos", () => {
    for (const e of EMPENHOS_ACORDO_RIO_DOCE) {
      for (const campo of ["valorEmpenhado", "valorLiquidado", "valorPagoFinanceiro"] as const) {
        expect(Number.isFinite(e[campo]), `${e.numEmpenho}.${campo}`).toBe(true);
        expect(e[campo]).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test("datas, quando presentes, são ISO AAAA-MM-DD", () => {
    for (const e of EMPENHOS_ACORDO_RIO_DOCE) {
      if (e.dataEmpenho !== null) expect(e.dataEmpenho).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
