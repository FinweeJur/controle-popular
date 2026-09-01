import { describe, expect, test } from "vitest";
import { COBERTURA_CONTRATOS_OBRAS, lerContratosObrasMg, OBRAS_POR_MODALIDADE, OBRAS_POR_SITUACAO } from "./ckan-mg-obras";

/**
 * `ckan-mg-obras.ts` é GERADO por `scripts/coletar-ckan-mg.mts --conjunto=obras`
 * a partir do CKAN do `dados.mg.gov.br`, dataset `portal_obras` (DER-MG),
 * tabela `contratos.csv`.
 *
 * O que se trava aqui: o CNPJ com zero à esquerda perdido (mesma armadilha de
 * `contratos_vigentes`) e o achado de dado pessoal em `fiscais.csv` — não
 * publicado linha a linha nesta rodada, só o NÚMERO do achado, que precisa
 * continuar batendo se alguém rodar o coletor de novo.
 */
describe("contratos de obra rodoviária do DER-MG", () => {
  const CONTRATOS_OBRAS_MG = lerContratosObrasMg();

  test("644 contratos medidos em 21/08/2026", () => {
    expect(CONTRATOS_OBRAS_MG.length).toBe(644);
    expect(COBERTURA_CONTRATOS_OBRAS.contratos).toBe(644);
  });

  test("cnpj tem 14 dígitos ou é null — zero à esquerda perdido corrigido (78 casos de 13 dígitos, 23 de 12, medidos em 21/08/2026)", () => {
    for (const c of CONTRATOS_OBRAS_MG) {
      if (c.cnpj !== null) expect(c.cnpj, c.contrato).toMatch(/^\d{14}$/);
    }
    expect(COBERTURA_CONTRATOS_OBRAS.cnpjInvalidos).toBe(0);
  });

  test("aditados (diasAditados > 0) é a mesma ideia de 'prorrogado' de convenios-mg — 147 de 644, 22.8%, medido em 21/08/2026", () => {
    const aditados = CONTRATOS_OBRAS_MG.filter((c) => c.diasAditados > 0);
    expect(aditados.length).toBe(147);
    expect(COBERTURA_CONTRATOS_OBRAS.aditados).toBe(aditados.length);
    expect(COBERTURA_CONTRATOS_OBRAS.percentualAditados).toBeCloseTo((147 / 644) * 100, 1);
  });

  test("percentualExecucao vem 0–1 da fonte, nunca > 1 — não confundir com porcentagem já multiplicada", () => {
    for (const c of CONTRATOS_OBRAS_MG) {
      expect(c.percentualExecucao, c.contrato).toBeGreaterThanOrEqual(0);
      // Alguns contratos medem além do previsto (aditivo que não atualizou o
      // percentual na fonte) — por isso não há teto de 1 aqui, só o piso de 0.
    }
  });

  test("achado de dado pessoal em fiscais.csv fica registrado como número, mesmo sem publicar a lista de pessoas — 37 de 5.336, medido em 21/08/2026", () => {
    // fiscais.csv não é publicado nesta rodada (ver docstring do arquivo
    // gerado); o número é o único vestígio do achado, e precisa sobreviver a
    // uma nova coleta.
    expect(COBERTURA_CONTRATOS_OBRAS.fiscaisCsvLinhas).toBe(5336);
    expect(COBERTURA_CONTRATOS_OBRAS.fiscaisCsvComCpfNoConselho).toBe(37);
  });

  test("nenhum CPF válido sobrevive em empresa/objeto (texto livre)", () => {
    const cpfValido = (d: string) => {
      if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
      const dv = (ate: number) => {
        let soma = 0;
        for (let i = 0; i < ate; i++) soma += Number(d[i]) * (ate + 1 - i);
        const r = (soma * 10) % 11;
        return r === 10 ? 0 : r;
      };
      return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
    };
    const RE = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|\b\d{11}\b/g;
    let sobreviventes = 0;
    for (const c of CONTRATOS_OBRAS_MG) {
      for (const campo of ["empresa", "objeto"] as const) {
        for (const m of c[campo].matchAll(RE)) {
          if (cpfValido(m[0].replace(/\D/g, ""))) sobreviventes++;
        }
      }
    }
    expect(sobreviventes).toBe(0);
  });

  test("a cobertura bate com o array — nada digitado à mão", () => {
    const A = CONTRATOS_OBRAS_MG;
    const C = COBERTURA_CONTRATOS_OBRAS;
    expect(C.contratos).toBe(A.length);
    expect(C.valorTotal).toBeCloseTo(A.reduce((t, c) => t + c.valorTotal, 0), 0);
  });

  test("os agregados somam o mesmo total de linhas que a base", () => {
    expect(OBRAS_POR_SITUACAO.reduce((t, s) => t + s.contratos, 0)).toBe(CONTRATOS_OBRAS_MG.length);
    expect(OBRAS_POR_MODALIDADE.reduce((t, m) => t + m.contratos, 0)).toBeLessThanOrEqual(CONTRATOS_OBRAS_MG.length);
  });
});
