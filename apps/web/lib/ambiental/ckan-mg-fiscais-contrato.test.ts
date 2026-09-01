import { describe, expect, test } from "vitest";
import {
  COBERTURA_FISCAIS_CONTRATO,
  lerFiscaisContratoMg,
  FISCAIS_CONTRATO_POR_ANO,
  FISCAIS_CONTRATO_POR_SITUACAO,
} from "./ckan-mg-fiscais-contrato";

function cpfValido(d: string): boolean {
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(d[i]) * (ate + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}
const PADRAO_CPF = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|\b\d{11}\b/g;

/**
 * `ckan-mg-fiscais-contrato.ts` é GERADO por
 * `scripts/coletar-ckan-mg.mts --conjunto=fiscais-contrato` a partir do CKAN
 * do `dados.mg.gov.br`, dataset `fiscais_contrato` — cinco CSVs, um por ano
 * (2022–2026).
 *
 * O que se trava aqui: a sondagem original só tinha amostrado 2026 para CPF
 * no campo do fornecedor; os quatro anos anteriores TAMBÉM têm, e o campo
 * `objeto` (texto livre do ato administrativo) tem CPF de servidor citado no
 * corpo do texto — achado que nenhuma sondagem anterior tinha citado.
 */
describe("fiscais e gestores de contratos do Estado, 2022–2026", () => {
  const FISCAIS_CONTRATO_MG = lerFiscaisContratoMg();

  test("16.922 contratos nos cinco anos, medido em 21/08/2026", () => {
    expect(FISCAIS_CONTRATO_MG.length).toBe(16922);
    expect(COBERTURA_FISCAIS_CONTRATO.contratos).toBe(16922);
  });

  test("cnpj tem 14 dígitos ou é null — nunca CPF, mesmo quando a fonte trazia CPF no campo cnpj_cpf", () => {
    for (const c of FISCAIS_CONTRATO_MG) {
      if (c.cnpj !== null) expect(c.cnpj, c.numeroContrato).toMatch(/^\d{14}$/);
    }
  });

  test("cpfRedigidos cobre os cinco anos, não só 2026 — 615 no total, medido em 21/08/2026", () => {
    // A sondagem original amostrou só 2026 (205 CPF) e marcou 2022–2025 como
    // "não investigado". Os quatro anos anteriores têm de 38 a 194 cada —
    // ausentes da amostra original, presentes na coleta real.
    expect(COBERTURA_FISCAIS_CONTRATO.cpfRedigidos).toBe(615);
  });

  test("nenhum CPF válido sobrevive em NENHUM campo de texto livre (fornecedor, objeto, fiscais, gestores)", () => {
    // objeto às vezes cita "Fica designado o servidor... CPF ... para
    // acompanhar" — CPF dentro do corpo de um ato administrativo, não do
    // campo de documento. 257 linhas tinham isso, medido em 21/08/2026.
    let sobreviventes = 0;
    for (const c of FISCAIS_CONTRATO_MG) {
      for (const campo of ["fornecedor", "objeto", "fiscais", "gestores"] as const) {
        for (const m of c[campo].matchAll(PADRAO_CPF)) {
          if (cpfValido(m[0].replace(/\D/g, ""))) sobreviventes++;
        }
      }
    }
    expect(sobreviventes, "CPF sobrevivendo em campo de texto livre").toBe(0);
    expect(COBERTURA_FISCAIS_CONTRATO.linhasComCpfEmTextoLivre).toBe(257);
  });

  test("valores aceitam vírgula E ponto como decimal, sem depender do ano — 2022 mistura os dois formatos nas mesmas linhas", () => {
    for (const c of FISCAIS_CONTRATO_MG) {
      expect(Number.isFinite(c.valorInicial), c.numeroContrato).toBe(true);
      expect(Number.isFinite(c.valorAtual), c.numeroContrato).toBe(true);
      expect(c.valorInicial).toBeGreaterThanOrEqual(0);
      expect(c.valorAtual).toBeGreaterThanOrEqual(0);
    }
  });

  test("datas, quando presentes, são ISO AAAA-MM-DD", () => {
    for (const c of FISCAIS_CONTRATO_MG) {
      for (const campo of ["dataPublicacao", "inicioVigencia", "fimVigencia"] as const) {
        const v = c[campo];
        if (v !== null) expect(v, `${c.numeroContrato}.${campo}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  test("a cobertura bate com o array — nada digitado à mão", () => {
    const A = FISCAIS_CONTRATO_MG;
    const C = COBERTURA_FISCAIS_CONTRATO;
    expect(C.contratos).toBe(A.length);
    expect(C.anoInicial).toBe(Math.min(...A.map((c) => c.ano)));
    expect(C.anoFinal).toBe(Math.max(...A.map((c) => c.ano)));
    expect(C.valorAtualTotal).toBeCloseTo(A.reduce((t, c) => t + c.valorAtual, 0), 0);
  });

  test("os agregados somam o mesmo total de linhas que a base", () => {
    expect(FISCAIS_CONTRATO_POR_SITUACAO.reduce((t, s) => t + s.contratos, 0)).toBe(FISCAIS_CONTRATO_MG.length);
    expect(FISCAIS_CONTRATO_POR_ANO.reduce((t, a) => t + a.contratos, 0)).toBe(FISCAIS_CONTRATO_MG.length);
    expect(FISCAIS_CONTRATO_POR_ANO.map((a) => a.ano).sort()).toEqual([2022, 2023, 2024, 2025, 2026]);
  });
});
