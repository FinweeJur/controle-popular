import { describe, expect, test } from "vitest";
import {
  COBERTURA_TAC_GTAC,
  TACS_GTAC,
  TAC_GTAC_POR_ANO,
  TAC_GTAC_POR_SITUACAO,
} from "./tac-gtac";

/**
 * Gerado por `scripts/coletar-tac-gtac-mg.mts` (sistema GTAC, SEMAD).
 *
 * O teste mais importante daqui é o de DADO PESSOAL: a API de origem expõe CPF
 * de pessoa física em 355 registros e nome+CPF do servidor que cadastrou em
 * todos. Nada disso pode alcançar o repositório, que é público — e o modo de
 * falha é irreversível: commit publicado fica acessível por hash mesmo depois
 * de removido.
 */
describe("TACs ambientais de MG (GTAC)", () => {
  const C = COBERTURA_TAC_GTAC;

  test("nenhum CPF sobreviveu — nem no documento, nem em campo de servidor", () => {
    const serializado = JSON.stringify(TACS_GTAC);
    expect(serializado).not.toMatch(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/);
    for (const campo of ["cpf_usuario", "nome_usuario", "cpf_cnpj"]) {
      expect(serializado, `campo pessoal "${campo}" vazou`).not.toContain(campo);
    }
    // Todo `cnpj` publicado tem que ter 14 dígitos: 11 seria CPF passando.
    for (const t of TACS_GTAC) {
      if (t.cnpj !== null) expect(t.cnpj, `TAC ${t.id}`).toMatch(/^\d{14}$/);
    }
  });

  test("a redação é declarada, não silenciosa", () => {
    // Publicar 1.647 CNPJ e omitir que 355 registros tiveram documento redigido
    // faria a cobertura parecer completa. O número fica à vista.
    expect(C.cpfRedigidos).toBeGreaterThan(0);
    expect(C.comCnpj + C.cpfRedigidos).toBe(C.tacs);
    expect(C.comCnpj).toBe(TACS_GTAC.filter((t) => t.cnpj !== null).length);
  });

  test("o cruzamento vigente × vencido é subconjunto do que existe", () => {
    // 72 marcados "Vigente" têm vencimento já passado. Não é prova de
    // irregularidade — pode ser aditivo não lançado —, mas é a base se
    // contradizendo, e é o número que a página mostra.
    expect(C.vigentesComVencimentoPassado).toBeLessThanOrEqual(C.vigentes);
    expect(C.vigentes).toBeLessThanOrEqual(C.tacs);
    const vigentes = TACS_GTAC.filter((t) => t.situacao.toLowerCase().startsWith("vigente"));
    expect(C.vigentes).toBe(vigentes.length);
    expect(C.vigentesComVencimentoPassado).toBe(
      vigentes.filter((t) => t.vencimento && t.vencimento < C.coletadoEm).length,
    );
  });

  test("quem não tem data de vencimento fica fora de qualquer conta de prazo", () => {
    // São 1.119 de 2.002 — mais da metade. Se isso não estiver declarado,
    // qualquer percentual sobre prazo mente pelo denominador.
    expect(C.semDataDeVencimento).toBe(TACS_GTAC.filter((t) => !t.vencimento).length);
    expect(C.semDataDeVencimento).toBeGreaterThan(0);
    expect(C.comVencimentoPassado + C.semDataDeVencimento).toBeLessThanOrEqual(C.tacs);
  });

  test("datas em ISO, e vencer antes de assinar é anomalia RARA da fonte", () => {
    for (const t of TACS_GTAC) {
      for (const campo of ["assinatura", "inicioVigencia", "vencimento"] as const) {
        const v = t[campo];
        if (v !== null) expect(v, `TAC ${t.id}.${campo}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
    // Um TAC não pode vencer antes de ser assinado. Existe exatamente 1 assim
    // em 2.002 (id 23895: assinado 31/10/2017, vencimento 30/04/2017, prazo de
    // 6 meses — as duas datas estão trocadas NA FONTE, não na leitura). O teste
    // trava a raridade, não a ausência: se virar dezenas, é sinal de que o
    // parser passou a ler as colunas erradas, e aí não é mais a fonte.
    const invertidos = TACS_GTAC.filter(
      (t) => t.assinatura && t.vencimento && t.vencimento < t.assinatura,
    );
    expect(
      invertidos.length,
      `datas invertidas: ${invertidos.map((t) => t.id).join(", ")}`,
    ).toBeLessThanOrEqual(5);
  });

  test("os agregados batem com a base", () => {
    expect(TAC_GTAC_POR_SITUACAO.reduce((t, s) => t + s.tacs, 0)).toBeLessThanOrEqual(C.tacs);
    expect(TAC_GTAC_POR_ANO.reduce((t, a) => t + a.tacs, 0)).toBeLessThanOrEqual(C.tacs);
    const anos = TAC_GTAC_POR_ANO.map((a) => a.ano);
    expect(anos).toEqual([...anos].sort((a, b) => a - b));
    expect(C.anoInicial).toBe(anos[0]);
    expect(C.anoFinal).toBe(anos[anos.length - 1]);
  });

  test("rótulos vieram resolvidos, não como id numérico", () => {
    // A API devolve `municipio`/`unidade` como objeto aninhado; se o resolvedor
    // falhar, o campo vira "[object Object]" ou o id cru.
    for (const t of TACS_GTAC.slice(0, 200)) {
      expect(t.municipio).not.toBe("[object Object]");
      expect(t.unidade).not.toBe("[object Object]");
      expect(t.municipio).not.toMatch(/^\d+$/);
    }
    expect(C.municipios).toBeGreaterThan(100);
  });
});
