import { describe, expect, test } from "vitest";
import {
  COBERTURA_CONVENIOS_FEDERAIS_MG,
  CONVENIOS_FEDERAIS_POR_ANO,
  CONVENIOS_FEDERAIS_POR_MUNICIPIO,
  CONVENIOS_FEDERAIS_POR_ORGAO,
  CONVENIOS_FEDERAIS_POR_SITUACAO,
} from "./convenios-federais-mg";

/**
 * Gerado por `scripts/coletar-convenios-federais-mg.mts` (Transferegov).
 *
 * O que se trava aqui é o par de armadilhas que produz número plausível e
 * errado: o join que devolve quase nada quando o BOM gruda no nome da primeira
 * coluna, e a comparação de valor original × atual sobre denominadores
 * diferentes.
 */
describe("convênios federais com proponente de MG", () => {
  const C = COBERTURA_CONVENIOS_FEDERAIS_MG;

  test("o join casou de verdade — não é o caso de 1 proposta", () => {
    // Lendo os CSV como latin-1, o BOM vira três caracteres colados no nome da
    // primeira coluna e `r.ID_PROPOSTA` fica `undefined`: o resultado é "1
    // proposta de MG" em vez de 98.949, sem lançar erro nenhum.
    expect(C.propostas).toBeGreaterThan(10_000);
    expect(C.convenios).toBeGreaterThan(1_000);
    expect(C.convenios).toBeLessThan(C.propostas);
  });

  test("o crescimento de valor é medido sobre quem tem OS DOIS valores", () => {
    // Somar o valor atual de todos contra o original de alguns dá 3,3x — falso
    // e alarmante. A cobertura publica o denominador junto, e ele é menor que
    // o total justamente porque a fonte só preenche parte dos registros.
    expect(C.conveniosComValorOriginal).toBeLessThan(C.convenios);
    expect(C.conveniosComValorOriginal).toBeGreaterThan(0);
    expect(C.percentualComValorOriginal).toBeCloseTo(
      (C.conveniosComValorOriginal / C.convenios) * 100,
      1,
    );
    // O crescimento tem que bater com os dois totais comparáveis publicados.
    expect(C.crescimentoDeValor).toBeCloseTo(
      ((C.valorAtualComparavel - C.valorOriginalComparavel) / C.valorOriginalComparavel) * 100,
      1,
    );
    // E o total comparável é sempre menor que o global, pela mesma razão.
    expect(C.valorAtualComparavel).toBeLessThan(C.valorGlobal);
  });

  test("percentuais derivam dos valores, nunca digitados", () => {
    expect(C.percentualDesembolsado).toBeCloseTo((C.desembolsado / C.valorGlobal) * 100, 1);
    expect(C.percentualComProrrogacao).toBeCloseTo((C.comProrrogacao / C.convenios) * 100, 1);
  });

  test("a série por ano soma o total MENOS os que não têm ano, e a diferença tem nome", () => {
    // 4.884 convênios não trazem ano válido na fonte. Eles ficam fora da série
    // por ano — e isso precisa estar declarado, senão a soma da série bate
    // menos que o total e parece que convênios sumiram.
    expect(CONVENIOS_FEDERAIS_POR_ANO.reduce((t, a) => t + a.convenios, 0)).toBe(
      C.convenios - C.conveniosSemAno,
    );
    expect(C.conveniosSemAno).toBeGreaterThanOrEqual(0);
    expect(C.conveniosSemAno).toBeLessThan(C.convenios);
  });

  test("os demais agregados são consistentes com a cobertura", () => {
    expect(CONVENIOS_FEDERAIS_POR_SITUACAO.reduce((t, s) => t + s.convenios, 0)).toBeLessThanOrEqual(
      C.convenios,
    );
    // Órgão e município são TOP-N, então somam menos que o total — de propósito.
    expect(CONVENIOS_FEDERAIS_POR_ORGAO.reduce((t, o) => t + o.n, 0)).toBeLessThanOrEqual(
      C.convenios,
    );
    expect(CONVENIOS_FEDERAIS_POR_MUNICIPIO.reduce((t, m) => t + m.n, 0)).toBeLessThanOrEqual(
      C.convenios,
    );
  });

  test("nenhum rótulo veio vazio ou com mojibake", () => {
    const rotulos = [
      ...CONVENIOS_FEDERAIS_POR_ORGAO.map((o) => o.orgaoSuperior),
      ...CONVENIOS_FEDERAIS_POR_MUNICIPIO.map((m) => m.municipio),
      ...CONVENIOS_FEDERAIS_POR_SITUACAO.map((s) => s.situacao),
    ];
    expect(rotulos.length).toBeGreaterThan(0);
    for (const r of rotulos) {
      expect(r.length, "rótulo vazio").toBeGreaterThan(0);
      expect(r, `mojibake em "${r}"`).not.toContain("�");
    }
  });

  test("anos em faixa plausível e em ordem", () => {
    const anos = CONVENIOS_FEDERAIS_POR_ANO.map((a) => a.ano);
    expect(anos).toEqual([...anos].sort((a, b) => a - b));
    for (const a of anos) {
      expect(a).toBeGreaterThan(1990);
      expect(a).toBeLessThan(2040);
    }
    expect(C.anoInicial).toBe(anos[0]);
    expect(C.anoFinal).toBe(anos[anos.length - 1]);
  });
});
