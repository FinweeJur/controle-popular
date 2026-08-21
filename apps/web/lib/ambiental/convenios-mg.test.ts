import { describe, expect, test } from "vitest";
import {
  COBERTURA_CONVENIOS_AMBIENTAIS,
  CONVENIOS_AMBIENTAIS_MG,
  CONVENIOS_AMBIENTAIS_POR_ANO,
  CONVENIOS_AMBIENTAIS_POR_ORGAO,
} from "./convenios-mg";

/**
 * `convenios-mg.ts` é GERADO por `scripts/coletar-convenios-ambientais-mg.mts`
 * a partir do CKAN do `dados.mg.gov.br`.
 *
 * O que se trava aqui é a leitura correta das DATAS. A fonte tem um campo com
 * nome enganoso (`dt_vigencia_inicial`, que não é data de início) e o modo de
 * falha é silencioso: quem lê errado obtém zero dias de duração para 99,8% dos
 * convênios, e zero é um número plausível.
 */
describe("convênios dos órgãos ambientais de MG", () => {
  test("só os quatro órgãos ambientais entraram", () => {
    // O dataset tem 55 órgãos e 90 mil convênios — esporte, assistência,
    // educação. Se o filtro escapar, dinheiro que não é ambiental aparece numa
    // página de meio ambiente, o que é erro editorial, não só de dado.
    expect(COBERTURA_CONVENIOS_AMBIENTAIS.orgaos).toBe(4);
    const nomes = new Set(CONVENIOS_AMBIENTAIS_MG.map((c) => c.orgao));
    expect(nomes.size).toBe(4);
    for (const n of nomes) {
      expect(n, `órgão fora do recorte ambiental: ${n}`).toMatch(
        /MEIO AMBIENTE|FLORESTAS|GESTAO DAS AGUAS/i,
      );
    }
  });

  test("prorrogação é `prazoAtual − prazoOriginal`, nunca negativa", () => {
    const DIA = 86_400_000;
    for (const c of CONVENIOS_AMBIENTAIS_MG) {
      expect(c.diasDeProrrogacao).toBeGreaterThanOrEqual(0);
      if (c.prazoOriginal && c.prazoAtual) {
        const esperado = Math.round(
          (Date.parse(`${c.prazoAtual}T00:00:00Z`) - Date.parse(`${c.prazoOriginal}T00:00:00Z`)) /
            DIA,
        );
        expect(c.diasDeProrrogacao, `convênio ${c.id}`).toBe(Math.max(0, esperado));
      }
    }
  });

  test("as datas são ISO `AAAA-MM-DD` — nunca deslocadas por fuso", () => {
    // `new Date("2016-12-03")` em UTC-3 vira 02/12 na renderização local. Já
    // mordeu em vigência de contrato neste repo, por isso o coletor monta a
    // data em UTC e serializa o dia direto.
    for (const c of CONVENIOS_AMBIENTAIS_MG) {
      for (const campo of ["prazoOriginal", "prazoAtual"] as const) {
        const v = c[campo];
        if (v !== null) expect(v, `${c.id}.${campo}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  test("a cobertura literal bate com o array — nada digitado à mão", () => {
    const A = CONVENIOS_AMBIENTAIS_MG;
    const C = COBERTURA_CONVENIOS_AMBIENTAIS;
    expect(C.convenios).toBe(A.length);
    expect(C.valorTotal).toBeCloseTo(
      A.reduce((t, c) => t + c.valorTotal, 0),
      2,
    );
    expect(C.prorrogados).toBe(A.filter((c) => c.diasDeProrrogacao > 0).length);
    expect(C.percentualProrrogados).toBeCloseTo((C.prorrogados / C.convenios) * 100, 1);
    const anos = A.map((c) => c.ano).filter((a) => a > 1990);
    expect(C.anoInicial).toBe(Math.min(...anos));
    expect(C.anoFinal).toBe(Math.max(...anos));
  });

  test("a mediana de prorrogação vem só dos prorrogados, não do total", () => {
    // Incluir os 455 que nunca foram prorrogados puxaria a mediana para 0 e
    // faria parecer que prorrogação é exceção rara — quando é quase metade.
    const dias = CONVENIOS_AMBIENTAIS_MG.filter((c) => c.diasDeProrrogacao > 0)
      .map((c) => c.diasDeProrrogacao)
      .sort((a, b) => a - b);
    expect(COBERTURA_CONVENIOS_AMBIENTAIS.medianaDiasDeProrrogacao).toBe(
      dias[Math.floor(dias.length / 2)],
    );
    expect(COBERTURA_CONVENIOS_AMBIENTAIS.maximoDiasDeProrrogacao).toBe(dias[dias.length - 1]);
    expect(COBERTURA_CONVENIOS_AMBIENTAIS.medianaDiasDeProrrogacao).toBeGreaterThan(0);
  });

  test("a régua estadual existe e cobre a base inteira — é o que dá sentido ao número ambiental", () => {
    const C = COBERTURA_CONVENIOS_AMBIENTAIS;
    // "47,7% prorrogados" só significa alguma coisa ao lado da média do Estado.
    expect(C.conveniosNoEstado).toBeGreaterThan(C.convenios);
    expect(C.percentualProrrogadosNoEstado).toBeGreaterThan(0);
    expect(C.percentualProrrogadosNoEstado).toBeLessThan(100);
  });

  test("valores são finitos e não negativos", () => {
    for (const c of CONVENIOS_AMBIENTAIS_MG) {
      for (const campo of ["valorTotal", "valorConcedente", "valorContrapartida"] as const) {
        expect(Number.isFinite(c[campo]), `${c.id}.${campo}`).toBe(true);
        expect(c[campo]).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test("os agregados somam o mesmo que a base", () => {
    expect(CONVENIOS_AMBIENTAIS_POR_ORGAO.reduce((t, o) => t + o.convenios, 0)).toBe(
      COBERTURA_CONVENIOS_AMBIENTAIS.convenios,
    );
    expect(CONVENIOS_AMBIENTAIS_POR_ORGAO.reduce((t, o) => t + o.valorTotal, 0)).toBeCloseTo(
      COBERTURA_CONVENIOS_AMBIENTAIS.valorTotal,
      2,
    );
    expect(CONVENIOS_AMBIENTAIS_POR_ANO.reduce((t, a) => t + a.convenios, 0)).toBe(
      COBERTURA_CONVENIOS_AMBIENTAIS.convenios,
    );
  });

  test("instrumento vazio é vazio, nunca o hífen que a fonte grava", () => {
    // Registros da base antiga trazem "-" em tp_instrumento. Publicar o hífen
    // faria a tela mostrar um tipo de instrumento chamado "-".
    for (const c of CONVENIOS_AMBIENTAIS_MG) {
      expect(c.instrumento).not.toBe("-");
    }
  });
});
