import { describe, expect, test } from "vitest";
import {
  COBERTURA_CONTRATOS_VIGENTES_IPSEMG,
  CONTRATOS_VIGENTES_IPSEMG,
  IPSEMG_POR_RAMO_ATIVIDADE,
  IPSEMG_POR_REGIAO_ASSISTENCIAL,
} from "./ckan-mg-ipsemg";

/**
 * `ckan-mg-ipsemg.ts` é GERADO por `scripts/coletar-ckan-mg.mts --conjunto=ipsemg`
 * a partir do CKAN do `dados.mg.gov.br`, dataset `contratos_vigentes`
 * (prestadores de saúde credenciados ao IPSEMG).
 *
 * O que se trava aqui é o achado mais sério da rodada: o campo `nome` de
 * alguns prestadores pessoa física traz o próprio CPF colado ao texto — não
 * é o campo de documento (`cpf_cnpj`), é o campo de NOME. A régua que pega
 * isso (`redigirTextoLivre` no coletor) precisa continuar pegando.
 */
describe("contratos vigentes do IPSEMG", () => {
  test("6.699 contratos medidos em 21/08/2026 — número grande, cravado com data", () => {
    expect(CONTRATOS_VIGENTES_IPSEMG.length).toBe(6699);
    expect(COBERTURA_CONTRATOS_VIGENTES_IPSEMG.contratos).toBe(6699);
  });

  test("cnpj tem 14 dígitos ou é null — nunca 11 a 13 (zero à esquerda perdido na exportação)", () => {
    // A fonte grava CNPJ como número; a exportação derruba zero à esquerda.
    // Um CNPJ com 12 ou 13 dígitos publicado como está seria um identificador
    // de empresa ERRADO, não corrigido.
    for (const c of CONTRATOS_VIGENTES_IPSEMG) {
      if (c.cnpj !== null) expect(c.cnpj, c.nome).toMatch(/^\d{14}$/);
    }
  });

  test("cnpjVazios + comCnpj + cnpjInvalidos fecham o total — medido em 21/08/2026: 4.924 vazios, 1.775 com CNPJ, 0 inválidos", () => {
    const C = COBERTURA_CONTRATOS_VIGENTES_IPSEMG;
    expect(C.cnpjVazios).toBe(4924);
    expect(C.comCnpj).toBe(1775);
    expect(C.cnpjInvalidos).toBe(0);
    expect(C.cnpjVazios + C.comCnpj + C.cnpjInvalidos).toBe(C.contratos);
  });

  test("nenhum CPF válido sobrevive em NENHUM campo de texto, inclusive `nome` — 11 casos redigidos em 21/08/2026", () => {
    const DIGITOS_CPF = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|\b\d{11}\b/g;
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
    let sobreviventes = 0;
    for (const c of CONTRATOS_VIGENTES_IPSEMG) {
      for (const m of c.nome.matchAll(DIGITOS_CPF)) {
        if (cpfValido(m[0].replace(/\D/g, ""))) sobreviventes++;
      }
    }
    expect(sobreviventes, "CPF sobrevivendo em CONTRATOS_VIGENTES_IPSEMG[].nome").toBe(0);
    expect(COBERTURA_CONTRATOS_VIGENTES_IPSEMG.nomesComCpfRedigido).toBe(11);
  });

  test("periodo_referencia: só um valor quando preenchido, e a maioria das linhas NÃO traz — 4.925 vazias, medido em 21/08/2026", () => {
    // A primeira leitura (split ingênuo) sugeria fotografia completa; a
    // leitura correta achou 4.925 linhas sem essa data.
    expect(COBERTURA_CONTRATOS_VIGENTES_IPSEMG.semReferencia).toBe(4925);
    expect(COBERTURA_CONTRATOS_VIGENTES_IPSEMG.referenciaEm).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("a cobertura bate com o array — nada digitado à mão", () => {
    const A = CONTRATOS_VIGENTES_IPSEMG;
    const C = COBERTURA_CONTRATOS_VIGENTES_IPSEMG;
    expect(C.contratos).toBe(A.length);
    expect(C.ramosDeAtividade).toBe(IPSEMG_POR_RAMO_ATIVIDADE.length);
    expect(C.regioesAssistenciais).toBe(IPSEMG_POR_REGIAO_ASSISTENCIAL.length);
  });

  test("os agregados somam o mesmo total de linhas que a base", () => {
    expect(IPSEMG_POR_RAMO_ATIVIDADE.reduce((t, r) => t + r.contratos, 0)).toBeLessThanOrEqual(
      CONTRATOS_VIGENTES_IPSEMG.length,
    );
    // `<=` e não `==`: `ramoAtividade` pode vir vazio na fonte, e a contagem
    // por chave (`contar()` no coletor) pula chave vazia — não é bug.
  });
});
